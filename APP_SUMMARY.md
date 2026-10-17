# CAPartner App Summary (for backend planning)

## 1. Tech stack and where data comes from now

**Stack**
- Flutter (Dart). It is a mobile app only; this repo has an Android folder and no web app.
- Packages: `flutter_svg` (icons) and `camera` (phone camera).
- Android asks for one permission: CAMERA.

**Where data comes from today**
- There is no backend. There is no Firebase, no API and no HTTP library.
- Accounts are kept in memory by `AccountStore` (`lib/features/auth/account_store.dart`). Everything is lost when the app closes.
- Readings, locations, alerts, other users and Bluetooth devices are all fake values written into the code.
- The only real data is the phone camera's live view and the videos it records. Videos are saved on the phone and only listed for the current session.

## 2. User roles and login

**Roles in the app**
- There is only **one role**: the cap wearer (an "enforcer" on duty).
  - Can see: their own vitals, location, alerts, the map of other enforcers, the camera, and their account.
  - Can do: sign up, log in, pair a cap, record video, filter alerts, edit their profile, change the paired cap, log out.

**Roles that are only mentioned, with no screens**
- **Admin**: alerts say "Acknowledged by Admin Reyes". The privacy policy says "authorized administrators of your station" can see the data.
- **Responder**: alerts say "responder dispatched".
- **Other enforcers**: they appear on the map as "Enforcer 01" and "Enforcer 02".

The backend will probably need an admin/station role and a station or team grouping, even though the app has none yet.

**How login works now**
1. The app always opens on the Splash screen. Tapping it starts **sign up**, even if you have an account (there is no saved session).
2. Sign up: Email → 6-digit code → create password → Login screen.
3. Login: email and password. The field says "Email / Username", but only email works.
4. On the first login with a new account, a 6-digit code is asked for again. After that it is skipped.
5. Login → Welcome screen (2 seconds) → Pairing (if no cap is paired yet) → Home tabs.
6. Forgot password: Email (must already exist) → code → new password → Login.

**Things that are fake about login**
- Any 6 digits are accepted as the code. No email is ever sent, and "Resend OTP" does nothing.
- "Remember me" is shown but never used.
- Passwords are stored as plain text in memory.

**Rules**
- Email must be a valid address from an allowed provider: gmail, yahoo, outlook, hotmail, live, msn, icloud, me, aol, proton, or any `*.gov.ph` / `*.gov.com`.
- Password: at least 8 characters, with an uppercase letter, a lowercase letter, a number and a special character.
- Contact number: optional. If given, it must be a PH mobile number (`09…` or `+639…`, 11 digits after the prefix).
- Name: at least 2 characters (checked on Edit Profile).

## 3. Screens

| Screen | Data shown | User actions |
|---|---|---|
| Splash | Logo, tagline | Tap to continue (goes to sign up) |
| Email (sign up / forgot password) | — | Enter email, Continue |
| OTP Verification | — | Enter 6 digits, Verify, Resend OTP (30s wait) |
| Create / Update Password | — | Enter and confirm password, Submit |
| Login | — | Email, password, Remember me, Forgot Password, Continue |
| Login OTP (first login) | — | Enter code, Verify, Resend |
| Welcome | User's first name | None (moves on by itself) |
| Pairing step 1 | Instructions | Start Scanning (shows a "Turn on Bluetooth" dialog) |
| Pairing step 2 | Found devices: name, type, signal 1–4 | Select a device, Pair Device |
| Pairing step 3 | Device name, sensors, battery, link | Go To Dashboard |
| Home frame (header + status bar) | Greeting + first name, cap ID, Bluetooth / cellular status, cap battery % | Switch tabs |
| Dashboard tab | Heart rate (BPM + status), body temperature (°C + status), motion status, location + "updated X ago" | SOS button (**does nothing yet**) |
| Map tab | Map image with pins; list of users with name, address, cap ID, status | None ("STATUS" and "Refresh" are plain labels) |
| Camera tab | Location, live camera view, recording timer, clips recorded this session | Start/stop recording, switch camera |
| Alerts tab | Alerts grouped by day: type, source, time, title, detail, "Acknowledged" | Filter: All / Auto / Manual / System |
| Account tab | Name, email, contact number, cap name, battery, connection | Edit Profile, Battery details, Connection details, Manage Pairing, Read Full Policy, Log out |
| Battery dialog | Device, battery %, "Not charging", "About 5 hours" left | Close |
| Connection dialog | Device, Bluetooth, cellular, LoRa relay status | Close |
| Edit Profile | Name, email, password, contact number | Save (asks to confirm), Cancel |
| Privacy Policy | Fixed policy text | Acknowledge |

