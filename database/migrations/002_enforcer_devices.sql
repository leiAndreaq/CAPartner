-- CAPartner migration 002: registered phones, force logout, change email/password codes, max enforcers
-- Run ONCE on a database that already has migration 001.
--   psql -U postgres -d cap_system -v ON_ERROR_STOP=1 -f 002_enforcer_devices.sql
-- All-or-nothing: if any line fails, nothing changes.
BEGIN;

-- 1. Remember the enforcer's registered phone (empty = no phone, next login needs 2FA).
--    Logout and force logout empty both columns, which ends every login pass for that enforcer.
ALTER TABLE enforcers
  ADD COLUMN device_key_hash      TEXT,
  ADD COLUMN device_registered_at TIMESTAMPTZ,
  ADD CONSTRAINT enforcers_device_both_or_none
      CHECK ((device_key_hash IS NULL) = (device_registered_at IS NULL));

-- 2. Email must be unique only among active enforcers (a deleted/hidden account frees its email).
DROP INDEX idx_enforcers_email;
CREATE UNIQUE INDEX idx_enforcers_email_active ON enforcers (lower(email)) WHERE is_active;

-- 3. Allow codes for changing the admin email and password.
--    Finds the old rule by what it says, so the name does not matter.
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'otp_codes'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%reset_password%';
  IF c IS NULL THEN
    RAISE EXCEPTION 'otp_codes purpose rule not found: was this migration already run?';
  END IF;
  EXECUTE format('ALTER TABLE otp_codes DROP CONSTRAINT %I', c);
END $$;

ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_purpose_check
      CHECK (purpose IN ('login_2fa','reset_password','change_email','change_password'));

-- 4. Maximum number of active enforcer accounts.
ALTER TABLE app_settings
  ADD COLUMN max_enforcers INT NOT NULL DEFAULT 3 CHECK (max_enforcers BETWEEN 1 AND 50);

COMMIT;
