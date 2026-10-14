import "server-only";
import type { Prisma } from "@prisma/client";
import {
  CANDIDATE_INITIATIVES,
  INITIATIVE_THRESHOLD,
  POLL_DAYS,
  addDays,
  draftLikesNeeded,
  initiativeDeadline,
  todayIso,
  type Application,
  type District,
  type Initiative,
  type Member,
  type Poll,
} from "../model";
import { db } from "./db";
import type { Viewer } from "./viewer";

export interface PublicState {
  today: string;
  districts: District[];
  members: Member[];
  polls: Poll[];
  initiatives: Initiative[];
  viewer: { wallet?: string; memberId?: string; isAdmin: boolean; demoAdmin: boolean };
}

export interface AdminState {
  members: Member[]; // with contact details
  applications: Application[];
}

const activeMember = { member: { active: true } };

export async function loadPublicState(viewer: Viewer, demoAdmin: boolean): Promise<PublicState> {
  const today = todayIso();
  const memberId = viewer.member?.id;

  const [districts, members, passed, polls, initiatives] = await Promise.all([
    db.district.findMany({ orderBy: { createdAt: "asc" } }),
    db.member.findMany({ where: { active: true }, orderBy: { joined: "asc" } }),
    db.initiative.groupBy({ by: ["authorId"], where: { status: "approved" }, _count: true }),
    db.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } },
        votes: memberId ? { where: { memberId }, select: { optionId: true } } : false,
      },
    }),
    db.initiative.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        likes: { where: activeMember, select: { memberId: true } },
        votes: { where: activeMember, select: { memberId: true, yes: true } },
      },
    }),
  ]);

  const passedBy = new Map(passed.map((p) => [p.authorId, p._count]));

  return {
    today,
    districts: districts.map((d) => ({ id: d.id, name: { ka: d.nameKa, en: d.nameEn } })),
    members: members.map((m) => ({
      id: m.id,
      name: { ka: m.nameKa, en: m.nameEn },
      wallet: m.wallet,
      role: m.role,
      joined: m.joined,
      districtId: m.districtId ?? undefined,
      candidate: (passedBy.get(m.id) ?? 0) >= CANDIDATE_INITIATIVES,
    })),
    polls: polls.map((p) => ({
      id: p.id,
      title: { ka: p.titleKa, en: p.titleEn },
      image: p.image ?? undefined,
      startsAt: p.startsAt ?? undefined,
      endsAt: p.endsAt,
      closed: !!p.closedAt,
      closedAt: p.closedAt ?? undefined,
      options: p.options.map((o) => ({ id: o.id, label: { ka: o.labelKa, en: o.labelEn }, votes: o._count.votes })),
      myVote: (p.votes as { optionId: string }[] | undefined)?.[0]?.optionId,
    })),
    initiatives: initiatives.map((i) => {
      const base = {
        id: i.id,
        title: { ka: i.titleKa, en: i.titleEn },
        summary: { ka: i.summaryKa, en: i.summaryEn },
        authorId: i.authorId,
        createdAt: i.createdAt,
        stage: i.stage,
        promotedAt: i.promotedAt ?? undefined,
      };
      const deadline = initiativeDeadline(base);
      const mine = i.votes.find((v) => v.memberId === memberId);
      return {
        ...base,
        status: i.status === "pending" && deadline && deadline < today ? "expired" : i.status,
        likes: i.likes.length,
        yes: i.votes.filter((v) => v.yes).length,
        myLike: !!memberId && i.likes.some((l) => l.memberId === memberId),
        myVote: mine ? (mine.yes ? "yes" : "no") : undefined,
      };
    }),
    viewer: { wallet: viewer.wallet, memberId, isAdmin: viewer.isAdmin, demoAdmin },
  };
}

export async function loadAdminState(): Promise<AdminState> {
  const [members, applications] = await Promise.all([
    db.member.findMany({ where: { active: true }, orderBy: { joined: "asc" } }),
    db.application.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return {
    members: members.map((m) => ({
      id: m.id,
      name: { ka: m.nameKa, en: m.nameEn },
      wallet: m.wallet,
      role: m.role,
      joined: m.joined,
      districtId: m.districtId ?? undefined,
      candidate: false, // not needed in the admin view
      phone: m.phone ?? undefined,
      email: m.email ?? undefined,
    })),
    applications: applications.map((a) => ({
      id: a.id,
      name: { ka: a.nameKa, en: a.nameEn },
      wallet: a.wallet,
      districtId: a.districtId,
      phone: a.phone,
      email: a.email,
      idFrontUrl: `/api/admin/applications/${a.id}/photo/front`,
      idBackUrl: `/api/admin/applications/${a.id}/photo/back`,
      createdAt: a.createdAt.toISOString().slice(0, 10),
    })),
  };
}

type Tx = Prisma.TransactionClient;

const activeMemberCount = (tx: Tx) => tx.member.count({ where: { active: true } });

/** Promotes a draft to an initiative once enough current members like it. */
export async function promoteIfLiked(tx: Tx, initiativeId: string) {
  const [likes, members] = await Promise.all([
    tx.initiativeLike.count({ where: { initiativeId, ...activeMember } }),
    activeMemberCount(tx),
  ]);
  if (likes >= draftLikesNeeded(members)) {
    await tx.initiative.update({
      where: { id: initiativeId },
      data: { stage: "initiative", promotedAt: todayIso() },
    });
  }
}

/** Puts the initiative to a poll once enough current members vote yes. */
export async function approveIfSupported(tx: Tx, initiativeId: string) {
  const [yes, members] = await Promise.all([
    tx.initiativeVote.count({ where: { initiativeId, yes: true, ...activeMember } }),
    activeMemberCount(tx),
  ]);
  if (members > 0 && yes / members >= INITIATIVE_THRESHOLD) await approveInitiative(tx, initiativeId);
}

/** Marks an initiative approved and opens a yes/no poll on it, starting today. */
export async function approveInitiative(tx: Tx, initiativeId: string) {
  const i = await tx.initiative.update({ where: { id: initiativeId }, data: { status: "approved" } });
  const today = todayIso();
  await tx.poll.upsert({
    where: { initiativeId },
    update: {},
    create: {
      titleKa: i.titleKa,
      titleEn: i.titleEn,
      startsAt: today,
      endsAt: addDays(today, POLL_DAYS),
      initiativeId,
      options: {
        create: [
          { labelKa: "დიახ", labelEn: "Yes", position: 0 },
          { labelKa: "არა", labelEn: "No", position: 1 },
        ],
      },
    },
  });
}