## 4. Data used in the app

**User / Account**

| Field | Type | Required | Example |
|---|---|---|---|
| email | text (unique, case-insensitive) | yes | `juan@gmail.com` |
| password | text (should be hashed) | yes | `Passw0rd!` |
| name | text | no at sign up; yes on Edit Profile | `Juan Dela Cruz` |
| contactNumber | text | no | `09171234567` |
| verifiedOnLogin | true/false | yes (default false) | `false` |
| pairedCap | text (cap name) | no | `CAP-001` |
| rememberMe | true/false | collected but unused | `true` |

**Smart Cap (device)**

| Field | Type | Required | Example |
|---|---|---|---|
| name | text | yes | `CAP-001` |
| serial / ID suffix | text | yes | `PSTMD-2026-084` (fixed in code) |
| description | text | yes | `CAPartner Smart Cap` |
| isSmartCap | true/false | yes | `true` |
| signalBars | whole number 1–4 | yes | `4` |
| batteryPercent | whole number 0–100 | yes | `70` |
| chargingStatus | text | yes | `Not charging` |
| estimatedTimeLeft | text or minutes | no | `About 5 hours` |
| sensorsStatus | text | yes | `idle` |
| bluetoothStatus | choice | yes | `Connected · Strong` |
| cellularStatus | choice | yes | `Disconnected` |
| loraRelayStatus | choice | yes | `Standby` |

**Vital reading**

| Field | Type | Required | Example |
|---|---|---|---|
| heartRate | whole number (BPM) | yes | `80` |
| heartRateStatus | choice | yes | `Normal` |
| bodyTemperature | decimal (°C) | yes | `38.3` |
| temperatureStatus | choice | yes | `Normal` |
| motionStatus | choice | yes | `Stationary` |
| activityStatus | choice | yes | `Active` |
| recordedAt | date-time | yes | `updated 2s ago` |

**Location**

| Field | Type | Required | Example |
|---|---|---|---|
| address | text | yes | `Vicas Market, Camarin Road` |
| lat / lng | decimal | needed (the app uses fixed pixel spots today) | — |
| status | choice | yes | `Active` |
| updatedAt | date-time | yes | `updated 12s ago` |

**Alert**

| Field | Type | Required | Example |
|---|---|---|---|
| type | choice: auto / manual / system | yes | `manual` |
| createdAt (shown as day + time) | date-time | yes | `Today, 4:11 PM` |
| title | text | yes | `Manual SOS sent` |
| detail | text | yes | `Acknowledged by Admin · responder dispatched` |
| source | text (user or cap) | no (system alerts have none) | `You`, `CAP 002` |
| fromMe | true/false | yes | `true` |
| acknowledged / by whom | true/false + user | implied | `Admin Reyes` |
| responderDispatched | true/false | implied | `true` |

**Other enforcer (map list)**

| Field | Type | Required | Example |
|---|---|---|---|
| name | text | yes | `Enforcer 01` |
| address | text | yes | `Almar Zabarte, Camarin Road` |
| capId | text | yes | `CAP 002 - PSTMD-2026-085` |
| position | coordinates | yes | (fixed pixel spot today) |
| status | choice | yes | `CONNECTED` |

**Video clip**

| Field | Type | Required | Example |
|---|---|---|---|
| path / file | file (video, no audio) | yes | local phone path |
| recordedAt | date-time | yes | `09:51 AM` |

