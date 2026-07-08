export const SIGNAL_WEIGHTS: Record<string, number> = {
  // ── HARD BLOCKS ────────────────────────────────────────────────────────────
  duplicate_phone:               -100,
  survey_time_under_2min:        -100,
  bulk_ip_hard_block:            -100,

  // ── LAYER 1 (OTP) ──────────────────────────────────────────────────────────
  phone_verified:                 +20,

  // ── LAYER 2 (Instant) ──────────────────────────────────────────────────────
  duplicate_device:               -25,
  duplicate_email:                -30,
  duplicate_business_name:        -15,
  bulk_ip_submission:             -20,
  mild_ip_cluster:                -10,
  invalid_phone_format:           -50,
  disposable_email:               -40,
  invalid_email_format:           -20,
  invalid_website_format:         -30,
  tampered_likert_range:          -20,
  missing_required_field:         -15,
  straight_line_response:         -35,
  near_straight_line:             -20,
  impossible_employee_it:         -30,
  employee_count_year_mismatch:   -20,
  survey_time_under_4min:         -25,
  survey_time_very_long:           -5,
  not_digital_business:           -40,
  scale_confusion_suspected:      -10,

  // ── LAYER 3 (Enrichment) ───────────────────────────────────────────────────
  website_live:                   +15,
  website_live_empty:              +5,
  website_redirects:              +10,
  website_404:                    -10,
  website_server_error:            -5,
  website_unreachable:            -15,
  website_refused:                -15,
  no_website_provided:             -5,
  domain_established:             +10,
  domain_mature:                   +5,
  domain_young:                     0,
  domain_very_young:              -10,
  domain_brand_new:               -20,
  domain_whois_unavailable:         0,
  email_matches_website:          +15,
  custom_domain_email:            +10,
  free_email_provider:              0,
  disposable_email_enrichment:    -40,
  google_presence_found:          +10,
  kenya_context_confirmed:         +5,
  no_search_presence:             -10,
};

export const SCORE_THRESHOLDS = {
  autoPass: 70,
  review:   40,
} as const;

export const HARD_BLOCK_EVENTS = new Set([
  'duplicate_phone',
  'survey_time_under_2min',
  'bulk_ip_hard_block',
]);
