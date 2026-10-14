// Seeds an empty database: districts, plus demo members, polls and initiatives
// (skip the demo part with SEED_DEMO=false). Does nothing if districts already exist.
import { PrismaClient, type Member } from "@prisma/client";

const db = new PrismaClient();

const districts = [
  ["თბილისი", "Tbilisi"],
  ["ქუთაისი", "Kutaisi"],
  ["ბათუმი", "Batumi"],
  ["რუსთავი", "Rustavi"],
  ["ზუგდიდი", "Zugdidi"],
  ["გორი", "Gori"],
  ["თელავი", "Telavi"],
];

// Demo wallets are not real keys: nobody can sign in with them.
const members = [
  ["ნინო კვარაცხელია", "Nino Kvaratskhelia", "admin", "2026-01-10"],
  ["გიორგი მამულაშვილი", "Giorgi Mamulashvili", "member", "2026-02-03"],
  ["ლევან ბერიძე", "Levan Beridze", "member", "2026-02-17"],
  ["თამარ ჯავახიშვილი", "Tamar Javakhishvili", "member", "2026-03-05"],
  ["დავით ხარაიშვილი", "Davit Kharaishvili", "member", "2026-03-21"],
  ["მარიამ ლომიძე", "Mariam Lomidze", "member", "2026-04-09"],
  ["ზურაბ წულუკიძე", "Zurab Tsulukidze", "member", "2026-05-14"],
  ["ანა ჩხეიძე", "Ana Chkheidze", "member", "2026-06-02"],
] as const;

type DemoPoll = {
  titleKa: string;
  titleEn: string;
  endsAt: string;
  closedAt?: string;
  options: [string, string][];
  votes: number[]; // option index chosen by each demo member, in order
};

const polls: DemoPoll[] = [
  {
    titleKa: "აირჩიეთ საერთო კრების თარიღი",
    titleEn: "Choose the date of the general assembly",
    endsAt: "2026-10-20",
    options: [["25 ოქტომბერი", "25 October"], ["8 ნოემბერი", "8 November"], ["22 ნოემბერი", "22 November"]],
    votes: [1, 1, 0, 2, 1],
  },
  {
    titleKa: "რომელია პირველი კვარტლის ბიუჯეტის პრიორიტეტი?",
    titleEn: "What is the budget priority for Q1?",
    endsAt: "2026-11-01",
    options: [["განათლება", "Education"], ["ჯანდაცვა", "Healthcare"], ["ინფრასტრუქტურა", "Infrastructure"], ["ციფრული სერვისები", "Digital services"]],
    votes: [0, 1, 3, 0],
  },
  {
    titleKa: "უნდა გახდეს თუ არა წევრობის შენატანი წლიური?",
    titleEn: "Should membership dues become annual?",
    endsAt: "2026-08-15",
    closedAt: "2026-08-15",
    options: [["დიახ", "Yes"], ["არა", "No"]],
    votes: [0, 0, 1, 0, 0, 1, 0],
  },
  {
    titleKa: "პარტიის ახალი ლოგოს არჩევა",
    titleEn: "Choosing the party's new logo",
    endsAt: "2026-07-01",
    closedAt: "2026-07-01",
    options: [["ვარიანტი A", "Option A"], ["ვარიანტი B", "Option B"], ["ვარიანტი C", "Option C"]],
    votes: [1, 0, 1, 2, 1, 1],
  },
];

type DemoInitiative = {
  titleKa: string;
  titleEn: string;
  summaryKa: string;
  summaryEn: string;
  author: number;
  createdAt: string;
  stage: "draft" | "initiative";
  status: "pending" | "approved" | "rejected";
  yes?: number[];
  no?: number[];
};

const initiatives: DemoInitiative[] = [
  {
    titleKa: "ველობილიკები რაიონულ ცენტრებში",
    titleEn: "Bike lanes in district centers",
    summaryKa: "უსაფრთხო ველობილიკების ქსელი ყველა რაიონულ ცენტრში.",
    summaryEn: "A network of safe bike lanes in every district center.",
    author: 2,
    createdAt: "2026-10-13",
    stage: "draft",
    status: "pending",
  },
  {
    titleKa: "უფასო ინტერნეტი სოფლის სკოლებში",
    titleEn: "Free internet in village schools",
    summaryKa: "ყველა სოფლის სკოლაში ოპტიკურ-ბოჭკოვანი კავშირის უზრუნველყოფა.",
    summaryEn: "Provide fiber connectivity to every village school.",
    author: 3,
    createdAt: "2026-10-08",
    stage: "initiative",
    status: "pending",
    yes: [1, 2],
    no: [4],
  },
  {
    titleKa: "ბიუჯეტის გამჭვირვალობის დაფა",
    titleEn: "Budget transparency dashboard",
    summaryKa: "პარტიის შემოსავლებისა და ხარჯების საჯარო დაფა რეალურ დროში.",
    summaryEn: "A public real-time dashboard of party income and spending.",
    author: 5,
    createdAt: "2026-09-02",
    stage: "initiative",
    status: "rejected",
    yes: [0, 1],
    no: [6],
  },
];

async function main() {
  if (await db.district.count()) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const ds = await Promise.all(
    districts.map(([nameKa, nameEn]) => db.district.create({ data: { nameKa, nameEn } }))
  );
  console.log(`Seeded ${ds.length} districts.`);
  if (process.env.SEED_DEMO === "false") return;

  const ms: Member[] = [];
  for (const [i, [nameKa, nameEn, role, joined]] of members.entries()) {
    ms.push(
      await db.member.create({
        data: {
          nameKa,
          nameEn,
          role,
          joined,
          wallet: `Demo${String(i + 1).padStart(2, "0")}Wa11et${"X".repeat(30)}`,
          districtId: ds[i % ds.length].id,
        },
      })
    );
  }

  for (const p of polls) {
    const poll = await db.poll.create({
      data: {
        titleKa: p.titleKa,
        titleEn: p.titleEn,
        endsAt: p.endsAt,
        closedAt: p.closedAt,
        options: { create: p.options.map(([labelKa, labelEn], position) => ({ labelKa, labelEn, position })) },
      },
      include: { options: { orderBy: { position: "asc" } } },
    });
    await db.pollVote.createMany({
      data: p.votes.map((option, m) => ({ pollId: poll.id, memberId: ms[m].id, optionId: poll.options[option].id })),
    });
  }

  for (const i of initiatives) {
    const created = await db.initiative.create({
      data: {
        titleKa: i.titleKa,
        titleEn: i.titleEn,
        summaryKa: i.summaryKa,
        summaryEn: i.summaryEn,
        authorId: ms[i.author].id,
        createdAt: i.createdAt,
        promotedAt: i.stage === "initiative" ? i.createdAt : null,
        stage: i.stage,
        status: i.status,
      },
    });
    await db.initiativeVote.createMany({
      data: [
        ...(i.yes ?? []).map((m) => ({ initiativeId: created.id, memberId: ms[m].id, yes: true })),
        ...(i.no ?? []).map((m) => ({ initiativeId: created.id, memberId: ms[m].id, yes: false })),
      ],
    });
  }
  console.log(`Seeded ${ms.length} demo members, ${polls.length} polls, ${initiatives.length} initiatives.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
