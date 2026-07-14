// Client-safe: question definitions for the survey. Imported by both UI and server validators.

export const TARGET_RESPONSES = 330;
export const REWARD_AMOUNT_KES = 50;

// Yes/No answer type used in Sections B, C, D
export type YesNo = "yes" | "no";

// ----- Screening -----
export const SECTOR_OPTIONS = [
  "Software development / IT services",
  "Digital marketing / creative agency",
  "Fintech / mobile money / payment services",
  "E-commerce / online retail",
  "Cloud / SaaS services",
  "IT consultancy / managed services",
  "Other digital services",
];

export const ROLE_OPTIONS = [
  "Business Owner / CEO / Director",
  "IT Manager / Systems Administrator",
  "Cybersecurity Officer / IT Security Lead",
  "Operations Manager",
  "Other senior role with IT oversight",
];

// ----- Section A -----
export const SECTION_A = {
  A1: {
    type: "radio" as const,
    label: "What sector best describes your business?",
    options: SECTOR_OPTIONS,
    otherOption: "Other digital services",
  },
  A2: {
    type: "radio" as const,
    label: "How many full-time employees does your business have?",
    options: ["1–9 employees", "10–49 employees", "50–99 employees", "100–249 employees"],
  },
  A3: {
    type: "radio" as const,
    label: "How long has your business been running?",
    options: ["Less than 1 year", "1–3 years", "4–7 years", "8–15 years", "More than 15 years"],
  },
  A4: {
    type: "radio" as const,
    label: "How many staff in your business focus on IT or security (as their main job)?",
    options: [
      "None — IT is handled by staff who do other jobs too",
      "1 person",
      "2–3 people",
      "4 or more people",
      "We outsource IT fully to an external company",
    ],
  },
  A5: {
    type: "checkbox" as const,
    label: "Which of the following does your business actively use?",
    options: [
      "Mobile money (M-Pesa, Airtel Money, etc.)",
      "Cloud tools (Google Workspace, AWS, Azure, Microsoft 365, etc.)",
      "Online payment gateway or e-commerce platform",
      "Customer database or CRM system",
      "Remote work or team chat tools (Slack, Teams, Zoom, etc.)",
      "Connections to third-party apps or services via API",
      "Social media for business operations",
      "Online or mobile banking",
    ],
  },
  A6: {
    type: "radio" as const,
    label: "What is your primary role in the business?",
    options: [
      "Business Owner / CEO / Director",
      "IT Manager / Systems Administrator",
      "Cybersecurity Officer / IT Security Lead",
      "Operations Manager",
      "Other",
    ],
    otherOption: "Other",
  },
} as const;

