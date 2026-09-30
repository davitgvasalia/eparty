import type { Locale } from "./i18n";

const en = {
  appName: "E-Party",
  tagline: "Transparent, decentralized governance",
  nav: {
    home: "Home",
    members: "Members",
    polls: "Polls",
    initiatives: "Initiatives",
    results: "Completed",
    admin: "Admin",
  },
  common: {
    demoNotice:
      "Demo data. Voting is not yet connected to the Solana program.",
    votes: "votes",
    endsOn: "Ends",
    endedOn: "Ended",
    winner: "Leading option",
    connectToVote: "Connect your wallet to vote",
    vote: "Cast vote",
    voted: "Your vote is recorded (demo)",
    empty: "Nothing here yet.",
  },
  login: {
    title: "Sign in with your wallet",
    subtitle:
      "No password, no email. Your Solana wallet is your identity in the party.",
    steps: [
      "Connect your wallet (Phantom, Solflare)",
      "Sign a one-time message. It is free and sends no transaction",
      "You are in. Members can vote, everyone can read",
    ],
    connected: "Wallet connected",
    goHome: "Go to dashboard",
    note: "Membership is granted by the administrator after identity verification.",
  },
  home: {
    welcome: "Welcome",
    stats: {
      members: "Members",
      activePolls: "Active polls",
      initiatives: "Initiatives",
      completed: "Completed polls",
    },
    latestPolls: "Active polls",
    latestInitiatives: "Latest initiatives",
    viewAll: "View all",
  },
  members: {
    title: "Party members",
    subtitle: "Public register of verified members",
    name: "Name",
    wallet: "Wallet",
    role: "Role",
    joined: "Joined",
    admin: "Administrator",
    member: "Member",
  },
  polls: {
    title: "Active polls",
    subtitle: "One member, one vote. Every vote is recorded on Solana.",
  },
  initiatives: {
    title: "Initiatives",
    subtitle: "Proposals from members. Approved ones become polls.",
    author: "Author",
    supporters: "supporters",
    status: {
      pending: "Under review",
      approved: "Approved",
      rejected: "Rejected",
    },
  },
  results: {
    title: "Completed polls",
    subtitle: "Final, public and verifiable results",
    turnout: "Total votes",
  },
  admin: {
    title: "Administration",
    subtitle: "Manage members, polls and initiatives",
    restricted: "This section is only available to the administrator wallet.",
    connectFirst: "Connect the administrator wallet to continue.",
    demoMode:
      "Demo mode: no administrator wallet is configured, so this panel is open.",
    tabs: { members: "Members", polls: "Polls", initiatives: "Initiatives" },
    addMember: "Add member",
    fullNameKa: "Full name (Georgian)",
    fullNameEn: "Full name (English)",
    walletAddress: "Wallet address",
    add: "Add",
    remove: "Remove",
    createPoll: "Create poll",
    pollTitleKa: "Question (Georgian)",
    pollTitleEn: "Question (English)",
    optionsHint: "Options, one per line",
    endDate: "End date",
    create: "Create",
    closePoll: "Close poll",
    approve: "Approve",
    reject: "Reject",
    openPolls: "Open polls",
    closed: "Closed",
    pendingOnly: "Initiatives awaiting review",
  },
};

export type Dict = typeof en;

