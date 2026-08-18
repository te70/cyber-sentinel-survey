// Report scoring logic and per-question recommendation content.
// Client-safe — no server imports.

export interface QuestionRec {
  gap: string;
  strength?: string; // explicit strength label; if absent, derived from gap by replacing "^No " → "Has "
  risk: string;
  recommendation: string;
  tetrasecService: string;
}

// Keyed by "B1_1", "B2_3", etc. — only No answers will be shown in the report.
export const B_RECS: Record<string, QuestionRec> = {
  // ── B1 Governance & Policy ──────────────────────────────────────────────
  B1_1: {
    gap: "No written security policy",
    risk: "Without written rules, each person in your business decides their own approach to security. This creates gaps that attackers can quietly exploit.",
    recommendation: "Write a simple one-page Acceptable Use Policy covering: passwords, device use, data handling, and what to do when something suspicious happens.",
    tetrasecService: "Tetrasec Policy Starter Pack — ready-made, customisable security policies for Kenyan digital businesses.",
  },
  B1_2: {
    gap: "Leadership does not prioritise cybersecurity",
    strength: "Leadership actively prioritises cybersecurity",
    risk: "Without leadership buy-in, security budgets get cut and staff don't take it seriously. The tone at the top sets the tone everywhere else.",
    recommendation: "Schedule a 30-minute 'cyber risk' conversation with your leadership team. Ask: what would happen to our business if we lost access to our systems for a week?",
    tetrasecService: "Tetrasec Executive Briefing — a structured risk conversation for business owners and directors.",
  },
  B1_3: {
    gap: "No named security owner",
    risk: "When everyone is responsible for security, nobody is. Incidents get missed because staff assume someone else is handling it.",
    recommendation: "Designate one person as your Security Contact — this does not need to be a full-time role. Just one person who gets the call when something goes wrong.",
    tetrasecService: "Tetrasec Virtual CISO — affordable fractional security leadership for SMEs that cannot yet hire a full-time expert.",
  },
  B1_4: {
    gap: "New tools adopted without a security check",
    strength: "Security check done before adopting any new tool or platform",
    risk: "New apps and platforms are a very common entry point for attackers. A tool with weak security can expose all the data it touches.",
    recommendation: "Before adopting any new platform, answer three questions: Does it encrypt data? Does it have a privacy policy? Has it had any publicised data breaches?",
    tetrasecService: "Tetrasec Tool Vetting — a quick security review of apps and platforms before you commit.",
  },
  B1_5: {
    gap: "Security rules are never reviewed or updated",
    strength: "Security rules reviewed and updated at least once a year",
    risk: "Outdated policies create false confidence. Staff follow rules that no longer reflect how the business actually operates.",
    recommendation: "Set a December calendar reminder to review your security rules each year. A review should take less than one hour.",
    tetrasecService: "Tetrasec Annual Security Review — structured yearly assessment with a clear action plan.",
  },
  B1_6: {
    gap: "Not compliant with Kenya Data Protection Act 2019",
    strength: "Kenya DPA 2019 compliance in place",
    risk: "The Kenya DPA 2019 requires businesses handling personal data to register with the ODPC and follow data handling rules. Non-compliance can result in fines of up to KSh 5 million.",
    recommendation: "Check whether your business must register as a Data Controller at odpc.go.ke. Start with a Data Register — a list of what personal data you hold and why.",
    tetrasecService: "Tetrasec DPA Compliance Package — ODPC registration support and data register setup for SMEs.",
  },
  // ── B2 Risk Management ──────────────────────────────────────────────────
  B2_1: {
    gap: "No security risk identification process",
    risk: "IT and business decisions made without thinking about security first are far more likely to introduce vulnerabilities that cost a lot more to fix later.",
    recommendation: "Before your next big IT decision, ask: what could go wrong if this were hacked or went offline? Write down the top three risks.",
    tetrasecService: "Tetrasec Risk Assessment — structured identification and prioritisation of your top security risks.",
  },
  B2_2: {
    gap: "No inventory of business assets and data",
    risk: "You cannot protect what you do not know you have. Untracked devices and forgotten accounts are common entry points for attackers.",
    recommendation: "Spend one hour creating a simple spreadsheet listing all laptops, phones, cloud accounts, and tools your business uses. Flag which ones touch customer data.",
    tetrasecService: "Tetrasec Asset Discovery — comprehensive mapping of your digital assets and areas of exposure.",
  },
  B2_3: {
    gap: "Third-party suppliers not checked for security",
    strength: "Third-party suppliers checked for security before working with them",
    risk: "Many Kenyan business breaches happen through a supplier, contractor, or developer — not through the business directly. Their weak security becomes your problem.",
    recommendation: "For your next contractor, ask three questions: Do you have a written security policy? Have you had any data breaches? How do you protect the data we share with you?",
    tetrasecService: "Tetrasec Supplier Security Review — questionnaire and assessment for your key third-party partners.",
  },
  B2_4: {
    gap: "No financial estimate of what a breach would cost",
    risk: "Without knowing the potential cost, it is impossible to justify security investment. Businesses regularly underestimate breach costs by 10 times or more.",
    recommendation: "Estimate your breach cost: downtime days × daily revenue + customer notification costs + recovery work. Most Nairobi SMEs land between KSh 500,000 and KSh 5 million.",
    tetrasecService: "Tetrasec Business Impact Analysis — structured financial risk assessment tailored for Kenyan SMEs.",
  },
  B2_5: {
    gap: "Security not part of business planning",
    strength: "Security risk management integrated into business planning and budgets",
    risk: "When security is treated as an IT issue rather than a business issue, it gets underfunded and becomes reactive — only addressed after an incident.",
    recommendation: "Add a 'security budget' line to your annual business plan — even if it starts at KSh 50,000. Having a number forces the conversation with your team.",
    tetrasecService: "Tetrasec Strategy Alignment — integrating security planning into your business planning and budgeting cycle.",
  },
  B2_6: {
    gap: "No security review when adopting new digital services",
    risk: "Every new digital tool expands your attack surface. Each one is a new door that needs a lock before you open it to your business.",
    recommendation: "Create a simple five-question security checklist for any new digital service: Is it HTTPS? Does it require access to all our data? Does it support two-factor login?",
    tetrasecService: "Tetrasec New Service Evaluation — digital tool security checklist and rapid review service.",
  },
  // ── B3 Access Control ───────────────────────────────────────────────────
  B3_1: {
    gap: "No two-step login on important business accounts",
    risk: "Passwords alone are easily stolen through phishing or leaked from other sites. Two-step login (2FA) stops the vast majority of account takeover attacks — including Instagram and TikTok hijackings that are common among Nairobi SMEs.",
    recommendation: "Turn on two-step login for every important account: Google Workspace, business email, M-Pesa business tools, Instagram, and TikTok. It takes about 10 minutes per account and costs nothing.",
    tetrasecService: "Tetrasec Quick Wins — hands-on help enabling two-step login across all your key business accounts.",
  },
  B3_2: {
    gap: "Staff have broader access than their job requires",
    strength: "Least-privilege access in place — staff only access what their role requires",
    risk: "When everyone has access to everything, one compromised account exposes the whole business. Account takeovers on shared platforms — social media, cloud drives, email — are far more damaging when access isn't limited.",
    recommendation: "Decide which tools and accounts each person genuinely needs. Remove admin rights from anyone who doesn't use them. On social media, use the 'team member' role rather than sharing the admin password.",
    tetrasecService: "Tetrasec Access Audit — a review of who has access to what, with a clean-up plan tailored to your business.",
  },
  B3_3: {
    gap: "No process to remove access when a staff member or freelancer leaves",
    risk: "Freelancers and departing staff who still hold passwords or shared logins are a quiet but serious risk. Former employees' credentials remain a common entry point for account takeovers weeks after they leave.",
    recommendation: "On a person's last day: change every shared password they knew, remove them from shared accounts and tools, and revoke their access to email, cloud drives, and social media. Put this on a checklist so it never gets skipped.",
    tetrasecService: "Tetrasec Offboarding Protocol — a step-by-step leaver checklist customised for your business tools.",
  },
  B3_4: {
    gap: "No inventory of business accounts and who has access",
    risk: "Without a list, accounts get forgotten — especially old social media profiles, unused supplier logins, and shared email accounts. Forgotten accounts are often unprotected and become easy targets.",
    recommendation: "Spend one hour writing a simple spreadsheet: account name, platform, who has the password, and when the password was last changed. Update it whenever someone joins or leaves.",
    tetrasecService: "Tetrasec Account Inventory Setup — we help you map and document every business account so nothing is forgotten.",
  },
  B3_5: {
    gap: "No plan to recover a hacked social media or business account",
    risk: "Instagram and TikTok account takeovers are among the most costly incidents for Nairobi digital businesses. Recovery without preparation is slow — accounts can stay offline for weeks while revenue and client trust are lost.",
    recommendation: "For each business account, find and save the official account recovery steps now — before you need them. Add a recovery email and phone number to every account. Know who to call at the platform if it happens.",
    tetrasecService: "Tetrasec Account Recovery Support — fast response and guided recovery when a business account is compromised.",
  },
  B3_6: {
    gap: "Same password used across multiple accounts",
    strength: "Unique passwords used for every account — no password reuse",
    risk: "Password reuse is the most common reason Kenyan SME accounts get taken over. One leaked password — from any site your staff use — can unlock every account that shares it.",
    recommendation: "Adopt a free password manager such as Bitwarden or Google Password Manager. Make it a business rule: every account gets its own unique password stored in the manager.",
    tetrasecService: "Tetrasec Password Security Rollout — password manager setup and a short team briefing on why it matters.",
  },
  // ── B4 Incident Detection & Response ───────────────────────────────────
  B4_1: {
    gap: "No tools to detect suspicious activity",
    risk: "Without monitoring, breaches happen silently. The average Kenyan SME only discovers a breach after customers report something — by which time the damage is done.",
    recommendation: "Enable the free built-in security alerts in Google Workspace or Microsoft 365. They will notify you of suspicious logins, bulk data exports, and password changes.",
    tetrasecService: "Tetrasec Threat Monitoring — affordable managed detection service for SME environments.",
  },
  B4_2: {
    gap: "No written incident response plan",
    risk: "When a breach happens, panic leads to costly mistakes. Without a plan, businesses often delete evidence, miss legal notification deadlines, and make the situation much worse.",
    recommendation: "Write one page titled 'What to do if we get hacked.' Include: who to call, what to switch off, and who to notify — customers, your bank, and CA Kenya.",
    tetrasecService: "Tetrasec Incident Response Plan — a customised one-page response playbook for your business.",
  },
  B4_3: {
    gap: "Staff do not know how to report security issues",
    strength: "Staff know who to contact and what to do when they spot a security issue",
    risk: "Staff often notice suspicious activity but do not know whether to report it or fear being blamed. This delay in reporting is expensive — every hour matters in a breach.",
    recommendation: "Post a simple notice in your office and team WhatsApp: 'If something looks wrong, call [name] immediately. No blame — just report it.'",
    tetrasecService: "Tetrasec Security Culture Workshop — building a report-first security culture across your team.",
  },
  B4_4: {
    gap: "Incident response plan never tested",
    strength: "Incident response plan tested through a drill or practice run",
    risk: "A plan that has never been practised will fail when it matters most. Response teams freeze, steps are unclear, and key contacts turn out to be unavailable.",
    recommendation: "Run a 30-minute tabletop exercise with your team: imagine your email was hacked — what do you do first? Who calls who? Write down what you discover.",
    tetrasecService: "Tetrasec Tabletop Exercise — a guided cyber incident simulation for your leadership team.",
  },
  B4_5: {
    gap: "Security incidents not reported to relevant authorities",
    strength: "Security incidents reported to the ODPC and relevant Kenyan authorities",
    risk: "Under the Kenya DPA 2019, personal data breaches must be reported to the ODPC within 72 hours. Failure to report is a regulatory offence with financial penalties.",
    recommendation: "Know your obligations: customer data breaches go to the ODPC at odpc.go.ke. Financial fraud should be reported to your bank and the DCI Cybercrime Unit.",
    tetrasecService: "Tetrasec Regulatory Reporting Support — guided breach notification to the ODPC and relevant Kenyan authorities.",
  },
  B4_6: {
    gap: "No post-incident review after security events",
    risk: "Businesses that do not review incidents repeat them. The same phishing message that fooled a staff member this month will fool another one next month.",
    recommendation: "After any incident — even a near-miss — hold a 15-minute debrief: what happened, how did it get in, and what would have stopped it? Write down the answers.",
    tetrasecService: "Tetrasec Post-Incident Review — structured analysis and remediation planning after a security event.",
  },
  // ── B5 Recovery & Business Continuity ──────────────────────────────────
  B5_1: {
    gap: "No automated data backups",
    risk: "Ransomware destroys businesses that have no backups. If attackers lock your files, your only options are to pay the ransom — or restore from backup. Without a backup, there is no choice.",
    recommendation: "Set up automatic daily backups using Google Drive, Dropbox, or OneDrive. This takes 15 minutes to configure and costs almost nothing.",
    tetrasecService: "Tetrasec Backup Setup — enterprise-grade backup configuration adapted for SME systems and budgets.",
  },
  B5_2: {
    gap: "Backups have never been tested for restoration",
    strength: "Backups tested and verified — confirmed they can actually be restored",
    risk: "Many businesses discover their backups are corrupted or incomplete only during a crisis. An untested backup is not really a backup.",
    recommendation: "Once per quarter, restore one file from your backup and verify that it works and is current. This takes five minutes and could save your entire business.",
    tetrasecService: "Tetrasec Backup Integrity Testing — scheduled verification that your backups actually work when you need them.",
  },
  B5_3: {
    gap: "No off-site or redundant backup copy",
    risk: "On-site backups are destroyed by the same ransomware, fire, or flood that destroys your primary data. You need at least one copy stored somewhere else.",
    recommendation: "Follow the 3-2-1 rule: three copies, on two different media, with one stored off-site. In practice: your device, Google Drive, and an external hard drive at a separate location.",
    tetrasecService: "Tetrasec Cloud Backup Strategy — redundant backup architecture design and implementation for Kenyan SMEs.",
  },
  B5_4: {
    gap: "No written business continuity plan",
    risk: "Without a continuity plan, a cyberattack can shut your business for days or weeks. Customers leave, revenue stops, and staff have no idea what to do.",
    recommendation: "Write a one-page Business Continuity Plan covering: which services are critical, how you operate without IT for 48 hours, and who your key contacts are.",
    tetrasecService: "Tetrasec Business Continuity Planning — structured resilience planning customised for Kenyan digital SMEs.",
  },
  B5_5: {
    gap: "No tested recovery capability after an attack",
    risk: "Recovery without preparation is slow and chaotic. The longer your business is down, the more revenue, customers, and reputation you lose.",
    recommendation: "Define your Recovery Time Objective: how quickly do you need to be back operating? Work backwards from that number to build your recovery steps.",
    tetrasecService: "Tetrasec Recovery Readiness Assessment — testing and improving your actual recovery capability before an incident occurs.",
  },
  B5_6: {
    gap: "No cyber insurance or incident fund",
    risk: "A serious cyberattack costs Kenyan SMEs an average of KSh 800,000 to KSh 3 million to recover from. Without reserved funds, many businesses do not survive the aftermath.",
    recommendation: "Ask your business insurer about cyber insurance add-ons — many Kenyan insurers now offer this. Set aside at least KSh 200,000 as a minimum cyber incident fund.",
    tetrasecService: "Tetrasec Cyber Insurance Advisory — guidance on appropriate coverage levels for your specific risk profile.",
  },
  // ── B6 Staff Knowledge and Awareness ────────────────────────────────────
  B6_1: {
    gap: "Staff cannot identify phishing, scam messages, or suspicious calls",
    strength: "Staff can identify phishing emails, WhatsApp scams, and suspicious calls",
    risk: "Most attacks on Kenyan SMEs start with a fake message or call. If staff cannot spot a phishing email, a WhatsApp scam, or an impersonation call, one click can compromise the whole business.",
    recommendation: "Show your team three real examples of Kenyan scam messages — fake M-Pesa alerts, impersonation emails, suspicious WhatsApp messages. Point out the signs: urgency, requests for passwords, wrong sender details.",
    tetrasecService: "Tetrasec Phishing Awareness Programme — interactive training built around attack examples your team will recognise from everyday life in Nairobi.",
  },
  B6_2: {
    gap: "Staff do not know the M-Pesa STK push safety rule",
    strength: "Staff know the M-Pesa STK push rule — decline any prompt you did not initiate",
    risk: "M-Pesa STK push fraud is experienced regularly by Nairobi SMEs. Attackers trigger payment prompts and pressure staff to confirm. Staff who do not know the rule — 'decline any prompt you did not initiate' — accidentally authorise real payments to fraudsters.",
    recommendation: "Tell every staff member who handles M-Pesa the rule: if you did not initiate the STK push, decline it immediately and report it — even if someone on the phone says it is a test or an error. Post this rule in your office and team WhatsApp.",
    tetrasecService: "Tetrasec M-Pesa Fraud Briefing — a 30-minute session covering M-Pesa attack patterns and the practical rules to follow.",
  },
  B6_3: {
    gap: "New staff are not told about security risks when they join",
    strength: "New staff and freelancers receive a security briefing on joining",
    risk: "New staff and freelancers are the most likely to fall for social engineering. They do not yet know what is normal — so they cannot spot what is abnormal. One uninformed new hire can be the entry point for a serious incident.",
    recommendation: "Add a 20-minute security talk to your onboarding — even informally. Cover: the company password rules, how to spot a fake message, who to call if something looks wrong, and the M-Pesa STK push rule.",
    tetrasecService: "Tetrasec Onboarding Security Kit — a short, reusable security briefing you can give every new team member from day one.",
  },
  B6_4: {
    gap: "Cybersecurity has never been discussed as a team",
    strength: "Cybersecurity discussed as a team at least once in the past 12 months",
    risk: "If security is never talked about, staff assume someone else is responsible — or that it is not a real concern for a business their size. This silence is how small incidents escalate into serious ones.",
    recommendation: "Spend 15 minutes at your next team meeting discussing one real scenario: what would you do if our Instagram was hacked tomorrow? Who would you call? What would we lose? This conversation alone raises awareness more than most formal training.",
    tetrasecService: "Tetrasec Security Culture Workshop — a facilitated 90-minute team session that opens the conversation around cyber risk in plain language.",
  },
  B6_5: {
    gap: "Staff may share passwords or PINs when pressured",
    strength: "Staff know not to share passwords, PINs, or M-Pesa codes — even under pressure",
    risk: "Social engineering — where attackers pretend to be from Safaricom, a bank, or IT support — is one of the most effective ways to steal credentials. Staff who share passwords or M-Pesa PINs under pressure have unwittingly enabled some of the most costly SME fraud cases in Kenya.",
    recommendation: "Make this a firm rule, communicated to everyone: never share a password, M-Pesa PIN, or confirmation code with anyone — including someone claiming to be from Safaricom, your bank, or IT support. Legitimate services will never ask for these.",
    tetrasecService: "Tetrasec Social Engineering Awareness — training on how impersonation attacks work and what to say when someone asks for your credentials.",
  },
  B6_6: {
    gap: "No security awareness activities in the past year",
    risk: "Threats evolve constantly. WhatsApp scams, AI-generated phishing messages, and new M-Pesa fraud patterns appear regularly. A team that has not discussed security recently is not prepared for the attacks that exist today.",
    recommendation: "Pick one activity to do in the next 30 days: share a news article about a local cyberattack in your team WhatsApp, hold a 15-minute briefing, or circulate a one-page tip sheet on M-Pesa safety. Consistency matters more than formality.",
    tetrasecService: "Tetrasec Monthly Security Briefing — short, Kenya-specific threat alerts and practical tips delivered to your team every month.",
  },
};

