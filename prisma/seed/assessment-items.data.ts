// Multi-item domain assessment battery — 90 short, single-claim, agree/disagree statements
// (6 domains x 5 levels x 3 tiers), each operationalising the *most defining* claim of its
// Annex A descriptor rather than pasting the whole (often compound) descriptor as one sentence.
// Every row carries a sourceDescriptorRef tying it back to the exact descriptor it's drawn from,
// preserving the same content-validity traceability Annex A itself has (Section 12.1). All rows
// are draft, pending researcher review before pilot use.
//
// Level 0 has no item (default when nothing is endorsed). Baseline scope is 1 item per level —
// see item-scoring.ts for how these combine into a cumulative domain score.

import type { DomainId } from "../../src/lib/alita/domains";

export type ItemTier = "A" | "B" | "C";

export interface AssessmentItemRow {
  domainId: DomainId;
  tier: ItemTier;
  level: number;
  statementText: string;
  sourceDescriptorRef: string;
  order: number;
  status: "draft";
}

interface LevelStatements {
  level: number;
  A: string;
  B: string;
  C: string;
}

function expand(domainId: DomainId, rows: LevelStatements[]): AssessmentItemRow[] {
  return rows.flatMap((row) => [
    {
      domainId,
      tier: "A" as const,
      level: row.level,
      statementText: row.A,
      sourceDescriptorRef: `Annex A ${domainId} Level ${row.level}, Tier A`,
      order: 1,
      status: "draft" as const,
    },
    {
      domainId,
      tier: "B" as const,
      level: row.level,
      statementText: row.B,
      sourceDescriptorRef: `Annex A ${domainId} Level ${row.level}, Tier B`,
      order: 1,
      status: "draft" as const,
    },
    {
      domainId,
      tier: "C" as const,
      level: row.level,
      statementText: row.C,
      sourceDescriptorRef: `Annex A ${domainId} Level ${row.level}, Tier C`,
      order: 1,
      status: "draft" as const,
    },
  ]);
}

const D1: LevelStatements[] = [
  {
    level: 1,
    A: `I have heard of Kenya's Data Protection Act, even though I haven't checked whether it applies to my business yet.`,
    B: `The owner knows the Data Protection Act exists, but no one has checked whether the business needs to register or qualifies for the small-business exemption.`,
    C: `DPA awareness exists at the owner level, but no formal evaluation of registration/exemption applicability has been performed.`,
  },
  {
    level: 2,
    A: `I have checked whether my business qualifies for the small-business exemption from the Data Protection Act.`,
    B: `We have checked our small-business exemption status against the turnover and employee-count criteria, but haven't registered or written a policy yet.`,
    C: `We have formally evaluated our exemption status against the turnover/employee-count criteria and sector overrides.`,
  },
  {
    level: 3,
    A: `My business is registered with the ODPC (or I have confirmed we're exempt), and I have a simple written note on how we handle customer data.`,
    B: `We are registered with the ODPC (or hold documented proof of exemption), have a written data-handling policy, and I understand what controls our provider manages without needing it explained each time.`,
    C: `ODPC registration is completed (or exemption formally documented), a written data-handling policy exists, and I can articulate our provider-managed controls independently.`,
  },
  {
    level: 4,
    A: `I review and update my data-handling notes at least once a year, and think through the risks before using customer data in a new way.`,
    B: `Our data-handling policy is reviewed every year, and we carry out a Data Protection Impact Assessment before starting any higher-risk use of sensitive data.`,
    C: `Our policy is reviewed annually, and Data Protection Impact Assessments are conducted for higher-risk processing activities.`,
  },
  {
    level: 5,
    A: `Looking after data protection is simply part of how my business runs, no matter who does the technical work.`,
    B: `Data protection governance is built into how we run the business and reviewed continuously, regardless of whether IT is handled in-house or outsourced.`,
    C: `Data protection governance is embedded in our operations and reviewed continuously, independent of our IT delivery model.`,
  },
];

