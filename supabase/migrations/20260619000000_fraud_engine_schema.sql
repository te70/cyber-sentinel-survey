-- Fraud engine schema additions
-- Extends the existing `responses` table and adds OTP + audit tables.

-- ── Extend responses ─────────────────────────────────────────────────────────

ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS phone_e164           text,
  ADD COLUMN IF NOT EXISTS phone_verified       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email                text,
  ADD COLUMN IF NOT EXISTS business_name        text,
  ADD COLUMN IF NOT EXISTS website_url          text,
  ADD COLUMN IF NOT EXISTS device_hash          text,
  ADD COLUMN IF NOT EXISTS session_id           uuid,
  ADD COLUMN IF NOT EXISTS survey_started_at    timestamptz,

  -- Analysis pipeline scores
  ADD COLUMN IF NOT EXISTS maturity_score       float,
  ADD COLUMN IF NOT EXISTS barrier_score        float,
  ADD COLUMN IF NOT EXISTS usability_score      float,
  ADD COLUMN IF NOT EXISTS domain_scores        jsonb,

  -- Fraud engine
  ADD COLUMN IF NOT EXISTS fraud_score          integer,
  ADD COLUMN IF NOT EXISTS fraud_signals        jsonb,
  ADD COLUMN IF NOT EXISTS fraud_status         text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by          text,
  ADD COLUMN IF NOT EXISTS review_note          text,
  ADD COLUMN IF NOT EXISTS reviewed_at          timestamptz,

  -- Payout scheduling
  ADD COLUMN IF NOT EXISTS payout_queued_at     timestamptz,
  ADD COLUMN IF NOT EXISTS payout_released_at   timestamptz,
  ADD COLUMN IF NOT EXISTS payout_mpesa_ref     text,
  ADD COLUMN IF NOT EXISTS payout_amount        integer NOT NULL DEFAULT 100;

-- fraud_status must be one of the allowed values
ALTER TABLE public.responses
  ADD CONSTRAINT responses_fraud_status_check
  CHECK (fraud_status IN ('pending','auto_passed','in_review','approved','auto_rejected','rejected'));

CREATE INDEX IF NOT EXISTS responses_fraud_status_idx  ON public.responses (fraud_status);
CREATE INDEX IF NOT EXISTS responses_phone_e164_idx    ON public.responses (phone_e164);
CREATE INDEX IF NOT EXISTS responses_device_hash_idx   ON public.responses (device_hash);
CREATE INDEX IF NOT EXISTS responses_ip_address_idx    ON public.responses (ip_address);

-- ── OTP attempts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.otp_attempts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text        NOT NULL,
  code        text        NOT NULL,     -- SHA-256 hash of the 6-digit code; never plain text
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  verified    boolean     NOT NULL DEFAULT false,
  attempts    integer     NOT NULL DEFAULT 0,
  ip_address  text
);

CREATE INDEX IF NOT EXISTS otp_attempts_phone_idx     ON public.otp_attempts (phone);
CREATE INDEX IF NOT EXISTS otp_attempts_created_idx   ON public.otp_attempts (created_at);

GRANT ALL ON public.otp_attempts TO service_role;
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;

-- ── Fraud events (append-only audit log) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fraud_events (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id     uuid    NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  layer           integer NOT NULL,
  event_type      text    NOT NULL,
  detail          jsonb,
  score_impact    integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS fraud_events_response_idx   ON public.fraud_events (response_id);
CREATE INDEX IF NOT EXISTS fraud_events_event_type_idx ON public.fraud_events (event_type);

GRANT ALL ON public.fraud_events TO service_role;
ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;