// ── Domain metadata ──────────────────────────────────────────────────────────

export const B_DOMAINS: { key: string; label: string; questionCount: number; description: string }[] = [
  { key: "B1", label: "Rules & Responsibility",                   questionCount: 6, description: "Whether your business has clear security rules, someone responsible, and follows the Kenya DPA." },
  { key: "B2", label: "Risk Management",                          questionCount: 6, description: "Identifying threats before they become incidents — from new tools to third-party suppliers." },
  { key: "B3", label: "Controlling Who Gets In",                  questionCount: 6, description: "Two-step login, least-privilege access, offboarding, account inventory, and password hygiene." },
  { key: "B4", label: "Spotting and Dealing with Problems",       questionCount: 6, description: "Detecting suspicious activity and knowing exactly what to do when an incident happens." },
  { key: "B5", label: "Getting Back on Track After a Problem",    questionCount: 6, description: "Backups, recovery plans, and financial reserves to survive and recover from an attack." },
  { key: "B6", label: "Staff Knowledge and Awareness",            questionCount: 6, description: "Whether staff can spot M-Pesa fraud, phishing, and social engineering — and know who to tell." },
];

// ── Scoring ──────────────────────────────────────────────────────────────────

export function scoreDomain(data: Record<string, string | unknown>, prefix: string, count: number): number {
  const yesCount = Array.from({ length: count }, (_, i) => `${prefix}_${i + 1}`)
    .filter((k) => data[k] === "yes").length;
  return count === 0 ? 0 : Math.round((yesCount / count) * 100);
}