const D2: LevelStatements[] = [
  {
    level: 1,
    A: `I have a rough idea of what data and systems matter most to my business, even though it isn't written down anywhere.`,
    B: `We have an informal sense of what data and systems matter most, but nothing is documented or classified by sensitivity.`,
    C: `Awareness of critical data and systems is informal and undocumented, with no structured classification applied.`,
  },
  {
    level: 2,
    A: `I have a basic list of the systems and data my business uses, though it isn't organised by how sensitive or risky each one is.`,
    B: `A basic list of our systems and data exists, though it isn't classified by sensitivity, and I haven't personally reviewed any list our provider holds.`,
    C: `A basic asset/data inventory exists but lacks sensitivity classification, and may reside solely with an outsourced provider without owner-level review.`,
  },
  {
    level: 3,
    A: `I know which types of information my business holds — like ID numbers, payment details, or health records — would be most damaging if lost, and I treat those more carefully.`,
    B: `Our data is classified by sensitivity level, and sector-specific risk categories relevant to our business — like client documents or payment data — are explicitly identified.`,
    C: `Our data assets are classified by sensitivity level, with sector-specific risk categories explicitly identified for our business type.`,
  },
  {
    level: 4,
    A: `I check in on my business risks regularly, and I've actually asked my platforms and providers how they protect my data instead of just assuming it's fine.`,
    B: `We review our risk register on a set schedule, and we independently verify — rather than assume — how our third-party platforms and providers protect our data.`,
    C: `Our risk register is reviewed on a defined cadence, and third-party/provider security practices are independently verified rather than assumed.`,
  },
  {
    level: 5,
    A: `As my business grows or changes, I automatically think about the new risks that brings — it's second nature by now.`,
    B: `Risk management is continuous and backed by data — any new system, device, or business change automatically triggers a fresh risk review.`,
    C: `Risk management is continuous and quantitatively informed, with new systems, devices, or business-model changes triggering automatic reassessment.`,
  },
];

const D3: LevelStatements[] = [
  {
    level: 1,
    A: `The only login protection on my accounts is whatever Instagram, WhatsApp, or Google turns on by default — I haven't turned anything on myself.`,
    B: `MFA is only active on our accounts where the platform forces it by default — it isn't yet a deliberate business decision.`,
    C: `MFA/2FA is present only where enforced by platform default, not yet as a deliberate policy decision.`,
  },
  {
    level: 2,
    A: `I've turned on extra login protection for some important accounts, but not consistently, and I'm not fully sure what my provider set up.`,
    B: `MFA is turned on for some of our accounts but not consistently, and where a provider manages it, I don't have visibility into exactly how it's configured.`,
    C: `MFA is applied inconsistently across our accounts, and where provider-managed, we lack visibility into the configuration.`,
  },
  {
    level: 3,
    A: `Every important account, including my business Instagram and Facebook, has extra login protection deliberately turned on, and I have a list of all my accounts.`,
    B: `MFA is deliberately required company-wide — not just where platforms force it — and we have a documented inventory of all our accounts, including social media.`,
    C: `MFA is mandated as company-wide policy, not merely where platforms require it, with a documented account inventory including social media.`,
  },
  {
    level: 4,
    A: `I have a clear plan for what to do if I ever got locked out of my business Instagram or Facebook page, because losing it would mean losing the business.`,
    B: `We have a documented recovery plan for losing access to a social media or content account, treated as a business-continuity risk rather than just a data issue.`,
    C: `A documented recovery plan exists for social/content platform account loss, framed as a business-continuity risk rather than purely data protection.`,
  },
  {
    level: 5,
    A: `All my accounts, including social media, get checked regularly, and I've actually tested my recovery plan to make sure it works.`,
    B: `We apply a zero-trust approach with automated access reviews across all accounts including social media, and our recovery plans have actually been tested.`,
    C: `We apply a zero-trust approach, with all accounts including social media covered by automated access reviews and tested recovery plans.`,
  },
];

const D4: LevelStatements[] = [
  {
    level: 1,
    A: `I've mentioned things like fake M-Pesa messages to my staff casually, even though there's been no real sit-down training.`,
    B: `Risks have been discussed informally, and staff show basic awareness — like declining unexpected M-Pesa STK-push prompts — even without formal training.`,
    C: `Informal risk discussion has occurred, and staff demonstrate baseline awareness of social-engineering risks without formal training delivery.`,
  },
  {
    level: 2,
    A: `People in my business are starting to notice when something looks off, but there's no set way for them to tell me about it.`,
    B: `Staff are getting better at noticing suspicious activity, but there's no set process for reporting or escalating it to someone who can act.`,
    C: `Staff risk-recognition is improving informally, but no structured reporting pathway or escalation process exists.`,
  },
  {
    level: 3,
    A: `Once a year, everyone in my business sits down for 30 minutes to go through spotting fake M-Pesa messages and knowing who to tell if something looks wrong.`,
    B: `An annual training session covers social-engineering tactics, including M-Pesa STK-push fraud, with attendance logged and content reviewed each year.`,
    C: `An annual awareness session is delivered covering social-engineering vectors including M-Pesa STK-push fraud, with attendance logged and content reviewed yearly.`,
  },
  {
    level: 4,
    A: `Training happens every few months, I occasionally test staff with a fake suspicious message, and people feel comfortable telling me if they made a mistake.`,
    B: `Training happens quarterly, staff are tested with simulated phishing, and people report incidents without fear of blame — reporting rates are tracked.`,
    C: `Training follows a quarterly cadence with simulated phishing/fraud exercises, and staff report incidents without fear of blame while reporting rates are tracked.`,
  },
  {
    level: 5,
    A: `Security is just part of how my business works — new hires learn it from day one, and everyone feels comfortable flagging anything odd.`,
    B: `Awareness is built into onboarding for new hires and reinforced through ongoing simulated exercises, with reporting rates and speed tracked and used to improve training.`,
    C: `Awareness is embedded in onboarding and reinforced through ongoing simulated exercises, with incident-reporting rates and time-to-report tracked and used to refine training content.`,
  },
];

