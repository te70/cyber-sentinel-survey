// Training Hub micro-lessons — tier-registered like Annex A (full A/B/C content per topic, not
// a single plain-language version), each grounded in the model's own thematic evidence base
// (M-Pesa STK-push fraud, social-media account takeover) rather than generic filler. All rows
// are draft, pending researcher review before pilot use. D4 (the gate domain) has the most
// topics, per the brief.
//
// Original 9 topics x 3 tiers = 27 lessons. Phase 2/3 priority pass added D5 breach-notification
// (owner + staff companion) and the D3/D6 impersonation lesson = 12 more (39 total). Phase 4/5
// added the remaining D1/D2/D3/D5/D6 topics plus two general (non-domain-scored) lessons = 45
// more. 84 lessons total, each with 2 quiz questions. Every row keeps a sourceRef pointing at the
// specific Annex A descriptor (or Section 9 row) it's drawn from — Section 12.1 traceability.

import type { DomainId } from "../../src/lib/alita/domains";

export interface QuizQuestionData {
  question: string;
  options: string[];
  correctIndex: number;
}

type LessonAudience = "owner" | "staff" | "both";
// "GEN" is a seeded pseudo-domain for lessons not tied to a scored domain (see the Phase 5
// comment below) — deliberately not part of DomainId, which drives assessment scoring.
type LessonDomainId = DomainId | "GEN";

export interface LessonRow {
  domainId: LessonDomainId;
  tier: "A" | "B" | "C";
  title: string;
  explanation: string;
  example: string;
  sortOrder: number;
  status: "draft";
  // Higher surfaces first as the remediation-guidance "Learn more" pick — see
  // pickLessonForDomain in src/lib/alita/remediation.functions.ts.
  priority: number;
  // Content targeting only (no per-user accounts exist) — drives the Training Hub audience
  // filter toggle.
  audience: LessonAudience;
  // Traceability back to the specific Annex A descriptor or Section 9 row this is drawn from —
  // Section 12.1's content-validity requirement.
  sourceRef: string;
  // True for content whose accuracy depends on external platform UI that changes over time
  // (e.g. the D3 platform-specific MFA walkthroughs) — see needsPeriodicReview in schema.prisma.
  needsPeriodicReview: boolean;
  quiz: QuizQuestionData[];
}

interface LessonContent {
  title: string;
  explanation: string;
  example: string;
  quiz: QuizQuestionData[];
}

interface LessonTopic {
  domainId: LessonDomainId;
  sortOrder: number;
  priority?: number;
  audience?: LessonAudience;
  sourceRef: string;
  needsPeriodicReview?: boolean;
  A: LessonContent;
  B: LessonContent;
  C: LessonContent;
}

function expand(topic: LessonTopic): LessonRow[] {
  return (["A", "B", "C"] as const).map((tier) => ({
    domainId: topic.domainId,
    tier,
    sortOrder: topic.sortOrder,
    status: "draft" as const,
    priority: topic.priority ?? 0,
    audience: topic.audience ?? "both",
    sourceRef: topic.sourceRef,
    needsPeriodicReview: topic.needsPeriodicReview ?? false,
    ...topic[tier],
  }));
}

