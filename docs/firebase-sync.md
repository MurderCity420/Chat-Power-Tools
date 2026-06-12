# Firebase Sync

[← Back to README](../README.md) · [All docs](getting-started.md)

**Firebase sync** keeps your Chat Power Tools settings — your user lists (Alerts / Ignored / Blocked tiers, favorites), colors, aliases, and preferences — in sync across every browser and computer you use, in near real time, through your own free Google Firebase database.

It lives on the **Data** tab, under **Google Firebase sync**.

> **Do you need this?** If you only use one browser, you don't. For a simpler hands-off backup, or to move settings between two browsers occasionally, the file **Download / Upload Settings** buttons (also on the Data tab) are enough. Firebase is for live, automatic, multi-device sync.

> While Firebase sync is **enabled**, the older profile-field backup is paused — Firebase becomes the single source of truth.

> **Per-account storage:** your data is stored under `cpt/<your-username>` in the database — each chat account gets its own branch (meta / settings / users / logs). This means **multiple chat accounts can share one Firebase database/connection**, since they never collide. The script only connects **after you log in to chat**.

---

## What gets synced

| Synced | Not synced |
|---|---|
| Tier (Alerts / Ignored / Blocked) | Moderator / model flags |
| Favorites | Hashid, friend-relationship IDs |
| Custom colors & aliases | Friend flag (rebuilt from your Stars list) |
| Rename history & UIDs | Country |
| General settings (toggles, preferences) | Firebase credentials *(device-local, never uploaded)* |

**Guests are never synced** — their accounts are temporary and their IDs get recycled.

Your Firebase **credentials stay on the device you typed them into**. They are never written to the database, never included in a settings export, and never synced.

---

## One-time Firebase setup (free)

This takes about five minutes. You only do it once; afterward every device just needs the same four values.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with any Google account.
2. Click **Add project**, give it a name (e.g. `cpt-sync`), **disable Google Analytics**, and create it.

### 2. Create the Realtime Database

3. In the left sidebar, open **Build → Realtime Database**, then click **Create Database**.
4. Pick the server location closest to you and choose **Start in test mode**, then enable it.

> You'll lock the database down properly in step 5 — test mode just gets it created.

### 3. Enable Email/Password sign-in