const D5: LevelStatements[] = [
  {
    level: 1,
    A: `Staff know to tell me or my IT provider if something seems wrong, but nobody is actively checking for problems before they're reported.`,
    B: `Staff know to escalate to the owner or provider if something seems wrong, but there's no proactive monitoring and no visibility into what the provider is detecting.`,
    C: `Staff know to escalate to the owner or provider, but no proactive monitoring or visibility into provider-side detection exists.`,
  },
  {
    level: 2,
    A: `I have a simple list of what to do if something goes wrong, and I've asked my IT provider exactly what they're watching for on my behalf.`,
    B: `A basic incident response checklist exists, and the owner has requested and received documented information on exactly what the provider is monitoring for.`,
    C: `A basic incident response checklist exists, and the owner has obtained documented visibility into the provider's monitoring scope.`,
  },
  {
    level: 3,
    A: `I know what my provider is watching for, and I know that if a data breach happened, I'd need to tell the ODPC within 72 hours — and who in my business would actually do that.`,
    B: `The owner has confirmed visibility into what the provider monitors, everyone knows about the 72-hour ODPC breach-notification rule, and a named person is responsible for it.`,
    C: `Owner visibility into provider monitoring is confirmed, the 72-hour ODPC breach-notification obligation is known, and a named point of contact exists for execution.`,
  },
  {
    level: 4,
    A: `I have a written plan for handling incidents, my provider or team reports to me regularly, and after anything happens I look at why it happened, not just fix it.`,
    B: `A formal incident response plan is documented, the provider or internal team reports on a regular schedule, and a root-cause review is carried out after any incident.`,
    C: `A formal incident response plan is documented, a regular reporting cadence exists, and root-cause review is conducted following every incident.`,
  },
  {
    level: 5,
    A: `Every incident, big or small, makes my business better prepared for next time, and I have full visibility no matter who's doing the technical work.`,
    B: `Lessons from each incident continuously improve our process, and full detection-and-response visibility is maintained whether IT is in-house or outsourced.`,
    C: `A continuous improvement process driven by incident learnings is in place, with full detection-and-response visibility maintained regardless of delivery model.`,
  },
];

const D6: LevelStatements[] = [
  {
    level: 1,
    A: `I back things up here and there when I remember, but there's no real system, and no plan for what to do if I lost my social media accounts.`,
    B: `Backups happen occasionally and manually where they happen at all, and there's no formal procedure for recovering lost accounts or data.`,
    C: `Backups occur ad hoc or manually where present, with no formal recovery procedure for account or data loss.`,
  },
  {
    level: 2,
    A: `My data gets backed up regularly, often through my provider, but nobody has actually tested whether I could get it all back if I needed to.`,
    B: `Regular backups happen, often managed by a provider, but the recovery process has never actually been tested and it isn't clear who would be responsible for it.`,
    C: `Regular backups occur, often provider-managed, but recovery procedures are untested and ownership of recovery execution is unclear.`,
  },
  {
    level: 3,
    A: `I have a written plan for getting back up and running if something goes wrong, including how I'd get back into my business Instagram or Facebook if I were ever locked out.`,
    B: `A documented recovery plan covers both restoring data and recovering social media or content accounts, framed around keeping the business running.`,
    C: `A documented recovery plan exists covering both data restoration and social/content platform account recovery, framed around business continuity.`,
  },
  {
    level: 4,
    A: `I've actually tried out my recovery plan to see how long it takes and whether it works, so I'm not guessing during an emergency.`,
    B: `The recovery plan is tested on a set schedule, and our recovery time objectives — how long recovery should realistically take — are understood and written down.`,
    C: `The recovery plan is tested on a defined cadence, and recovery time objectives are understood and documented.`,
  },
  {
    level: 5,
    A: `Bouncing back from a problem is something my business is genuinely ready for, no matter how big or small, and I keep improving how I'd handle it.`,
    B: `Recovery capability is continuously tested and improved, and resilience is maintained no matter how much the business grows or changes.`,
    C: `Recovery capability is continuously tested and improved, with resilience maintained independent of business scale or growth.`,
  },
];

export const ASSESSMENT_ITEMS: AssessmentItemRow[] = [
  ...expand("D1", D1),
  ...expand("D2", D2),
  ...expand("D3", D3),
  ...expand("D4", D4),
  ...expand("D5", D5),
  ...expand("D6", D6),
];
