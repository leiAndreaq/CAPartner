-- ============================================================================
-- CAPartner database schema (PostgreSQL 13 or newer)
--
-- Run this on an EMPTY database. It is all-or-nothing: if anything fails,
-- nothing is created, so you can fix the problem and run it again.
--
--   psql -U postgres -d cap_system -v ON_ERROR_STOP=1 -f schema.sql
--   then: psql -U postgres -d cap_system -v ON_ERROR_STOP=1 -f seed.sql
--
-- This file already includes migrations 001 and 002. Do NOT run the files in
-- migrations\ on a database built from this file. They are only for older
-- databases that were built before those changes.
--
-- Part 1: who and what     (stations, sectors, admins, caps, enforcers)
-- Part 2: what caps report (telemetry, alerts, connection events)
-- Part 3: the rest         (codes, settings, media, audit log, consent)
-- ============================================================================
BEGIN;

-- ======================= PART 1 =======================
-- CAPartner database, Step 1: who and what
-- PostgreSQL 13 or newer (gen_random_uuid is built in)

CREATE TABLE stations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  console_id  VARCHAR(30)  UNIQUE
);

CREATE TABLE sectors (
  id          SERIAL PRIMARY KEY,
  station_id  INT NOT NULL REFERENCES stations(id),
  name        VARCHAR(100) NOT NULL,
  road_area   VARCHAR(150),
  bbox_west   NUMERIC(9,6),
  bbox_south  NUMERIC(9,6),
  bbox_east   NUMERIC(9,6),
  bbox_north  NUMERIC(9,6),
  UNIQUE (station_id, name)
);

CREATE TABLE admins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id          INT REFERENCES stations(id),
  username            VARCHAR(50)  UNIQUE NOT NULL,
  password_hash       TEXT         NOT NULL,
  full_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(150) NOT NULL,
  office              VARCHAR(100),
  position            VARCHAR(100),
  failed_login_count  INT     NOT NULL DEFAULT 0,
  is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_admins_email ON admins (lower(email));

CREATE TABLE caps (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cap_code           VARCHAR(20) UNIQUE NOT NULL,
  serial_no          VARCHAR(30) UNIQUE,
  status             VARCHAR(10) NOT NULL DEFAULT 'offline'
                     CHECK (status IN ('normal','attention','offline')),
  connection         VARCHAR(10) NOT NULL DEFAULT 'offline'
                     CHECK (connection IN ('internet','lora','offline')),
  lora_relay_status  VARCHAR(10)
                     CHECK (lora_relay_status IN ('active','standby','offline')),
  battery_pct        INT CHECK (battery_pct BETWEEN 0 AND 100),
  is_charging        BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at       TIMESTAMPTZ,
  camera_online      BOOLEAN NOT NULL DEFAULT FALSE,
  stream_started_at  TIMESTAMPTZ,
  last_latitude      NUMERIC(9,6),
  last_longitude     NUMERIC(9,6)
);

CREATE TABLE enforcers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id                 INT  REFERENCES sectors(id),
  full_name                 VARCHAR(100) NOT NULL,
  email                     VARCHAR(150) NOT NULL,
  password_hash             TEXT NOT NULL,
  must_change_password      BOOLEAN NOT NULL DEFAULT TRUE,
  temp_password_expires_at  TIMESTAMPTZ,
  activated_at              TIMESTAMPTZ,
  badge_no                  VARCHAR(30) UNIQUE,
  contact_no                VARCHAR(20),
  cap_id                    UUID UNIQUE REFERENCES caps(id) ON DELETE SET NULL,
  created_by_admin_id       UUID REFERENCES admins(id),
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  failed_login_count        INT NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  is_locked                 BOOLEAN NOT NULL DEFAULT FALSE,
  device_key_hash           TEXT,          -- registered phone (empty = next login needs 2FA)
  device_registered_at      TIMESTAMPTZ,   -- logout / force logout empties both
  CONSTRAINT enforcers_device_both_or_none
      CHECK ((device_key_hash IS NULL) = (device_registered_at IS NULL))
);
-- Email is unique only among active enforcers (a deleted/hidden account frees its email).
CREATE UNIQUE INDEX idx_enforcers_email_active ON enforcers (lower(email)) WHERE is_active;
CREATE INDEX idx_enforcers_sector ON enforcers (sector_id);

-- ======================= PART 2 =======================
-- CAPartner database, Step 2: what the caps report (v2, after fixes)

