import type { Locale } from "./i18n";

// Texts of the public website (/site). Edit them here; the news timeline is managed
// in the app's admin panel instead.

/** Contact details. Empty values are not shown on the site. */
export const contacts = {
  email: "",
  phone: "",
  address: { ka: "", en: "" },
  facebook: "", // full URL
  website: "https://e-p.hrgeo.ge",
};

const en = {
  nav: { about: "About", statute: "Statute", membership: "Membership", news: "News", contacts: "Contacts" },
  openApp: "Open the app",
  slides: [
    {
      title: "A party governed by its members",
      text: "Every decision is made by the members' vote. No back rooms, no middlemen.",
    },
    {
      title: "One member, one vote",
      text: "Members sign in with their Solana wallet and vote from their phone. Results are open to everyone.",
    },
    {
      title: "Ideas come from the members",
      text: "Any member can propose an initiative. With enough support it becomes a poll for the whole party.",
    },
    {
      title: "Join us",
      text: "Apply in the app. The administrator verifies your identity and adds you to the member register.",
    },
  ],
  about: {
    title: "About the party",
    paragraphs: [
      "E-Party is an electronic political party: its members make decisions together, online, through transparent votes.",
      "The party runs on an open platform. The member register, the polls and their results are public, so anyone can check how a decision was reached.",
      "Members sign in with a Solana wallet instead of a password. This makes every vote personal and impossible to cast on someone else's behalf.",
    ],
    points: [
      { title: "Transparency", text: "Polls, results and the member register are open to everyone." },
      { title: "Direct democracy", text: "Members decide themselves instead of delegating every question." },
      { title: "Security", text: "Signing in and voting is done with a personal cryptographic wallet." },
    ],
  },
  statute: {
    title: "Statute",
    subtitle: "The main provisions of the party's statute.",
    articles: [
      {
        title: "Article 1. General provisions",
        text: "E-Party is a voluntary association of citizens of Georgia whose decisions are made by the electronic vote of its members.",
      },
      {
        title: "Article 2. Goals",
        text: "To involve citizens directly in political decisions, to make the party's work fully transparent and to develop electronic democracy in Georgia.",
      },
      {
        title: "Article 3. Members",
        text: "Any citizen of Georgia who shares the party's goals, has passed identity verification and is entered in the member register can be a member. Every member has one vote.",
      },
      {
        title: "Article 4. Initiatives",
        text: "Any member can submit a proposal. A proposal liked by 1% of members within 10 days becomes an initiative; an initiative supported by 51% of members within 10 days is put to a poll of all members.",
      },
      {
        title: "Article 5. Polls",
        text: "Polls are held electronically within the announced dates. The option with the most votes wins. Results are published and kept open.",
      },
      {
        title: "Article 6. Administration",
        text: "The administrator verifies applications, keeps the member register and organises polls, but has no more votes than any other member.",
      },
    ],
  },
  membership: {
    title: "How to join",
    subtitle: "Membership is free and takes a few minutes.",
    steps: [
      { title: "Create a wallet", text: "Install Phantom or Solflare on your phone and create a Solana wallet." },
      { title: "Fill in the application", text: "In the app, open “Join”, enter your name, contacts and district, and attach both sides of your ID card." },
      { title: "Verification", text: "The administrator checks your identity. ID photos are deleted once the application is decided." },
      { title: "Vote", text: "Once approved you appear in the member register and can vote and propose initiatives." },
    ],
    requirements: {
      title: "Requirements",
      items: [
        "Citizen of Georgia, 18 years or older",
        "A valid ID card",
        "A personal Solana wallet (one wallet per member)",
        "Agreement with the party's statute",
      ],
    },
    apply: "Apply in the app",
  },
  news: { title: "News", empty: "No news yet." },
  contacts: {
    title: "Contacts",
    subtitle: "Get in touch with us.",
    email: "Email",
    phone: "Phone",
    address: "Address",
    facebook: "Facebook",
    website: "Website",
  },
  footer: "Electronic party",
};

export type SiteContent = typeof en;

