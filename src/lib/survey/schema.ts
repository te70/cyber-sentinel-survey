// Client-safe: question definitions for the survey. Imported by both UI and server validators.

export const TARGET_RESPONSES = 330;
export const REWARD_AMOUNT_KES = 100;

export const LIKERT_AGREE: { value: number; label: string }[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

export const LIKERT_BARRIER: { value: number; label: string }[] = [
  { value: 1, label: "Not a barrier" },
  { value: 2, label: "Minor barrier" },
  { value: 3, label: "Moderate barrier" },
  { value: 4, label: "Major barrier" },
  { value: 5, label: "Critical barrier" },
];

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
    label: "How many full-time employees does your business currently employ?",
    options: ["1–9 employees", "10–49 employees", "50–99 employees", "100–249 employees"],
  },
  A3: {
    type: "radio" as const,
    label: "How long has your business been in operation?",
    options: ["Less than 1 year", "1–3 years", "4–7 years", "8–15 years", "More than 15 years"],
  },
  A4: {
    type: "radio" as const,
    label: "How many dedicated IT or cybersecurity staff does your business employ?",
    options: [
      "None — IT is managed by non-specialist staff",
      "1 person",
      "2–3 people",
      "4 or more people",
      "IT is fully outsourced to a third party",
    ],
  },
  A5: {
    type: "checkbox" as const,
    label: "Which of the following digital platforms does your business actively use?",
    options: [
      "Mobile money integration (M-Pesa, Airtel Money, etc.)",
      "Cloud storage or SaaS tools (Google Workspace, AWS, Azure, etc.)",
      "Online payment gateway or e-commerce platform",
      "Customer database or CRM system",
      "Remote work or collaboration tools (Slack, Teams, Zoom, etc.)",
      "API integrations with third-party services",
      "Social media platforms for business operations",
      "Online banking or mobile banking",
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
  "My business has a documented information security or cybersecurity policy that all staff are aware of.",
  "Senior management treats cybersecurity as a core business priority, not an afterthought.",
  "My business assigns clear responsibility for cybersecurity to a specific person or role.",
  "Cybersecurity considerations are included when deciding to adopt new digital tools or platforms.",
  "My business reviews and updates its security policies at least once per year.",
  "My business complies with relevant Kenyan data protection regulations (e.g. the Data Protection Act 2019).",
];
const B2 = [
  "My business regularly identifies and documents cybersecurity risks before making IT or operational decisions.",
  "My business has a current inventory of the digital assets (data, systems, devices) that need to be protected.",
  "My business evaluates the cybersecurity risk posed by third-party suppliers, developers, or service providers.",
  "My business can estimate the potential financial impact of a cybersecurity incident on operations.",
  "Security risk management is formally integrated into my business's overall operational or strategic planning.",
  "My business has a process for reviewing and updating its risk assessment when new digital services are adopted.",
];
const B3 = [
  "My business uses multi-factor authentication (MFA) for all business-critical accounts and systems.",
  "Staff are only granted access to the systems and data required for their specific role (least-privilege principle).",
  "When an employee or contractor leaves, their access to all business systems is removed immediately.",
  "My business enforces strong, unique passwords and a regular password-change policy across all accounts.",
  "My business has controls to prevent unauthorised devices from connecting to its network or systems.",
  "Access to sensitive customer or business data is logged and monitored for unusual activity.",
];
const B4 = [
  "My business uses tools or software to monitor its systems for unusual, suspicious, or unauthorised activity.",
  "My business has a documented incident response procedure for cybersecurity events (e.g. ransomware, data breach).",
  "All staff know who to contact and what immediate steps to take if they suspect a security incident.",
  "My business has tested its incident response procedure through a drill or simulation in the past 12 months.",
  "My business has reported a cybersecurity incident to a relevant authority (e.g. CA Kenya, bank) when required.",
  "After any security incident, my business conducts a formal review to understand what happened and prevent recurrence.",
];
const B5 = [
  "My business performs regular automated backups of all critical data and systems.",
  "My business has tested that backed-up data can be successfully restored within an acceptable timeframe.",
  "At least one backup copy of critical data is stored in a physically separate or off-site location.",
  "My business has a documented business continuity plan that would allow operations to continue during a cyberattack.",
  "My business could restore normal operations within an acceptable timeframe following a serious cyber incident.",
  "My business has cyber insurance or a financial contingency plan specifically for cybersecurity incidents.",
];
const B6 = [
  "My business provided cybersecurity awareness training to all staff in the past 12 months.",
  "New employees receive formal cybersecurity orientation as part of their onboarding process.",
  "Staff in my business can confidently recognise the signs of a phishing email or social engineering attempt.",
  "My business uses simulated phishing exercises or other practical methods to test and reinforce staff awareness.",
  "Cybersecurity awareness is treated as an ongoing practice in my business, reviewed and refreshed regularly.",
  "My business monitors whether staff apply cybersecurity best practices in their day-to-day work.",
];

export const SECTION_B_LIKERT = {
  B1: { title: "Governance & Policy", items: B1 },
  B2: { title: "Risk Management", items: B2 },
  B3: { title: "Access Control", items: B3 },
  B4: { title: "Incident Detection & Response", items: B4 },
  B5: { title: "Recovery & Business Continuity", items: B5 },
  B6: { title: "Awareness & Training", items: B6 },
} as const;

export const B7a_OPTIONS = [
  "Phishing attack (fraudulent email, SMS, or WhatsApp message targeting staff or customers)",
  "Ransomware attack (files or systems encrypted and ransom demanded)",
  "Data breach (unauthorised access to customer, employee, or business data)",
  "Unauthorised access to a business account, email, or system",
  "Social engineering attempt (manipulation to obtain credentials or authorise transactions)",
  "Mobile money or M-Pesa fraud (fraudulent transactions or API abuse)",
  "Malware or virus infection on business devices",
  "Distributed Denial of Service (DDoS) attack on business systems or website",
  "Supply chain attack via a third-party developer, plugin, or software provider",
  "None of the above — no incident experienced",
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
export const B7d_ITEMS = [
  "My business is frequently targeted by cybercriminals because of the digital nature of our services.",
  "The cybersecurity threats my business faces have increased in the past 12 months.",
  "I am concerned that my business's current security measures are insufficient to prevent a serious incident.",
  "Mobile money fraud and M-Pesa-related attacks are a particularly significant threat for my type of business.",
];

// ----- Section C (barrier scale) -----
export const SECTION_C_BARRIERS = {
  C1: {
    title: "Financial Barriers",
    items: [
      "The cost of cybersecurity tools, software, or platforms is too high for my business.",
      "My business cannot afford to hire a dedicated cybersecurity professional or consultant.",
      "Cybersecurity budget competes with other business priorities and is consistently underfunded.",
      "My business lacks a method to calculate the return on investment (ROI) of security spending.",
      "The cost of achieving certification or compliance (e.g. ISO 27001) is prohibitive for my business.",
    ],
  },
  C2: {
    title: "Knowledge & Skill Barriers",
    items: [
      "My business lacks staff with sufficient cybersecurity knowledge or qualifications.",
      "I personally do not know where to begin implementing structured cybersecurity practices.",
      "Staff in my business have low digital literacy, making it difficult to implement security controls.",
      "My business is unfamiliar with the cybersecurity regulations and frameworks that apply to us.",
      "Cybersecurity knowledge and skills are difficult to retain because trained staff are recruited away by larger firms.",
    ],
  },
  C3: {
    title: "Technology Infrastructure Barriers",
    items: [
      "My business's IT infrastructure is too basic or outdated to support advanced cybersecurity controls.",
      "Existing cybersecurity frameworks assume a level of technological maturity that my business has not yet reached.",
      "Unreliable internet connectivity in Nairobi makes it difficult to implement and maintain cloud-based security tools.",
      "My business relies heavily on personal mobile devices for work, which are difficult to secure consistently.",
      "Third-party developers or platforms my business depends on have weak or unknown security standards.",
    ],
  },
  C4: {
    title: "Organisational & Governance Barriers",
    items: [
      "Senior management in my business does not prioritise or champion cybersecurity investment.",
      "My business lacks documented security policies, procedures, or governance structures.",
      "Staff attitudes and resistance to changing behaviour are a significant obstacle to improving security.",
      "My business has no formal process for evaluating or selecting cybersecurity tools or frameworks.",
      "Cybersecurity responsibilities are unclear — no single person or team owns the security function.",
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
export const D1_ITEMS: { text: string; reverse: boolean }[] = [
  { text: "I found this cybersecurity maturity assessment easy to complete without specialist help.", reverse: false },
  { text: "I would need significant technical support before I could use this model regularly in my business.", reverse: true },
  { text: "I felt confident that I understood what the assessment was measuring at each section.", reverse: false },
  { text: "The results of this assessment clearly show me where my business's cybersecurity gaps are.", reverse: false },
  { text: "There was too much inconsistency in this tool for me to trust its results.", reverse: true },
  { text: "I believe this tool is affordable and appropriately sized for a business like mine.", reverse: false },
  { text: "The six sections of this model felt logically connected and worked together as a coherent whole.", reverse: false },
  { text: "I would need to learn many new things before I could effectively use this model in my business.", reverse: true },
  { text: "I would recommend this maturity assessment model to other digital services businesses of a similar size.", reverse: false },
  { text: "I felt that this model addressed the real cybersecurity challenges I face as a Nairobi digital services SME.", reverse: false },
];

export const D2_ITEMS = [
  "Using this assessment tool would help my business make better-informed cybersecurity decisions.",
  "I can clearly see the practical benefit of completing this assessment annually or before adopting a new platform.",
  "The domain scores produced by this model would help me prioritise where to invest in security first.",
  "I would use this tool independently — without needing to hire a consultant — to assess my business each year.",
  "The five-tier maturity structure (Initial to Optimising) gives my business a realistic improvement roadmap.",
];

export const D3_ITEMS = [
  "This assessment tool reflects the cybersecurity threats that are most relevant to how my business operates in Nairobi.",
  "The tool adequately covers risks specific to digital services SMEs, such as M-Pesa fraud and API security.",
  "The six domains cover the security areas most important to a business of my type and size.",
  "This tool is more relevant to my business than global frameworks like NIST CSF or ISO 27001.",
  "I would trust the results of this model more than I would trust a self-assessment based on a global framework.",
];

export const D4_PROMPTS = {
  D4a: "What did you find most useful or valuable about this assessment tool?",
  D4b: "What changes or additions would make this tool more useful for your business?",
  D4c: "Are there cybersecurity risks specific to digital services SMEs in Nairobi — such as M-Pesa API fraud, developer access risks, or client data custody — that this tool does not adequately address?",
  D4d: "How realistically would your business use this assessment going forward? (e.g. annually, quarterly, before launching a new service, when onboarding a new IT partner)",
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