const TOPICS: LessonTopic[] = [
  // ── D4-1: Spotting fake M-Pesa STK-push prompts ──────────────────────────────────────────
  {
    domainId: "D4",
    sortOrder: 1,
    sourceRef: "D4 descriptor, Level 1 (all tiers) — informal M-Pesa STK-push prompt awareness",
    A: {
      title: "Spotting fake M-Pesa STK-push prompts",
      explanation: `An STK-push prompt is the pop-up on your phone asking you to enter your M-Pesa PIN to complete a payment. Scammers can trigger these prompts without you asking for anything — hoping you'll enter your PIN out of habit. The rule is simple: if you didn't start the payment yourself, decline the prompt. No exceptions, even if the person calling says it's "a mistake" or "a test."`,
      example: `A shop owner in Nairobi got a call from someone claiming to be a Safaricom agent, saying they'd sent an STK-push "by accident" and asking her to enter her PIN to "reverse" it. The prompt was real — but entering the PIN would have approved a payment TO the scammer, not reversed anything. She hung up and declined the prompt, and nothing was lost.`,
      quiz: [
        {
          question:
            "You get an STK-push prompt for a payment you never asked for. What should you do?",
          options: [
            "Enter your PIN to see what happens",
            "Decline it — you never asked to pay anything",
            "Call the number back and ask what it's for",
            "Ignore it, it will go away",
          ],
          correctIndex: 1,
        },
        {
          question: `Someone calls claiming to be from Safaricom, saying a payment prompt was sent "by mistake" and asks you to enter your PIN to cancel it. What's really happening?`,
          options: [
            "They're helping you cancel a genuine mistake",
            "Entering your PIN would actually approve a payment to them",
            "This is a normal part of using M-Pesa",
            "You should enter the PIN twice to be safe",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Spotting fake M-Pesa STK-push prompts",
      explanation: `An STK-push (a payment prompt Safaricom sends to your phone) asks you to enter your M-Pesa PIN to approve a transaction. Fraudsters can trigger these prompts without your involvement, relying on social engineering (tricking people into acting against their own interest) — often posing as Safaricom staff — to get you to enter your PIN "to fix" or "cancel" something. The prompt itself is a real Safaricom message; what's fake is the reason someone gives you for entering your PIN. The rule: never enter your PIN for a prompt you didn't personally initiate.`,
      example: `A shop owner received a call from someone claiming to be a Safaricom agent, saying an STK-push had been sent "in error" and asking her to enter her PIN to reverse it. Entering the PIN would have approved a real payment to the caller's account, not cancelled anything. She declined and reported the call.`,
      quiz: [
        {
          question: "What does entering your PIN on an unsolicited STK-push prompt actually do?",
          options: [
            "Cancels the pending transaction",
            "Approves the transaction to whoever triggered it",
            "Nothing — it's just a confirmation",
            "Reports the prompt to Safaricom",
          ],
          correctIndex: 1,
        },
        {
          question: `A caller claiming to be from Safaricom asks you to enter your PIN to "reverse" an accidental payment prompt. What should you recognise?`,
          options: [
            "This is standard Safaricom procedure",
            "This is social engineering — the caller is trying to manipulate you into approving a payment",
            "You should comply since Safaricom staff called",
            "The prompt itself must be fake",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Spotting fake M-Pesa STK-push prompts",
      explanation: `STK-push fraud exploits the legitimate Safaricom payment-prompt mechanism via social-engineering pretexting — an attacker triggers a genuine prompt, then uses a fabricated pretext (posing as Safaricom support, claiming an erroneous transaction) to induce PIN entry, which functions as transaction authorisation, not cancellation. The control is behavioural, not technical: PIN entry should be conditioned strictly on self-initiated transactions, regardless of the plausibility of the pretext or caller identity claims.`,
      example: `An attacker triggered an STK-push against a target's number, then called posing as Safaricom support, requesting PIN entry to "reverse" the erroneous charge. PIN entry would have authorised the transaction to the attacker's account. The target declined and the pretext failed.`,
      quiz: [
        {
          question:
            "From a technical standpoint, what does PIN entry on an STK-push prompt constitute?",
          options: [
            "A cancellation request",
            "Transaction authorisation",
            "A status inquiry",
            "A fraud report",
          ],
          correctIndex: 1,
        },
        {
          question: "What is the correct control for STK-push social-engineering attempts?",
          options: [
            "Verify caller identity before entering PIN",
            "Only enter PIN for self-initiated transactions, regardless of caller claims",
            "Enter PIN but immediately change it afterward",
            "Call Safaricom to confirm before declining",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D4-2: Recognising phishing and social engineering ────────────────────────────────────
  {
    domainId: "D4",
    sortOrder: 2,
    sourceRef:
      "D4 descriptor, Level 2 (all tiers) — staff risk-recognition without a structured reporting process yet",
    A: {
      title: "Recognising phishing and social engineering",
      explanation: `Phishing is a fake message — email, SMS, or WhatsApp — pretending to be someone trustworthy to trick you into clicking a link, sharing a password, or sending money. Look out for: urgency ("act now or lose access"), requests for passwords or codes, and senders that look almost right but not quite (a slightly misspelled company name, an odd email address). When in doubt, don't click — contact the company directly through a number or website you already know.`,
      example: `A staff member got an email that looked like it was from their bank, saying their account would be frozen unless they "verified" their login within an hour. The link led to a fake page designed to steal the password. She noticed the sender's email address was slightly wrong and reported it instead of clicking.`,
      quiz: [
        {
          question: "Which of these is a common warning sign of phishing?",
          options: [
            "A message that gives you plenty of time to respond",
            "Urgent pressure to act immediately",
            "A sender you recognise",
            "A message with no links",
          ],
          correctIndex: 1,
        },
        {
          question: `You get a message claiming to be your bank asking you to "verify" your password urgently. What should you do?`,
          options: [
            "Click the link and enter your password to be safe",
            "Ignore the urgency and contact your bank directly using a number you already trust",
            "Forward it to a colleague to check",
            "Reply asking if it's real",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Recognising phishing and social engineering",
      explanation: `Phishing is a fraudulent message (email, SMS, WhatsApp) designed to steal information, and social engineering (manipulation tactics used to trick people) is the broader technique behind it — attackers exploit urgency, authority, and trust rather than technical weaknesses. Common signals: artificial urgency, requests for credentials or codes, and sender details that are subtly wrong (a near-identical domain name, an unfamiliar reply-to address). The safest response is independent verification — contacting the claimed sender through a channel you already trust, not one provided in the suspicious message.`,
      example: `A staff member received an email appearing to be from the company's bank, warning of account suspension unless login credentials were "verified" within the hour. The sender's domain was a near-identical misspelling of the real one. She reported it instead of clicking, having been trained to check sender domains carefully.`,
      quiz: [
        {
          question: "What is the underlying technique phishing relies on?",
          options: [
            "Exploiting software vulnerabilities",
            "Social engineering — manipulating people via urgency and trust",
            "Guessing weak passwords",
            "Intercepting network traffic",
          ],
          correctIndex: 1,
        },
        {
          question:
            "What's the safest way to verify a suspicious message claiming to be from your bank?",
          options: [
            "Click the link provided and check",
            "Contact the bank independently, through a channel you already trust",
            "Reply to the message asking for confirmation",
            "Forward it to see if colleagues think it's real",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Recognising phishing and social engineering",
      explanation: `Phishing operationalises social-engineering principles — pretexting, urgency, authority impersonation — to bypass technical controls by targeting human decision-making directly. Indicators include artificial time pressure, credential/code solicitation, and domain-spoofing (visually or semantically similar sender domains). The appropriate control is out-of-band verification: confirming the claimed sender's identity through an independently-trusted channel, never through contact details supplied within the suspicious message itself.`,
      example: `A phishing email spoofing the organisation's bank domain (a near-identical lookalike) demanded urgent credential re-verification. Domain inspection revealed the spoofing; the recipient escalated rather than engaging, consistent with the organisation's out-of-band verification policy.`,
      quiz: [
        {
          question:
            "Why is phishing effective against organisations with strong technical controls?",
          options: [
            "It exploits software vulnerabilities directly",
            "It targets human decision-making, bypassing technical controls entirely",
            "It requires no attacker effort",
            "It only works against small businesses",
          ],
          correctIndex: 1,
        },
        {
          question: "What defines correct out-of-band verification of a suspicious sender?",
          options: [
            "Using contact details provided in the message",
            "Confirming identity through an independently-trusted channel, not the message itself",
            "Replying to ask if the message is legitimate",
            "Checking if the message has correct spelling",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D4-3: Protecting your business social media accounts ────────────────────────────────
  {
    domainId: "D4",
    sortOrder: 3,
    sourceRef:
      "D4 descriptor, Level 3 (all tiers) — annual training content on protecting the business Instagram/WhatsApp login",
    A: {
      title: "Protecting your business social media accounts",
      explanation: `If your business runs on Instagram, WhatsApp, or Facebook, losing access to that account can mean losing the business itself, not just some data. Turn on two-step login for every business social media account, don't share the password with more people than need it, and make sure you have a recovery email and phone number saved on the account before anything goes wrong.`,
      example: `A small boutique lost access to its Instagram account after a hacker reset the password using an outdated recovery email nobody had updated in years. Because there was no working recovery option, it took weeks and lost sales to get the account back.`,
      quiz: [
        {
          question:
            "Why is losing a business social media account especially serious for a social-media-based business?",
          options: [
            "It's just an inconvenience",
            "It can mean losing the business itself, not just data",
            "It only affects marketing",
            "It's easily and instantly fixed",
          ],
          correctIndex: 1,
        },
        {
          question:
            "What should you check now, before anything goes wrong, on your business social accounts?",
          options: [
            "That the password is easy to remember",
            "That recovery email and phone number are current and working",
            "That you post every day",
            "That you have many followers",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Protecting your business social media accounts",
      explanation: `For a business where social media platforms function as the primary digital footprint, account loss is a business-continuity risk (something that could stop the business running), not merely a data-protection issue. Deliberately enable MFA (extra login protection) on every business account, limit password-sharing to only those who need it, and keep recovery details (email, phone) current — an outdated recovery method is often the reason account recovery fails when it's needed most.`,
      example: `A boutique lost Instagram access when an attacker reset the password via an outdated recovery email that hadn't been updated in years. With no working recovery path, restoring the account took weeks and cost real sales.`,
      quiz: [
        {
          question:
            "Why is social media account loss classified as a business-continuity risk for some businesses?",
          options: [
            "It's a minor inconvenience only",
            "It can stop the business operating, not just affect data",
            "It only matters for large enterprises",
            "It's unrelated to revenue",
          ],
          correctIndex: 1,
        },
        {
          question: "What commonly causes account recovery to fail when it's actually needed?",
          options: [
            "Too strong a password",
            "Outdated or unmonitored recovery email/phone details",
            "Having MFA enabled",
            "Posting too frequently",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Protecting your business social media accounts",
      explanation: `Where social platforms constitute primary business infrastructure, account compromise or loss represents a business-continuity risk requiring the same rigor as any critical-system failure. Controls: mandatory MFA across all business accounts, least-privilege credential sharing, and continuously validated recovery contact details — recovery-path failure, not the initial compromise, is typically what converts a security incident into an extended business-continuity event.`,
      example: `An attacker reset credentials on a business's primary Instagram account via a stale recovery email address. Absent a validated recovery path, restoration required weeks of platform escalation, during which revenue-generating operations were disrupted.`,
      quiz: [
        {
          question:
            "What typically converts a social-media account compromise into an extended business-continuity event?",
          options: [
            "The initial compromise itself",
            "Failure of the recovery path (e.g., stale recovery contact details)",
            "Having too many admins",
            "Posting frequency",
          ],
          correctIndex: 1,
        },
        {
          question: "What credential-sharing principle should apply to business social accounts?",
          options: [
            "Share broadly so anyone can respond quickly",
            "Least-privilege — only those who need access get it",
            "Use one shared password for simplicity",
            "Avoid MFA to simplify access",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D4-4: Why this applies to your business too (counters the self-exclusion belief, T10) ─
  {
    domainId: "D4",
    sortOrder: 4,
    sourceRef: `D4 descriptor, Level 0 (all tiers) — addressing "cybersecurity is for bigger businesses, not mine"`,
    A: {
      title: "Why this applies to your business too",
      explanation: `It's easy to think cybersecurity is something for big companies with IT departments, not a small business like yours. But attackers don't only target big companies — smaller businesses are often targeted precisely because they're less protected. Every business that uses M-Pesa, WhatsApp, or a customer list has something worth protecting, and something an attacker could exploit. This tool exists because businesses exactly like yours were the ones who told us this gap exists.`,
      example: `One Nairobi shop owner said she never thought hackers would bother with "a business this small." A few months later, someone hijacked her business WhatsApp and scammed her customers out of deposits using her own contact list — the exact assumption that she was "too small to target" was what left her exposed.`,
      quiz: [
        {
          question: "Why might a small business actually be an attractive target for attackers?",
          options: [
            "Small businesses have more money than large ones",
            "Small businesses are often less protected, making them easier targets",
            "Attackers only target large companies",
            "Small businesses have no data worth stealing",
          ],
          correctIndex: 1,
        },
        {
          question: `What's the risk in thinking "this doesn't apply to a business like mine"?`,
          options: [
            "It's usually true and saves time",
            "It's the exact assumption that leaves real gaps unaddressed",
            "It only matters for tech companies",
            "It has no real consequence",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Why this applies to your business too",
      explanation: `A common belief among small and outsourced-IT businesses is that cybersecurity concerns "bigger, more technical businesses," not their own — the self-exclusion belief. In practice, smaller businesses are frequently targeted precisely because they typically have fewer safeguards in place than larger organisations, not despite it. Any business handling M-Pesa transactions, customer contact data, or social-media-based operations has assets worth protecting and a genuine attack surface, regardless of size or technical sophistication.`,
      example: `A business owner assumed her operation was "too small to target." Months later her business WhatsApp was hijacked, and the attacker used her existing customer contact list to run a deposit scam — the same assumption of being too small was precisely what left the business under-protected.`,
      quiz: [
        {
          question: "What is the 'self-exclusion belief' this lesson addresses?",
          options: [
            "The belief that cybersecurity is unaffordable",
            "The belief that cybersecurity concerns bigger businesses, not one's own",
            "The belief that passwords are unnecessary",
            "The belief that backups are optional",
          ],
          correctIndex: 1,
        },
        {
          question: "Why are smaller businesses often targeted despite (or because of) their size?",
          options: [
            "They typically have fewer safeguards than larger organisations",
            "Attackers prefer complex targets",
            "Small businesses have no valuable data",
            "Size has no bearing on targeting",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: "Why this applies to your business too",
      explanation: `The self-exclusion belief — that cybersecurity concerns larger, more technically sophisticated organisations rather than one's own — is a documented barrier to security engagement among smaller organisations, independent of actual risk exposure. Empirically, smaller organisations are frequently targeted precisely due to comparatively weaker safeguards, not despite their size. Any organisation processing financial transactions, maintaining customer data, or operating primary business functions via social platforms possesses a genuine, exploitable attack surface regardless of organisational scale or technical maturity.`,
      example: `An organisation's leadership assessed their risk exposure as negligible given their size, foregoing basic account-security controls. Subsequent compromise of business communication channels — enabled precisely by that absent control — resulted in direct financial loss via social-engineered transactions against the organisation's own customer base.`,
      quiz: [
        {
          question:
            "What does the evidence indicate about smaller organisations' actual risk exposure?",
          options: [
            "They are rarely targeted due to low value",
            "They are frequently targeted due to comparatively weaker safeguards",
            "Risk exposure correlates directly with organisational size",
            "Risk exposure is irrelevant below a certain size threshold",
          ],
          correctIndex: 1,
        },
        {
          question: "What characterises the self-exclusion belief as a security barrier?",
          options: [
            "It accurately reflects actual risk levels",
            "It is a documented barrier to engagement, independent of actual risk exposure",
            "It only affects technically unsophisticated staff",
            "It has no bearing on security posture",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D1: Understanding the Kenya DPA basics ───────────────────────────────────────────────
  {
    domainId: "D1",
    sortOrder: 1,
    sourceRef:
      "D1 descriptor, Level 1-2 (all tiers) — DPA awareness and the exemption test (turnover/employee-count thresholds, sector overrides)",
    A: {
      title: "Understanding the Kenya DPA basics",
      explanation: `Kenya's Data Protection Act 2019 sets rules for any business that collects personal information — even something as simple as customer names and phone numbers. Most very small businesses (turnover under KES 5 million and fewer than 10 employees) may qualify for an exemption from full registration, but you still need to check, not assume. If you're not exempt, you register with the ODPC (the regulator). Either way, you should have a simple written note on how you handle customer data.`,
      example: `A small online shop owner assumed the DPA didn't apply to her because she was "too small." When she checked the ODPC website, she found her sector actually required registration regardless of size — she registered and avoided a potential fine.`,
      quiz: [
        {
          question: "Who does Kenya's Data Protection Act 2019 potentially apply to?",
          options: [
            "Only large corporations",
            "Any business that collects personal information, including small ones",
            "Only businesses with an IT department",
            "Only banks",
          ],
          correctIndex: 1,
        },
        {
          question: "What should a small business do about DPA applicability rather than assume?",
          options: [
            "Assume it doesn't apply because the business is small",
            "Actually check registration/exemption status against the real criteria",
            "Ignore it until a customer complains",
            "Wait for the ODPC to contact them",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Understanding the Kenya DPA basics",
      explanation: `The Data Protection Act 2019 governs how businesses collect, store, and use personal data in Kenya, and applies broadly — not just to large or technical organisations. Small businesses may qualify for the small-business exemption (turnover under KES 5M and fewer than 10 employees), unless their sector requires registration regardless of size. Checking your actual status against the ODPC's criteria — rather than assuming exemption — is the first governance step, followed by registering (or documenting exemption) and writing a basic data-handling policy.`,
      example: `A business owner assumed the DPA didn't apply given her size, without checking. Her sector was actually a mandatory-registration category regardless of turnover. Checking directly against ODPC criteria (rather than assuming) avoided a compliance gap.`,
      quiz: [
        {
          question:
            "What determines whether a small business qualifies for the DPA small-business exemption?",
          options: [
            "Owner's personal judgement",
            "Turnover and employee count against the defined thresholds, unless sector-overridden",
            "Whether the business has a website",
            "Whether the business has ever had a data breach",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the correct first governance step regarding DPA applicability?",
          options: [
            "Assume exemption applies without checking",
            "Formally check status against ODPC criteria rather than assuming",
            "Wait until audited",
            "Delegate the decision entirely to an IT provider without follow-up",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Understanding the Kenya DPA basics",
      explanation: `The Data Protection Act 2019 establishes data-controller/processor obligations applicable broadly across organisational scale, subject to a small-business exemption (turnover under KES 5M and fewer than 10 employees) that is itself subject to sector-specific overrides for certain high-risk or mandatory-registration categories. Formal evaluation of applicability — rather than assumed exemption — constitutes the baseline governance action, followed by registration or documented exemption and a written data-handling policy satisfying Section 25 accountability principles.`,
      example: `An organisation assumed exemption applicability without formal evaluation. Sector-specific mandatory-registration criteria in fact overrode the general exemption threshold, creating undocumented non-compliance until a formal evaluation against ODPC criteria was conducted.`,
      quiz: [
        {
          question: "What can override the general small-business exemption threshold?",
          options: [
            "Nothing — the threshold is absolute",
            "Sector-specific mandatory-registration criteria",
            "The business owner's discretion",
            "The number of customers served in a single day",
          ],
          correctIndex: 1,
        },
        {
          question: "What constitutes the baseline governance action regarding DPA applicability?",
          options: [
            "Assuming exemption based on business size alone",
            "Formal evaluation against ODPC criteria, including sector overrides",
            "Deferring entirely to an IT provider with no independent verification",
            "Registering only after a complaint is filed",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D2: Knowing what data and systems matter most ────────────────────────────────────────
  {
    domainId: "D2",
    sortOrder: 1,
    sourceRef:
      "D2 descriptor, Level 0-1 (all tiers) — moving from an undocumented sense of what matters to a written list",
    A: {
      title: "Knowing what data and systems matter most",
      explanation: `Not all business information is equally risky if lost. Customer ID numbers, payment details, and health or HR records are far more damaging if leaked than, say, a marketing flyer. Start by writing down what data and systems your business actually has, then mark which ones would hurt the most if exposed — and give those extra care, like stronger passwords and more limited access.`,
      example: `A salon kept client health notes (allergies, treatment history) in the same unprotected spreadsheet as its social media content calendar. Once the owner realised the health notes were far more sensitive, she moved them to a separate, password-protected file with limited access.`,
      quiz: [
        {
          question: "Which of these would typically be the most damaging to lose or leak?",
          options: [
            "A social media content calendar",
            "Customer ID numbers and health records",
            "A list of business opening hours",
            "A generic marketing flyer",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the first step in knowing what matters most?",
          options: [
            "Assume everything is equally important",
            "Write down what data and systems the business actually has",
            "Wait until something is lost to find out",
            "Delete anything that seems unnecessary",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Knowing what data and systems matter most",
      explanation: `Effective risk management starts with classification (sorting by sensitivity) — not every asset carries equal risk if exposed. Sector-specific categories matter: HR/employment data, guest/hospitality data, client documents, and logistics/payment data typically carry higher sensitivity than general business information. Building a basic inventory first, then classifying by potential harm if exposed, lets you direct extra protection (access limits, stronger authentication) to what actually matters most.`,
      example: `A salon stored sensitive client health notes in the same unprotected file as routine content-planning documents. Classifying data by sensitivity revealed the health notes needed separate, access-limited handling — a gap that had gone unnoticed because everything had been treated the same.`,
      quiz: [
        {
          question: "What does classifying data by sensitivity actually achieve?",
          options: [
            "It makes storage more complicated for no benefit",
            "It directs extra protection toward what would cause the most harm if exposed",
            "It's only relevant for large enterprises",
            "It replaces the need for backups",
          ],
          correctIndex: 1,
        },
        {
          question:
            "Which sector-specific category is explicitly called out as often higher-sensitivity?",
          options: [
            "Marketing content",
            "HR/employment or client health data",
            "Public business hours",
            "Generic promotional material",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Knowing what data and systems matter most",
      explanation: `Risk management maturity begins with asset/data inventory, followed by sensitivity classification incorporating sector-specific risk categories (HR/employment, guest/hospitality, client documents, logistics/payment data) relevant to the Organisational Profile business type. Classification directs proportionate control allocation — access restriction, authentication strength — toward assets whose exposure would cause the greatest harm, rather than applying uniform (and therefore inefficient) protection across all assets indiscriminately.`,
      example: `An organisation maintained sensitive client health records within an undifferentiated, uniformly-protected data store alongside low-sensitivity operational content. Formal sensitivity classification revealed the health records required materially stronger access controls than the uniform baseline provided.`,
      quiz: [
        {
          question: "What is the purpose of sensitivity classification in risk management?",
          options: [
            "Uniform protection is always more efficient",
            "Directing proportionate controls toward higher-harm assets",
            "Eliminating the need for an asset inventory",
            "Satisfying an arbitrary compliance checkbox",
          ],
          correctIndex: 1,
        },
        {
          question: "What should classification incorporate beyond generic sensitivity levels?",
          options: [
            "Nothing further is needed",
            "Sector-specific risk categories relevant to the business type",
            "Only financial data categories",
            "Only data mentioned in a contract",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D3: Turning on two-step login everywhere ─────────────────────────────────────────────
  {
    domainId: "D3",
    sortOrder: 1,
    sourceRef:
      "D3 descriptor, Level 1-3 (all tiers) — moving from default-only MFA to a deliberate policy across accounts, including social media",
    A: {
      title: "Turning on two-step login everywhere",
      explanation: `Two-step login (also called MFA or 2FA) means that even if someone steals your password, they still can't get into your account without a second code — usually sent to your phone or generated by an app. It takes about 10 minutes per account to turn on, and it stops the vast majority of account takeovers, including the Instagram and TikTok hijackings that are common among small Kenyan businesses.`,
      example: `Two staff members at the same company had their email passwords leaked in an unrelated data breach. The one with two-step login turned on was safe — the attacker had the password but couldn't get past the second step. The other, without it, had her account taken over.`,
      quiz: [
        {
          question: "Why does two-step login protect you even if your password leaks?",
          options: [
            "It changes your password automatically",
            "It requires a second code the attacker doesn't have",
            "It hides your account from search",
            "It only works for banking apps",
          ],
          correctIndex: 1,
        },
        {
          question:
            "About how long does it typically take to turn on two-step login for one account?",
          options: [
            "About a week",
            "About 10 minutes",
            "It requires hiring an IT consultant",
            "It can't be done without a paid subscription",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Turning on two-step login everywhere",
      explanation: `MFA (multi-factor authentication — a second login step beyond just a password) should be a deliberate company-wide policy, not something left to whichever platforms happen to enforce it by default. It defends specifically against credential-based attacks: even a leaked or guessed password is insufficient for account access without the second factor. Rolling it out across every important account — including social media — takes roughly 10 minutes per account and closes one of the most common entry points for account takeover.`,
      example: `Two staff members at the same organisation had passwords exposed in an unrelated third-party breach. The one with MFA enabled was unaffected — the leaked password alone was insufficient for access. The other, without MFA, experienced a full account takeover.`,
      quiz: [
        {
          question: "What does MFA specifically defend against?",
          options: [
            "Physical theft of a device",
            "Credential-based attacks, even when a password is leaked or guessed",
            "Power outages",
            "Poor internet connectivity",
          ],
          correctIndex: 1,
        },
        {
          question:
            "Why should MFA be deliberate company policy rather than left to platform defaults?",
          options: [
            "Platform defaults always cover every important account",
            "Relying only on defaults leaves coverage inconsistent and incomplete",
            "Deliberate policy is more expensive for no benefit",
            "It's a legal requirement in all cases",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Turning on two-step login everywhere",
      explanation: `MFA should be mandated as deliberate, company-wide policy rather than contingent on platform-default enforcement, since default-only coverage produces inconsistent, unauditable protection. MFA specifically mitigates credential-based compromise: a correctly-implemented second factor renders a leaked or brute-forced password alone insufficient for account access. Full-scope rollout — including social media and other non-core accounts frequently excluded from default enterprise policies — closes one of the most common initial-access vectors for account takeover.`,
      example: `A credential-leak event affected two accounts within the same organisation. The MFA-protected account remained secure despite the leaked credential; the non-MFA account was compromised, demonstrating MFA's effectiveness as a control against credential-based initial access.`,
      quiz: [
        {
          question: "Why is default-only MFA coverage considered inadequate?",
          options: [
            "It produces inconsistent, unauditable protection across accounts",
            "It is more secure than deliberate policy",
            "It costs more than deliberate policy",
            "It only applies to banking platforms",
          ],
          correctIndex: 0,
        },
        {
          question: "What does MFA specifically render insufficient for account access?",
          options: [
            "Physical access to a device",
            "A leaked or brute-forced password alone",
            "A valid session token",
            "Network connectivity",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D5: The first hour of a security incident ────────────────────────────────────────────
  {
    domainId: "D5",
    sortOrder: 1,
    sourceRef:
      "D5 descriptor, Level 3-4 (all tiers) — incident response fundamentals and the 72-hour ODPC breach-notification clock",
    A: {
      title: "The first hour of a security incident",
      explanation: `If you suspect your business has been hacked or a data breach has happened, the first hour matters. Don't panic-delete anything — that can destroy evidence you need later. Do: tell the person responsible (yourself or whoever you've named), change passwords on anything that might be affected, and if customer data was involved, remember Kenya's law requires telling the ODPC within 72 hours.`,
      example: `A business noticed unusual logins to their email account. Instead of panicking, the owner immediately changed the password, checked what emails had been accessed, and — since customer data was involved — began the process of notifying the ODPC within the required window.`,
      quiz: [
        {
          question: "What's a mistake to avoid in the first hour of a suspected security incident?",
          options: [
            "Changing passwords",
            "Panic-deleting things that might be evidence",
            "Telling the responsible person",
            "Checking what was affected",
          ],
          correctIndex: 1,
        },
        {
          question:
            "If customer data was involved in a breach, what's the legal deadline to notify the ODPC?",
          options: ["30 days", "72 hours", "1 year", "There is no deadline"],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "The first hour of a security incident",
      explanation: `The first hour after suspecting a security incident sets the tone for everything that follows. Avoid destructive actions (deleting logs, wiping devices) before understanding what happened — this destroys evidence needed for root-cause review. Escalate to the named responsible person, change credentials on potentially-affected accounts, and if the incident involves personal data, remember the 72-hour ODPC breach-notification obligation starts from when the breach is discovered, not when it's fully investigated.`,
      example: `An organisation noticed unusual login activity on a shared email account. Rather than immediately wiping the account, the team escalated to the named incident contact, rotated credentials, and — since customer data was potentially exposed — began the 72-hour ODPC notification process from the point of discovery.`,
      quiz: [
        {
          question:
            "Why should destructive actions (deleting logs, wiping devices) be avoided early in an incident?",
          options: [
            "They're always necessary immediately",
            "They can destroy evidence needed for root-cause review",
            "They speed up recovery",
            "They're required by the ODPC",
          ],
          correctIndex: 1,
        },
        {
          question: "From what point does the 72-hour ODPC notification clock start?",
          options: [
            "From when the investigation is fully complete",
            "From when the breach is discovered",
            "From when customers are informed",
            "From when the incident is publicly reported",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "The first hour of a security incident",
      explanation: `The initial response window following incident detection is critical to preserving forensic integrity and meeting regulatory obligations. Destructive remediation actions (log deletion, device wiping) prior to evidence preservation compromise root-cause analysis capability. Standard first-hour actions: escalation to the named incident owner, credential rotation on potentially-affected accounts, and initiation of the 72-hour ODPC breach-notification process — the notification clock runs from discovery, not from completion of investigation.`,
      example: `Following detection of anomalous authentication activity, the organisation preserved log evidence prior to remediation, escalated to the designated incident owner, rotated affected credentials, and initiated ODPC notification procedures from the point of discovery rather than awaiting full investigation completion.`,
      quiz: [
        {
          question: "What does premature destructive remediation compromise?",
          options: [
            "Nothing of consequence",
            "Forensic integrity and root-cause analysis capability",
            "Only cosmetic system appearance",
            "Customer communication timelines",
          ],
          correctIndex: 1,
        },
        {
          question: "What is the correct sequencing for the 72-hour ODPC notification clock?",
          options: [
            "It starts upon completion of full investigation",
            "It starts from the point of discovery",
            "It starts only after customer notification",
            "It starts after remediation is complete",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D5-2: What to do within 72 hours of a data breach (Phase 2 priority — see plan) ─────────
  // Currently the 72-hour ODPC obligation only lived inside the D5 Level 3 descriptor text; this
  // is the first dedicated walkthrough of what it actually means to do. priority: 10 makes this
  // the "Learn more" pick from D5 remediation guidance (see pickLessonForDomain) whenever there's
  // a D5 gap — not just another entry in the general library.
  {
    domainId: "D5",
    sortOrder: 2,
    priority: 10,
    audience: "owner",
    sourceRef:
      "D5 descriptor, Level 3 (all tiers) — the 72-hour ODPC breach-notification obligation and named point of contact",
    A: {
      title: "What to do within 72 hours of a data breach",
      explanation: `A "breach" under Kenya's Data Protection Act means personal data — customer names, phone numbers, ID numbers, payment details — got accessed, lost, or leaked without permission. If that happens, you have 72 hours to tell the ODPC (the Office of the Data Protection Commissioner, Kenya's data regulator) — and the clock starts from when you find out, not from when it actually happened. "Naming a point of contact" just means picking one specific person (you, or a named staff member) who's responsible for actually making that call if it happens — not "someone will handle it." A basic notification needs: what happened, roughly how many people's data was affected, what you're doing about it, and how the ODPC can reach you.`,
      example: `A shop's email account got hacked, and the attacker downloaded a spreadsheet of 200 customers' names and phone numbers. Because the owner had already decided she was the point of contact, she knew exactly who needed to notify the ODPC — and because she'd thought about the 72-hour rule before it happened, she didn't lose the first day figuring out who was supposed to act.`,
      quiz: [
        {
          question: "When does the 72-hour ODPC notification clock actually start?",
          options: [
            "From the moment the breach happened, even if you didn't know yet",
            "From when you become aware the breach happened",
            "From when you finish investigating fully",
            "There's no real deadline in practice",
          ],
          correctIndex: 1,
        },
        {
          question: `What does "naming a point of contact" mean for a small business?`,
          options: [
            "Hiring a dedicated compliance officer",
            "Picking one specific person responsible for making the ODPC notification if needed",
            "Nothing — it only applies to large companies",
            "Writing the ODPC's contact details on a wall",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "What to do within 72 hours of a data breach",
      explanation: `A qualifying personal-data breach under the DPA is unauthorised access, loss, or disclosure of personal data — customer names, contact details, ID numbers, payment records. Once discovered, the business has 72 hours to notify the ODPC (Office of the Data Protection Commissioner); the clock starts at the point of awareness, not the point of compromise, so delayed discovery doesn't extend it once you know. A named point of contact means one specific person, identified in advance, responsible for coordinating and making that notification — this doesn't require a dedicated Data Protection Officer for an exempted small business, just clarity on who acts. A basic notification needs to cover: the nature of the breach, the approximate number and category of people affected, likely consequences, and the measures taken or proposed in response.`,
      example: `A retailer's point-of-sale system was compromised, exposing roughly 150 customers' payment details. Because the owner had already named herself as the point of contact and knew what a notification needed to include, the business was able to notify the ODPC within the window instead of losing time deciding who was responsible for what.`,
      quiz: [
        {
          question: "When does the 72-hour ODPC notification clock start?",
          options: [
            "At the moment the breach technically occurred",
            "At the point the business becomes aware of the breach",
            "Only once the investigation is fully complete",
            "There is no fixed deadline in Kenyan law",
          ],
          correctIndex: 1,
        },
        {
          question: "What must a basic ODPC breach notification include?",
          options: [
            "Only a general statement that something happened",
            "The nature of the breach, who's affected, and what's being done about it",
            "A full forensic report before any notification is made",
            "Nothing specific — the ODPC will ask if needed",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "What to do within 72 hours of a data breach",
      explanation: `A qualifying breach is unauthorised access, loss, or disclosure of personal data. The 72-hour ODPC notification obligation is triggered at the point of awareness, not the point of occurrence. A named point of contact — one identified individual responsible for coordinating and executing notification — satisfies the requirement without necessitating a dedicated Data Protection Officer for exempted entities. A minimally compliant notification specifies: the nature of the breach, the approximate scope and category of affected data subjects, likely consequences, and remedial measures taken or proposed.`,
      example: `A compromised point-of-sale system exposed payment data for approximately 150 customers. A pre-designated point of contact and a clear understanding of notification content requirements allowed the 72-hour window to be met without ambiguity over responsibility.`,
      quiz: [
        {
          question: "The 72-hour ODPC notification obligation is triggered by:",
          options: [
            "The moment of breach occurrence",
            "The point of organisational awareness of the breach",
            "Completion of a full investigation",
            "There is no defined trigger point",
          ],
          correctIndex: 1,
        },
        {
          question: "A minimally compliant breach notification must specify:",
          options: [
            "A general acknowledgement only",
            "Nature of the breach, scope of affected data subjects, and remedial measures",
            "A complete forensic audit prior to any disclosure",
            "No specific content requirements exist",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D5-3: Who to tell if you spot a possible data breach (staff-facing companion) ───────────
  {
    domainId: "D5",
    sortOrder: 3,
    audience: "staff",
    sourceRef:
      "D5 descriptor, Level 3 (all tiers) — staff-facing companion to the 72-hour ODPC breach-notification lesson",
    A: {
      title: "Who to tell if you spot a possible data breach",
      explanation: `If you notice something that might mean customer information got seen, taken, or leaked by someone who shouldn't have it — a hacked account, a lost laptop, a spreadsheet sent to the wrong person — tell the owner or your named point of contact immediately. Don't wait to be sure, and don't try to fix it yourself first. The business has a strict 72-hour deadline to report real breaches, and every hour spent not telling anyone is an hour off that clock.`,
      example: `An employee noticed the shared customer spreadsheet had been emailed to the wrong address by mistake. Instead of quietly trying to recall the email and hoping it was fine, she told the owner straight away — which meant the owner had almost the full 72 hours to figure out whether it needed reporting, instead of finding out days later with much less time left.`,
      quiz: [
        {
          question: "You notice something that might be a data breach. What should you do first?",
          options: [
            "Try to fix it quietly yourself first",
            "Tell the owner or named point of contact immediately",
            "Wait until you're completely sure before saying anything",
            "Only mention it if a customer complains",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does reporting quickly matter so much here?",
          options: [
            "It doesn't really matter when you report it",
            "There's a strict 72-hour deadline that starts once the business becomes aware",
            "Only the IT provider needs to know",
            "Reporting is optional for small businesses",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Who to tell if you spot a possible data breach",
      explanation: `If you notice anything suggesting personal data may have been accessed, lost, or disclosed without authorisation — a compromised login, a misdirected email, a missing device — escalate to the owner or the business's named point of contact immediately, rather than attempting remediation independently first. The 72-hour ODPC notification window begins at the point the business becomes aware, so delayed internal reporting directly erodes the time available to assess and respond properly.`,
      example: `A staff member noticed a shared customer spreadsheet had been sent to the wrong recipient. Escalating immediately, rather than quietly trying to recall the email, preserved most of the 72-hour window for the owner to properly assess whether formal notification was required.`,
      quiz: [
        {
          question: "What's the correct first action on suspecting a data breach?",
          options: [
            "Attempt to resolve it independently first",
            "Escalate immediately to the owner or named point of contact",
            "Wait for certainty before raising it",
            "Only escalate if a customer notices first",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does immediate internal escalation matter?",
          options: [
            "It has no real effect on the outcome",
            "The 72-hour notification clock starts at awareness, so delay shrinks the response window",
            "Only management-level staff are affected by the deadline",
            "Escalation is purely a formality",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Who to tell if you spot a possible data breach",
      explanation: `Any indication of unauthorised access, loss, or disclosure of personal data should be escalated immediately to the owner or named point of contact, without independent remediation attempts. Since the 72-hour ODPC notification window is triggered at the point of organisational awareness, delayed internal escalation directly reduces the time available for compliant response.`,
      example: `A misdirected email containing a customer data spreadsheet was escalated immediately rather than addressed independently, preserving the notification window for proper assessment.`,
      quiz: [
        {
          question: "The correct first response to a suspected breach is:",
          options: [
            "Independent remediation before escalation",
            "Immediate escalation to the named point of contact",
            "Delay until certainty is established",
            "No action is required at staff level",
          ],
          correctIndex: 1,
        },
        {
          question: "Delayed internal escalation primarily affects:",
          options: [
            "Nothing of consequence",
            "The time remaining within the 72-hour notification window",
            "Only the technical remediation process",
            "Customer-facing communications alone",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D6: The 3-2-1 backup rule ─────────────────────────────────────────────────────────────
  {
    domainId: "D6",
    sortOrder: 1,
    sourceRef:
      "D6 descriptor, Level 1 (all tiers) — moving from ad-hoc, unsystematic backups to a real system",
    A: {
      title: "The 3-2-1 backup rule",
      explanation: `The 3-2-1 rule is a simple way to make sure your backups actually protect you: keep 3 copies of your important data, on 2 different types of storage, with 1 copy stored somewhere else entirely (not in your office). This way, if ransomware locks your main computer, or a fire or theft happens at your office, you still have a working copy somewhere safe.`,
      example: `A business had all its files backed up — but the backup drive was sitting right next to the main computer. When a break-in happened, both were stolen. If one copy had been stored somewhere else, the business wouldn't have lost everything.`,
      quiz: [
        {
          question: "In the 3-2-1 rule, what does the '1' stand for?",
          options: [
            "1 password for all accounts",
            "1 copy stored somewhere else, off-site",
            "1 backup per year",
            "1 person responsible for backups",
          ],
          correctIndex: 1,
        },
        {
          question:
            "Why did the business in the example still lose everything despite having a backup?",
          options: [
            "The backup was too old",
            "The backup was stored in the same location as the original, so both were stolen together",
            "They used the wrong software",
            "They never actually turned the backup on",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "The 3-2-1 backup rule",
      explanation: `The 3-2-1 rule structures backups so a single event can't wipe out both your original data and your backup: 3 total copies of important data, stored on 2 different types of media, with 1 copy kept off-site (physically separate from your main location). This specifically protects against scenarios where backup and original share the same fate — a device stolen alongside its backup drive, or ransomware that also encrypts a connected backup.`,
      example: `An organisation's backup drive was stored next to the primary computer it backed up. A physical break-in resulted in both being stolen simultaneously, negating the backup entirely. An off-site copy, per the 3-2-1 rule, would have survived the same event.`,
      quiz: [
        {
          question:
            "What specific failure mode does the 3-2-1 rule's off-site requirement protect against?",
          options: [
            "Slow internet speeds",
            "Backup and original being lost together in the same event (theft, fire, ransomware)",
            "Software becoming outdated",
            "Running out of storage space",
          ],
          correctIndex: 1,
        },
        {
          question: "What does the 3-2-1 rule require regarding storage media?",
          options: [
            "All copies on the same type of media for consistency",
            "At least 2 different types of media",
            "Only cloud storage, never physical media",
            "Only physical media, never cloud",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "The 3-2-1 backup rule",
      explanation: `The 3-2-1 backup strategy mitigates correlated-failure risk: 3 total data copies, across 2 distinct media types, with 1 copy maintained off-site. This structure specifically defends against single-event scenarios that would otherwise compromise both primary data and its backup simultaneously — co-located physical theft, fire, or ransomware capable of encrypting network-attached backup targets. Media-type diversity further mitigates media-specific failure modes (e.g., a firmware-level exploit affecting one storage vendor's hardware).`,
      example: `An organisation's sole backup resided on network-attached storage co-located with, and network-accessible from, the primary environment. A ransomware event encrypted both primary systems and the backup target simultaneously, illustrating the correlated-failure risk the 3-2-1 rule's off-site and media-diversity requirements are designed to mitigate.`,
      quiz: [
        {
          question:
            "What risk does maintaining backups on the same network as production systems create?",
          options: [
            "No meaningful risk",
            "Ransomware capable of encrypting network-attached backups alongside primary systems",
            "Slower backup speeds only",
            "Increased storage costs only",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does the 3-2-1 rule specify at least 2 different media types?",
          options: [
            "To increase cost unnecessarily",
            "To mitigate media-specific failure modes affecting a single storage type",
            "Media type has no bearing on resilience",
            "To comply with an arbitrary standard",
          ],
          correctIndex: 1,
        },
      ],
    },
  },
];

// ── D3/D6: Spotting and responding to a cloned business page (Phase 3 priority) ────────────────
// Section 9's local-risk table lists impersonation/fake-page fraud (emerging pattern E3) as a
// *secondary* risk for D3 and D6 — but E3 is explicitly flagged there as an emerging pattern from
// the thematic analysis, not yet written into Annex A's formal 0-5 leveled descriptors the way
// every other lesson in this file is. That's a real difference in status, not a technicality, so
// it's called out in this lesson's sourceRef rather than presented as identical to fully-scored
// content.
//
// Researcher decision this raises (documented here per the brief's Phase 8 thesis-note ask —
// there's no separate thesis-notes file in this repo, so decisions like this live as a comment
// next to the content they concern, same as the D4-heavy scope choice noted at the top of this
// file): should E3 eventually be written into Annex A's formal descriptors (most likely under D3
// or D6), or should it stay training-only content that runs ahead of the formally scored model?
// Both are defensible. Not resolved by this change — flagging it for a deliberate call, not
// leaving it to be discovered by comparing the app against Annex A.
//
// Tagged against both D3 and D6 (Section 9's primary/secondary mapping) by duplicating the
// content as two separate Lesson rows, tier x domain (6 rows total) — the schema has no
// many-to-many lesson-domain relation, and duplication matches the existing per-tier content
// duplication pattern already used everywhere else in this file. Known tradeoff: TrainingCompletion
// is tracked per Lesson row, so completing the D3 copy won't mark the D6 copy done — acceptable
// for two independent "Learn more" entry points, but worth knowing if this surfaces confusingly
// in a future usability pass. Defined here (after TOPICS) and appended via TOPICS.push() below,
// rather than duplicating ~90 lines of tier content inline for each domain.
const IMPERSONATION_CONTENT: { A: LessonContent; B: LessonContent; C: LessonContent } = {
  A: {
    title: "Spotting and responding to a cloned business page",
    explanation: `A cloned page copies your business name, logo, and photos to trick your customers — sometimes running fake "sales," sometimes asking people to pay a different M-Pesa number or account. You usually find out because a customer messages you asking "is this really you?" or complains after paying the fake page. If it happens: report it to the platform straight away (Instagram and Facebook both have a "report impersonation" option), post a warning from your real account so customers know which page is genuine, and message any regular customers directly. This is exactly the kind of thing your account-recovery plan (the one for losing your Instagram or Facebook page) should already cover — losing control of how customers find you is a business risk, not just an annoyance.`,
    example: `A customer messaged a boutique's real Instagram asking why "they" had asked her to pay a different M-Pesa number for an order. It turned out a near-identical fake account, using the same photos and name, had been messaging her customers directly. The owner reported the fake account to Instagram, posted a warning naming the real account, and messaged her regular customers to confirm the correct number — most of the damage was avoided because she acted the same day.`,
    quiz: [
      {
        question: "How do most businesses first find out about a page impersonating them?",
        options: [
          "The platform automatically notifies them",
          "A customer asks or complains about something the fake page did",
          "It shows up in a routine security scan",
          "It never becomes noticeable",
        ],
        correctIndex: 1,
      },
      {
        question:
          "What should you do first if you discover a cloned version of your business page?",
        options: [
          "Wait to see if it goes away on its own",
          "Report it to the platform and warn your customers from your real account",
          "Message the fake page asking them to stop",
          "Delete your own real account to avoid confusion",
        ],
        correctIndex: 1,
      },
    ],
  },
  B: {
    title: "Spotting and responding to a cloned business page",
    explanation: `Impersonation (a fake page copying your business name, logo, and photos) is typically discovered when a customer contacts the real business questioning something the fake page did — a suspicious "sale," or a payment request to a different account. Response steps: report the fake account to the platform through its impersonation-reporting flow, post a warning from the verified/real account clarifying which is genuine, and proactively notify regular customers. This should be treated as part of the same account-recovery planning already expected at D3 Level 4 (a documented recovery plan for social/content account loss, framed as a business-continuity risk) — impersonation is a variant of that same underlying risk: loss of control over how customers find and trust the business online.`,
    example: `A boutique's genuine Instagram received a customer query about a payment request sent by "them" to a different M-Pesa number. Investigation revealed a near-identical cloned account contacting real customers directly. The owner reported the impersonating account, posted a clarifying notice from the verified account, and directly contacted regular customers — timely action limited the financial and reputational impact.`,
    quiz: [
      {
        question: "What typically triggers discovery of a business-impersonation incident?",
        options: [
          "Automatic platform detection and notification",
          "A customer query or complaint about the fake account's activity",
          "A scheduled security audit",
          "It is rarely discovered at all",
        ],
        correctIndex: 1,
      },
      {
        question: "How does this connect to the D3 Level 4 account-recovery expectation?",
        options: [
          "It's unrelated to account-recovery planning",
          "Impersonation is a variant of the same business-continuity risk that recovery planning already covers",
          "Only literal account loss counts as business continuity, not impersonation",
          "This connection only applies to Tier C businesses",
        ],
        correctIndex: 1,
      },
    ],
  },
  C: {
    title: "Spotting and responding to a cloned business page",
    explanation: `Business impersonation (a duplicated page mimicking name, branding, and imagery) is most commonly discovered via customer-initiated inquiry regarding the fake account's activity, rather than platform-side detection. Response protocol: initiate platform impersonation reporting, issue a clarifying notice from the verified account, and directly notify recurring customers. This risk is a variant of the account-loss business-continuity risk already addressed at D3 Level 4 and should be incorporated into existing recovery-plan documentation rather than treated as a separate category.`,
    example: `Customer-reported activity from a cloned account (identical branding, alternate payment details) prompted platform reporting, verified-account clarification, and direct customer notification, limiting exposure.`,
    quiz: [
      {
        question: "Impersonation incidents are most commonly identified via:",
        options: [
          "Automated platform-side detection",
          "Customer-initiated inquiry regarding fake-account activity",
          "Routine internal audit",
          "They are typically undetected",
        ],
        correctIndex: 1,
      },
      {
        question: "Impersonation risk should be incorporated into:",
        options: [
          "A wholly separate risk category",
          "Existing account-recovery/business-continuity documentation",
          "No formal documentation is warranted",
          "Customer-facing communications only, with no internal record",
        ],
        correctIndex: 1,
      },
    ],
  },
};

TOPICS.push(
  {
    domainId: "D3",
    sortOrder: 2,
    priority: 10,
    audience: "both",
    sourceRef:
      "Section 9 emerging pattern E3 (impersonation/fake-page fraud) — secondary risk for D3; NOT yet in Annex A's formal 0-5 descriptors as of this content pass. Cross-referenced against D3 Level 4 (documented account-recovery plan, business-continuity framing). See the comment above this lesson for the researcher decision this raises.",
    ...IMPERSONATION_CONTENT,
  },
  {
    domainId: "D6",
    sortOrder: 2,
    priority: 10,
    audience: "both",
    sourceRef:
      "Section 9 emerging pattern E3 (impersonation/fake-page fraud) — secondary risk for D6; NOT yet in Annex A's formal 0-5 descriptors as of this content pass. See the comment above this lesson for the researcher decision this raises.",
    ...IMPERSONATION_CONTENT,
  },
);

// ── Phase 4 content expansion — remaining D1/D2/D3/D5/D6 topics ────────────────────────────────
// Same tier-registered pattern as everything above, each grounded in a specific descriptor level
// via sourceRef. Picks up where the Phase 2/3 priority pass left off (see the plan this was built
// against — schema + priority-lesson mechanism already exist, this is content volume only).
TOPICS.push(
  // ── D1-2: The DPA exemption test, step by step ────────────────────────────────────────────
  {
    domainId: "D1",
    sortOrder: 2,
    sourceRef:
      "D1 descriptor, Level 2 (all tiers) — the KES 5M turnover / 10-employee exemption test and sector overrides",
    A: {
      title: "The DPA exemption test, step by step",
      explanation: `Kenya's Data Protection Act has a small-business exemption: if your turnover is under KES 5 million a year AND you have fewer than 10 employees, you likely don't need to register with the ODPC. But there's a catch — some sectors have to register no matter their size, because of the kind of data they handle. The test is simple: check both numbers first, then check whether your type of business is one of the sector exceptions. Write down which one applies to you and why — that written note is what "checked, not just assumed" actually looks like.`,
      example: `A small salon owner had always assumed the DPA "was for bigger companies." Going through the actual test — under KES 5M turnover, 4 employees, not in a sector with an override — she confirmed she qualified for the exemption, and wrote a single line noting the date she checked and why. It took fifteen minutes and gave her something to point to if anyone ever asked.`,
      quiz: [
        {
          question: "What are the two numbers in the DPA small-business exemption test?",
          options: [
            "Turnover under KES 5M and fewer than 10 employees",
            "Turnover under KES 1M and fewer than 5 employees",
            "Only the number of employees matters",
            "Only turnover matters",
          ],
          correctIndex: 0,
        },
        {
          question: "Can every business under those thresholds skip ODPC registration?",
          options: [
            "Yes, always, no exceptions",
            "No — some sectors must register regardless of size",
            "Only if they ask the ODPC first",
            "The exemption doesn't really exist",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "The DPA exemption test, step by step",
      explanation: `The DPA's small-business exemption applies where turnover is under KES 5 million and the business employs fewer than 10 people — but sector overrides exist, meaning certain business types must register with the ODPC regardless of meeting those thresholds. The evaluation itself is straightforward: confirm both the turnover and employee-count criteria, then confirm whether the business's sector carries a registration override. Document the outcome and the date it was checked — an undocumented assumption doesn't satisfy the "evaluated applicability" bar this descriptor is testing for.`,
      example: `A boutique retailer, comfortably under both thresholds and outside any sector override, formally evaluated and documented its exemption status rather than relying on an assumption — a fifteen-minute exercise that produced a written record the owner could reference if ever asked.`,
      quiz: [
        {
          question: "What does the DPA small-business exemption test require checking?",
          options: [
            "Turnover and employee count against the thresholds, plus any sector override",
            "Only whether the owner has heard of the DPA",
            "Only the business's registration certificate",
            "Nothing — exemption is automatic",
          ],
          correctIndex: 0,
        },
        {
          question: "Why does documenting the exemption check matter?",
          options: [
            "It doesn't — a mental note is sufficient",
            "An undocumented assumption doesn't satisfy the 'evaluated applicability' requirement",
            "Only the ODPC's own records matter",
            "Documentation is only needed for registered businesses",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "The DPA exemption test, step by step",
      explanation: `Exemption evaluation requires confirming both quantitative thresholds (turnover under KES 5M; fewer than 10 employees) and the absence of an applicable sector-specific registration override. Documented evaluation — not informal assumption — is the standard this descriptor level tests for.`,
      example: `A retail business confirmed both threshold criteria and the absence of a sector override, producing a dated written record rather than relying on an undocumented assumption.`,
      quiz: [
        {
          question: "Exemption evaluation requires confirming:",
          options: [
            "Quantitative thresholds only",
            "Quantitative thresholds and the absence of a sector-specific override",
            "Sector classification only",
            "Nothing formal is required",
          ],
          correctIndex: 1,
        },
        {
          question: "What distinguishes an adequate exemption evaluation from an inadequate one?",
          options: [
            "Documentation versus undocumented assumption",
            "There is no meaningful distinction",
            "Only the business owner's confidence level",
            "Whether a lawyer was consulted",
          ],
          correctIndex: 0,
        },
      ],
    },
  },

  // ── D1-3: Writing a one-page data-handling policy ─────────────────────────────────────────
  {
    domainId: "D1",
    sortOrder: 3,
    sourceRef: "D1 descriptor, Level 3 (all tiers) — a written policy for handling customer data",
    A: {
      title: "Writing a one-page data-handling policy",
      explanation: `A data-handling policy doesn't need to be a legal document — it just needs to answer, in plain language: what customer information you collect, why you collect it, how it's stored and protected, who in your business can access it, how long you keep it, and who to contact with questions. One page is enough. Writing it down (instead of just knowing it in your head) is what actually satisfies this part of the law, and it means anyone in the business can explain your practices consistently instead of everyone giving a different answer.`,
      example: `A café owner sat down for twenty minutes and wrote one page: they collect names and phone numbers for delivery orders, store them in their order app, only the owner and one manager can see them, they're deleted after a year, and questions go to the owner directly. Simple, honest, and exactly what was needed.`,
      quiz: [
        {
          question: "How long does a data-handling policy for a small business need to be?",
          options: [
            "A full legal document, several pages",
            "One page is enough if it covers the key points in plain language",
            "It doesn't need to be written down at all",
            "Exactly as long as a lawyer says",
          ],
          correctIndex: 1,
        },
        {
          question: "What should a basic data-handling policy cover?",
          options: [
            "Only what data is collected",
            "What's collected, why, how it's protected, who can access it, and how long it's kept",
            "Only the business's contact details",
            "A list of every customer's name",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Writing a one-page data-handling policy",
      explanation: `A written data-handling policy needs to cover, at minimum: the categories of personal data collected, the purpose of collection, storage and protection measures, who within the business has access, retention period, and a contact point for queries. A single page is sufficient for a small business — the requirement is that it exists in writing and is consistent, not that it be exhaustive. Writing it down converts implicit practice into something the business can actually be accountable to.`,
      example: `A retail business documented, in one page, the categories of customer data it held, its storage location, access restrictions to two staff members, a one-year retention period, and a named contact for data queries — turning previously informal practice into a consistent, referenceable policy.`,
      quiz: [
        {
          question: "What must a written data-handling policy specify?",
          options: [
            "Categories of data collected, purpose, protection, access, and retention",
            "Only the business's registration number",
            "A list of competitor practices",
            "Nothing specific — any document suffices",
          ],
          correctIndex: 0,
        },
        {
          question: "Why does writing the policy down matter, beyond just knowing the practices?",
          options: [
            "It doesn't matter either way",
            "It converts implicit practice into something consistent and accountable",
            "Only for businesses with over 50 employees",
            "It's purely a formality with no practical effect",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Writing a one-page data-handling policy",
      explanation: `A minimally compliant data-handling policy specifies: data categories collected, purpose of processing, storage/protection measures, access controls, retention period, and a designated contact point. Documentation converts informal practice into a consistent, accountable standard; length is not the compliance criterion — completeness and consistency are.`,
      example: `A one-page policy specifying data categories, storage location, two-person access restriction, one-year retention, and a named contact point replaced previously undocumented, inconsistent practice.`,
      quiz: [
        {
          question: "A minimally compliant data-handling policy must specify:",
          options: [
            "Data categories, purpose, protection, access, and retention",
            "Only a general statement of good intent",
            "Employee headcount only",
            "Nothing beyond a business registration number",
          ],
          correctIndex: 0,
        },
        {
          question: "The compliance criterion for such a policy is primarily:",
          options: [
            "Document length",
            "Completeness and consistency of the specified elements",
            "Legal review by external counsel",
            "Publication on a public website",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D1-4: What's a DPIA, and when do you need one? ────────────────────────────────────────
  {
    domainId: "D1",
    sortOrder: 4,
    sourceRef:
      "D1 descriptor, Level 4 (all tiers) — Data Protection Impact Assessments for higher-risk processing",
    A: {
      title: "What's a DPIA, and when do you need one?",
      explanation: `A DPIA (Data Protection Impact Assessment) is just a structured way of thinking through the privacy risks before you start doing something new with sensitive customer data — before you start it, not after. You need one when you're about to do something higher-risk: starting to collect a new type of sensitive data (like ID numbers or health information), using a new system that handles customer data, or sharing data with a new third party. The exercise itself is simple: what data, why, what could go wrong, and what you're doing to reduce that risk — written down before you start, not as an afterthought.`,
      example: `Before adding a loyalty programme that would collect customers' ID numbers, a shop owner spent thirty minutes thinking through: why she needed the ID numbers, what could go wrong if that list leaked, and how she'd protect it (a locked, access-limited spreadsheet). That thirty minutes before launch was the DPIA — informal, but exactly the kind of thinking the requirement is asking for.`,
      quiz: [
        {
          question: "When should a DPIA happen, relative to starting a higher-risk activity?",
          options: [
            "After something goes wrong",
            "Before you start it",
            "Only once a year regardless of new activities",
            "DPIAs are never needed for small businesses",
          ],
          correctIndex: 1,
        },
        {
          question: "What kind of situation typically calls for a DPIA?",
          options: [
            "Routine, everyday use of data you already handle safely",
            "Starting to collect new sensitive data or using a new system for customer data",
            "Sending a normal invoice",
            "Nothing — DPIAs only apply to large corporations",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "What's a DPIA, and when do you need one?",
      explanation: `A Data Protection Impact Assessment is a structured pre-assessment of privacy risk, conducted before undertaking higher-risk processing activities — new collection of sensitive data categories, adoption of a new system handling customer data, or a new third-party data-sharing arrangement. The assessment itself doesn't need to be elaborate for a small business: identify the data involved, the purpose, the plausible risks, and the mitigating measures — documented before the activity begins, not retrospectively.`,
      example: `Before launching a loyalty programme requiring ID-number collection, a business conducted a brief DPIA: identifying the data category, the business justification, the risk of exposure, and the mitigation (access-restricted, encrypted storage) — completed prior to launch rather than after.`,
      quiz: [
        {
          question: "A DPIA is best described as:",
          options: [
            "A retrospective audit after an incident",
            "A structured pre-assessment of privacy risk before higher-risk processing begins",
            "An annual formality unrelated to specific activities",
            "A requirement exclusive to large enterprises",
          ],
          correctIndex: 1,
        },
        {
          question: "Which scenario would typically warrant a DPIA?",
          options: [
            "Continuing an existing, already-assessed data practice unchanged",
            "Adopting a new system that will process sensitive customer data",
            "Issuing a routine invoice",
            "None — DPIAs are optional in all cases",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "What's a DPIA, and when do you need one?",
      explanation: `A Data Protection Impact Assessment is a documented, pre-emptive risk evaluation conducted prior to higher-risk processing activities (new sensitive-data collection, new system adoption, new third-party sharing). Minimum content: data categories involved, processing purpose, identified risks, and mitigating measures — completed prior to, not following, activity commencement.`,
      example: `Prior to implementing ID-number collection for a loyalty programme, a documented risk evaluation identified the data category, purpose, exposure risk, and access-restriction mitigation ahead of launch.`,
      quiz: [
        {
          question: "A DPIA is conducted:",
          options: [
            "After an incident occurs",
            "Prior to commencing higher-risk processing activity",
            "Only during external audits",
            "It is not a documented process",
          ],
          correctIndex: 1,
        },
        {
          question: "Minimum DPIA content includes:",
          options: [
            "Data categories, purpose, risks, and mitigations",
            "A general statement of compliance intent only",
            "Financial projections",
            "Competitor benchmarking",
          ],
          correctIndex: 0,
        },
      ],
    },
  },
);

TOPICS.push(
  // ── D2-2: Listing what data and systems you actually have (worksheet) ────────────────────
  {
    domainId: "D2",
    sortOrder: 2,
    sourceRef:
      "D2 descriptor, Level 0-1 (all tiers) — moving from an informal sense of what matters to a written list",
    A: {
      title: "Listing what data and systems you actually have",
      explanation: `This is a worksheet, not a lecture — grab a piece of paper or a blank note and list every system and type of data your business touches: your phone, your M-Pesa account, your business Instagram/WhatsApp, any spreadsheets or apps with customer details, your email, your point-of-sale system if you have one. For each one, jot down what it holds. That's it — you now have a data and systems inventory, which is the first real step before you can protect anything properly, because you can't protect what you haven't written down.`,
      example: `A hair salon owner sat down and listed: her phone (customer WhatsApp chats), an appointment-booking app (names, phone numbers, appointment history), her business Instagram, and a paper ledger for payments. Fifteen minutes, and for the first time she had an actual list instead of a rough idea in her head.`,
      quiz: [
        {
          question: "What's the first step in building a data and systems inventory?",
          options: [
            "Buying new security software",
            "Writing down every system and type of data your business touches",
            "Hiring an IT consultant",
            "Deleting anything you're not sure about",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does writing the list down matter more than just having a rough idea?",
          options: [
            "It doesn't — a mental list is just as good",
            "You can't properly protect what you haven't actually identified and written down",
            "It's only needed for tax purposes",
            "Written lists are required by every app you use",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Listing what data and systems you actually have",
      explanation: `Building a basic asset and data inventory starts with a simple worksheet exercise: list every system the business uses (communication apps, booking/POS systems, social media accounts, spreadsheets, email) and the category of data each one holds. This doesn't need specialist tools — a written or typed list is sufficient at this stage. The point is converting an informal, in-your-head sense of "what we use" into a documented list, which is the prerequisite for any meaningful classification or risk-prioritisation work later.`,
      example: `A retail business documented its systems — a booking app (customer contact details), Instagram (public-facing, no sensitive data), and a shared spreadsheet (supplier and payment details) — converting a previously informal sense of "what we use" into an actual written inventory.`,
      quiz: [
        {
          question: "What does a basic data/systems inventory require?",
          options: [
            "Specialist software and external consultants",
            "A written list of systems used and the data category each holds",
            "Nothing — informal awareness is sufficient",
            "A government-issued certification",
          ],
          correctIndex: 1,
        },
        {
          question: "Why is documenting the inventory a prerequisite for later steps?",
          options: [
            "It isn't related to later risk-classification work",
            "Sensitivity classification and risk prioritisation depend on first knowing what exists",
            "Only the ODPC needs this information",
            "It's purely a bookkeeping formality",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Listing what data and systems you actually have",
      explanation: `Asset and data inventory construction begins with documenting all systems in use (communication platforms, booking/POS systems, social accounts, spreadsheets, email) and the data category each holds. Documentation, not specialist tooling, is the requirement at this stage; it is the necessary precondition for subsequent sensitivity classification and risk prioritisation.`,
      example: `A documented inventory listing a booking application, social media presence, and a shared spreadsheet, each annotated with its data category, replaced previously undocumented informal awareness.`,
      quiz: [
        {
          question: "The initial step in asset/data inventory construction is:",
          options: [
            "Procuring specialist inventory software",
            "Documenting systems in use and their data categories",
            "Engaging external audit consultants",
            "Deleting unused systems",
          ],
          correctIndex: 1,
        },
        {
          question: "This inventory step is a precondition for:",
          options: [
            "Nothing further is required afterward",
            "Sensitivity classification and risk prioritisation",
            "Tax filing only",
            "Marketing strategy",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D2-3: Classifying your data by sensitivity ────────────────────────────────────────────
  {
    domainId: "D2",
    sortOrder: 3,
    sourceRef:
      "D2 descriptor, Level 3 (all tiers) — sensitivity classification and sector-specific risk categories",
    A: {
      title: "Classifying your data by sensitivity",
      explanation: `Once you have a list of what data you hold (see the previous lesson), sort it by how damaging it would be if it leaked. ID numbers, payment details, and health or HR records are the most sensitive — treat those with extra care. Names and general contact details are lower risk but still matter. Your specific business type may have its own sensitive categories too — guest records for hospitality, client files for professional services, delivery/payment details for logistics. You don't need special software for this: a simple "high/medium/low sensitivity" label next to each item on your list is enough to start treating the risky stuff differently.`,
      example: `A boutique guesthouse reviewed its data list and flagged guest ID copies and payment details as "high sensitivity" (locked away, access limited to the owner), while general booking-calendar entries were "low sensitivity" (fine on a shared tablet). The same data, treated very differently, once it was actually classified instead of lumped together.`,
      quiz: [
        {
          question: "Which of these is typically the most sensitive category of data?",
          options: [
            "A customer's first name only",
            "ID numbers, payment details, and health/HR records",
            "Your business's public Instagram bio",
            "Your shop's opening hours",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the simplest way for a small business to classify data sensitivity?",
          options: [
            "Buy specialised classification software",
            "Label each item on your data list as high, medium, or low sensitivity",
            "Assume everything is equally sensitive",
            "Ignore classification entirely",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Classifying your data by sensitivity",
      explanation: `Sensitivity classification builds on the data inventory: sort each item by potential harm if exposed. ID numbers, payment details, and health/HR records sit at the top; general contact information is lower risk but not negligible. Business-type-specific categories also apply — guest/hospitality data, client documents for professional services, logistics/payment data — and should be identified explicitly rather than left implicit. A simple high/medium/low tagging scheme against the existing inventory is sufficient; the goal is differentiated handling, not a formal classification system.`,
      example: `A guesthouse classified guest ID copies and payment records as high sensitivity (restricted access, locked storage) while general booking calendar entries were tagged low sensitivity (shared access acceptable) — differentiated treatment that hadn't existed when everything was handled the same way.`,
      quiz: [
        {
          question: "What forms the top tier of data sensitivity for most small businesses?",
          options: [
            "General contact information",
            "ID numbers, payment details, and health/HR records",
            "Public marketing content",
            "Business opening hours",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the practical goal of sensitivity classification?",
          options: [
            "Producing an unused formal document",
            "Enabling differentiated handling based on actual risk",
            "Satisfying a purely bureaucratic requirement",
            "Reducing the total amount of data collected",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Classifying your data by sensitivity",
      explanation: `Sensitivity classification extends the data inventory by assigning a harm-based tier to each item: ID numbers, payment details, and health/HR records at the highest tier; general contact data lower. Sector-specific categories (hospitality guest data, professional-services client files, logistics/payment data) should be explicitly identified. A simple high/medium/low tagging scheme suffices; the objective is differentiated handling proportional to risk, not procedural formality.`,
      example: `Guest ID copies and payment records were tagged high sensitivity with restricted, locked access; general calendar data was tagged low sensitivity with shared access — differentiated handling replacing uniform treatment.`,
      quiz: [
        {
          question: "Sensitivity classification is built on top of:",
          options: [
            "A previously completed data/systems inventory",
            "External audit findings only",
            "Marketing segmentation data",
            "Nothing — it's a standalone exercise",
          ],
          correctIndex: 0,
        },
        {
          question: "The practical objective of classification is:",
          options: [
            "Differentiated handling proportional to risk",
            "Producing a document for its own sake",
            "Reducing total data volume",
            "Satisfying an external auditor only",
          ],
          correctIndex: 0,
        },
      ],
    },
  },

  // ── D2-4: Checking instead of assuming your provider's security (T3) ─────────────────────
  {
    domainId: "D2",
    sortOrder: 4,
    sourceRef:
      "D2 descriptor, Level 4 (all tiers) — independently verifying rather than assuming third-party/provider security practices",
    A: {
      title: "Checking instead of assuming your provider's security",
      explanation: `If your website, booking system, or payment processing is run by an outside provider, it's easy to assume "they've got it covered." The next step is to actually check — ask your provider directly what security measures they have in place (backups, who can access your data, what happens if something goes wrong), and get the answer in writing if you can. You're not trying to catch them out — you're making sure "probably fine" becomes "actually confirmed," because if something does go wrong, you're still the one responsible for your customers' data, not just your provider.`,
      example: `A shop using a third-party booking platform had always assumed it was secure because "it's a big company." After actually emailing to ask about their backup process and who could access customer data, the owner got a clear written answer — turning an assumption into something she could actually point to if a customer ever asked.`,
      quiz: [
        {
          question: "What's the risk of just assuming a provider handles security properly?",
          options: [
            "There's no risk — providers always handle it correctly",
            "You remain responsible for your customers' data even if something goes wrong on the provider's end",
            "Providers are legally required to fix everything automatically",
            "Assuming is always faster and just as safe",
          ],
          correctIndex: 1,
        },
        {
          question: "What's a concrete way to move from assuming to actually verifying?",
          options: [
            "Do nothing differently, it's not worth the effort",
            "Directly ask the provider about their security measures and get the answer in writing",
            "Switch providers immediately without asking anything",
            "Trust word-of-mouth reviews only",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Checking instead of assuming your provider's security",
      explanation: `Where third-party providers handle business-critical systems (booking, payment processing, hosting), independent verification of their security practices — rather than assumption — is the standard being tested here. Concretely: directly request information on backup practices, access controls, and incident procedures, and obtain that confirmation in writing where possible. Ultimate accountability for customer data doesn't transfer to the provider simply because they manage the system.`,
      example: `A business using a third-party booking platform formally requested and received written confirmation of the provider's backup cadence and access-control practices, replacing an unverified assumption with a documented answer.`,
      quiz: [
        {
          question: "Why does independent verification of provider security matter?",
          options: [
            "It's an unnecessary formality",
            "Accountability for customer data doesn't transfer away simply because a provider manages the system",
            "Providers are never at fault for incidents",
            "Only applies to businesses with in-house IT",
          ],
          correctIndex: 1,
        },
        {
          question: "What does 'verification' concretely look like here?",
          options: [
            "Requesting and documenting the provider's actual security practices",
            "Assuming the provider is reputable, therefore secure",
            "Reading unrelated online reviews only",
            "Ignoring the question entirely",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: "Checking instead of assuming your provider's security",
      explanation: `Independent verification of third-party provider security practices — as opposed to unverified assumption — is required for business-critical outsourced systems. This entails formally requesting and documenting information on backup practices, access controls, and incident response procedures. Accountability for customer data is not transferred by outsourcing system management.`,
      example: `Written confirmation of a booking-platform provider's backup and access-control practices was formally requested and obtained, replacing an unverified assumption of adequate security.`,
      quiz: [
        {
          question: "Independent verification of provider security is required because:",
          options: [
            "Accountability for customer data is not transferred by outsourcing",
            "Providers are contractually infallible",
            "It is a purely optional best practice with no bearing on accountability",
            "Regulators verify providers automatically",
          ],
          correctIndex: 0,
        },
        {
          question: "Adequate verification entails:",
          options: [
            "Formally requesting and documenting provider security practices",
            "Assuming reputation implies security",
            "Relying solely on marketing claims",
            "No action is required",
          ],
          correctIndex: 0,
        },
      ],
    },
  },
);

TOPICS.push(
  // ── D3-3: Turning on MFA on WhatsApp, Instagram, Gmail, and mobile money ─────────────────
  // Flagged needsPeriodicReview: the menu paths below are accurate as of this content pass, but
  // WhatsApp/Instagram/Google's own settings UI changes over time — a stale screenshot-style
  // walkthrough actively misleads a Tier A user rather than just quietly aging (Phase 6).
  {
    domainId: "D3",
    sortOrder: 3,
    needsPeriodicReview: true,
    sourceRef:
      "D3 descriptor, Level 1 (all tiers) — the specific platforms Annex A names (WhatsApp, Instagram, Google Workspace, banking apps)",
    A: {
      title: "Turning on MFA on WhatsApp, Instagram, Gmail, and mobile money",
      explanation: `"Turn on 2FA" is easy to say and hard to actually do if nobody tells you where the button is. Here's where to look: WhatsApp — Settings > Account > Two-step verification. Instagram — Settings > Accounts Centre > Password and security > Two-factor authentication. Gmail/Google — myaccount.google.com > Security > 2-Step Verification. Banking and mobile-money apps — usually under Settings or Security in the app; if you can't find it, call your provider and ask directly. Do this for every account today, not "someday" — it takes about five minutes per app.`,
      example: `A shop owner had heard "turn on two-factor" for months but never actually did it because she didn't know where to look. Following the exact menu paths for WhatsApp, Instagram, and her Gmail took her under twenty minutes total, done in one sitting instead of being an ongoing item on a to-do list nobody ever gets to.`,
      quiz: [
        {
          question: "Where do you turn on two-step verification in WhatsApp?",
          options: [
            "Settings > Account > Two-step verification",
            "It can't be turned on in WhatsApp",
            "Only your phone's general settings",
            "You need a separate app entirely",
          ],
          correctIndex: 0,
        },
        {
          question:
            "What should you do if you can't find the MFA setting in your banking or mobile-money app?",
          options: [
            "Assume it doesn't have the feature and give up",
            "Call the provider directly and ask",
            "Use the same PIN everywhere instead",
            "It's not important for financial apps",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Turning on MFA on WhatsApp, Instagram, Gmail, and mobile money",
      explanation: `Generic "enable 2FA" guidance undersells what's actually specified here — Annex A names these platforms explicitly. Concrete paths: WhatsApp (Settings > Account > Two-step verification), Instagram (Settings > Accounts Centre > Password and security > Two-factor authentication), Google/Gmail (myaccount.google.com > Security > 2-Step Verification), and banking/mobile-money apps (typically under Settings or Security within the app; contact the provider directly if the option isn't visible). This should be treated as a same-day task across every account, not an open-ended intention.`,
      example: `Despite months of general awareness that "2FA should be enabled," a business owner had never located the actual settings. Working through the specific menu paths for WhatsApp, Instagram, and Google took under twenty minutes in a single sitting.`,
      quiz: [
        {
          question:
            "Why does this lesson specify exact menu paths rather than general '2FA' advice?",
          options: [
            "Generic advice undersells what Annex A already specifies by naming these platforms explicitly",
            "Specific paths are unnecessary detail",
            "Only large businesses need this level of detail",
            "The platforms change too often for this to matter",
          ],
          correctIndex: 0,
        },
        {
          question:
            "What's the recommended action if MFA isn't visible in a banking or mobile-money app?",
          options: [
            "Skip it and move on",
            "Contact the provider directly",
            "Assume it's unnecessary for that platform",
            "Wait for the app to prompt you",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Turning on MFA on WhatsApp, Instagram, Gmail, and mobile money",
      explanation: `MFA activation should follow the specific platforms named in Annex A rather than generic guidance: WhatsApp (Settings > Account > Two-step verification), Instagram (Settings > Accounts Centre > Password and security > Two-factor authentication), Google Workspace/Gmail (Security > 2-Step Verification), and banking/mobile-money applications (provider-specific; direct contact recommended where the setting is not readily located). Implementation should be completed across all accounts within a single session.`,
      example: `MFA was activated across WhatsApp, Instagram, and Google accounts by following platform-specific menu paths within a single twenty-minute session, following prolonged non-implementation despite general awareness of the requirement.`,
      quiz: [
        {
          question: "This lesson's approach differs from generic '2FA' guidance by:",
          options: [
            "Specifying exact platform menu paths rather than a general instruction",
            "Recommending against MFA for small businesses",
            "Applying only to enterprise accounts",
            "There is no meaningful difference",
          ],
          correctIndex: 0,
        },
        {
          question: "Recommended implementation scope is:",
          options: [
            "One account per month",
            "All named accounts within a single session",
            "Only the primary business email",
            "Only accounts flagged by the platform itself",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D3-4: Building a full account inventory ───────────────────────────────────────────────
  {
    domainId: "D3",
    sortOrder: 4,
    sourceRef:
      "D3 descriptor, Level 3 (all tiers) — a documented inventory of all accounts, including social media",
    A: {
      title: "Building a full account inventory",
      explanation: `List every login your business uses — email, banking, M-Pesa/mobile money, Instagram, WhatsApp Business, any booking or POS system, cloud storage. People almost always forget the social media accounts because they don't feel like "real" accounts the way a bank login does — but losing your Instagram can hurt your business just as much as losing access to your email. Write down each account and roughly who's responsible for it. This list is also exactly what you'd need if you ever had to prove which accounts belong to your business, or hand things over if you were ever unreachable.`,
      example: `A business owner listing her accounts realised she'd never actually written down that her business Instagram was tied to a personal phone number she'd since changed — something she only discovered by doing the inventory, not by something going wrong first.`,
      quiz: [
        {
          question:
            "Which type of account do people most often forget to include in an account inventory?",
          options: [
            "Bank accounts",
            "Social media accounts like Instagram or WhatsApp Business",
            "Email accounts",
            "Nobody forgets any accounts",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does a full account inventory matter, beyond just having a list?",
          options: [
            "It has no practical use",
            "It's what you'd need to prove account ownership or hand things over if you're unreachable",
            "It's only useful for tax purposes",
            "It replaces the need for passwords",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Building a full account inventory",
      explanation: `A documented account inventory should include every credential the business relies on — email, banking, mobile money, social media (Instagram, WhatsApp Business), booking/POS systems, and cloud storage. Social media accounts are the most commonly omitted category, despite representing comparable business risk to financial accounts if lost. Each entry should note who's responsible for it. This documentation also directly supports account-recovery and continuity planning, rather than existing as a standalone exercise.`,
      example: `Compiling a full account inventory surfaced that the business Instagram was still linked to a personal phone number that had since been changed — a gap identified proactively through the inventory process rather than discovered during an actual recovery attempt.`,
      quiz: [
        {
          question: "What category of account is most commonly omitted from inventories?",
          options: [
            "Banking accounts",
            "Social media accounts",
            "Email accounts",
            "None are commonly omitted",
          ],
          correctIndex: 1,
        },
        {
          question: "How does the account inventory relate to continuity planning?",
          options: [
            "It's unrelated to continuity planning",
            "It directly supports account-recovery and continuity planning",
            "It replaces the need for a recovery plan entirely",
            "Only IT staff need this connection",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "Building a full account inventory",
      explanation: `A comprehensive account inventory encompasses financial, communication, and social media credentials, with responsibility assignment per entry. Social media accounts are the most frequently omitted category despite comparable business risk to financial accounts. This documentation is a direct input to account-recovery and business-continuity planning rather than a standalone artifact.`,
      example: `Inventory compilation identified an outdated recovery phone number linked to the business's social media account — surfaced proactively rather than during an actual incident.`,
      quiz: [
        {
          question: "A comprehensive account inventory should include:",
          options: [
            "Financial, communication, and social media credentials with assigned responsibility",
            "Financial credentials only",
            "Only accounts with existing MFA enabled",
            "Public-facing accounts only",
          ],
          correctIndex: 0,
        },
        {
          question: "This inventory functions as:",
          options: [
            "A standalone compliance artifact",
            "A direct input to account-recovery and continuity planning",
            "A marketing document",
            "A one-time exercise with no further use",
          ],
          correctIndex: 1,
        },
      ],
    },
  },

  // ── D3-5: Your plan for losing your Instagram or Facebook page ───────────────────────────
  {
    domainId: "D3",
    sortOrder: 5,
    sourceRef:
      "D3 descriptor, Level 4 (all tiers) — documented recovery plan for social/content account loss, business-continuity framing",
    A: {
      title: "Your plan for losing your Instagram or Facebook page",
      explanation: `This is about getting locked out of your own page — hacked, forgotten password with no recovery option set up, or a platform mistake — not about someone impersonating you (that's covered in a separate lesson). Your plan needs three things: recovery options actually set up in advance (a current phone number and email on the account, not an old one), knowing the platform's real account-recovery process before you need it, and proof you own the business (business registration, past posts, ad receipts) ready to submit if asked. Treat losing this page like losing a shop's keys, not like losing a photo — for many businesses, it's how customers find you at all.`,
      example: `A boutique owner made sure her Instagram's recovery email and phone number were current, saved a screenshot of Instagram's official account-recovery help page, and kept a folder with proof of business ownership — all before anything went wrong, so if it ever did, she wouldn't be starting from zero.`,
      quiz: [
        {
          question: "What's this lesson about, specifically?",
          options: [
            "Someone else cloning your business page",
            "Getting locked out of your own page and being able to recover it",
            "Deleting your business's social media accounts",
            "Changing your business name on Instagram",
          ],
          correctIndex: 1,
        },
        {
          question: "What should be part of your recovery plan before anything goes wrong?",
          options: [
            "Nothing — deal with it only if it happens",
            "Current recovery contact info, knowledge of the platform's recovery process, and proof of ownership ready",
            "Just remembering your original password",
            "Sharing your login with everyone you know, just in case",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Your plan for losing your Instagram or Facebook page",
      explanation: `This addresses losing access to a business's own social/content account — through compromise, lost credentials with no recovery path configured, or platform error — distinct from impersonation by a third party (covered separately). A documented recovery plan requires: current recovery contact details actually configured on the account, familiarity with the platform's official recovery process obtained in advance, and readily available proof of business ownership (registration documents, historical posts, ad-spend receipts). This should be framed as a business-continuity risk — for many businesses, the account is the primary customer-discovery channel — not merely a data-loss concern.`,
      example: `A business proactively confirmed current recovery contact details on its Instagram account, documented the platform's official recovery procedure, and assembled ownership-proof documentation in advance of any actual incident.`,
      quiz: [
        {
          question: "How does this lesson differ from the impersonation lesson?",
          options: [
            "It doesn't differ — they're the same scenario",
            "This covers losing your own account access; impersonation covers a third party cloning your page",
            "This only applies to Instagram, not other platforms",
            "This is only relevant to large businesses",
          ],
          correctIndex: 1,
        },
        {
          question: "What should a documented recovery plan include?",
          options: [
            "Current recovery contacts, known recovery process, and ready proof of ownership",
            "Nothing beyond the original password",
            "A backup social media account with a different name",
            "Sharing credentials broadly for redundancy",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: "Your plan for losing your Instagram or Facebook page",
      explanation: `Account-recovery planning for owned social/content accounts (distinct from third-party impersonation) requires: verified current recovery contact configuration, documented familiarity with platform-specific recovery procedures, and pre-assembled ownership documentation. This risk should be framed under business continuity — the account often functions as a primary customer-acquisition channel — rather than solely as data loss.`,
      example: `Recovery contact details were verified as current, the platform's recovery procedure was documented in advance, and ownership documentation was pre-assembled ahead of any incident.`,
      quiz: [
        {
          question: "This lesson addresses recovery planning distinct from:",
          options: [
            "Third-party impersonation of the business account",
            "Backup restoration procedures",
            "Data protection impact assessments",
            "Provider security verification",
          ],
          correctIndex: 0,
        },
        {
          question: "The appropriate framing for this risk is:",
          options: [
            "Business-continuity risk, not merely data loss",
            "A purely technical IT issue",
            "An irrelevant edge case",
            "A marketing concern only",
          ],
          correctIndex: 0,
        },
      ],
    },
  },
);

TOPICS.push(
  // ── D5-4: A basic incident-response checklist ─────────────────────────────────────────────
  {
    domainId: "D5",
    sortOrder: 4,
    sourceRef: "D5 descriptor, Level 2 (all tiers) — a basic incident-response checklist",
    A: {
      title: "A basic incident-response checklist",
      explanation: `You don't need a formal document to have a checklist — you need five things written down somewhere you can actually find in a panic: 1) Who do you tell first (name and phone number)? 2) What do you check first (which accounts, which systems)? 3) What do you NOT do (don't panic-delete anything, don't pay a ransom demand without advice)? 4) Does this involve customer data — if yes, remember the 72-hour ODPC clock. 5) Who else needs to know (staff, customers, your IT provider)? Stick it somewhere physical too, not just in a file on the computer that might be the thing that's compromised.`,
      example: `A small business printed their five-point checklist and taped it inside a cupboard near the till — when a staff member noticed a strange login alert, she didn't have to think about what to do next; she just followed the list, starting with who to call.`,
      quiz: [
        {
          question:
            "Why is it useful to keep a printed copy of your incident checklist, not just a digital one?",
          options: [
            "Printed copies look more official",
            "If your computer or accounts are what's compromised, a digital-only checklist may be unreachable",
            "It's a legal requirement",
            "There's no real benefit either way",
          ],
          correctIndex: 1,
        },
        {
          question: "What's one thing a basic incident checklist should tell you NOT to do?",
          options: [
            "Not to tell anyone about it",
            "Not to panic-delete things that might be evidence, and not to pay a ransom without advice",
            "Not to change any passwords",
            "Not to check which systems were affected",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "A basic incident-response checklist",
      explanation: `A basic incident-response checklist doesn't require formal documentation software — it requires five accessible points: the designated first point of contact (name and number), the initial systems/accounts to check, explicit "don't do this" guidance (no evidence-destroying actions, no unadvised ransom payment), a trigger reminder for the 72-hour ODPC clock if customer data is involved, and a notification list (staff, customers, IT provider). Keeping a physical copy alongside the digital one matters — if compromised systems are the checklist's storage location, it becomes inaccessible exactly when needed.`,
      example: `A business kept a printed five-point checklist accessible near the point of sale. When a staff member noticed a suspicious login alert, the response followed the checklist directly rather than requiring improvisation under pressure.`,
      quiz: [
        {
          question: "What does a basic incident-response checklist need to specify?",
          options: [
            "First contact, systems to check, prohibited actions, the 72-hour trigger, and who to notify",
            "Only a general statement that incidents should be reported",
            "A full technical forensic procedure",
            "Nothing specific is required",
          ],
          correctIndex: 0,
        },
        {
          question: "Why maintain a physical, not just digital, copy of the checklist?",
          options: [
            "Physical copies are more legally binding",
            "A digital-only checklist may be unreachable if the compromised system is where it's stored",
            "There's no meaningful difference",
            "Printed documents are required by regulation",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "A basic incident-response checklist",
      explanation: `A minimally viable incident-response checklist specifies: designated first point of contact, initial systems/accounts for review, explicit prohibited actions (evidence destruction, unadvised ransom payment), the 72-hour ODPC notification trigger condition, and a stakeholder notification list. Redundant physical accessibility (independent of digital systems) is a practical requirement, since compromised digital infrastructure may itself store the only checklist copy.`,
      example: `A physically accessible five-point checklist enabled a direct, structured response to a suspicious login alert without requiring improvised decision-making.`,
      quiz: [
        {
          question: "A minimally viable incident checklist specifies:",
          options: [
            "Contact point, initial checks, prohibited actions, notification trigger, and stakeholder list",
            "A general incident-awareness statement only",
            "A complete forensic investigation protocol",
            "No specific content is required",
          ],
          correctIndex: 0,
        },
        {
          question: "Physical redundancy for the checklist matters because:",
          options: [
            "Digital storage may itself be part of the compromised system",
            "Physical documents are inherently more secure",
            "It's a purely aesthetic preference",
            "Regulation mandates physical documentation",
          ],
          correctIndex: 0,
        },
      ],
    },
  },

  // ── D5-5: What a "root-cause review" actually looks like ──────────────────────────────────
  {
    domainId: "D5",
    sortOrder: 5,
    sourceRef:
      "D5 descriptor, Level 4 (all tiers) — root-cause review carried out after an incident",
    A: {
      title: "What a root-cause review actually looks like",
      explanation: `A "root-cause review" sounds technical, but for a small business it's really just one honest conversation after an incident is over: what actually let this happen (a weak password? no MFA? someone clicked a link?), was it a one-off or something that could easily happen again, and what's one concrete change that would stop it next time. Write down the answer to those three questions — that's the review. The point isn't blame; it's making sure you actually fix the door that was left open, instead of just cleaning up the mess and moving on.`,
      example: `After a fake M-Pesa prompt almost cost a shop money, the owner didn't just move on — she asked why it almost worked (staff hadn't been told about STK-push scams specifically) and made one change: covering it directly in the next team conversation. That's a root-cause review, done in fifteen minutes.`,
      quiz: [
        {
          question:
            "What are the three questions a small-business root-cause review should answer?",
          options: [
            "How much did it cost, who's to blame, and when did it happen",
            "What let it happen, could it happen again, and what one change would prevent it",
            "What software should be purchased",
            "How to keep it a secret from staff",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the main point of a root-cause review?",
          options: [
            "Assigning blame to a specific staff member",
            "Making sure the actual underlying issue gets fixed, not just the immediate mess cleaned up",
            "Filling out a compliance form for its own sake",
            "Avoiding ever discussing the incident again",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "What a root-cause review actually looks like",
      explanation: `A root-cause review, in practical terms for a small business, is a structured post-incident conversation addressing three questions: what specific condition allowed the incident to occur, whether that condition is isolated or likely to recur, and what concrete change would prevent recurrence. Documenting the answers constitutes the review — no formal methodology or external facilitation is required at this scale. The objective is remediation of the underlying cause, not just incident cleanup, and explicitly not attribution of blame.`,
      example: `Following a near-miss M-Pesa STK-push scam, the business identified the underlying gap (staff hadn't been briefed on that specific fraud pattern) and implemented one concrete change — covering it in the next team discussion — rather than treating the incident as resolved once the immediate risk passed.`,
      quiz: [
        {
          question: "What three questions structure a practical root-cause review?",
          options: [
            "What allowed it, could it recur, and what change prevents recurrence",
            "Cost, blame, and timeline",
            "Legal liability, insurance claims, and PR response",
            "None — it's an informal, unstructured process",
          ],
          correctIndex: 0,
        },
        {
          question: "What is explicitly NOT the purpose of a root-cause review?",
          options: [
            "Fixing the underlying issue",
            "Assigning individual blame",
            "Documenting what happened",
            "Preventing recurrence",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "What a root-cause review actually looks like",
      explanation: `A root-cause review, appropriately scoped for a small business, addresses: the specific enabling condition, whether that condition is isolated or systemic/recurring, and a concrete corrective action. Documentation of these three elements constitutes an adequate review; formal methodology is not required at this scale. The objective is remediation of the underlying cause rather than blame attribution or incident cleanup alone.`,
      example: `A structured review following an averted fraud attempt identified the enabling condition (a specific training gap) and implemented a targeted corrective action, rather than concluding the process once immediate risk had passed.`,
      quiz: [
        {
          question: "An adequately scoped root-cause review documents:",
          options: [
            "Enabling condition, recurrence likelihood, and corrective action",
            "Cost and timeline only",
            "Blame attribution",
            "Nothing beyond a summary of what happened",
          ],
          correctIndex: 0,
        },
        {
          question: "The objective of a root-cause review is:",
          options: [
            "Remediation of the underlying cause",
            "Formal blame attribution",
            "Satisfying a documentation quota",
            "Concluding the incident response process",
          ],
          correctIndex: 0,
        },
      ],
    },
  },
);

TOPICS.push(
  // ── D6-3: Getting from "backing up when I remember" to a real system ─────────────────────
  {
    domainId: "D6",
    sortOrder: 3,
    sourceRef:
      "D6 descriptor, Level 1-2 (all tiers) — moving from occasional manual backups to a regular, real system",
    A: {
      title: `Getting from "backing up when I remember" to a real system`,
      explanation: `If your backup routine is "I copy things over when I think of it," you're one bad week away from losing everything. The fix isn't complicated: pick one thing that backs up automatically on a schedule (most cloud storage and many apps can do this without you touching anything), and pick a day each month to actually glance at it and confirm something recent is there. That's it — "automatic and scheduled" beats "manual and occasional" every time, because it doesn't depend on you remembering.`,
      example: `A business that used to back up "whenever" switched to a cloud storage app that automatically saved a copy of their files every night. The owner set a single monthly reminder to check it was working — turning an unreliable habit into something that happened whether she thought about it or not.`,
      quiz: [
        {
          question: "What's the main problem with backing up only 'when you remember'?",
          options: [
            "It uses too much storage space",
            "It depends entirely on memory, so it's unreliable and easy to skip for long stretches",
            "It's actually just as reliable as automatic backups",
            "It's too expensive compared to automatic options",
          ],
          correctIndex: 1,
        },
        {
          question: "What's a simple first step toward a real backup system?",
          options: [
            "Hiring a full-time IT department",
            "Setting up one thing to back up automatically on a schedule, and checking it monthly",
            "Backing up more often but still manually",
            "Just backing up once and never checking again",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: `Getting from "backing up when I remember" to a real system`,
      explanation: `Manual, memory-dependent backups are functionally unreliable — the goal is converting to an automated, scheduled process that doesn't depend on someone remembering to act. Practically: select one automated backup mechanism (many cloud storage services and applications support this natively), and establish a recurring monthly check to confirm the backup actually contains recent data, not just that the mechanism exists. Automated-and-scheduled is a categorically more reliable standard than manual-and-occasional.`,
      example: `A business transitioned from ad hoc manual backups to an automated nightly cloud backup, paired with a monthly verification check — converting an unreliable habit into a process independent of anyone remembering to act.`,
      quiz: [
        {
          question: "Why is a manual, 'when I remember' backup approach considered unreliable?",
          options: [
            "It's dependent on memory rather than a scheduled process",
            "It's technically identical to automated backups",
            "It's only a cost issue, not a reliability issue",
            "It isn't actually unreliable",
          ],
          correctIndex: 0,
        },
        {
          question: "What does a basic automated backup system require?",
          options: [
            "An automated backup mechanism plus a recurring check that it's actually capturing recent data",
            "Nothing beyond setting it up once",
            "Manual backups performed more frequently",
            "A dedicated in-house server",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: `Getting from "backing up when I remember" to a real system`,
      explanation: `Ad hoc, memory-dependent backup practices are inherently unreliable. The transition target is an automated, scheduled backup mechanism paired with a recurring verification step confirming currency of the backed-up data, not merely the mechanism's existence. Automated-scheduled backup is categorically more reliable than manual-occasional backup.`,
      example: `Transition to an automated nightly backup with a monthly currency-verification check replaced a previously ad hoc, unreliable manual process.`,
      quiz: [
        {
          question: "Ad hoc backup practices are considered inadequate because they:",
          options: [
            "Depend on memory rather than a scheduled, automated process",
            "Are functionally equivalent to automated backups",
            "Only affect large enterprises",
            "Are purely a cost consideration",
          ],
          correctIndex: 0,
        },
        {
          question: "An adequate backup verification step confirms:",
          options: [
            "That the backup mechanism exists and contains recent data",
            "Only that the mechanism was installed",
            "Nothing beyond initial setup",
            "The total storage capacity used",
          ],
          correctIndex: 0,
        },
      ],
    },
  },

  // ── D6-4: Try your backup — a guided restore drill ────────────────────────────────────────
  {
    domainId: "D6",
    sortOrder: 4,
    sourceRef:
      "D6 descriptor, Level 2-4 (all tiers) — testing recovery, not just having backups (Annex A is explicit many SMEs back up but never test restoring)",
    A: {
      title: "Try your backup — a guided restore drill",
      explanation: `Having a backup and knowing it actually works are two different things — plenty of businesses back up regularly and only discover the backup was broken the day they actually need it. Here's a simple drill: pick one file or folder you'd genuinely hate to lose, and — without touching the original — try to fully restore just that one thing from your backup, right now. Time how long it takes. If it works, great, you've confirmed it for real. If it doesn't, you just found out on a normal Tuesday instead of during an actual emergency.`,
      example: `A business that had "always backed up" tried restoring a single folder as a test and discovered the backup app had silently stopped syncing three months earlier. Finding that out during a calm afternoon test, instead of during an actual data loss, meant it cost them twenty minutes instead of their entire customer records.`,
      quiz: [
        {
          question: "Why isn't just having a backup enough on its own?",
          options: [
            "A backup that's never been tested might not actually work when you need it",
            "Backups are always guaranteed to work perfectly",
            "Testing a backup takes too long to be worthwhile",
            "It's fine as long as the backup app is popular",
          ],
          correctIndex: 0,
        },
        {
          question: "What does a simple backup-restore drill involve?",
          options: [
            "Deleting your original files to force a real test",
            "Restoring one file or folder from your backup without touching the original, to confirm it actually works",
            "Reading the backup app's manual",
            "Waiting for the app to notify you if something's wrong",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Try your backup — a guided restore drill",
      explanation: `Backup existence and backup reliability are distinct properties — a business can back up consistently while the backup itself is silently non-functional, a gap that surfaces only when a real recovery is attempted. A guided drill addresses this directly: select a single non-critical file or folder, and perform an actual restoration from the backup (leaving the original untouched), timing the process. A successful restore confirms functional reliability; a failed one surfaces the gap under controlled conditions rather than during an actual incident.`,
      example: `A routine test restore of a single folder revealed that automated backup syncing had silently failed three months earlier — a discovery made during a scheduled test rather than during an actual data-loss event, at negligible cost instead of losing three months of records.`,
      quiz: [
        {
          question: "What gap does a restore drill specifically address?",
          options: [
            "The difference between having a backup and confirming it's actually functional",
            "The cost of backup storage",
            "How often backups should run",
            "Which cloud provider to use",
          ],
          correctIndex: 0,
        },
        {
          question: "What does a basic restore drill involve?",
          options: [
            "Restoring a selected file/folder from backup without altering the original, and timing it",
            "Deleting the backup to test recreation",
            "Only reviewing backup logs",
            "Purchasing additional backup storage",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: "Try your backup — a guided restore drill",
      explanation: `Backup existence does not entail backup functional reliability; a non-functional backup typically surfaces only during an actual recovery attempt. A restore drill mitigates this: select a non-critical file/folder, perform an actual restoration from backup without modifying the original, and record elapsed time. Successful completion confirms functional reliability under controlled conditions; failure surfaces the gap without incident-time consequences.`,
      example: `A scheduled restore drill on a single folder revealed a silent, three-month-old backup-sync failure — identified under controlled test conditions rather than during an actual data-loss incident.`,
      quiz: [
        {
          question: "A restore drill is designed to surface:",
          options: [
            "Gaps between backup existence and backup functional reliability",
            "Storage cost inefficiencies",
            "Optimal backup scheduling frequency",
            "Which files are least important",
          ],
          correctIndex: 0,
        },
        {
          question: "A restore drill's defining characteristic is:",
          options: [
            "Actual restoration performed under controlled, non-incident conditions",
            "A documentation-only review of backup configuration",
            "Deletion of the original data to force validation",
            "An automated, unsupervised process",
          ],
          correctIndex: 0,
        },
      ],
    },
  },
);

// ── Phase 5: emerging-pattern lessons not tied to a scored domain ──────────────────────────────
// Talent turnover and the solo-operator single-point-of-failure risk are emerging patterns from
// the thematic analysis with standalone training value, but neither maps cleanly onto one of the
// six scored domains — tagging either D3 or D6 alone would misrepresent what they're actually
// about. Tagged against a "GEN" pseudo-domain instead of leaving domainId nullable: Lesson.domainId
// is a required FK to Domain, used throughout getLessons/Training Hub grouping/remediation
// cross-linking, and a nullable-FK migration would touch all of that for two lessons. A real
// "GEN" Domain row (seeded separately in prisma/seed.ts, NOT added to DOMAIN_IDS in domains.ts,
// so it never participates in assessment scoring) satisfies the FK with no schema/query changes
// elsewhere. The Training Hub renders a "General" section for it, outside the six-domain grouping.
//
// The third emerging pattern, time constraint, isn't a lesson topic — it's a format rule: every
// lesson in this file stays short, which is already the established authoring convention here,
// not a new one introduced for these two.
TOPICS.push(
  // ── GEN-1: Offboarding checklist — when someone leaves ────────────────────────────────────
  {
    domainId: "GEN",
    sortOrder: 1,
    audience: "owner",
    sourceRef:
      "Section 9 emerging pattern (talent turnover) — not tied to a scored Annex A domain; standalone training content",
    A: {
      title: "Offboarding checklist: when someone leaves",
      explanation: `When a staff member leaves — on good terms or not — there's a short window where access they no longer need can still cause real damage if it's forgotten about. The checklist is short: remove them from any shared accounts (email, social media, booking system), change any passwords they knew that other people still use, and revoke access to anything that was tied specifically to them (a login, an API key, a shared drive). Do this on their last day, not "sometime soon" — the gap between "they left" and "their access was removed" is exactly the window this is meant to close.`,
      example: `When a part-time social media assistant left, the owner immediately removed her from the shared Instagram login, changed the WiFi password she'd used, and double-checked no other shared accounts still listed her. It took ten minutes and closed a gap that could otherwise have sat open indefinitely.`,
      quiz: [
        {
          question: "When should offboarding steps (removing access) actually happen?",
          options: [
            "Whenever it's convenient, weeks later",
            "On the person's last day, not sometime after",
            "Only if the person left on bad terms",
            "Offboarding isn't really necessary for small teams",
          ],
          correctIndex: 1,
        },
        {
          question: "What does a basic offboarding checklist cover?",
          options: [
            "Only returning any physical equipment",
            "Removing shared-account access, changing shared passwords they knew, and revoking anything tied to them",
            "Just saying goodbye",
            "Nothing — access naturally expires on its own",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "Offboarding checklist: when someone leaves",
      explanation: `Departing staff represent a defined access-risk window if offboarding is delayed or informal. A basic offboarding checklist: remove the individual from shared accounts (email, social media, booking/POS systems), rotate any shared passwords they had knowledge of, and revoke access tied specifically to them (individual logins, API keys, shared drives). This should be completed on the departure date itself — the interval between departure and access revocation is precisely the exposure this checklist closes.`,
      example: `Upon a part-time social media assistant's departure, the business immediately removed her from the shared Instagram account, rotated the shared WiFi password, and confirmed no other shared credentials remained associated with her — a ten-minute process closing an otherwise open-ended exposure window.`,
      quiz: [
        {
          question: "What defines the risk window this checklist addresses?",
          options: [
            "The interval between departure and access revocation",
            "The person's entire tenure at the business",
            "Only the first week after hiring",
            "There is no meaningful risk window",
          ],
          correctIndex: 0,
        },
        {
          question: "What should a basic offboarding checklist cover?",
          options: [
            "Shared-account removal, shared-credential rotation, and individually-tied access revocation",
            "Only formal exit-interview documentation",
            "Physical equipment return only",
            "Nothing specific to security",
          ],
          correctIndex: 0,
        },
      ],
    },
    C: {
      title: "Offboarding checklist: when someone leaves",
      explanation: `Departing personnel constitute a defined access-risk window absent timely, structured offboarding. Minimum offboarding actions: shared-account access removal, rotation of shared credentials known to the departing individual, and revocation of individually-assigned access (logins, API keys, shared storage). Execution should coincide with the departure date; the departure-to-revocation interval constitutes the exposure window.`,
      example: `Shared-account access removal and credential rotation were completed on the departure date of a part-time staff member, eliminating the exposure window rather than allowing it to persist.`,
      quiz: [
        {
          question: "The relevant exposure window in offboarding is defined by:",
          options: [
            "The interval between departure and access revocation",
            "The individual's total tenure",
            "Only the onboarding period",
            "There is no defined exposure window",
          ],
          correctIndex: 0,
        },
        {
          question: "Minimum offboarding actions include:",
          options: [
            "Shared-account removal, credential rotation, and individual access revocation",
            "Exit documentation only",
            "Equipment return only",
            "No specific security action is required",
          ],
          correctIndex: 0,
        },
      ],
    },
  },

  // ── GEN-2: What happens if you're unreachable ─────────────────────────────────────────────
  {
    domainId: "GEN",
    sortOrder: 2,
    audience: "owner",
    sourceRef:
      "Section 9 emerging pattern (solo-operator single point of failure) — not tied to a scored Annex A domain; standalone training content",
    A: {
      title: "What happens if you're unreachable",
      explanation: `If you're the only person who knows the passwords, the backup location, and who to call if something goes wrong — what happens if you're sick, unreachable, or something happens to you? This isn't about handing over full control to someone else. It's about making sure one other person (a trusted family member, a co-owner, even a lawyer) has access to a sealed, secured note with the essentials: where key passwords are kept, what accounts exist, and who to contact for what. Write it, secure it, and tell one person it exists — that's the whole exercise.`,
      example: `A solo shop owner wrote a single page listing where her password manager was, her IT provider's contact, and instructions for her sister to follow if she couldn't be reached for more than a few days. She sealed it in an envelope at home. It cost an afternoon and meant the business wouldn't simply stop functioning if something happened to her.`,
      quiz: [
        {
          question: "What's the core risk this lesson addresses?",
          options: [
            "The business having too many people with access",
            "One person being the only one who knows critical business/account information",
            "Spending too much money on backups",
            "Having too many social media accounts",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the recommended fix, without giving up full control?",
          options: [
            "Share every password with everyone in the business",
            "A secured note with the essentials, accessible to one trusted person, kept for emergencies only",
            "Do nothing — this risk can't really be reduced",
            "Hire a full-time second owner",
          ],
          correctIndex: 1,
        },
      ],
    },
    B: {
      title: "What happens if you're unreachable",
      explanation: `Sole-operator businesses concentrate critical operational knowledge — credentials, backup locations, key contacts — in a single individual, creating a continuity risk if that person becomes unreachable or incapacitated. The mitigation isn't distributing full operational control; it's ensuring one trusted party (family member, co-owner, or legal representative) has access to a secured record of the essentials: password-manager location, account inventory, and contact points. Documenting it, securing it, and informing one person of its existence constitutes an adequate mitigation at this scale.`,
      example: `A sole proprietor documented her password manager's location, her IT provider's contact information, and handling instructions on a single page, sealed it, and informed her sister of its existence and location — a modest investment addressing a previously unmitigated continuity risk.`,
      quiz: [
        {
          question: "What continuity risk does sole-operator concentration of knowledge create?",
          options: [
            "None — concentration of knowledge is not a risk",
            "The business could be unable to function if the sole knowledge-holder becomes unreachable",
            "It only affects tax filing",
            "It's exclusively an IT department concern",
          ],
          correctIndex: 1,
        },
        {
          question: "What does an adequate mitigation involve?",
          options: [
            "Distributing full access to all staff immediately",
            "A secured record of essentials accessible to one trusted party, documented and communicated",
            "No action — this risk cannot be meaningfully reduced",
            "Hiring additional full-time staff",
          ],
          correctIndex: 1,
        },
      ],
    },
    C: {
      title: "What happens if you're unreachable",
      explanation: `Sole-operator concentration of operational knowledge (credentials, backup locations, key contacts) constitutes a business-continuity risk in the event of unavailability or incapacitation. Adequate mitigation entails a documented, secured record of essential information accessible to one designated trusted party — not distributed operational control. Documentation, securing, and single-party disclosure of existence constitute sufficient mitigation at this scale.`,
      example: `A documented, secured record of essential account and contact information, disclosed to one designated trusted party, addressed a previously unmitigated sole-operator continuity risk.`,
      quiz: [
        {
          question: "Sole-operator knowledge concentration creates risk specifically around:",
          options: [
            "Business continuity in the event of unavailability",
            "Tax compliance only",
            "Marketing consistency",
            "No material risk exists",
          ],
          correctIndex: 0,
        },
        {
          question: "Adequate mitigation for this risk involves:",
          options: [
            "Full distributed access to all personnel",
            "A documented, secured record accessible to one designated trusted party",
            "No action, as the risk is unavoidable",
            "Outsourcing all operations",
          ],
          correctIndex: 1,
        },
      ],
    },
  },
);

export const LESSONS: LessonRow[] = TOPICS.flatMap(expand);