CREATE TABLE telemetry (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cap_id          UUID NOT NULL REFERENCES caps(id),
  enforcer_id      UUID REFERENCES enforcers(id),   -- who wore the cap (saved when the reading arrives)
  recorded_at     TIMESTAMPTZ NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  via_gateway     BOOLEAN NOT NULL DEFAULT FALSE,
  heart_rate_bpm  INT,
  body_temp_c     NUMERIC(4,1),
  motion          VARCHAR(12) CHECK (motion IN ('moving','stationary')),
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  battery_pct     INT,
  connection      VARCHAR(10) NOT NULL
                  CHECK (connection IN ('internet','lora','offline')),
  UNIQUE (cap_id, recorded_at)
);
CREATE INDEX idx_telemetry_cap_time ON telemetry (cap_id, recorded_at DESC);
CREATE INDEX idx_telemetry_enforcer_time ON telemetry (enforcer_id, recorded_at DESC);

CREATE TABLE alerts (
  id                       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_uid                UUID,   -- made once by the sender (cap or phone) and re-sent unchanged
  type                     VARCHAR(12) NOT NULL
                           CHECK (type IN ('sos','health','connection','device','camera')),
  source                   VARCHAR(10) NOT NULL
                           CHECK (source IN ('manual','auto','system')),
  origin                   VARCHAR(12) NOT NULL
                           CHECK (origin IN ('cap_button','mobile_app','vitals_rule','system')),
  cap_id                   UUID REFERENCES caps(id),
  enforcer_id              UUID REFERENCES enforcers(id),
  title                    VARCHAR(100) NOT NULL,
  detail                   TEXT NOT NULL,
  location_text            VARCHAR(200),
  latitude                 NUMERIC(9,6),
  longitude                NUMERIC(9,6),
  heart_rate_bpm           INT,
  body_temp_c              NUMERIC(4,1),
  sos_hold_seconds         INT,
  status                   VARCHAR(12) NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new','pending','acknowledged','resolved')),
  acknowledged_by          UUID REFERENCES admins(id),
  acknowledged_at          TIMESTAMPTZ,
  responder_dispatched     BOOLEAN NOT NULL DEFAULT FALSE,
  responder_dispatched_at  TIMESTAMPTZ,
  occurred_at              TIMESTAMPTZ NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cap_id IS NOT NULL OR enforcer_id IS NOT NULL),
  CHECK ((acknowledged_by IS NULL) = (acknowledged_at IS NULL)),
  CHECK ( (origin IN ('cap_button','mobile_app') AND source = 'manual')
       OR (origin = 'vitals_rule' AND source = 'auto')
       OR (origin = 'system'      AND source = 'system') )
);
CREATE UNIQUE INDEX idx_alerts_event_uid ON alerts (event_uid);
CREATE INDEX idx_alerts_status_time ON alerts (status, created_at DESC);
CREATE INDEX idx_alerts_enforcer    ON alerts (enforcer_id, created_at DESC);
CREATE INDEX idx_alerts_cap         ON alerts (cap_id, created_at DESC);

CREATE TABLE alert_reads (
  admin_id  UUID   NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  alert_id  BIGINT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_id, alert_id)
);

CREATE TABLE connection_events (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cap_id       UUID NOT NULL REFERENCES caps(id),
  occurred_at  TIMESTAMPTZ NOT NULL,
  connection   VARCHAR(10) NOT NULL
               CHECK (connection IN ('internet','lora','offline')),
  event        VARCHAR(12) NOT NULL
               CHECK (event IN ('paired','fallback','restored')),
  reason       VARCHAR(200),
  UNIQUE (cap_id, occurred_at, event)
);
CREATE INDEX idx_conn_events_cap_time ON connection_events (cap_id, occurred_at DESC);

-- ======================= PART 3 =======================
-- Email codes (2FA for admins and enforcers, and admin email/password changes).
CREATE TABLE otp_codes (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id     UUID REFERENCES admins(id)    ON DELETE CASCADE,
  enforcer_id  UUID REFERENCES enforcers(id) ON DELETE CASCADE,
  purpose      VARCHAR(15) NOT NULL
               CHECK (purpose IN ('login_2fa','reset_password','change_email','change_password')),
  code_hash    TEXT NOT NULL,                  -- never the real code
  attempts     INT  NOT NULL DEFAULT 0 CHECK (attempts >= 0),   -- wrong tries
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((admin_id IS NULL) <> (enforcer_id IS NULL))           -- belongs to exactly one
);
CREATE INDEX idx_otp_admin    ON otp_codes (admin_id,    purpose, created_at DESC);
CREATE INDEX idx_otp_enforcer ON otp_codes (enforcer_id, purpose, created_at DESC);