export function overallScore(domainScores: number[]): number {
  if (domainScores.length === 0) return 0;
  return Math.round(domainScores.reduce((a, b) => a + b, 0) / domainScores.length);
}

export function getTier(score: number): { tier: string; colour: string; summary: string } {
  if (score < 20) return {
    tier: "Initial",
    colour: "#EF4444",
    summary: "Your business is at the very start of its cybersecurity journey. Most controls are informal or absent. Focusing on the critical gaps below — especially passwords, backups, and staff awareness — will have the highest immediate impact.",
  };
  if (score < 40) return {
    tier: "Developing",
    colour: "#F97316",
    summary: "Some security practices are in place, but they are inconsistent or undocumented. Your business recognises cybersecurity as important but has not yet formalised processes across all areas. The recommendations below will help you build repeatable, reliable security habits.",
  };
  if (score < 60) return {
    tier: "Defined",
    colour: "#EAB308",
    summary: "Your business has a reasonable security foundation with documented policies and consistent practices in some areas. Gaps remain in measurement, testing, and continuous improvement. The focus now should be on closing the specific gaps identified below.",
  };
  if (score < 80) return {
    tier: "Managed",
    colour: "#22C55E",
    summary: "Your security processes are actively managed and measurable. Your business responds well to security issues and tracks against defined targets. Advancing further requires embedding security into strategic planning and supplier management.",
  };
  return {
    tier: "Optimising",
    colour: "#00C9C8",
    summary: "Your business demonstrates strong cybersecurity practices — policies are current, controls are tested, and improvement is continuous. Maintain this by reviewing against evolving threats and considering formal certifications such as ISO 27001.",
  };
}

