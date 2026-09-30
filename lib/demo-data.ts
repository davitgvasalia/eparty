import type { L10n } from "./i18n";

export type Role = "admin" | "member";

export interface Member {
  id: string;
  name: L10n;
  wallet: string;
  role: Role;
  joined: string; // ISO date
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
  endsAt: string; // ISO date
  closed: boolean;
}

export type InitiativeStatus = "pending" | "approved" | "rejected";

export interface Initiative {
  id: string;
  title: L10n;
  summary: L10n;
  authorId: string;
  supporters: number;
  status: InitiativeStatus;
}

export const members: Member[] = [
  { id: "m1", name: { ka: "ნინო კვარაცხელია", en: "Nino Kvaratskhelia" }, wallet: "DemoAdm1nWa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXA", role: "admin", joined: "2026-01-10" },
  { id: "m2", name: { ka: "გიორგი მამულაშვილი", en: "Giorgi Mamulashvili" }, wallet: "DemoMem2Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXB", role: "member", joined: "2026-02-03" },
  { id: "m3", name: { ka: "ლევან ბერიძე", en: "Levan Beridze" }, wallet: "DemoMem3Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXC", role: "member", joined: "2026-02-17" },
  { id: "m4", name: { ka: "თამარ ჯავახიშვილი", en: "Tamar Javakhishvili" }, wallet: "DemoMem4Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXD", role: "member", joined: "2026-03-05" },
  { id: "m5", name: { ka: "დავით ხარაიშვილი", en: "Davit Kharaishvili" }, wallet: "DemoMem5Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXE", role: "member", joined: "2026-03-21" },
  { id: "m6", name: { ka: "მარიამ ლომიძე", en: "Mariam Lomidze" }, wallet: "DemoMem6Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXF", role: "member", joined: "2026-04-09" },
  { id: "m7", name: { ka: "ზურაბ წულუკიძე", en: "Zurab Tsulukidze" }, wallet: "DemoMem7Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXG", role: "member", joined: "2026-05-14" },
  { id: "m8", name: { ka: "ანა ჩხეიძე", en: "Ana Chkheidze" }, wallet: "DemoMem8Wa11etXXXXXXXXXXXXXXXXXXXXXXXXXXXXH", role: "member", joined: "2026-06-02" },
];

export const polls: Poll[] = [
  {
    id: "p1",
    title: {
      ka: "მხარს უჭერთ თუ არა რეგიონული განვითარების ახალ პროგრამას?",
      en: "Do you support the new regional development program?",
    },
    options: [
      { id: "yes", label: { ka: "დიახ", en: "Yes" }, votes: 112 },
      { id: "no", label: { ka: "არა", en: "No" }, votes: 31 },
      { id: "abstain", label: { ka: "თავს ვიკავებ", en: "Abstain" }, votes: 9 },
    ],
    endsAt: "2026-10-12",
    closed: false,
  },
  {
    id: "p2",
    title: {
      ka: "აირჩიეთ საერთო კრების თარიღი",
      en: "Choose the date of the general assembly",
    },
    options: [
      { id: "d1", label: { ka: "25 ოქტომბერი", en: "25 October" }, votes: 64 },
      { id: "d2", label: { ka: "8 ნოემბერი", en: "8 November" }, votes: 88 },
      { id: "d3", label: { ka: "22 ნოემბერი", en: "22 November" }, votes: 41 },
    ],
    endsAt: "2026-10-20",
    closed: false,
  },
  {
    id: "p3",
    title: {
      ka: "რომელია პირველი კვარტლის ბიუჯეტის პრიორიტეტი?",
      en: "What is the budget priority for Q1?",
    },
    options: [
      { id: "edu", label: { ka: "განათლება", en: "Education" }, votes: 77 },
      { id: "health", label: { ka: "ჯანდაცვა", en: "Healthcare" }, votes: 69 },
      { id: "infra", label: { ka: "ინფრასტრუქტურა", en: "Infrastructure" }, votes: 35 },
      { id: "digital", label: { ka: "ციფრული სერვისები", en: "Digital services" }, votes: 52 },
    ],
    endsAt: "2026-11-01",
    closed: false,
  },
];

export const finishedPolls: Poll[] = [
  {
    id: "f1",
    title: {
      ka: "უნდა გახდეს თუ არა წევრობის შენატანი წლიური?",
      en: "Should membership dues become annual?",
    },
    options: [
      { id: "yes", label: { ka: "დიახ", en: "Yes" }, votes: 143 },
      { id: "no", label: { ka: "არა", en: "No" }, votes: 58 },
    ],
    endsAt: "2026-08-15",
    closed: true,
  },
  {
    id: "f2",
    title: {
      ka: "პარტიის ახალი ლოგოს არჩევა",
      en: "Choosing the party's new logo",
    },
    options: [
      { id: "a", label: { ka: "ვარიანტი A", en: "Option A" }, votes: 90 },
      { id: "b", label: { ka: "ვარიანტი B", en: "Option B" }, votes: 121 },
      { id: "c", label: { ka: "ვარიანტი C", en: "Option C" }, votes: 47 },
    ],
    endsAt: "2026-07-01",
    closed: true,
  },
  {
    id: "f3",
    title: {
      ka: "ღია სხდომების ონლაინ გადაცემა",
      en: "Live-streaming open meetings",
    },
    options: [
      { id: "yes", label: { ka: "დიახ", en: "Yes" }, votes: 176 },
      { id: "no", label: { ka: "არა", en: "No" }, votes: 12 },
    ],
    endsAt: "2026-06-10",
    closed: true,
  },
];

export const initiatives: Initiative[] = [
  {
    id: "i1",
    title: { ka: "უფასო ინტერნეტი სოფლის სკოლებში", en: "Free internet in village schools" },
    summary: {
      ka: "ყველა სოფლის სკოლაში ოპტიკურ-ბოჭკოვანი კავშირის უზრუნველყოფა.",
      en: "Provide fiber connectivity to every village school.",
    },
    authorId: "m4",
    supporters: 58,
    status: "pending",
  },
  {
    id: "i2",
    title: { ka: "წევრთა ყოველთვიური ღია შეხვედრა", en: "Monthly open meeting for members" },
    summary: {
      ka: "თვეში ერთხელ ღია შეხვედრა ჰიბრიდულ ფორმატში.",
      en: "A monthly open meeting in hybrid format.",
    },
    authorId: "m2",
    supporters: 96,
    status: "approved",
  },
  {
    id: "i3",
    title: { ka: "ბიუჯეტის გამჭვირვალობის დაფა", en: "Budget transparency dashboard" },
    summary: {
      ka: "პარტიის შემოსავლებისა და ხარჯების საჯარო დაფა რეალურ დროში.",
      en: "A public real-time dashboard of party income and spending.",
    },
    authorId: "m6",
    supporters: 121,
    status: "approved",
  },
  {
    id: "i4",
    title: { ka: "ხმის მიცემა SMS-ით", en: "Voting by SMS" },
    summary: {
      ka: "ხმის მიცემის შესაძლებლობა SMS-ით ვოლეტის გარეშე.",
      en: "Allow voting by SMS without a wallet.",
    },
    authorId: "m7",
    supporters: 14,
    status: "rejected",
  },
];

export const totalVotes = (p: Poll) => p.options.reduce((s, o) => s + o.votes, 0);
