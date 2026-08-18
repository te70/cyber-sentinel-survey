// Remediation guidance — "what's wrong going from Level N to N+1" and "how to improve" — a
// second content layer distinct from Annex A descriptors (which describe what each level looks
// like). Every row here is a faithful elaboration of the literal delta between the two Annex A
// descriptor rows for that domain/tier/adjacent-level pair (see descriptors.data.ts), so it's
// traceable back to specific reviewed content rather than invented from scratch. All rows are
// draft, pending researcher review before pilot use, same treatment as Annex A itself.
//
// 6 domains x 5 adjacent transitions (0-1, 1-2, 2-3, 3-4, 4-5) x 3 tiers = 90 rows.
// D4 (the gate domain, the thesis's central claim) was written first and with the most care.

import type { DomainId } from "../../src/lib/alita/domains";

export type RemediationTier = "A" | "B" | "C";

export interface RemediationRow {
  domainId: DomainId;
  tier: RemediationTier;
  fromLevel: number;
  toLevel: number;
  whatsWrong: string;
  howToImprove: string;
  status: "draft";
}

interface TransitionContent {
  whatsWrong: string;
  howToImprove: string[];
}

interface TransitionRow {
  from: number;
  to: number;
  A: TransitionContent;
  B: TransitionContent;
  C: TransitionContent;
}

function steps(list: string[]): string {
  return list.map((s, i) => `${i + 1}. ${s}`).join("\n");
}

function expand(domainId: DomainId, rows: TransitionRow[]): RemediationRow[] {
  return rows.flatMap((row) => [
    {
      domainId,
      tier: "A" as const,
      fromLevel: row.from,
      toLevel: row.to,
      whatsWrong: row.A.whatsWrong,
      howToImprove: steps(row.A.howToImprove),
      status: "draft" as const,
    },
    {
      domainId,
      tier: "B" as const,
      fromLevel: row.from,
      toLevel: row.to,
      whatsWrong: row.B.whatsWrong,
      howToImprove: steps(row.B.howToImprove),
      status: "draft" as const,
    },
    {
      domainId,
      tier: "C" as const,
      fromLevel: row.from,
      toLevel: row.to,
      whatsWrong: row.C.whatsWrong,
      howToImprove: steps(row.C.howToImprove),
      status: "draft" as const,
    },
  ]);
}

// ─── D4: Awareness & Training (written first, most care — the gate domain) ─────────────────

