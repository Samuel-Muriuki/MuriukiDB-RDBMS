-- Create table to store custom email OTPs
CREATE TABLE public.auth_email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup', 'recovery', 'email_change')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX idx_auth_email_otps_email_purpose ON public.auth_email_otps(email, purpose, expires_at);

-- Enable RLS but with no policies = only backend functions can access
ALTER TABLE public.auth_email_otps ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup expired OTPs (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.auth_email_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;