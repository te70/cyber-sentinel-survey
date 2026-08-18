// Training Hub micro-lessons — tier-registered like Annex A (full A/B/C content per topic, not
// a single plain-language version), each grounded in the model's own thematic evidence base
// (M-Pesa STK-push fraud, social-media account takeover) rather than generic filler. All rows
// are draft, pending researcher review before pilot use. D4 (the gate domain) has the most
// topics, per the brief.
//
// 9 topics x 3 tiers = 27 lessons, each with 2 quiz questions.

import type { DomainId } from "../../src/lib/alita/domains";

export interface QuizQuestionData {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LessonRow {
  domainId: DomainId;
  tier: "A" | "B" | "C";
  title: string;
  explanation: string;
  example: string;
  sortOrder: number;
  status: "draft";
  quiz: QuizQuestionData[];
}

interface LessonContent {
  title: string;
  explanation: string;
  example: string;
  quiz: QuizQuestionData[];
}

interface LessonTopic {
  domainId: DomainId;
  sortOrder: number;
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
    ...topic[tier],
  }));
}

const TOPICS: LessonTopic[] = [
  // ── D4-1: Spotting fake M-Pesa STK-push prompts ──────────────────────────────────────────
  {
    domainId: "D4",
    sortOrder: 1,
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

  // ── D6: The 3-2-1 backup rule ─────────────────────────────────────────────────────────────
  {
    domainId: "D6",
    sortOrder: 1,
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

export const LESSONS: LessonRow[] = TOPICS.flatMap(expand);