-- System-wide settings: always exactly one row
CREATE TABLE app_settings (
  id                         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  low_battery_threshold_pct  INT NOT NULL DEFAULT 20
                             CHECK (low_battery_threshold_pct BETWEEN 1 AND 99),
  heart_rate_max_bpm         INT NOT NULL DEFAULT 120
                             CHECK (heart_rate_max_bpm BETWEEN 60 AND 250),
  body_temp_max_c            NUMERIC(4,1) NOT NULL DEFAULT 38.0
                             CHECK (body_temp_max_c BETWEEN 35 AND 43),
  auto_signout_minutes       INT NOT NULL DEFAULT 15
                             CHECK (auto_signout_minutes BETWEEN 1 AND 240),
  max_failed_logins          INT NOT NULL DEFAULT 3
                             CHECK (max_failed_logins BETWEEN 1 AND 10),
  otp_valid_minutes          INT NOT NULL DEFAULT 15
                             CHECK (otp_valid_minutes BETWEEN 1 AND 30),
  temp_password_valid_hours  INT NOT NULL DEFAULT 72
                             CHECK (temp_password_valid_hours BETWEEN 1 AND 336),
  updated_by_admin_id        UUID REFERENCES admins(id),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  max_enforcers              INT NOT NULL DEFAULT 3
                             CHECK (max_enforcers BETWEEN 1 AND 50)
);
INSERT INTO app_settings DEFAULT VALUES;      -- the one row

-- Each admin's own on/off switches
CREATE TABLE admin_preferences (
  admin_id               UUID PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  audible_siren          BOOLEAN NOT NULL DEFAULT TRUE,
  desktop_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  lora_fallback_alerts   BOOLEAN NOT NULL DEFAULT TRUE,
  low_battery_warnings   BOOLEAN NOT NULL DEFAULT TRUE,
  gps_sync               BOOLEAN NOT NULL DEFAULT TRUE
);

-- Videos and photos sent to the admin (sending needs internet)
CREATE TABLE media (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_uid         UUID UNIQUE,                 -- made once by the sender; a retry can't duplicate
  source            VARCHAR(5) NOT NULL CHECK (source IN ('phone','cap')),
  kind              VARCHAR(5) NOT NULL DEFAULT 'video' CHECK (kind IN ('video','photo')),
  enforcer_id       UUID REFERENCES enforcers(id),
  cap_id            UUID REFERENCES caps(id),
  alert_id          BIGINT REFERENCES alerts(id),   -- optional link to an incident
  recorded_at       TIMESTAMPTZ NOT NULL,
  duration_seconds  INT CHECK (duration_seconds >= 0),   -- empty for photos
  size_bytes        BIGINT,
  file_url          TEXT,                         -- link to the stored file, not the file itself
  upload_status     VARCHAR(10) NOT NULL DEFAULT 'uploading'
                    CHECK (upload_status IN ('uploading','uploaded','failed')),
  uploaded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((source = 'cap'   AND cap_id      IS NOT NULL)
      OR (source = 'phone' AND enforcer_id IS NOT NULL)),
  CHECK (upload_status <> 'uploaded' OR file_url IS NOT NULL)
);
CREATE INDEX idx_media_enforcer ON media (enforcer_id, recorded_at DESC);
CREATE INDEX idx_media_time     ON media (recorded_at DESC);
CREATE INDEX idx_media_alert    ON media (alert_id) WHERE alert_id IS NOT NULL;

-- Who did what. The backend should only ever add rows here.
CREATE TABLE audit_logs (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_type         VARCHAR(30) NOT NULL,       -- no strict list; the backend decides the types
  description         TEXT NOT NULL,              -- never passwords or codes
  actor_admin_id      UUID REFERENCES admins(id),
  actor_enforcer_id   UUID REFERENCES enforcers(id),
  target_enforcer_id  UUID REFERENCES enforcers(id),   -- example: the enforcer an admin created
  username_tried      VARCHAR(50),                -- for failed sign-ins by unknown names
  console_id          VARCHAR(30),                -- CALOOCAN-SSB-01
  CHECK (NOT (actor_admin_id IS NOT NULL AND actor_enforcer_id IS NOT NULL))
);
CREATE INDEX idx_audit_time   ON audit_logs (occurred_at DESC);
CREATE INDEX idx_audit_type   ON audit_logs (action_type, occurred_at DESC);
CREATE INDEX idx_audit_admin  ON audit_logs (actor_admin_id, occurred_at DESC);

-- Proof that an enforcer pressed "Acknowledge" on the Privacy Policy screen
CREATE TABLE privacy_consents (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enforcer_id     UUID NOT NULL REFERENCES enforcers(id),
  policy_version  VARCHAR(20) NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enforcer_id, policy_version)
);

COMMIT;