// ----- Section B (Likert agree scale) -----
const B1 = [
  "My business has written security rules or guidelines that all staff know about.",
  "The people who run my business treat online security as a serious priority.",
  "Someone specific in my business is responsible for keeping our systems and data secure.",
  "We think about security risks before adopting any new app, tool, or digital platform.",
  "My business reviews and updates its security rules at least once a year.",
  "My business follows Kenya's data protection laws (e.g. the Data Protection Act 2019).",
];
const B2 = [
  "We regularly identify security risks before making important IT or business decisions.",
  "We have an up-to-date list of all the data, devices, and systems we need to protect.",
  "We check the security practices of suppliers, developers, and other third parties we work with.",
  "We can estimate how much a security breach could cost our business financially.",
  "Managing security risks is part of our normal business planning.",
  "We review our security risks whenever we start using a new digital service or tool.",
];
const B3 = [
  "We use two-step login (where a code is sent to your phone or email) for all important business accounts.",
  "Staff only have access to the accounts and tools they actually need for their job — not everything.",
  "When a staff member or freelancer leaves, we immediately change passwords and remove their access.",
  "We have a list of all our business accounts (email, social media, banking, M-Pesa, cloud tools) and who has access to each.",
  "If a business account on Instagram, TikTok, or another platform was hacked, we know exactly what steps to take to recover it.",
  "We use different passwords for different accounts rather than the same password everywhere.",
];
const B4 = [
  "We use tools or software to watch for suspicious or unusual activity on our systems.",
  "We have a written plan for what to do if a security incident (e.g. hacking, ransomware) happens.",
  "All staff know who to contact and what to do if they suspect a security problem.",
  "We have tested our security response plan through a drill or practice run in the past year.",
  "We have reported security incidents to the relevant authority (e.g. CA Kenya, our bank) when required.",
  "After any security incident, we review what happened to stop it from happening again.",
];
const B5 = [
  "We automatically back up all important business data and systems on a regular basis.",
  "We have tested that our backups can actually be restored when needed.",
  "We keep at least one backup copy of important data in a separate or off-site location.",
  "We have a written plan to keep the business running if a cyberattack were to occur.",
  "We could recover and return to normal operations quickly after a serious cyberattack.",
  "We have cyber insurance or money set aside to deal with the costs of a security incident.",
];
const B6 = [
  "Staff in my business know how to spot a fake or suspicious email, WhatsApp message, or phone call.",
  "Staff know that unexpected M-Pesa STK push prompts they did not initiate should be declined and reported immediately.",
  "When new staff join, we tell them about the security risks they might face in their role — even informally.",
  "My business has discussed cybersecurity risks with the team in the past 12 months — even in a casual conversation.",
  "Staff know not to share passwords, PIN numbers, or M-Pesa confirmation codes with anyone — including people claiming to be from Safaricom or a bank.",
  "My business has run any kind of awareness activity — a meeting, a shared article, a short briefing — about online safety in the past year.",
];

export const SECTION_B_LIKERT = {
  B1: { title: "Rules & Responsibility", items: B1 },
  B2: { title: "Risk Management", items: B2 },
  B3: { title: "Controlling Who Gets In", items: B3 },
  B4: { title: "Spotting and Dealing with Problems", items: B4 },
  B5: { title: "Getting Back on Track After a Problem", items: B5 },
  B6: { title: "Staff Knowledge and Awareness", items: B6 },
} as const;

export const B7a_OPTIONS = [
  "Phishing — fake emails, SMS, or WhatsApp messages sent to staff or customers",
  "Ransomware — our files or systems were locked and a ransom was demanded",
  "Data breach — someone gained unauthorised access to customer, staff, or business data",
  "Account takeover — someone gained unauthorised access to a business email or account",
  "Social engineering — someone tricked staff into giving up passwords or approving payments",
  "M-Pesa or mobile money fraud — fraudulent transactions through our systems",
  "Malware or virus infection on business devices",
  "Website attack — our website or systems were taken offline (DDoS attack)",
  "Third-party breach — an attack via a developer, plugin, or software we rely on",
  "None of the above — we have not experienced any incidents",
];
export const B7b_OPTIONS = ["None", "1–2 incidents", "3–5 incidents", "More than 5 incidents"];
export const B7c_OPTIONS = [
  "Direct financial loss",
  "Operational disruption or system downtime",
  "Loss or compromise of customer data",
  "Reputational or brand damage",
  "Legal or regulatory consequences",
  "Loss of client trust or contract",
  "No significant impact",
  "Not applicable — no incident experienced",
];
export const B7d_ITEMS: string[] = [
  "My business is frequently targeted by criminals because of the digital nature of what we do.",
  "The security threats my business faces have grown worse in the past 12 months.",
  "I am worried that our current security measures are not enough to prevent a serious incident.",
  "M-Pesa fraud and mobile money attacks are a significant threat for a business like mine.",
];