const ka: Dict = {
  appName: "ელექტრონული პარტია",
  tagline: "გამჭვირვალე, დეცენტრალიზებული მმართველობა",
  nav: {
    home: "მთავარი",
    members: "წევრები",
    polls: "გამოკითხვები",
    initiatives: "ინიციატივები",
    results: "დასრულებული",
    admin: "ადმინისტრატორი",
  },
  common: {
    demoNotice:
      "დემო მონაცემებია. ხმის მიცემა ჯერ არ არის დაკავშირებული Solana-ს პროგრამასთან.",
    votes: "ხმა",
    endsOn: "მთავრდება",
    endedOn: "დასრულდა",
    winner: "ლიდერი ვარიანტი",
    connectToVote: "ხმის მისაცემად დააკავშირეთ ვოლეტი",
    vote: "ხმის მიცემა",
    voted: "თქვენი ხმა დაფიქსირდა (დემო)",
    empty: "ჯერ არაფერია.",
  },
  login: {
    title: "შესვლა ვოლეტით",
    subtitle:
      "პაროლი და ელფოსტა საჭირო არ არის. თქვენი Solana ვოლეტი არის თქვენი იდენტობა პარტიაში.",
    steps: [
      "დააკავშირეთ ვოლეტი (Phantom, Solflare)",
      "მოაწერეთ ხელი ერთჯერად შეტყობინებას. ეს უფასოა და ტრანზაქცია არ იგზავნება",
      "მზადაა. წევრებს შეუძლიათ ხმის მიცემა, წაკითხვა კი ყველას",
    ],
    connected: "ვოლეტი დაკავშირებულია",
    goHome: "მთავარ გვერდზე გადასვლა",
    note: "წევრობას ანიჭებს ადმინისტრატორი პირადობის დადასტურების შემდეგ.",
  },
  home: {
    welcome: "კეთილი იყოს თქვენი მობრძანება",
    stats: {
      members: "წევრი",
      activePolls: "აქტიური გამოკითხვა",
      initiatives: "ინიციატივა",
      completed: "დასრულებული გამოკითხვა",
    },
    latestPolls: "აქტიური გამოკითხვები",
    latestInitiatives: "ბოლო ინიციატივები",
    viewAll: "ყველას ნახვა",
  },
  members: {
    title: "პარტიის წევრები",
    subtitle: "დადასტურებული წევრების საჯარო რეესტრი",
    name: "სახელი",
    wallet: "ვოლეტი",
    role: "როლი",
    joined: "გაწევრიანდა",
    admin: "ადმინისტრატორი",
    member: "წევრი",
  },
  polls: {
    title: "აქტიური გამოკითხვები",
    subtitle: "ერთი წევრი, ერთი ხმა. ყველა ხმა ფიქსირდება Solana-ზე.",
  },
  initiatives: {
    title: "ინიციატივები",
    subtitle: "წევრების წინადადებები. დამტკიცებული ინიციატივა ხდება გამოკითხვა.",
    author: "ავტორი",
    supporters: "მხარდამჭერი",
    status: {
      pending: "განხილვაშია",
      approved: "დამტკიცებულია",
      rejected: "უარყოფილია",
    },
  },
  results: {
    title: "დასრულებული გამოკითხვები",
    subtitle: "საბოლოო, საჯარო და გადამოწმებადი შედეგები",
    turnout: "სულ ხმა",
  },
  admin: {
    title: "ადმინისტრირება",
    subtitle: "წევრების, გამოკითხვებისა და ინიციატივების მართვა",
    restricted: "ეს განყოფილება ხელმისაწვდომია მხოლოდ ადმინისტრატორის ვოლეტისთვის.",
    connectFirst: "გასაგრძელებლად დააკავშირეთ ადმინისტრატორის ვოლეტი.",
    demoMode:
      "დემო რეჟიმი: ადმინისტრატორის ვოლეტი არ არის მითითებული, ამიტომ პანელი ღიაა.",
    tabs: { members: "წევრები", polls: "გამოკითხვები", initiatives: "ინიციატივები" },
    addMember: "წევრის დამატება",
    fullNameKa: "სახელი და გვარი (ქართულად)",
    fullNameEn: "სახელი და გვარი (ინგლისურად)",
    walletAddress: "ვოლეტის მისამართი",
    add: "დამატება",
    remove: "წაშლა",
    createPoll: "გამოკითხვის შექმნა",
    pollTitleKa: "კითხვა (ქართულად)",
    pollTitleEn: "კითხვა (ინგლისურად)",
    optionsHint: "ვარიანტები, თითო ხაზზე ერთი",
    endDate: "დასრულების თარიღი",
    create: "შექმნა",
    closePoll: "გამოკითხვის დახურვა",
    approve: "დამტკიცება",
    reject: "უარყოფა",
    openPolls: "ღია გამოკითხვები",
    closed: "დახურულია",
    pendingOnly: "განხილვის მომლოდინე ინიციატივები",
  },
};

const dictionaries: Record<Locale, Dict> = { ka, en };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}
