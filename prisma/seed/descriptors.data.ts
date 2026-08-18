// Full Annex A maturity descriptors — transcribed verbatim from
// CMAM_Annex_A_Full_Descriptors.docx.pdf. Do not paraphrase or regenerate this text;
// edit only by replacing with corrected verbatim text from the source document.
//
// 6 domains x 6 levels (0-5) x 3 tiers (A/B/C) = 108 rows.

import type { DomainId } from "../../src/lib/alita/domains";

export type DescriptorTier = "A" | "B" | "C";

export interface DescriptorRow {
  domainId: DomainId;
  level: number;
  tier: DescriptorTier;
  text: string;
}

interface LevelRow {
  level: number;
  A: string;
  B: string;
  C: string;
}

function expand(domainId: DomainId, rows: LevelRow[]): DescriptorRow[] {
  return rows.flatMap((row) => [
    { domainId, level: row.level, tier: "A" as const, text: row.A },
    { domainId, level: row.level, tier: "B" as const, text: row.B },
    { domainId, level: row.level, tier: "C" as const, text: row.C },
  ]);
}

const D1: LevelRow[] = [
  {
    level: 0,
    A: `Nobody in the business has really thought about security or data protection as "their job", there's no plan and no one person responsible for it.`,
    B: `No one has been assigned responsibility for security or data protection (governance, deciding who owns these decisions), and there's no awareness of what the Data Protection Act (Kenya's data privacy law) requires.`,
    C: `No security ownership assigned; no governance structure exists; no organisational awareness of Data Protection Act obligations.`,
  },
  {
    level: 1,
    A: `You've heard of the Data Protection Act but haven't looked into whether it applies to you or done anything about it yet.`,
    B: `The owner knows the Data Protection Act (DPA) exists, but no one has checked whether the business needs to register with the ODPC (Office of the Data Protection Commissioner) or qualifies for the small-business exemption. Nothing is written down.`,
    C: `DPA awareness exists at owner level but no formal evaluation of applicability (registration/exemption status); no documented policy.`,
  },
  {
    level: 2,
    A: `You've checked whether the small-business exemption applies to you, or your IT provider says they've "got it covered", but nothing is written down and you haven't registered yet.`,
    B: `You've checked whether you qualify for the DPA exemption (turnover under KES 5M and fewer than 10 employees, unless your sector must register regardless) but you haven't registered or written a policy, and if a provider handles compliance, you lack visibility into what they've set up.`,
    C: `Exemption status evaluated against the KES 5M turnover / 10-employee dual test and sector overrides; where compliance is outsourced, no owner-level visibility into what the provider has configured.`,
  },
  {
    level: 3,
    A: `You're registered with the ODPC (or you've confirmed you're exempt), you have a simple written note on how you handle customer data, and you can explain in your own words what your IT provider takes care of.`,
    B: `You're registered with the ODPC (or hold documented proof of exemption), you have a written policy for handling customer data, and you understand without needing your provider to explain it each time what controls (safeguards) they manage on your behalf.`,
    C: `ODPC registration completed or exemption formally documented; written data-handling policy exists; owner can articulate provider-managed controls without relying on the provider to explain them.`,
  },
  {
    level: 4,
    A: `You look over your data-handling notes at least once a year and update them, and if you start doing something new with sensitive customer data, you think it through before you start.`,
    B: `Your policy is reviewed and updated every year, and for anything higher-risk you do with sensitive data, you carry out a Data Protection Impact Assessment (DPIA), a structured check of the privacy risks before you start.`,
    C: `Policy reviewed and updated annually; Data Protection Impact Assessments conducted for higher-risk processing activities identified in Risk Management (D2).`,
  },
  {
    level: 5,
    A: `Looking after data and security is just part of how the business runs, no matter who's doing the technical work day to day.`,
    B: `Governance (ownership of security and compliance decisions) is built into how the business runs and reviewed continuously, with full DPA/ODPC compliance maintained and documented whether IT is handled in-house or outsourced.`,
    C: `Governance is embedded in operations and reviewed continuously; full DPA/ODPC compliance is maintained and documented regardless of internal or outsourced IT delivery model.`,
  },
];

