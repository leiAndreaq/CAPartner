-- seed_001.sql: starting data (1 station, 3 sectors, 3 caps) and links the first admin to the station.
-- Safe to run more than once: rows that already exist are skipped.
-- All or nothing: if any line fails, nothing is saved.

BEGIN;

INSERT INTO stations (name)
VALUES ('Traffic Bureau')
ON CONFLICT (name) DO NOTHING;

INSERT INTO sectors (station_id, name)
SELECT s.id, v.name
FROM stations s
CROSS JOIN (VALUES ('Sector 4 - Vicas'), ('Sector 5 - Almar'), ('Sector 6 - Zapote')) AS v(name)
WHERE s.name = 'Traffic Bureau'
ON CONFLICT (station_id, name) DO NOTHING;

-- Caps start as offline (the default). Serial numbers are added later.
-- Planned: CAP-001 for Zapote, CAP-002 for Almar, CAP-003 for Vicas (linked when each enforcer is created).
INSERT INTO caps (cap_code)
VALUES ('CAP-001'), ('CAP-002'), ('CAP-003')
ON CONFLICT (cap_code) DO NOTHING;

UPDATE admins
SET station_id = (SELECT id FROM stations WHERE name = 'Traffic Bureau')
WHERE email = 'capartnerwithus@gmail.com' AND station_id IS NULL;

COMMIT;
