// Open-source / genuinely-free tool recommendations. Every URL below was fetched and confirmed
// live, and every free/open-source claim checked, during implementation (not trusted from
// training data) — see the conversation record for the verification pass. Where a tool has paid
// tiers (SimpleRisk), the description scopes the recommendation to its genuinely-free edition
// only, never to a feature that's actually paid-gated.

import type { DomainId } from "../../src/lib/alita/domains";
import type { Tier } from "../../src/lib/alita/classification";

export type ToolType = "software" | "template" | "free_service";
export type SetupComplexity = "none" | "low" | "moderate";

export interface ToolRecommendationRow {
  domainId: DomainId;
  tier: Tier | null;
  name: string;
  url: string;
  type: ToolType;
  setupComplexity: SetupComplexity;
  shortDescription: string;
  isOpenSource: boolean;
}

export const TOOLS: ToolRecommendationRow[] = [
  // D1 — Governance & Policy
  {
    domainId: "D1",
    tier: "A",
    name: "ODPC — Register as a Data Handler",
    url: "https://www.odpc.go.ke/",
    type: "free_service",
    setupComplexity: "none",
    shortDescription:
      "Kenya's official data protection regulator. Check your registration/exemption status directly — no cost, no software.",
    isOpenSource: false,
  },
  {
    domainId: "D1",
    tier: null,
    name: "SimpleRisk",
    url: "https://simplerisk.com",
    type: "software",
    setupComplexity: "moderate",
    shortDescription:
      "Open-source GRC platform (free Core edition, self-hosted) for tracking policies and compliance status in one place.",
    isOpenSource: true,
  },

  // D2 — Risk Management
  {
    domainId: "D2",
    tier: "A",
    name: "Simple Risk Register Template",
    url: "https://www.stakeholdermap.com/risk/simple-risk-register-template.php",
    type: "template",
    setupComplexity: "none",
    shortDescription:
      "A free downloadable spreadsheet for listing risks by likelihood and impact — no software to install.",
    isOpenSource: false,
  },
  {
    domainId: "D2",
    tier: null,
    name: "OWASP Risk Rating Methodology",
    url: "https://owasp.org/www-community/OWASP_Risk_Rating_Methodology",
    type: "template",
    setupComplexity: "low",
    shortDescription:
      "A free, structured framework for rating how likely and how damaging a risk is.",
    isOpenSource: true,
  },
  {
    domainId: "D2",
    tier: null,
    name: "SimpleRisk",
    url: "https://simplerisk.com",
    type: "software",
    setupComplexity: "moderate",
    shortDescription:
      "Open-source risk register (free Core edition, self-hosted) for tracking identified risks over time.",
    isOpenSource: true,
  },

  // D3 — Access Control
  {
    domainId: "D3",
    tier: null,
    name: "Bitwarden",
    url: "https://bitwarden.com/",
    type: "software",
    setupComplexity: "none",
    shortDescription:
      "Free, open-source password manager — works on phone and computer, nothing to install to start.",
    isOpenSource: true,
  },
  {
    domainId: "D3",
    tier: "A",
    name: "Aegis Authenticator",
    url: "https://github.com/beemdevelopment/Aegis",
    type: "software",
    setupComplexity: "low",
    shortDescription: "Free, open-source two-step login (2FA) app for Android.",
    isOpenSource: true,
  },
  {
    domainId: "D3",
    tier: null,
    name: "KeePassXC",
    url: "https://keepassxc.org/",
    type: "software",
    setupComplexity: "low",
    shortDescription: "Free, open-source offline password manager — no cloud account required.",
    isOpenSource: true,
  },

  // D4 — Awareness & Training
  {
    domainId: "D4",
    tier: "A",
    name: "Google Phishing Quiz",
    url: "https://phishingquiz.withgoogle.com/",
    type: "free_service",
    setupComplexity: "none",
    shortDescription:
      "A free, no-signup interactive quiz that teaches staff to spot fake emails and messages.",
    isOpenSource: false,
  },
  {
    domainId: "D4",
    tier: null,
    name: "Have I Been Pwned",
    url: "https://haveibeenpwned.com/",
    type: "free_service",
    setupComplexity: "none",
    shortDescription:
      "Free lookup to check if a business email has appeared in a known data breach.",
    isOpenSource: false,
  },
  {
    domainId: "D4",
    tier: null,
    name: "Gophish",
    url: "https://getgophish.com/",
    type: "software",
    setupComplexity: "moderate",
    shortDescription:
      "Open-source, self-hosted framework for running your own phishing-simulation training.",
    isOpenSource: true,
  },

  // D5 — Incident Detection & Response
  {
    domainId: "D5",
    tier: "A",
    name: "ODPC — Breach Notification",
    url: "https://www.odpc.go.ke/",
    type: "free_service",
    setupComplexity: "none",
    shortDescription:
      "Kenya's official regulator — the authoritative source for the 72-hour breach-notification duty.",
    isOpenSource: false,
  },
  {
    domainId: "D5",
    tier: "C",
    name: "Wazuh",
    url: "https://wazuh.com",
    type: "software",
    setupComplexity: "moderate",
    shortDescription:
      "Open-source, self-hosted security monitoring and intrusion-detection platform.",
    isOpenSource: true,
  },

  // D6 — Recovery
  {
    domainId: "D6",
    tier: "A",
    name: "Back up files with Google Drive",
    url: "https://support.google.com/drive/answer/10838124?hl=en",
    type: "free_service",
    setupComplexity: "none",
    shortDescription:
      "Official guide to backing up your files using an existing free Google account — no new tool.",
    isOpenSource: false,
  },
  {
    domainId: "D6",
    tier: null,
    name: "restic",
    url: "https://restic.net/",
    type: "software",
    setupComplexity: "moderate",
    shortDescription:
      "Free, open-source backup tool (command-line) with encrypted, deduplicated backups.",
    isOpenSource: true,
  },
  {
    domainId: "D6",
    tier: null,
    name: "BorgBackup",
    url: "https://borgbackup.readthedocs.io/",
    type: "software",
    setupComplexity: "moderate",
    shortDescription: "Free, open-source deduplicating backup tool with encryption.",
    isOpenSource: true,
  },
];