const D2: LevelRow[] = [
  {
    level: 0,
    A: `You don't really have a list of what customer information or systems you have, or which ones would hurt the most to lose.`,
    B: `There's no inventory (list) of the systems and data you hold, and no prioritisation of which risks matter most.`,
    C: `No asset or data inventory exists; no risk prioritisation has been performed.`,
  },
  {
    level: 1,
    A: `You have a rough idea in your head of what's most important, but it's not written down anywhere.`,
    B: `You have an informal sense of what data and systems matter most, but nothing is documented or classified (sorted by sensitivity/importance).`,
    C: `Informal, undocumented awareness of critical data/systems; no structured classification.`,
  },
  {
    level: 2,
    A: `You (or your IT provider) have some idea of what systems and data you use, but it's not organised by how sensitive or risky it is.`,
    B: `A basic list of your systems and data exists, but it isn't classified by sensitivity (how damaging a leak would be), and if your provider holds this list, you haven't reviewed it yourself.`,
    C: `A basic asset/data list exists but lacks sensitivity classification; may reside with an outsourced provider without owner-level review.`,
  },
  {
    level: 3,
    A: `You know which types of information you hold would be the most damaging if lost or leaked like ID numbers, payment details, or health/HR records and you treat those more carefully.`,
    B: `Your data is classified by sensitivity level (how much harm exposure would cause), and sector-specific risk categories relevant to your business type: HR/employment data, guest/hospitality data, client documents, or logistics/payment data are explicitly identified.`,
    C: `Data assets are classified by sensitivity level; sector-specific risk categories (HR/employment, guest/hospitality, client documents, logistics/payment data, per Organisational Profile business type) are explicitly identified.`,
  },
  {
    level: 4,
    A: `You check in on your risks regularly, and you've actually asked your platforms and providers how they protect your data instead of just assuming it's fine.`,
    B: `You review your risk register (a log of identified risks) on a set schedule, and you independently verify rather than just assume how your third-party platforms and providers protect your data.`,
    C: `Risk register reviewed on a defined cadence; third-party and provider security practices are independently verified rather than assumed.`,
  },
  {
    level: 5,
    A: `As the business grows or changes what it does, you automatically think about what new risks that brings it's second nature.`,
    B: `Risk management is continuous and backed by data, and any new system, connected device, or change to how the business operates automatically triggers a fresh risk review.`,
    C: `Risk management is continuous and quantitatively informed; new systems, connected devices, or business-model changes trigger automatic reassessment.`,
  },
];

const D3: LevelRow[] = [
  {
    level: 0,
    A: `Passwords are shared or reused, and you don't really have a list of what accounts the business even has.`,
    B: `There's no access control (rules for who can get into what), passwords are shared or reused, and there's no inventory (list) of accounts.`,
    C: `No access control; shared/reused credentials; no account inventory.`,
  },
  {
    level: 1,
    A: `Whatever login protection Instagram, WhatsApp, or Google throws at you by default is all you have, you haven't turned anything on yourself.`,
    B: `MFA/2FA (multi-factor authentication — a second login step beyond just a password) is only active where the platform forces it by default, like Google Workspace or banking apps, it isn't a deliberate business decision.`,
    C: `MFA/2FA present only where enforced by platform default (e.g., Google Workspace, banking apps); not a deliberate policy decision.`,
  },
  {
    level: 2,
    A: `You've turned on extra protection for some important accounts, but not consistently, and if a provider set some of it up you're not totally sure what they did.`,
    B: `MFA (extra login protection) is turned on for some accounts but not consistently, and where a provider manages it, you don't have visibility into exactly how it's configured.`,
    C: `MFA applied inconsistently across accounts; where provider-managed, the owner lacks visibility into configuration.`,
  },
  {
    level: 3,
    A: `Every important account including your business Instagram and Facebook has extra login protection turned on deliberately, and you have a list of all your accounts.`,
    B: `MFA (extra login protection) is deliberately required company-wide not just where platforms force it and you have a documented inventory (list) of all accounts, including social media.`,
    C: `MFA deliberately mandated company-wide policy, not merely where platforms require it; documented account inventory including social media accounts.`,
  },
  {
    level: 4,
    A: `You have a clear plan for what to do if you ever got locked out of your business Instagram or Facebook page because losing it would mean losing the business, not just some data.`,
    B: `You have a documented recovery plan for if you lose access to a social media or content account, treated as a business-continuity risk (something that could stop the business running) rather than just a data issue.`,
    C: `Documented recovery plan exists for social media/content platform account loss, framed as business-continuity risk rather than purely a data-protection concern.`,
  },
  {
    level: 5,
    A: `All your accounts, including social media, get checked regularly, and you've actually tested your recovery plan to make sure it works.`,
    B: `You apply a zero-trust approach (verifying every access request rather than assuming trust), all accounts including social media are covered by automated access reviews, and your recovery plans have actually been tested.`,
    C: `Zero-trust approach; all accounts including social media covered by automated access reviews and tested recovery plans.`,
  },
];

