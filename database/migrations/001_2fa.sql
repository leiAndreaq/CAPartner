-- CAPartner migration 001: 2FA for enforcers too
-- Run ONCE on a database built from the first schema.sql.
--   psql -U postgres -d cap_system -v ON_ERROR_STOP=1 -f 001_2fa.sql
-- All-or-nothing: if any line fails, nothing changes.
BEGIN;

-- 1. Allow 2FA login codes for enforcers (was admin-only).
--    Finds the old rule by what it says, so the name does not matter.
DO $$
DECLARE c TEXT;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'otp_codes'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%login_2fa%'
    AND pg_get_constraintdef(oid) LIKE '%admin_id IS NOT NULL%';
  IF c IS NULL THEN
    RAISE EXCEPTION 'admin-only 2FA rule not found: was this migration already run?';
  END IF;
  EXECUTE format('ALTER TABLE otp_codes DROP CONSTRAINT %I', c);
END $$;

-- 2. Codes are valid 15 minutes (was 5). Only change the row if still at the old default.
ALTER TABLE app_settings ALTER COLUMN otp_valid_minutes SET DEFAULT 15;
UPDATE app_settings SET otp_valid_minutes = 15 WHERE id = 1 AND otp_valid_minutes = 5;

-- 3. Count wrong passwords for enforcers (admins already have this).
ALTER TABLE enforcers
  ADD COLUMN failed_login_count INT NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