// Gaps = questions answered "no" in Section B
export function findGaps(sectionB: Record<string, string | unknown>): { key: string; rec: QuestionRec; domain: string }[] {
  return Object.entries(B_RECS)
    .filter(([key]) => sectionB[key] === "no")
    .map(([key, rec]) => ({
      key,
      rec,
      domain: B_DOMAINS.find((d) => key.startsWith(d.key))?.label ?? "General",
    }));
}

// Barriers = questions answered "yes" in Section C (barrier exists)
export function findBarriers(sectionC: Record<string, string | unknown>): string[] {
  const barrierLabels: Record<string, string> = {
    C1_1: "Security tools are too expensive",
    C1_2: "Cannot afford a dedicated security expert",
    C1_3: "Security spending is crowded out by other costs",
    C1_4: "No way to measure whether security spend is worthwhile",
    C1_5: "Certifications and compliance are too costly",
    C2_1: "Staff lack cybersecurity knowledge",
    C2_2: "Uncertain where to start on security improvements",
    C2_3: "Limited digital skills among some staff",
    C2_4: "Uncertain which security laws apply to your business",
    C2_5: "Trained staff leave for larger companies",
    C4_1: "Leadership does not invest in security",
    C4_2: "No written security policies or procedures",
    C4_3: "Changing staff behaviour is a major obstacle",
    C4_4: "No formal way to choose or evaluate security tools",
    C4_5: "No clear owner responsible for security",
  };
  return Object.entries(barrierLabels)
    .filter(([key]) => sectionC[key] === "yes")
    .map(([, label]) => label);
}