// ----- Section C (barrier scale) -----
export const SECTION_C_BARRIERS = {
  C1: {
    title: "Financial Barriers",
    items: [
      "Security tools and software are too expensive for my business.",
      "We cannot afford to hire a dedicated security expert or consultant.",
      "Security spending is always crowded out by other business costs.",
      "We have no way to tell whether money spent on security is actually worth it.",
      "Getting certified or meeting compliance standards (e.g. ISO 27001) is too costly for a business our size.",
    ],
  },
  C2: {
    title: "Knowledge & Skill Barriers",
    items: [
      "We don't have staff who know enough about cybersecurity.",
      "I personally don't know where to start when it comes to improving our security.",
      "Some staff have limited digital skills, which makes it hard to enforce security measures.",
      "We're not sure which security laws or standards apply to our business.",
      "Trained staff leave for bigger companies, so we keep losing the security knowledge we build.",
    ],
  },
  C3: {
    title: "Does It Fit Your Nairobi Business?",
    items: [
      "This check-up covers the security issues that are most relevant to how my business operates in Nairobi.",
      "The questions about M-Pesa STK fraud, social media account takeovers, and Kenya DPA are relevant to my business.",
      "This tool feels more relevant to my business than international guidelines I may have heard of (e.g. NIST or ISO standards).",
      "The language used in this check-up is clear and does not require a technical background to understand.",
      "This tool reflects the real resource constraints — time, budget, expertise — that my business operates under.",
    ],
  },
  C4: {
    title: "Organisational Barriers",
    items: [
      "Business leadership doesn't prioritise or invest in security.",
      "We don't have written security policies or clear procedures.",
      "Getting staff to change their habits is a major obstacle to better security.",
      "We have no formal way to choose or evaluate security tools.",
      "No one person or team is clearly responsible for security in our business.",
    ],
  },
} as const;

export const C5_OPTIONS = [
  "Financial barriers",
  "Knowledge and skill barriers",
  "Technology infrastructure barriers",
  "Organisational and governance barriers",
  "All are equally significant",
];

// ----- Section D -----
export const D1_ITEMS: string[] = [
  "I found this assessment easy to complete without needing specialist help.",
  "I understood what each section of the assessment was trying to measure.",
  "The results clearly show me where my business's security gaps are.",
  "I believe this tool is affordable and the right size for a business like mine.",
  "The six sections felt well-connected and made sense as a whole.",
  "I would recommend this assessment to other digital businesses of a similar size.",
  "This tool reflects the real security challenges I face as a Nairobi digital SME.",
];

export const D2_ITEMS = [
  "Using this tool would help my business make better security decisions.",
  "I can see the value in completing this assessment every year or before adding a new platform.",
  "The scores from this assessment would help me decide where to spend on security first.",
  "I would use this tool on my own — without needing to hire a consultant — to assess my business each year.",
  "The five maturity levels (from Initial to Optimising) give my business a clear path to improving.",
];

export const D3_ITEMS = [
  "This tool reflects the security threats most relevant to my business in Nairobi.",
  "It covers risks specific to digital SMEs, like M-Pesa fraud and third-party developer risks.",
  "The six areas cover the security topics most important to a business of my type and size.",
  "This tool is more relevant to my business than international standards like NIST CSF or ISO 27001.",
  "I would trust this tool's results more than a self-assessment based on a global standard.",
];

export const D4_PROMPTS = {
  D4a: "What did you find most useful about this assessment?",
  D4b: "What changes or additions would make this tool more useful for your business?",
  D4c: "Are there security risks specific to digital SMEs in Nairobi — such as M-Pesa fraud, developer access, or client data handling — that this tool doesn't cover well?",
  D4d: "How often would your business realistically use this assessment? (e.g. once a year, before launching a new service, when bringing on a new IT partner)",
} as const;

export const SURVEY_STEPS = [
  "Section A — Organisational Profile",
  "B1 — Governance & Policy",
  "B2 — Risk Management",
  "B3 — Access Control",
  "B4 — Incident Detection & Response",
  "B5 — Recovery & Business Continuity",
  "B6 — Awareness & Training",
  "B7 — Threat Exposure",
  "Section C — Adoption Barriers",
  "Section D — Model Usability",
] as const;

export const PHONE_REGEX = /^(07|01)\d{8}$/;