5. In the left sidebar, open **Build → Authentication** and click **Get started**.
6. Enable the **Email/Password** provider and save.
7. Open the **Users** tab, click **Add user**, and enter any email and password (e.g. `cpt@cpt.local` / a password you'll reuse on each device). This is the login Chat Power Tools uses — it does **not** have to be a real email address.

### 4. Get your API key and database URL

8. Click the ⚙️ gear icon → **Project settings**.
9. Scroll to **Your apps**, click the web icon **`</>`**, and register an app named `cpt`.
10. From the config block shown, copy the **`apiKey`** and the **`databaseURL`** values.

> The database URL looks like `https://your-project-default-rtdb.firebaseio.com`. Make sure it's the **Realtime Database** URL, not a Firestore one.

### 5. Lock down the security rules

11. Go back to **Realtime Database → Rules** and replace the rules with:

```json
{
  "rules": {
    "cpt": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

12. **Publish** the rules.

> ⚠️ Set the rules **before** running setup in the next section. If they're still in default/locked mode, every write fails with a permission error.

---

## Connect Chat Power Tools

1. Open the **Power Tools** panel → **Data** tab.
2. Tick **Enable Google Firebase sync**.
3. Paste your four values:
   - **Firebase API Key**
   - **Database URL**
   - **Email** (the one you created in step 3)
   - **Password**
4. Click **Save Credentials**. The status line should turn green: **✅ Connected**. *(Saving, Importing, and Exporting credentials work any time — they don't require being logged in to chat.)*
5. **Make sure you're logged in to chat**, then click **Setup Database**. Watch the step-by-step log:

> **Database operations require being logged in to chat.** Setup Database, Push, Pull, Sync Now, Export Firebase Backup, and Reset Firebase DB are blocked (with a warning) until you log in, because the data path is keyed to your chat username. Only *Save / Import / Export credentials* work while logged out.

```
✅ Test connection — Authenticated
✅ Database structure — Created (v1)
✅ Migrations — Up to date
✅ Data migration — Migrated N user(s)
✅ Verification — Read/write confirmed
```

If any step shows ❌, it names the exact failure — see [Troubleshooting](#troubleshooting) below.

6. On every **other** device, repeat "Connect Chat Power Tools" with the **same four values**. Each device does a one-time pull of the shared data on login.

---

## Day-to-day sync

Once connected, sync is automatic:

- **Auto-sync interval** — choose how often local changes are pushed (`Off`, 30 s, 1 min, 5 min, 15 min). Default is 1 minute.
- Every change you make is saved locally **instantly** and queued for the next push, so the tool always works even if Firebase is unreachable.
- **On login**, each device does a one-time **pull** (Firebase → local) of users and settings and merges it — **the newest change to each record wins**.
- The recurring auto-sync timer is **push-only** (local → Firebase); it does **not** auto-pull. To bring down newer users/settings from another device, **reload** the page or use the **Pull FB → Local** button.
- The **"Last sync"** time updates on every auto-sync tick (even when nothing changed), so it always reflects the most recent push.

> The diagnostic log is also pushed to Firebase on every sync tick — see [Log sync](#log-sync) below.

### Manual controls

| Button | What it does |
|---|---|
| **Sync Now** | Pull, merge (newest wins per record), then push. |
| **Push Local → FB** | Overwrite Firebase with this device's settings. *(Confirmation required.)* |
| **Pull FB → Local** | Overwrite this device's settings with Firebase. *(Confirmation required.)* |

> Use **Push/Pull** only when you deliberately want one side to win wholesale — for normal use, the automatic merge and **Sync Now** are what you want.

---

## Log sync

When Firebase sync is enabled, your diagnostic log is also backed up. On every auto-sync tick the local log is pushed to Firebase under `cpt/<your-username>/logs` — **one-way (local → Firebase)** by default.

To bring log entries *down* from Firebase, use the **↓ Pull Logs** button on the **[Log](logs-and-sync.md)** tab (only shown when Firebase is enabled). It pulls log entries from Firebase and merges them into your local log, **deduped by timestamp** and kept within the same 3-day retention window. This is handy for gathering logs from another device onto the one you're looking at.

---

## Danger zone

- **Export Firebase Backup** — downloads your account's Firebase data as a JSON file (`cpt-firebase-backup-YYYY-MM-DD.json`).
- **Reset Firebase DB** — wipes your account's `cpt/<your-username>` node in Firebase. You must type `RESET` to arm the button. After resetting, click **Setup Database** to recreate the structure.

> Both buttons require being logged in to chat (the data path is keyed to your username).

---

## Cost

Everything above runs comfortably inside Firebase's free **Spark** plan — a heavy month is a few hundred batched writes and reads against daily limits of tens of thousands, and total storage is well under 100 KB. You will not be billed.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| ❌ on **Test connection** | Wrong API key, email, or password. Re-check the values; confirm the user exists under **Authentication → Users**. |
| ❌ on **Verification** / `403` / permission denied | Security rules not published, or not matching the `cpt` node. Re-do [step 5](#5-lock-down-the-security-rules). |
| Status stuck on **⚠️ Credentials not configured** | One of the four fields is empty. Fill all four and click **Save Credentials**. |
| Writes seem to do nothing | Make sure the **Database URL** is the Realtime Database URL (ends in `firebaseio.com`), not a Firestore URL. |
| Changes not appearing on another device | Confirm both devices use the **same four credentials** and that **Enable Google Firebase sync** is ticked on both. Try **Sync Now**. |

Watch the **[Log](logs-and-sync.md)** tab — Firebase actions are logged with a `Firebase` prefix.

---

**Related:** [Syncing your settings](syncing-settings.md) for file-based backup · [Log & Sync](logs-and-sync.md) to see sync activity · [Getting Started](getting-started.md) for the panel overview.