**OTP code**: 6 digits, required, for example `123456`.

## 5. Actions that create, edit or delete data

- **Create account** (sign up).
- **Verify email** on first login (sets `verifiedOnLogin`).
- **Reset password** (Forgot Password).
- **Update profile**: name, email (must not be taken), contact number, and password (optional).
- **Pair cap / change paired cap.**
- **Record video** (creates a clip).
- **Send SOS** (button exists but is not wired up; it should create a manual alert).
- **Log out** (only goes back to Login; nothing is saved or cleared).
- Implied but no screen: delete account (the privacy policy says to ask an admin), acknowledge an alert (an admin action).
- There is no delete action in the app.

## 6. Things that need live updates

- Vitals: heart rate, temperature, motion ("updated 2s ago").
- Own location and other enforcers' locations on the map.
- Alerts: new SOS, auto-detected alerts, admin acknowledgement, responder dispatched.
- Cap status: battery, Bluetooth, cellular, LoRa relay.
- Online/connected status of other users on the map.
- There is no chat or messaging in the app.

## 7. Data to or from the cap / gateway

**From the cap**
- Heart rate, body temperature, motion.
- GPS location.
- Battery level and charging state.
- Auto-detected alerts (for example, "Sustained 142 BPM").
- Possibly SOS from a button on the cap. The pairing text mentions a power button only.

**Device and link info**
- Cap name, serial, signal strength.
- Link status: Bluetooth, cellular, LoRa.

**LoRa relay / mesh gateway**
- System alerts like "Internet lost for 14 minutes — vitals relayed via mesh".
- The backend should accept readings that arrive late through the gateway, with their original timestamps.

**To the cap**
- Nothing is sent today. Pairing is only a demo and never uses Bluetooth.

## 8. Extras

- **Uploads**: videos are recorded but never uploaded. The camera screen always shows "Internet connection required", so an upload to the server is planned. The policy says recordings are kept as incident records.
- **Notifications**: none. Alerts would need push notifications, and OTP codes need email delivery.
- **Maps**: a fixed image (`map_thumbnail.svg`, `map.png`) with fixed pin spots. A real map and coordinates are needed.
- **Bluetooth**: a fake scan. Real BLE pairing is needed.
- **Reports**: none in the app. The admin side would likely need alert history, vitals history and incident videos.
- **Privacy Policy**: fixed text in `privacy_policy_screen.dart`. It promises data retention rules and deletion on request.

## 9. Where fake or test data is used

- `lib/features/auth/account_store.dart`: in-memory accounts only.
- `lib/main.dart`: login accepts any OTP. Sign up always starts from Splash.
- `lib/features/home/home_screen.dart`: location `Vicas Market, Camarin Road` and battery `70`.
- `lib/features/home/home_screen.dart`: cap ID suffix `PSTMD-2026-084` is fixed.
- `home_screen.dart` status pill: "CONNECTED" and "DISCONNECTED" are always shown.
- `lib/features/dashboard/dashboard_tab.dart`: heart rate `80` and temperature `38.3`. "Stationary", "Active", "Normal" and the "updated Xs ago" text are fixed too.
- `lib/features/map/map_tab.dart`: "Me", "Enforcer 01" and "Enforcer 02" with fixed addresses, cap IDs and pin spots.
- `lib/features/alerts/alerts_tab.dart`: 4 fixed sample alerts.
- `lib/features/pairing/pairing_screen.dart`: `demoDevices` (CAP-001, CAP-014, BLE-9F2), a fake scan and timer. The summary shows "idle", "70%" and "Bluetooth · Strong".
- `lib/features/account/account_tab.dart`: "Not charging", "About 5 hours", "Connected · Strong", "Disconnected" and "Standby".
- `lib/features/camera/camera_tab.dart`: the "Internet connection required" banner is always shown.
- `assets/images/test_account.png`: placeholder profile picture.
- `test/widget_test.dart`: widget tests only, with no test data for a backend.

---

The SOS button, the OTP check and "Remember me" are the main pieces that look done but don't work yet.