const D4: LevelRow[] = [
  {
    level: 0,
    A: `Nothing at the moment keeps staff safe, and nobody's talked about it, cybersecurity can feel like something for bigger, more technical businesses, not a business like this one.`,
    B: `There's no formal awareness programme, and risks like social engineering (manipulation tactics used to trick people, e.g. fake M-Pesa prompts) and phishing (fraudulent messages designed to steal information) aren't managed or tracked at all.`,
    C: `No formal security awareness programme exists; social-engineering and phishing risk is unmanaged and unmeasured; no organisational engagement with the topic.`,
  },
  {
    level: 1,
    A: `You've mentioned things like fake M-Pesa messages to your staff casually, and they know to be careful but there's been no real sit-down training.`,
    B: `Risks have been discussed informally, and staff show basic awareness for example, declining unexpected M-Pesa STK-push prompts (fraudulent payment requests) even without formal training.`,
    C: `Informal risk discussion has occurred; staff demonstrate baseline awareness (e.g., declining unsolicited M-Pesa STK prompts) without formal training delivery.`,
  },
  {
    level: 2,
    A: `People in the business are starting to notice when something looks off; a strange message, a weird login attempt but there's no set way of dealing with it or telling you about it.`,
    B: `Staff are getting better at noticing when something looks suspicious, but there's no set process for reporting it or escalating (passing it up) to someone who can act.`,
    C: `Staff risk-recognition is improving informally, but no structured reporting pathway or escalation process exists.`,
  },
  {
    level: 3,
    A: `Once a year, everyone sits down for 30 minutes to go through the basics spotting fake M-Pesa messages, protecting the business Instagram/WhatsApp login, and knowing who to tell if something looks wrong.`,
    B: `An annual training session covers social-engineering tactics (manipulation used to trick staff), including M-Pesa STK-push fraud, plus account-recovery steps. Attendance is logged and the content is reviewed each year.`,
    C: `An annual awareness session is delivered covering social-engineering vectors including M-Pesa STK-push fraud and account-recovery procedures; attendance is logged and content is reviewed yearly.`,
  },
  {
    level: 4,
    A: `Training happens every few months, you occasionally test staff with a fake suspicious message to see how they react, and people feel comfortable telling you if they made a mistake.`,
    B: `Training happens quarterly, and staff are tested with simulated phishing (fake fraud messages used to practise spotting real ones); people report incidents without fear of blame, and reporting rates are tracked.`,
    C: `Quarterly training cadence; simulated phishing/fraud exercises conducted; staff report incidents without fear of blame, and reporting rates are tracked.`,
  },
  {
    level: 5,
    A: `Security is just part of how the business works. New hires learn it from day one, and everyone feels comfortable flagging anything odd without worrying about getting in trouble for it.`,
    B: `Awareness is built into onboarding for new hires and reinforced through ongoing simulated exercises; both how often incidents are reported and how quickly are tracked and used to improve training, regardless of business size.`,
    C: `Awareness is embedded in onboarding and reinforced through ongoing simulated exercises; incident-reporting rates and time-to-report are tracked and used to refine training content, regardless of business size.`,
  },
];