const D4: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `Right now nobody has actually talked to your staff about online scams at all — if a fake M-Pesa message or suspicious link showed up, nobody would know it's something to be careful about, because it's never been mentioned.`,
      howToImprove: [
        `Pick one real example — a fake M-Pesa message, a suspicious WhatsApp link — and mention it to your staff this week, just in conversation.`,
        `Tell them the one rule that matters most: never enter a PIN or confirm a payment you didn't start yourself.`,
        `That's it for this step — you don't need a formal session yet, just get the topic out in the open.`,
      ],
    },
    B: {
      whatsWrong: `There's no awareness programme at all right now — social engineering (tricks used to manipulate people, like fake M-Pesa prompts) and phishing (fraudulent messages trying to steal information) aren't being managed or even talked about, so staff have no baseline to work from.`,
      howToImprove: [
        `Have an informal conversation with staff about one concrete risk — e.g., unexpected M-Pesa STK-push prompts (payment requests you didn't start) — and the rule: decline anything you didn't initiate.`,
        `Note that this doesn't need to be formal yet — just get the topic acknowledged so "we've never discussed this" stops being true.`,
        `Keep track of who you've talked to, so you know who still needs the conversation.`,
      ],
    },
    C: {
      whatsWrong: `No formal security awareness programme exists; social-engineering and phishing risk is currently unmanaged and unmeasured, with no organisational engagement with the topic at all.`,
      howToImprove: [
        `Initiate informal risk discussion with staff, establishing baseline awareness of at least one concrete vector — e.g., unsolicited M-Pesa STK-push prompts.`,
        `Document that the discussion occurred, even informally, as a starting reference point.`,
        `Treat this as step zero: the goal is organisational engagement with the topic existing at all.`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `Staff have heard you mention scams casually, but there's still no real way for them to tell you when something looks wrong, or to spot the early warning signs themselves — awareness is just luck right now, not a habit.`,
      howToImprove: [
        `Tell staff explicitly: if a message, login, or request feels even slightly off, come tell you — there's no such thing as a silly question here.`,
        `Point out 2-3 warning signs to watch for: urgent requests for money or codes, messages from numbers that look almost-but-not-quite right, and pressure to act immediately.`,
        `Make it easy to report — a WhatsApp group, or just "come find me" — so noticing something doesn't dead-end.`,
      ],
    },
    B: {
      whatsWrong: `Staff have picked up some baseline awareness informally — for example knowing to decline unexpected STK-push prompts — but there's no structured way for them to escalate (report upward) something they notice, so early warning signs can go nowhere.`,
      howToImprove: [
        `Define a simple escalation path: who does staff tell, and how, when something looks suspicious?`,
        `Make sure that path is known to everyone, not just assumed.`,
        `Start noting what gets reported, even informally, so patterns become visible over time.`,
      ],
    },
    C: {
      whatsWrong: `Baseline awareness exists informally, but there's no structured reporting pathway or escalation process — staff risk-recognition is improving ad hoc, with no mechanism to convert that into actionable signal for the business.`,
      howToImprove: [
        `Define and communicate a formal escalation process: reporting channel, owner, and expected response.`,
        `Ensure the pathway is documented, not assumed or tribal knowledge.`,
        `Begin logging reported incidents to establish a baseline reporting rate.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `Your staff are starting to notice suspicious things, which is real progress — but without an actual sit-down session, what they know is patchy and depends on who happened to hear what. There's no shared baseline everyone can be counted on to know.`,
      howToImprove: [
        `Set aside 30 minutes — once, with everyone in the room (or on a call) — to go through the basics together: fake M-Pesa messages, protecting your Instagram/WhatsApp login, and who to tell if something looks wrong.`,
        `Use real examples from your own business or industry if you have any — it sticks better than generic warnings.`,
        `Put a date in your calendar to do this again next year, so it doesn't quietly stop happening.`,
      ],
    },
    B: {
      whatsWrong: `Staff are getting better at noticing suspicious activity informally, but without a structured annual session, what people know varies by who happened to pick it up — there's no shared, logged baseline covering social-engineering tactics, M-Pesa STK-push fraud, and account-recovery steps.`,
      howToImprove: [
        `Run a structured annual training session covering: social-engineering tactics (manipulation used to trick staff), M-Pesa STK-push fraud specifically, and account-recovery steps.`,
        `Log attendance so you have a record of who's actually been through it.`,
        `Review and refresh the content each year rather than reusing the same session indefinitely.`,
      ],
    },
    C: {
      whatsWrong: `Staff risk-recognition is improving informally, but without a delivered, logged annual awareness session, coverage is inconsistent and unauditable — there's no record of who has been trained on what.`,
      howToImprove: [
        `Deliver a formal annual awareness session covering social-engineering vectors including M-Pesa STK-push fraud and account-recovery procedures.`,
        `Log attendance for audit purposes.`,
        `Review and update session content on a yearly cadence rather than reusing static material.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `You've done the once-a-year session, which is good — but a single yearly reminder fades fast, and you have no real sense of whether it actually changed how people react when something suspicious shows up.`,
      howToImprove: [
        `Instead of one big yearly session, break it into shorter check-ins every few months — five minutes at a team meeting is enough.`,
        `Every so often, send a fake-but-harmless suspicious message yourself (or ask a trusted friend to) and see who notices and reports it.`,
        `When someone gets it wrong, treat it as useful information, not a mistake to be embarrassed about — that's what keeps people reporting honestly.`,
      ],
    },
    B: {
      whatsWrong: `The annual session is a solid foundation, but once a year isn't enough to keep skills sharp, and you have no way of knowing whether the training actually changes behaviour when a real attempt happens — that requires testing, not just teaching.`,
      howToImprove: [
        `Move from annual to quarterly training cadence.`,
        `Introduce simulated phishing (fake fraud messages used to practise spotting real ones) to test whether staff actually apply what they've learned.`,
        `Track reporting rates over time, and make clear that reporting a mistake carries no blame — that's what keeps the data honest.`,
      ],
    },
    C: {
      whatsWrong: `Annual delivery establishes a baseline, but an annual cadence is insufficient to maintain readiness against evolving social-engineering tactics, and without simulated exercises there's no empirical measure of whether training translates into behaviour change.`,
      howToImprove: [
        `Increase training cadence to quarterly.`,
        `Introduce simulated phishing/fraud exercises to generate measurable behavioural data.`,
        `Track incident-reporting rates, and remove blame from the reporting process to preserve data integrity.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `Training happens regularly and people are engaged, which is strong — the last piece missing is making sure this becomes just "how things are done" rather than something that depends on you remembering to run it, especially as new people join.`,
      howToImprove: [
        `Add a short security chat to how you onboard every new hire from day one, not as an afterthought weeks in.`,
        `Keep the "no blame, just tell me" culture explicit and visible — say it out loud regularly, don't assume people remember.`,
        `Let this run itself: once it's part of onboarding and casual team habit, it survives you being busy or distracted.`,
      ],
    },
    B: {
      whatsWrong: `Quarterly training and simulated exercises are strong practice — what's missing is making awareness a structural part of the business rather than a recurring event you have to keep scheduling, especially for people who join after the last session.`,
      howToImprove: [
        `Build a short awareness briefing into onboarding for every new hire, from day one.`,
        `Keep tracking both how often incidents are reported and how quickly — use that data to refine what training covers next.`,
        `Treat this as permanent infrastructure, not a campaign with an end date, regardless of how the business grows.`,
      ],
    },
    C: {
      whatsWrong: `Quarterly training and simulated exercises are in place, but awareness remains a recurring programme rather than an embedded organisational property — it isn't yet integrated into onboarding or continuously refined using the data already being collected.`,
      howToImprove: [
        `Embed awareness training into new-hire onboarding as a standing requirement.`,
        `Use tracked incident-reporting rates and time-to-report metrics to continuously refine training content.`,
        `Maintain this regardless of business size or growth, as a structural rather than periodic function.`,
      ],
    },
  },
];

// ─── D1: Governance & Policy ─────────────────────────────────────────────────────────────────

const D1: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `Right now nobody in the business owns security or data protection at all — there's no plan, and you haven't even looked into whether the Data Protection Act applies to your business yet.`,
      howToImprove: [
        `Spend 10 minutes looking up the Data Protection Act 2019 and what it means for a business like yours.`,
        `Decide, even informally, that you (or someone specific) will be the person who thinks about this going forward.`,
        `That's enough for this step — the goal is just to stop the topic being a total blank.`,
      ],
    },
    B: {
      whatsWrong: `No one has been assigned responsibility for security or data protection governance (deciding who owns these decisions), and there's no awareness of what the Data Protection Act (Kenya's data privacy law) actually requires.`,
      howToImprove: [
        `Learn the basics of what the DPA requires — the ODPC website is a good starting point.`,
        `Assign governance responsibility to a specific person, even if it's a part-time addition to their role.`,
        `Write down that this assignment happened — a single sentence is enough to start.`,
      ],
    },
    C: {
      whatsWrong: `No security ownership is assigned, no governance structure exists, and there is no organisational awareness of Data Protection Act obligations.`,
      howToImprove: [
        `Establish baseline DPA awareness at the owner/leadership level.`,
        `Assign formal ownership of governance and compliance decisions to a named individual.`,
        `Document the assignment as the organisation's starting governance record.`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `You know the Data Protection Act exists, but you haven't actually checked whether the small-business exemption applies to you, or registered — so you don't know where you legally stand, and nothing is written down.`,
      howToImprove: [
        `Check whether you qualify for the small-business exemption (roughly: turnover under KES 5M and fewer than 10 employees, unless your sector requires registration regardless).`,
        `If your IT provider handles this, ask them directly what they've set up on your behalf — don't just assume it's covered.`,
        `Write down what you find, even in one sentence — "we checked and we [do/don't] need to register."`,
      ],
    },
    B: {
      whatsWrong: `The owner knows the DPA exists, but nobody has checked whether the business needs to register with the ODPC (Office of the Data Protection Commissioner) or qualifies for the small-business exemption — and nothing about this is written down.`,
      howToImprove: [
        `Check your status against the exemption test: turnover under KES 5M and fewer than 10 employees, unless your sector must register regardless.`,
        `If a provider handles compliance for you, ask specifically what they've configured — don't assume.`,
        `Document the outcome, even briefly.`,
      ],
    },
    C: {
      whatsWrong: `DPA awareness exists at owner level, but no formal evaluation of applicability (registration/exemption status) has been performed, and no documented policy exists.`,
      howToImprove: [
        `Formally evaluate applicability against the KES 5M turnover / 10-employee dual exemption test and any sector-specific overrides.`,
        `Where compliance is outsourced, obtain owner-level visibility into what the provider has actually configured.`,
        `Document the evaluation outcome as a compliance record.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `You've checked your exemption status, which is real progress, but you still haven't registered (if required) or confirmed your exemption formally, and you don't have anything written down about how you handle customer data.`,
      howToImprove: [
        `If you need to register, do it at the ODPC — it's a straightforward online process.`,
        `If you're exempt, get that confirmed and keep a record of it.`,
        `Write a simple note — even half a page — on how you handle customer data, in your own words, and be able to explain what your IT provider takes care of versus what you handle yourself.`,
      ],
    },
    B: {
      whatsWrong: `You've checked your exemption status, but you haven't registered or written a policy yet, and if a provider handles compliance, you still lack visibility into exactly what they've set up on your behalf.`,
      howToImprove: [
        `Complete ODPC registration if required, or gather documented proof of exemption.`,
        `Write a policy for handling customer data — it doesn't need to be long, but it needs to exist.`,
        `Ask your provider to walk you through what controls (safeguards) they manage, until you understand it well enough to explain it yourself.`,
      ],
    },
    C: {
      whatsWrong: `Exemption status has been evaluated, but ODPC registration is not completed or exemption is not formally documented, and no written data-handling policy exists.`,
      howToImprove: [
        `Complete ODPC registration where required, or formally document exemption status.`,
        `Author a written data-handling policy.`,
        `Ensure the owner can articulate provider-managed controls without relying on the provider to explain them each time.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `You're registered or confirmed exempt and have a written note, which is solid — but that note is a one-time snapshot, and if you start doing anything new with sensitive customer data, you're not yet in the habit of thinking it through first.`,
      howToImprove: [
        `Put a yearly reminder in your calendar to re-read and update your data-handling note.`,
        `Before starting anything new that touches sensitive customer data (a new system, a new type of data collection), pause and think through what could go wrong.`,
        `Update your note whenever something changes — it should reflect how you actually operate, not how you operated a year ago.`,
      ],
    },
    B: {
      whatsWrong: `You're registered (or exempt) with a written policy, which is a solid foundation — but the policy is static, and for higher-risk uses of sensitive data you're not yet running a Data Protection Impact Assessment (DPIA), a structured check of privacy risks before you start.`,
      howToImprove: [
        `Schedule an annual review of your policy — put a date on it.`,
        `For any higher-risk processing identified in your risk management work (D2), run a DPIA before you start — a structured walk-through of what could go wrong.`,
        `Update the policy based on what the review and any DPIAs turn up.`,
      ],
    },
    C: {
      whatsWrong: `Registration/exemption is documented and a policy exists, but the policy isn't on a review cadence, and Data Protection Impact Assessments aren't yet conducted for higher-risk processing identified in Risk Management (D2).`,
      howToImprove: [
        `Establish an annual policy review cadence.`,
        `Conduct DPIAs for any higher-risk processing activities identified in D2.`,
        `Feed DPIA findings back into policy updates.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `You're reviewing and updating your approach regularly, which is strong — the last step is making sure this doesn't depend on you personally remembering to do it, so it holds up no matter who's doing the day-to-day technical work.`,
      howToImprove: [
        `Make sure whoever handles your systems day-to-day — staff or an outside provider — knows the data-handling expectations, not just you.`,
        `Build the yearly review into how the business runs, not as a special task you assign yourself.`,
        `Treat this as simply part of running the business, the same way you'd treat rent or payroll.`,
      ],
    },
    B: {
      whatsWrong: `Your policy is reviewed annually and DPIAs happen for higher-risk work — strong practice — but governance still isn't fully embedded into daily operations, especially if IT delivery model (in-house vs outsourced) ever changes.`,
      howToImprove: [
        `Make sure compliance holds up regardless of who's handling IT day-to-day — in-house or outsourced.`,
        `Move from a scheduled annual check to continuous awareness — governance as an ongoing property of how the business runs, not an annual event.`,
        `Keep documentation current enough that you could explain your full compliance status at any time, not just after the yearly review.`,
      ],
    },
    C: {
      whatsWrong: `Policy review and DPIAs are in place, but governance is not yet embedded in operations as a continuously reviewed property, particularly with respect to consistency across internal and outsourced IT delivery models.`,
      howToImprove: [
        `Embed governance and compliance ownership into standard operating procedure, not a periodic exercise.`,
        `Maintain full DPA/ODPC compliance documentation continuously, regardless of internal or outsourced IT delivery model.`,
        `Treat continuous review as the standing state, not the annual review as the trigger.`,
      ],
    },
  },
];

// ─── D2: Risk Management ─────────────────────────────────────────────────────────────────────

const D2: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `You don't have any list of what customer information or systems your business has, or which ones would actually hurt the most to lose — so if something went wrong, you wouldn't even know what was at stake.`,
      howToImprove: [
        `Spend 20 minutes writing down every system and type of data your business touches — customer contacts, payment details, social media accounts, cloud tools.`,
        `Just get it into your head as a rough list — it doesn't need to be organised yet.`,
        `Keep it somewhere you'll actually look at again, even just notes on your phone.`,
      ],
    },
    B: {
      whatsWrong: `There's no inventory (list) of the systems and data you hold, and no prioritisation of which risks matter most — so decisions get made without any sense of what's actually at stake.`,
      howToImprove: [
        `Build an informal sense of what data and systems matter most — start simply, in your head or in notes.`,
        `Don't worry about formal classification yet — the goal is just to stop operating from a completely blank slate.`,
        `Involve anyone else who touches your systems, so the picture isn't only in one person's head.`,
      ],
    },
    C: {
      whatsWrong: `No asset or data inventory exists, and no risk prioritisation has been performed — there is currently no structural basis for identifying which risks matter most.`,
      howToImprove: [
        `Establish informal, documented awareness of critical data/systems as a starting point.`,
        `Capture this awareness in writing, even without formal structure yet.`,
        `Treat this as the precondition for any further risk-management maturity.`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `You have a rough idea in your head of what matters most, but nothing is written down — which means it lives only in your memory, and anyone else in the business (or you, on a bad day) has no way to check it.`,
      howToImprove: [
        `Write your mental list down properly — a simple note or spreadsheet is enough.`,
        `If your IT provider also tracks systems and data, ask them for their list and compare it to yours.`,
        `Don't worry about sorting by importance yet — just get everything out of your head and onto paper.`,
      ],
    },
    B: {
      whatsWrong: `You have an informal sense of what matters, but nothing is documented or classified (sorted by sensitivity/importance) — which means it can't be checked, shared, or relied on beyond the person who happens to remember it.`,
      howToImprove: [
        `Write down a basic list of your systems and data.`,
        `If a provider holds a version of this list, request it and review it yourself rather than trusting it's complete.`,
        `Leave sensitivity classification for the next step — just get the inventory itself documented first.`,
      ],
    },
    C: {
      whatsWrong: `Informal, undocumented awareness of critical data/systems exists, but no structured classification has been applied, and if an inventory exists at all, it may sit entirely with an outsourced provider without owner-level review.`,
      howToImprove: [
        `Formalise a basic asset/data inventory in writing.`,
        `If a provider maintains a version of this inventory, obtain and review it directly rather than deferring to their record.`,
        `Defer sensitivity classification to the next maturity step.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `You have a basic list of your systems and data now, but it isn't sorted by how damaging it would be if lost — a leaked ID number or payment record is treated the same as a leaked marketing flyer, when it really shouldn't be.`,
      howToImprove: [
        `Go through your list and mark which items would be most damaging if lost or leaked — ID numbers, payment details, and health/HR records are usually the highest-stakes.`,
        `Give those items extra care — stronger passwords, more limited access, more careful handling.`,
        `Revisit the list whenever you start collecting a new type of information.`,
      ],
    },
    B: {
      whatsWrong: `A basic list exists, but it isn't classified by sensitivity (how damaging a leak would be), and sector-specific risk categories relevant to your business — HR/employment data, guest/hospitality data, client documents, logistics/payment data — aren't explicitly identified.`,
      howToImprove: [
        `Classify each item on your list by sensitivity level — how much harm would exposure actually cause?`,
        `Explicitly flag the sector-specific categories that apply to your business type.`,
        `If your provider holds part of this list, make sure you've reviewed it yourself, not just received it.`,
      ],
    },
    C: {
      whatsWrong: `A basic asset/data list exists but lacks sensitivity classification, and sector-specific risk categories (HR/employment, guest/hospitality, client documents, logistics/payment data) relevant to the business type are not explicitly identified.`,
      howToImprove: [
        `Classify all data assets by sensitivity level.`,
        `Explicitly identify sector-specific risk categories applicable to the Organisational Profile business type.`,
        `Ensure owner-level review of the classified inventory, particularly where a provider was previously the sole custodian.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `You know which data matters most, which is good — but you're still assuming your platforms and providers are protecting it properly rather than actually checking, and you're not revisiting this regularly.`,
      howToImprove: [
        `Pick a regular check-in — every few months is enough — to look at your risks again.`,
        `Actually ask your platforms and providers how they protect your data, rather than assuming it's fine because nothing's gone wrong yet.`,
        `Write down what you learn, so next time you have something to compare against.`,
      ],
    },
    B: {
      whatsWrong: `Your data is classified by sensitivity and sector-specific categories are identified — a real risk register — but it's not being reviewed on a set schedule, and you're likely still assuming rather than verifying how third-party platforms protect your data.`,
      howToImprove: [
        `Put your risk register on a defined review schedule — quarterly is reasonable for a small business.`,
        `Independently verify, rather than assume, how your third-party platforms and providers protect your data — ask directly.`,
        `Update the register each time you review it, so it stays a living document.`,
      ],
    },
    C: {
      whatsWrong: `Data assets are classified and sector-specific categories identified, but the risk register isn't reviewed on a defined cadence, and third-party/provider security practices are still assumed rather than independently verified.`,
      howToImprove: [
        `Establish a defined review cadence for the risk register.`,
        `Independently verify third-party and provider security practices rather than relying on assumption.`,
        `Document verification outcomes as part of each review cycle.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `You're checking in on risks regularly and verifying with your providers, which is strong practice — the last step is making this automatic, so that any change to the business naturally triggers you to think about what new risks it brings.`,
      howToImprove: [
        `Whenever you add a new system, tool, or way of doing business, make "what risks does this bring?" a normal part of that decision, not an afterthought.`,
        `Keep the habit going even when things are calm — risk thinking shouldn't only happen after something goes wrong.`,
        `Treat it as second nature: by this point it should feel like a normal part of how you think about the business, not a separate task.`,
      ],
    },
    B: {
      whatsWrong: `You're reviewing your risk register on schedule and verifying providers independently — strong, disciplined practice. What's missing is making the review automatic rather than scheduled, so change itself is what triggers reassessment.`,
      howToImprove: [
        `Set the expectation that any new system, connected device, or change to how the business operates automatically triggers a fresh risk review — not just the scheduled one.`,
        `Keep the review backed by real data rather than impressions.`,
        `Make this continuous rather than periodic — the scheduled review becomes a backstop, not the only trigger.`,
      ],
    },
    C: {
      whatsWrong: `The risk register is reviewed on a defined cadence with independent verification — solid practice — but risk management is not yet continuous or quantitatively informed, and new systems, devices, or business-model changes don't yet trigger automatic reassessment.`,
      howToImprove: [
        `Move from cadence-based review to continuous, quantitatively-informed risk management.`,
        `Configure new systems, connected devices, or business-model changes to automatically trigger reassessment.`,
        `Treat the defined-cadence review as a floor, not the primary mechanism, going forward.`,
      ],
    },
  },
];

// ─── D3: Access Control ──────────────────────────────────────────────────────────────────────

const D3: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `Right now your passwords are shared or reused across accounts, and you don't have a list of what accounts your business even has — so you have no real control over who can get into what.`,
      howToImprove: [
        `Start a simple list of every account your business uses — email, social media, banking, M-Pesa, cloud tools.`,
        `Stop reusing the same password across accounts, starting with your most important ones.`,
        `Whatever login protection your apps offer by default (Google, Instagram, WhatsApp), make sure it's actually turned on.`,
      ],
    },
    B: {
      whatsWrong: `There's no access control (rules for who can get into what) in place — passwords are shared or reused, and there's no inventory (list) of accounts, so you have no structural way to know who can access what.`,
      howToImprove: [
        `Build an inventory (list) of every account the business uses.`,
        `Stop sharing and reusing passwords, starting with the highest-value accounts.`,
        `Confirm what MFA/2FA (multi-factor authentication — a second login step beyond just a password) is already active by platform default, as a baseline.`,
      ],
    },
    C: {
      whatsWrong: `No access control exists; credentials are shared or reused, and no account inventory has been established.`,
      howToImprove: [
        `Establish a documented account inventory.`,
        `Eliminate credential sharing and reuse, prioritising highest-value accounts first.`,
        `Confirm baseline MFA/2FA present via platform default enforcement (e.g., Google Workspace, banking apps).`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `You're relying entirely on whatever login protection Instagram, WhatsApp, or Google give you by default — you haven't actually turned on extra protection yourself, so you're only as protected as the platform's default settings happen to be.`,
      howToImprove: [
        `Go into your most important accounts and turn on extra login protection (two-step login) yourself, rather than relying on defaults.`,
        `Start with the accounts that would hurt the most to lose — usually email and your main business social media.`,
        `If a provider set anything up for you already, ask them exactly what's active.`,
      ],
    },
    B: {
      whatsWrong: `MFA/2FA is only active where the platform forces it by default — Google Workspace, banking apps — rather than as a deliberate business decision, which means your protection depends entirely on what each platform happens to require, not on your own judgement of what matters.`,
      howToImprove: [
        `Turn on MFA deliberately on your most important accounts, rather than relying on platform defaults.`,
        `Where a provider manages some accounts, ask for visibility into exactly how MFA is configured.`,
        `Prioritise accounts that would cause the most damage if compromised.`,
      ],
    },
    C: {
      whatsWrong: `MFA/2FA is present only where enforced by platform default, not as a deliberate policy decision — coverage is incidental rather than intentional.`,
      howToImprove: [
        `Convert MFA from platform-default-only to a deliberate policy applied to priority accounts.`,
        `Where provider-managed, obtain configuration visibility rather than accepting opacity.`,
        `Prioritise by potential impact of compromise.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `You've turned on extra protection for some accounts, but not consistently — and if a provider set some of it up, you're not fully sure what they actually did, which means you can't be confident it's really working.`,
      howToImprove: [
        `Make extra login protection a deliberate rule for every important account — not just some — including your business Instagram and Facebook.`,
        `Get a straight answer from your provider on exactly what protection is active on each account.`,
        `Finish (or start) a full list of all your accounts, so nothing gets missed.`,
      ],
    },
    B: {
      whatsWrong: `MFA is turned on for some accounts but not consistently, and where a provider manages it, you lack visibility into exactly how it's configured — so coverage is a patchwork rather than a policy.`,
      howToImprove: [
        `Make MFA a deliberate, company-wide requirement — not just where platforms force it.`,
        `Build a documented inventory (list) of all accounts, including social media, so nothing falls outside the policy.`,
        `Get full visibility from any provider managing MFA on your behalf.`,
      ],
    },
    C: {
      whatsWrong: `MFA is applied inconsistently across accounts, and where provider-managed, the owner lacks visibility into configuration — coverage cannot be verified or audited.`,
      howToImprove: [
        `Mandate MFA company-wide as formal policy, not contingent on platform enforcement.`,
        `Document a full account inventory including social media accounts.`,
        `Obtain full configuration visibility from any provider managing MFA.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `Every important account has protection turned on and you have a full list — strong foundation. But you don't yet have a clear plan for what you'd actually do if you got locked out of your business Instagram or Facebook, and for many digital businesses, losing that page means losing the business, not just some data.`,
      howToImprove: [
        `Write down, step by step, what you'd do if you lost access to your main business account right now.`,
        `Save any account-recovery information (recovery email, phone number, official platform contacts) somewhere you can find it under pressure.`,
        `Treat this as seriously as you'd treat losing your shopfront — because for many businesses, it is.`,
      ],
    },
    B: {
      whatsWrong: `MFA is mandated company-wide with a documented inventory — a real access-control policy. What's missing is a documented recovery plan for losing access to a social media or content account, treated as a business-continuity risk (something that could stop the business running) rather than just a data-protection issue.`,
      howToImprove: [
        `Document a recovery plan specifically for social media/content account loss.`,
        `Frame it as business continuity — what happens to revenue and operations, not just data, if this account disappears.`,
        `Make sure the plan includes concrete recovery contacts and steps, not just an intention to "figure it out."`,
      ],
    },
    C: {
      whatsWrong: `MFA is mandated company-wide with a documented inventory, but no documented recovery plan exists for social/content platform account loss framed as a business-continuity risk.`,
      howToImprove: [
        `Document a recovery plan for social/content platform account loss.`,
        `Frame the plan explicitly as business-continuity risk, not purely data-protection.`,
        `Include concrete recovery contacts and procedural steps.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `You have a real recovery plan, which most businesses don't — the last step is actually testing it, and making sure all your accounts (not just the main one) get checked regularly rather than being set up once and forgotten.`,
      howToImprove: [
        `Actually test your recovery plan — walk through the steps, don't just assume they'd work.`,
        `Set a regular reminder to check that protection is still active across all your accounts, including ones you don't use every day.`,
        `Update the plan whenever you add a new account or a platform changes how recovery works.`,
      ],
    },
    B: {
      whatsWrong: `You have a documented recovery plan treating account loss as a continuity risk — strong. The remaining gap is moving from documented-but-static to an actively tested, zero-trust approach (verifying every access request rather than assuming trust) across all accounts including social media.`,
      howToImprove: [
        `Apply a zero-trust approach: verify every access request rather than assuming trust once granted.`,
        `Set up automated access reviews covering all accounts, including social media.`,
        `Actually test your recovery plans rather than leaving them undemonstrated.`,
      ],
    },
    C: {
      whatsWrong: `A documented, continuity-framed recovery plan exists, but a zero-trust approach is not yet applied, and access reviews and recovery-plan testing are not yet automated/verified across all accounts including social media.`,
      howToImprove: [
        `Adopt a zero-trust approach — verify every access request rather than assuming trust.`,
        `Implement automated access reviews across all accounts, including social media.`,
        `Test recovery plans rather than leaving them unverified.`,
      ],
    },
  },
];

// ─── D5: Incident Detection & Response ───────────────────────────────────────────────────────

const D5: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `Right now if something went wrong, you'd probably only find out by accident — there's no plan, and nobody, including any IT provider you use, is actively watching for problems.`,
      howToImprove: [
        `Tell your staff explicitly: if something seems wrong with a system or account, tell you (or your IT provider) straight away.`,
        `If you use an IT provider, ask them directly whether they monitor for problems, or whether you'd only hear from them if something already broke.`,
        `That's enough for this step — the goal is just making sure someone would actually be told.`,
      ],
    },
    B: {
      whatsWrong: `There's no monitoring or detection capability (ability to notice something's wrong) and no incident response plan — if IT is outsourced, you'd only find out about an incident if the provider happened to mention it.`,
      howToImprove: [
        `Tell staff explicitly to escalate (report upward) to you or your provider the moment something seems wrong.`,
        `Ask your provider directly whether they proactively monitor for issues, or only react once something's already broken.`,
        `Document what you learn — even "they don't monitor anything" is a useful starting fact.`,
      ],
    },
    C: {
      whatsWrong: `No monitoring or detection capability exists, and no incident response plan is in place; where IT is outsourced, awareness of incidents is entirely dependent on provider disclosure.`,
      howToImprove: [
        `Establish that staff escalate to the owner or provider whenever an issue is suspected.`,
        `Determine whether the provider performs any proactive monitoring, or whether awareness is purely disclosure-dependent.`,
        `Document the current state as a baseline.`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `Staff know to tell you or your provider if something seems wrong, but nobody is actively checking for problems before they're reported — you're entirely dependent on someone happening to notice and speak up.`,
      howToImprove: [
        `Write a simple list of what to do if something goes wrong — even five steps is enough to start.`,
        `Ask your IT provider exactly what they're watching for on your behalf, in plain terms.`,
        `If the answer is "nothing," that's useful information — it tells you where the gap is.`,
      ],
    },
    B: {
      whatsWrong: `Staff know to escalate to the owner or provider, but there's no proactive monitoring and no visibility into what the provider is actually detecting on their end — you're still purely reactive.`,
      howToImprove: [
        `Build a basic incident response checklist — what to do, in order, when something goes wrong.`,
        `Formally ask your provider for documented information on exactly what they're monitoring for.`,
        `Keep that documentation somewhere accessible, not just as a verbal answer you'll forget.`,
      ],
    },
    C: {
      whatsWrong: `Staff know to escalate to owner or provider, but there is no proactive monitoring and no visibility into provider-side detection capability.`,
      howToImprove: [
        `Build a basic incident response checklist.`,
        `Formally request and obtain documented visibility into provider-side monitoring scope.`,
        `Retain that documentation as an auditable record.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `You have a simple response list and know what your provider is watching for — real progress. But you don't yet know that a data breach must be reported to the ODPC within 72 hours, or who in your business would actually be the one to do that.`,
      howToImprove: [
        `Learn the 72-hour rule: if a data breach happens, Kenya's Data Protection Act requires notifying the ODPC within 72 hours.`,
        `Decide, concretely, who in your business would be responsible for making that notification.`,
        `Write that person's name down somewhere you'd actually find it during a crisis.`,
      ],
    },
    B: {
      whatsWrong: `A basic checklist exists and you've got documented visibility into provider monitoring — solid groundwork. But not everyone yet knows the 72-hour rule (the legal requirement to notify the ODPC within 72 hours of a breach), and there isn't a named person responsible for actually doing it.`,
      howToImprove: [
        `Confirm you have real visibility into what your provider monitors, in writing.`,
        `Make sure everyone who needs to know understands the 72-hour ODPC breach-notification rule.`,
        `Name a specific person responsible for making that notification if it's ever needed.`,
      ],
    },
    C: {
      whatsWrong: `A basic IR checklist exists with documented provider-monitoring visibility, but the 72-hour ODPC breach-notification obligation is not yet confirmed as known, and no named point of contact exists for execution.`,
      howToImprove: [
        `Confirm organisational awareness of the 72-hour ODPC breach-notification obligation.`,
        `Designate a named point of contact responsible for execution.`,
        `Document this assignment alongside the existing monitoring-visibility record.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `You know the 72-hour rule and who's responsible, which covers the legal essential — but you don't yet have a full written plan, your provider or team isn't reporting to you on a regular basis, and after something happens you're not yet in the habit of asking why it happened.`,
      howToImprove: [
        `Write a fuller incident plan — what happens, in what order, when something goes wrong.`,
        `Ask your provider or team to report to you on a regular schedule, not just when something breaks.`,
        `After any incident, however small, take a few minutes to ask why it happened, not just fix it and move on.`,
      ],
    },
    B: {
      whatsWrong: `You've confirmed monitoring visibility and everyone knows the 72-hour rule — the compliance essentials are covered. What's missing is a formal, documented incident response plan, a regular reporting cadence from your provider or team, and a root-cause review (figuring out why it actually happened) after incidents.`,
      howToImprove: [
        `Document a formal incident response plan, not just informal knowledge.`,
        `Set a regular schedule for your provider or internal team to report to you.`,
        `After any incident, carry out a root-cause review — what actually caused it, not just what fixed it.`,
      ],
    },
    C: {
      whatsWrong: `Provider-monitoring visibility is confirmed and the 72-hour obligation is known with a named contact, but no formal incident response plan is documented, no regular reporting cadence exists, and no root-cause review process follows incidents.`,
      howToImprove: [
        `Document a formal incident response plan.`,
        `Establish a regular reporting cadence from the provider or internal team.`,
        `Conduct root-cause review following every incident.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `You have a written plan and regular reporting, and you look at why incidents happen — strong practice. The last step is making sure every incident, big or small, actually improves your readiness, and that you have full visibility regardless of who's doing the technical work.`,
      howToImprove: [
        `After every incident, however minor, write down one thing that would help next time — and actually act on it.`,
        `Make sure you have real visibility into detection and response, whether that work is done in-house or by an outside provider.`,
        `Treat "we got better because of that" as the standard for every incident, not just the big ones.`,
      ],
    },
    B: {
      whatsWrong: `You have a formal plan, regular reporting, and root-cause reviews — mature practice. The remaining step is making sure lessons from each incident continuously improve the process, with full visibility maintained regardless of whether IT is in-house or outsourced.`,
      howToImprove: [
        `Feed every root-cause review back into updating the incident response plan itself.`,
        `Maintain full detection-and-response visibility no matter how your IT delivery model changes.`,
        `Treat continuous improvement as the goal, not just having a plan on file.`,
      ],
    },
    C: {
      whatsWrong: `A formal IR plan, reporting cadence, and root-cause review process are in place, but incident learnings are not yet driving continuous process improvement, and detection/response visibility isn't yet guaranteed regardless of delivery model changes.`,
      howToImprove: [
        `Establish a continuous improvement process explicitly driven by incident learnings.`,
        `Guarantee full detection-and-response visibility regardless of internal or outsourced delivery model.`,
        `Treat this as an ongoing property of operations, not a static plan on file.`,
      ],
    },
  },
];

// ─── D6: Recovery ────────────────────────────────────────────────────────────────────────────

const D6: TransitionRow[] = [
  {
    from: 0,
    to: 1,
    A: {
      whatsWrong: `Right now if you lost your data or got locked out of an account, you'd have nothing to fall back on — no backup, no plan at all.`,
      howToImprove: [
        `Turn on automatic backup for your most important files — most cloud tools (Google Drive, Dropbox) do this for free with a few clicks.`,
        `Don't aim for a perfect system yet — just make sure something is being backed up somewhere.`,
        `Note down what you've backed up, so you know what's still exposed.`,
      ],
    },
    B: {
      whatsWrong: `There's no backup strategy and no business continuity plan (a plan for keeping the business running) or disaster recovery plan (a plan for restoring systems after a major incident) in place at all.`,
      howToImprove: [
        `Set up backups for your most important data — even a basic, manual process is a starting point.`,
        `Note what you've covered and what's still unprotected.`,
        `Don't aim for a full continuity plan yet — just get backups happening at all.`,
      ],
    },
    C: {
      whatsWrong: `No backup strategy exists, and no business continuity or disaster recovery plan is in place.`,
      howToImprove: [
        `Implement ad hoc/manual backups as a starting baseline.`,
        `Document what is and isn't currently covered.`,
        `Treat this as the precondition for any further recovery maturity.`,
      ],
    },
  },
  {
    from: 1,
    to: 2,
    A: {
      whatsWrong: `You back things up here and there when you remember, but there's no real system — and if you lost your social media accounts specifically, you don't have any plan for what you'd do.`,
      howToImprove: [
        `Turn your occasional backups into an automatic, regular habit rather than something you remember to do sometimes.`,
        `Write down basic account details (recovery email, phone number) for your key social media accounts somewhere safe.`,
        `Confirm your backups are actually running, not just switched on once and forgotten.`,
      ],
    },
    B: {
      whatsWrong: `Backups happen occasionally and manually where they happen at all, and there's no formal procedure for recovering lost accounts or data — so recovery would depend on improvising in the moment.`,
      howToImprove: [
        `Move from occasional manual backups to a regular, ideally automatic schedule.`,
        `Write a basic procedure for recovering lost accounts or data, even a short one.`,
        `Make sure whoever's managing backups (you or a provider) has clear responsibility for it.`,
      ],
    },
    C: {
      whatsWrong: `Backups occur ad hoc/manually where present, but no formal recovery procedure exists for account or data loss.`,
      howToImprove: [
        `Move from ad hoc to regular, scheduled backups.`,
        `Document a formal recovery procedure for account and data loss.`,
        `Assign clear ownership for backup execution.`,
      ],
    },
  },
  {
    from: 2,
    to: 3,
    A: {
      whatsWrong: `Your data gets backed up regularly, often through a provider — good — but nobody has actually tested whether you could get it all back if you needed to, so you don't really know if your backup works until the day you desperately need it.`,
      howToImprove: [
        `Write a simple plan for getting back up and running if something goes wrong — including specifically how you'd get back into your business Instagram or Facebook if you were ever locked out.`,
        `Pick one backup and try restoring a file from it, just to see that it actually works.`,
        `Keep the plan somewhere you can find it under pressure, not buried in an old email.`,
      ],
    },
    B: {
      whatsWrong: `Regular backups happen, often managed by a provider, but the recovery process has never actually been tested, and it isn't clear who would be responsible for carrying it out if it were needed.`,
      howToImprove: [
        `Document a recovery plan covering both restoring data and recovering social media/content accounts, framed around keeping the business running (business continuity), not just data.`,
        `Assign clear responsibility for who would actually carry out recovery.`,
        `Test at least one part of the process to confirm the theory matches reality.`,
      ],
    },
    C: {
      whatsWrong: `Regular backups occur, often provider-managed, but recovery procedures are untested and ownership of recovery execution is unclear.`,
      howToImprove: [
        `Document a recovery plan covering both data restoration and social/content platform account recovery, framed around business continuity.`,
        `Assign explicit ownership of recovery execution.`,
        `Test at least a subset of the recovery procedure to validate it.`,
      ],
    },
  },
  {
    from: 3,
    to: 4,
    A: {
      whatsWrong: `You have a written recovery plan, which most businesses skip — but you haven't actually tried it out, so you don't know how long it would really take or whether every step works the way you think it does.`,
      howToImprove: [
        `Actually run through your recovery plan once, even as a practice exercise, and time how long it takes.`,
        `Note anything that didn't go as expected, and fix the plan accordingly.`,
        `Do this occasionally, not just once — plans go stale as your business changes.`,
      ],
    },
    B: {
      whatsWrong: `A documented, continuity-framed recovery plan exists — real progress — but it isn't tested on a set schedule, and you don't have recovery time objectives (how long recovery should realistically take) written down.`,
      howToImprove: [
        `Put recovery plan testing on a defined schedule, not just as a one-off.`,
        `Work out and write down your recovery time objectives — how long can the business realistically be down before it's a serious problem?`,
        `Compare test results against those objectives, and adjust the plan if they don't match.`,
      ],
    },
    C: {
      whatsWrong: `A documented, continuity-framed recovery plan exists, but it is not tested on a defined cadence, and recovery time objectives are not yet understood or documented.`,
      howToImprove: [
        `Establish a defined testing cadence for the recovery plan.`,
        `Determine and document recovery time objectives.`,
        `Validate actual recovery performance against those objectives.`,
      ],
    },
  },
  {
    from: 4,
    to: 5,
    A: {
      whatsWrong: `You've tested your plan and know it works, which is genuinely strong preparation — the last step is making sure this readiness holds up and keeps improving as your business grows or changes, rather than being a one-time exercise.`,
      howToImprove: [
        `Re-test your recovery plan periodically, especially after any major change to your systems or accounts.`,
        `Keep improving the plan based on what each test or real incident teaches you.`,
        `Treat recovery readiness as an ongoing habit, not a box you tick once.`,
      ],
    },
    B: {
      whatsWrong: `Your recovery plan is tested on schedule with clear time objectives — strong, disciplined practice. What's left is making sure this capability keeps being tested and improved continuously, and holds up no matter how much the business grows or changes.`,
      howToImprove: [
        `Keep testing on schedule even as the business changes — don't let it lapse once things feel stable.`,
        `Use each test to actively improve the plan, not just confirm it still works.`,
        `Make resilience an ongoing property of the business, not a project with an end date.`,
      ],
    },
    C: {
      whatsWrong: `The recovery plan is tested on a defined cadence with documented recovery time objectives, but recovery capability is not yet continuously tested/improved or guaranteed independent of business scale or growth.`,
      howToImprove: [
        `Move from cadence-based testing to continuous testing and improvement.`,
        `Ensure resilience is maintained independent of business scale or growth.`,
        `Treat recovery capability as an ongoing operational property, not a periodic exercise.`,
      ],
    },
  },
];

export const REMEDIATION_GUIDANCE: RemediationRow[] = [
  ...expand("D1", D1),
  ...expand("D2", D2),
  ...expand("D3", D3),
  ...expand("D4", D4),
  ...expand("D5", D5),
  ...expand("D6", D6),
];