const ka: SiteContent = {
  nav: { about: "პარტიის შესახებ", statute: "წესდება", membership: "გაწევრიანება", news: "სიახლეები", contacts: "კონტაქტი" },
  openApp: "აპლიკაციის გახსნა",
  slides: [
    {
      title: "პარტია, რომელსაც წევრები მართავენ",
      text: "ყოველი გადაწყვეტილება წევრების ხმის მიცემით მიიღება. დახურული კარის და შუამავლების გარეშე.",
    },
    {
      title: "ერთი წევრი, ერთი ხმა",
      text: "წევრები Solana ვოლეტით შედიან და ხმას ტელეფონიდან აძლევენ. შედეგები ყველასთვის ღიაა.",
    },
    {
      title: "იდეები წევრებისგან მოდის",
      text: "ნებისმიერ წევრს შეუძლია ინიციატივის შეთავაზება. საკმარისი მხარდაჭერით ის მთელი პარტიის გამოკითხვა ხდება.",
    },
    {
      title: "შემოგვიერთდით",
      text: "შეავსეთ განაცხადი აპლიკაციაში. ადმინისტრატორი გადაამოწმებს თქვენს ვინაობას და დაგამატებთ წევრთა რეესტრში.",
    },
  ],
  about: {
    title: "პარტიის შესახებ",
    paragraphs: [
      "ელექტრონული პარტია არის პოლიტიკური პარტია, რომლის წევრებიც გადაწყვეტილებებს ერთად, ონლაინ, გამჭვირვალე კენჭისყრით იღებენ.",
      "პარტია ღია პლატფორმაზე მუშაობს. წევრთა რეესტრი, გამოკითხვები და მათი შედეგები საჯაროა, ამიტომ ნებისმიერს შეუძლია შეამოწმოს, როგორ იქნა მიღებული გადაწყვეტილება.",
      "წევრები პაროლის ნაცვლად Solana ვოლეტით შედიან. ამიტომ ყოველი ხმა პერსონალურია და სხვის სახელით მისი მიცემა შეუძლებელია.",
    ],
    points: [
      { title: "გამჭვირვალობა", text: "გამოკითხვები, შედეგები და წევრთა რეესტრი ყველასთვის ღიაა." },
      { title: "პირდაპირი დემოკრატია", text: "წევრები თავად წყვეტენ და არა მათი სახელით სხვები." },
      { title: "უსაფრთხოება", text: "შესვლა და ხმის მიცემა პერსონალური კრიპტოგრაფიული ვოლეტით ხდება." },
    ],
  },
  statute: {
    title: "წესდება",
    subtitle: "პარტიის წესდების ძირითადი დებულებები.",
    articles: [
      {
        title: "მუხლი 1. ზოგადი დებულებები",
        text: "ელექტრონული პარტია არის საქართველოს მოქალაქეთა ნებაყოფლობითი გაერთიანება, რომლის გადაწყვეტილებებიც წევრების ელექტრონული კენჭისყრით მიიღება.",
      },
      {
        title: "მუხლი 2. მიზნები",
        text: "მოქალაქეების პირდაპირი ჩართვა პოლიტიკურ გადაწყვეტილებებში, პარტიის საქმიანობის სრული გამჭვირვალობა და ელექტრონული დემოკრატიის განვითარება საქართველოში.",
      },
      {
        title: "მუხლი 3. წევრები",
        text: "წევრი შეიძლება იყოს საქართველოს ნებისმიერი მოქალაქე, რომელიც იზიარებს პარტიის მიზნებს, გაიარა ვინაობის გადამოწმება და შეყვანილია წევრთა რეესტრში. ყოველ წევრს აქვს ერთი ხმა.",
      },
      {
        title: "მუხლი 4. ინიციატივები",
        text: "ნებისმიერ წევრს შეუძლია წინადადების წარდგენა. წინადადება, რომელსაც 10 დღეში წევრების 1% მოიწონებს, ინიციატივა ხდება; ინიციატივა, რომელსაც 10 დღეში წევრების 51% დაუჭერს მხარს, ყველა წევრის გამოკითხვაზე გადის.",
      },
      {
        title: "მუხლი 5. გამოკითხვები",
        text: "გამოკითხვა ელექტრონულად, გამოცხადებულ ვადებში ტარდება. იმარჯვებს ვარიანტი, რომელიც ყველაზე მეტ ხმას მიიღებს. შედეგები ქვეყნდება და ღიად ინახება.",
      },
      {
        title: "მუხლი 6. ადმინისტრირება",
        text: "ადმინისტრატორი ამოწმებს განაცხადებს, აწარმოებს წევრთა რეესტრს და აწყობს გამოკითხვებს, თუმცა მას სხვა წევრზე მეტი ხმა არ აქვს.",
      },
    ],
  },
  membership: {
    title: "როგორ გავწევრიანდე",
    subtitle: "გაწევრიანება უფასოა და რამდენიმე წუთს მოითხოვს.",
    steps: [
      { title: "შექმენით ვოლეტი", text: "დააყენეთ Phantom ან Solflare ტელეფონზე და შექმენით Solana ვოლეტი." },
      { title: "შეავსეთ განაცხადი", text: "აპლიკაციაში გახსენით „გაწევრიანება“, მიუთითეთ სახელი, კონტაქტი და რაიონი და მიამაგრეთ პირადობის ორივე მხარე." },
      { title: "გადამოწმება", text: "ადმინისტრატორი ამოწმებს თქვენს ვინაობას. პირადობის ფოტოები განაცხადის განხილვის შემდეგ იშლება." },
      { title: "ხმის მიცემა", text: "დამტკიცების შემდეგ ჩნდებით წევრთა რეესტრში და შეგიძლიათ ხმის მიცემა და ინიციატივების შეთავაზება." },
    ],
    requirements: {
      title: "მოთხოვნები",
      items: [
        "საქართველოს მოქალაქე, 18 წლის ან უფროსი",
        "მოქმედი პირადობის მოწმობა",
        "პერსონალური Solana ვოლეტი (ერთი ვოლეტი ერთ წევრზე)",
        "თანხმობა პარტიის წესდებასთან",
      ],
    },
    apply: "განაცხადი აპლიკაციაში",
  },
  news: { title: "სიახლეები", empty: "სიახლეები ჯერ არ არის." },
  contacts: {
    title: "კონტაქტი",
    subtitle: "დაგვიკავშირდით.",
    email: "ელ-ფოსტა",
    phone: "ტელეფონი",
    address: "მისამართი",
    facebook: "Facebook",
    website: "ვებგვერდი",
  },
  footer: "ელექტრონული პარტია",
};

export function getSiteContent(locale: Locale): SiteContent {
  return locale === "ka" ? ka : en;
}
