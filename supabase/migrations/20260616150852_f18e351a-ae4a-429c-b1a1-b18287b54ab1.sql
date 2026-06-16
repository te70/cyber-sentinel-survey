
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Responses (server-only)
CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash text NOT NULL,
  phone_encrypted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  consented_at timestamptz,
  screened_in boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  screening jsonb,
  section_a jsonb,
  section_b jsonb,
  section_c jsonb,
  section_d jsonb,
  mpesa_payout_status text NOT NULL DEFAULT 'pending',
  mpesa_transaction_id text,
  mpesa_last_error text,
  ip_address text,
  user_agent text
);
CREATE UNIQUE INDEX responses_phone_completed_uniq
  ON public.responses (phone_hash) WHERE completed = true;
CREATE INDEX responses_phone_hash_idx ON public.responses (phone_hash);
CREATE INDEX responses_completed_idx ON public.responses (completed);
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
-- No policies => no access for anon/authenticated; service_role bypasses RLS.

-- Payout audit log
CREATE TABLE public.payout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  conversation_id text,
  originator_conversation_id text,
  status text NOT NULL DEFAULT 'pending',
  amount integer NOT NULL,
  raw_request jsonb,
  raw_response jsonb,
  result_payload jsonb
);
CREATE INDEX payout_attempts_response_idx ON public.payout_attempts (response_id);
CREATE INDEX payout_attempts_convo_idx ON public.payout_attempts (conversation_id);
GRANT ALL ON public.payout_attempts TO service_role;
ALTER TABLE public.payout_attempts ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER responses_touch_updated_at BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public counter (callable by anon; bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_completed_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int FROM public.responses WHERE completed = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_completed_count() TO anon, authenticated;
