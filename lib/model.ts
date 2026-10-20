// Types the API sends to the browser, and the rules shared by server and client.
import type { L10n } from "./i18n";

export type Role = "admin" | "member";

export interface District {
  id: string;
  name: L10n;
}

export interface Member {
  id: string;
  name: L10n;
  wallet: string;
  role: Role;
  joined: string; // ISO date
  districtId?: string;
  candidate: boolean;
  // Contact details are only sent to the administrator.
  phone?: string;
  email?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
}

/** A membership request, as the administrator sees it. */
export interface Application {
  id: string;
  name: L10n;
  wallet: string;
  districtId: string;
  phone: string;
  email: string;
  idFrontUrl: string;
  idBackUrl: string;
  createdAt: string; // ISO date
}

export interface PollOption {
  id: string;
  label: L10n;
  votes: number;
}

export interface Poll {
  id: string;
  title: L10n;
  options: PollOption[];
  image?: string; // URL
  startsAt?: string; // ISO date
  endsAt: string; // ISO date
  closed: boolean;
  closedAt?: string; // ISO date, set when closed before endsAt
  myVote?: string; // option id chosen by the signed-in member
}

export type InitiativeVote = "yes" | "no";

// "expired" is derived: a pending initiative whose deadline has passed.
export type InitiativeStatus = "pending" | "approved" | "rejected" | "expired";

// New initiatives start as "draft" (preparatory) and become an "initiative" once enough
// members like them.
export type InitiativeStage = "draft" | "initiative";

export interface Initiative {
  id: string;
  title: L10n;
  summary: L10n;
  authorId: string;
  createdAt: string; // ISO date
  stage: InitiativeStage;
  promotedAt?: string; // ISO date the draft became an initiative
  status: InitiativeStatus;
  likes: number; // likes from current members
  yes: number; // "put to a poll" votes from current members
  myLike: boolean;
  myVote?: InitiativeVote;
}

/** Share of all members that must like a draft for it to become an initiative. */
export const DRAFT_THRESHOLD = 0.01;

/** Likes a draft needs with the current member count (at least one). */
export const draftLikesNeeded = (memberCount: number) =>
  Math.max(1, Math.ceil(memberCount * DRAFT_THRESHOLD));

/** Share of all members that must vote yes for an initiative to become a poll. */
export const INITIATIVE_THRESHOLD = 0.51;

/** Days a draft, and then an initiative, has to reach its threshold before it expires. */
export const INITIATIVE_DAYS = 10;

/** Days a poll opened from an initiative stays open (the admin can change the dates). */
export const POLL_DAYS = 10;

/** Initiatives that must reach a poll before their author becomes a deputy candidate. */
export const CANDIDATE_INITIATIVES = 10;

export const isDraft = (i: Pick<Initiative, "stage">) => i.stage === "draft";

/**
 * Last day (inclusive, ISO date) of the current stage: a draft counts from its creation,
 * an initiative from the day it was promoted.
 */
export const initiativeDeadline = (i: Pick<Initiative, "stage" | "createdAt" | "promotedAt">) => {
  const start = isDraft(i) ? i.createdAt : i.promotedAt ?? i.createdAt;
  return addDays(start, INITIATIVE_DAYS);
};

/** ISO date `days` after the given ISO date. */
export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Local date as YYYY-MM-DD. */
export const todayIso = () => new Date().toLocaleDateString("en-CA");

/** Voting opens on the start date (inclusive); polls without one are open at once. */
export const pollStarted = (p: Pick<Poll, "startsAt">, today: string) => !p.startsAt || p.startsAt <= today;

/** A poll is finished once an admin closes it or its end date (inclusive) has passed. */
export const pollFinished = (p: Pick<Poll, "closed" | "endsAt">, today: string) => p.closed || p.endsAt < today;

export const totalVotes = (p: Poll) => p.options.reduce((s, o) => s + o.votes, 0);