const D5: LevelRow[] = [
  {
    level: 0,
    A: `If something went wrong, you'd probably only find out by accident there's no plan and nobody's really watching for problems.`,
    B: `There's no monitoring or detection capability (ability to notice something's wrong) and no incident response plan; if IT is outsourced, you'd only find out about an incident if the provider happened to tell you.`,
    C: `No monitoring or detection capability; no incident response plan; where IT is outsourced, awareness of incidents is entirely dependent on provider disclosure.`,
  },
  {
    level: 1,
    A: `Staff know to tell you (or your IT provider) if something seems wrong, but nobody's actively checking for problems before they're reported.`,
    B: `Staff know to escalate (report upward) to the owner or provider if something seems wrong, but there's no proactive monitoring, and no visibility into what the provider is detecting on their end.`,
    C: `Staff know to escalate to owner or provider; no proactive monitoring or visibility into provider-side detection.`,
  },
  {
    level: 2,
    A: `You have a simple list of what to do if something goes wrong, and you've asked your IT provider exactly what they're watching for on your behalf.`,
    B: `A basic incident response checklist exists, and the owner has asked for and received documented information on exactly what the provider is monitoring for.`,
    C: `Basic incident response checklist exists; owner has requested and received documented visibility into provider-side monitoring scope.`,
  },
  {
    level: 3,
    A: `You know what your provider is watching for, and if a data breach happened, you know you need to tell the ODPC within 72 hours and you know who in the business would actually do that.`,
    B: `The owner has confirmed visibility into what the provider monitors, and everyone knows about the 72-hour rule, the legal requirement to notify the ODPC (data protection regulator) within 72 hours of a breach with a named person responsible for doing it.`,
    C: `Owner has confirmed visibility into provider monitoring; the 72-hour ODPC breach-notification obligation is known, with a named point of contact for execution.`,
  },
  {
    level: 4,
    A: `You have a written plan for handling incidents, your provider or team reports to you regularly, and after anything happens you look at why it happened, not just fix it and move on.`,
    B: `A formal incident response plan is documented, the provider or internal team reports on a regular schedule, and after any incident a root-cause review (figuring out why it actually happened) is carried out.`,
    C: `Formal incident response plan documented; regular reporting cadence from provider or internal team; root-cause review conducted post-incident.`,
  },
  {
    level: 5,
    A: `Every incident big or small makes the business better prepared for next time, and you have full visibility no matter who's doing the technical work.`,
    B: `Lessons from each incident continuously improve the process, and full visibility into detection and response is maintained whether IT is handled in-house or outsourced.`,
    C: `Continuous improvement process driven by incident learnings; full detection and response visibility maintained regardless of internal or outsourced delivery model.`,
  },
];

const D6: LevelRow[] = [
  {
    level: 0,
    A: `If you lost your data or got locked out of an account, you'd have nothing to fall back on; no backup, no plan.`,
    B: `There's no backup strategy and no business continuity plan (a plan for keeping the business running) or disaster recovery plan (a plan for restoring systems after a major incident).`,
    C: `No backup strategy; no business continuity or disaster recovery plan exists.`,
  },
  {
    level: 1,
    A: `You back things up here and there when you remember, but there's no real system, and no plan for what to do if you lost your social media accounts.`,
    B: `Backups happen occasionally and manually where they happen at all, and there's no formal procedure for recovering lost accounts or data.`,
    C: `Backups occur ad hoc/manually where present; no formal recovery procedure for account or data loss.`,
  },
  {
    level: 2,
    A: `Your data gets backed up regularly often through your provider but nobody's actually tested whether you could get it all back if you needed to.`,
    B: `Regular backups happen, often managed by a provider, but the recovery process has never actually been tested, and it isn't clear who would be responsible for carrying it out.`,
    C: `Regular backups occur, often provider-managed, but recovery procedures are untested; ownership of recovery execution is unclear.`,
  },
  {
    level: 3,
    A: `You have a written plan for getting back up and running if something goes wrong including getting back into your business Instagram or Facebook if you were ever locked out.`,
    B: `A documented recovery plan covers both restoring data and recovering social media/content accounts, framed around keeping the business running (business continuity) rather than just data.`,
    C: `Documented recovery plan exists covering both data restoration and social/content platform account recovery, framed around business continuity.`,
  },
  {
    level: 4,
    A: `You've actually tried out your recovery plan to see how long it takes and whether it works, so you're not guessing during an emergency.`,
    B: `The recovery plan is tested on a set schedule, and recovery time objectives (how long recovery should realistically take) are understood and written down.`,
    C: `Recovery plan tested on a defined cadence; recovery time objectives are understood and documented.`,
  },
  {
    level: 5,
    A: `Bouncing back from a problem is something the business is genuinely ready for, no matter how big or small it is, and you keep improving how you'd handle it.`,
    B: `Recovery capability is continuously tested and improved, and resilience (the ability to bounce back) is maintained no matter how much the business grows or changes.`,
    C: `Recovery capability is continuously tested and improved; resilience is maintained independent of business scale or growth.`,
  },
];

export const DESCRIPTORS: DescriptorRow[] = [
  ...expand("D1", D1),
  ...expand("D2", D2),
  ...expand("D3", D3),
  ...expand("D4", D4),
  ...expand("D5", D5),
  ...expand("D6", D6),
];
