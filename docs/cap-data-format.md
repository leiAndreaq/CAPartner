# Smart Cap → phone data format

How the Smart Cap hands its sensor data to the CAPartner phone app, and what the
app does with it. For the hardware team.

## The path

```
Smart Cap ──(Bluetooth)──▶ phone app ──▶ SQLite on the phone ──(when online)──▶ backend ──▶ admin
```

1. The cap sends one **packet** per reading to the phone.
2. The app checks the packet and saves it in its SQLite database right away,
   so nothing is lost when there is no signal.
3. Every minute, and right after each new packet, the app sends what is
   waiting to the backend (`POST /enforcer/telemetry`), up to 100 readings
   at a time. It keeps retrying until the backend confirms it has them.
4. The backend stores them in the `telemetry` table, linked to the enforcer
   who is logged in on the phone and the cap the admin assigned to them.

## The Bluetooth link

The cap is a Bluetooth Low Energy (BLE) server; the phone connects to it. No
system pairing ("bonding") is needed.

| What | Value |
|---|---|
| Advertised name | `CAPartner-` + the cap code, e.g. `CAPartner-CAP-001` (the app shows `CAP-001`) |
| Service UUID (advertised) | `8f3a1c20-5b7e-4d2a-9c61-0e4b7f2a1d00` |
| Readings characteristic | `8f3a1c21-5b7e-4d2a-9c61-0e4b7f2a1d00`, **notify** |

- The cap sends **each packet as one notification** on the readings
  characteristic: the whole JSON text, UTF-8.
- On connecting, the phone asks for a larger MTU, so a packet up to about
  **240 bytes** fits in one notification. Keep packets under that.
- One phone at a time: while connected, the cap stops advertising; it should
  advertise again when the phone disconnects. The app reconnects by itself
  when the link drops.
- Send one reading every **5–10 seconds**, and an SOS right away.

In the app, `BleCapRadio` (`lib/features/pairing/ble_cap_radio.dart`) does
the scan and connection, and hands each packet to
`CapData.receiveJson(packet)` in `lib/data/cap_data.dart`.

## Reading packet

One UTF-8 JSON object per packet:

```json
{
  "recordedAt": "2026-10-26T03:15:00Z",
  "heartRateBpm": 82,
  "bodyTempC": 36.8,
  "motion": "moving",
  "latitude": 14.7534,
  "longitude": 121.0437,
  "batteryPct": 70,
  "connection": "internet"
}
```

| Field | Required | Type | Allowed values |
|---|---|---|---|
| `recordedAt` | no (default: the phone's time) | ISO 8601 time, UTC (`Z`) | When the reading was taken. Must not be in the future. |
| `heartRateBpm` | no | integer | 0–300 |
| `bodyTempC` | no | number, 1 decimal | 25–45 |
| `motion` | no | string | `"moving"` or `"stationary"` |
| `latitude` | no | number | −90 to 90 |
| `longitude` | no | number | −180 to 180 |
| `batteryPct` | no | integer | 0–100 |
| `connection` | no (default `"internet"`) | string | `"internet"`, `"lora"`, `"offline"` |

- Leave out (or send `null` for) any sensor that has no value yet.
- **`recordedAt` identifies the reading.** Sending the same packet twice is
  safe: the phone and the backend both keep it once. A cap that re-sends
  after a dropped link should re-send with the **same** `recordedAt`.
- The cap needs a correct clock (e.g. from GPS) for `recordedAt`. Until it
  has one, it leaves `recordedAt` out and the phone stamps the time the
  packet arrived.
- A packet outside these rules is refused and not stored.

## SOS packet (cap button)

```json
{ "type": "sos", "holdSeconds": 3 }
```

The app raises an SOS alert to the admin (origin `cap_button`), with the
phone's GPS position (or, without one, the cap's last known position) and the
vitals from the latest reading.

## Thresholds

The admin sets the limits in the web app (`app_settings` table). The phone
fetches them on every sync and keeps them in SQLite for offline use:

| Setting | Default |
|---|---|
| Max heart rate | 120 BPM |
| Max body temperature | 38.0 °C |
| Low battery | 20 % |

When a reading's heart rate or temperature **goes over** its limit (the reading
before was under it), the app raises a health alert to the admin (origin
`vitals_rule`). Staying over does not raise more alerts; dropping back under and
going over again does. Below 40 BPM or 30.0 °C the dashboard also shows the
wearer as unstable, whatever the admin set, and a reading that drops below
them raises a health alert too.

## What is kept on the phone

SQLite file `capartner.db` in the app's private storage:

| Table | What | Kept |
|---|---|---|
| `readings` | Every packet, with its sync state | 7 days after it is sent |
| `alerts` | SOS and health alerts | Always (shown on the Alerts tab) |
| `clips` | Camera clips (the video files are in the app's storage) | Always |
| `thresholds` | The admin's limits, last fetched | Replaced on each sync |

Each record belongs to the account that was logged in when it arrived, and is
only ever sent under that account's login.

## Testing without the app

The backend endpoint can be called directly with a logged-in enforcer's token:

```
POST /enforcer/telemetry
Authorization: Bearer <token>
Content-Type: application/json

{ "readings": [ { "recordedAt": "...", "heartRateBpm": 82, ... } ] }
```

It answers `{"received": n, "saved": m}` (`m` < `n` when some were already
saved), `400` with the reason for a bad reading, or `409` when the admin has
not assigned the enforcer a cap yet.

## SOS acknowledgement

After an SOS alert is sent, the app asks `GET /enforcer/alerts/:eventUid`
every few seconds (for up to 24 hours). The backend answers with the alert's
`status` (`new`, `pending`, `acknowledged` or `resolved`) and
`acknowledgedAt`. Once the status is `acknowledged` or `resolved`, the SOS
screen shows "Admin acknowledged · Help is on the way" and the Alerts tab
marks the alert acknowledged. A 404 means "not acknowledged yet".
