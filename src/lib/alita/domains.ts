// Alita/CMAM domain definitions — single source of truth for both the descriptor seed
// and the scoring engine, so weights/NIST mapping can never drift between the two.
// Transcribed from Model_Architecture.docx.pdf, Section 3.

export type DomainId = "D1" | "D2" | "D3" | "D4" | "D5" | "D6";

export interface DomainDef {
  id: DomainId;
  label: string;
  nistFunction: string;
  weight: number;
  sortOrder: number;
}

export const DOMAINS: DomainDef[] = [
  {
    id: "D1",
    label: "Governance & Policy",
    nistFunction: "GOVERN (GV)",
    weight: 0.15,
    sortOrder: 1,
  },
  { id: "D2", label: "Risk Management", nistFunction: "IDENTIFY (ID)", weight: 0.12, sortOrder: 2 },
  { id: "D3", label: "Access Control", nistFunction: "PROTECT: PR.AC", weight: 0.15, sortOrder: 3 },
  {
    id: "D4",
    label: "Awareness & Training",
    nistFunction: "PROTECT: PR.AT",
    weight: 0.25,
    sortOrder: 4,
  },
  {
    id: "D5",
    label: "Incident Detection & Response",
    nistFunction: "DETECT (DE) + RESPOND (RS)",
    weight: 0.18,
    sortOrder: 5,
  },
  { id: "D6", label: "Recovery", nistFunction: "RECOVER (RC)", weight: 0.15, sortOrder: 6 },
];

export const DOMAIN_IDS: DomainId[] = DOMAINS.map((d) => d.id) as DomainId[];

export const DOMAIN_WEIGHTS: Record<DomainId, number> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d.weight]),
) as Record<DomainId, number>;
