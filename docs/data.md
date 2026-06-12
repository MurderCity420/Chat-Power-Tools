# Data: backing up your settings

[← Back to README](../README.md)

The **Data** tab gives you three ways to back up and restore your Chat Power Tools settings. Each one is independent — pick the one that fits how you work.

---

## Quick comparison

| | Export / Import files | Browser cloud (Google Drive / OneDrive) | Firebase live sync |
|---|---|---|---|
| **Setup** | None | ~5 min | ~15 min |
| **Backs up** | CPT settings + full user list | All Tampermonkey scripts + settings | CPT settings + user list |
| **Live sync** | ❌ manual only | ❌ scheduled / manual | ✅ near real-time |
| **Works offline** | ✅ | ✅ (restore needs internet) | ❌ needs internet |
| **Cross-browser** | ✅ copy file anywhere | ✅ same cloud account | ✅ any browser with credentials |
| **Best for** | One-off transfers / disaster recovery | Most users wanting set-and-forget | Power users on multiple active devices |

> ⚠️ **Don't run Firebase sync and browser cloud backup at the same time.** They both write to the same stored data independently. If both are active and one device pulls from Firebase while another pushes to the cloud, they can overwrite each other. Pick one.

---

## Export and import files

The simplest option — no accounts or setup required.

**Download Settings** saves a `.json` file to your computer containing every CPT setting and your entire user list (ignored, blocked, favorites, keywords, alerts, etc.).

**Upload Settings** reads a previously downloaded `.json` file and restores it. You'll be asked to confirm before anything is overwritten.

**When to use it:**
- Moving to a new computer or browser as a one-time transfer
- Making a manual backup before a big change
- Sharing a settings template with someone else

**What it backs up:** everything Chat Power Tools stores — favorites, tiers, keywords, alerts, fan-mail templates, feature toggles, and the full user list.

**What it doesn't back up:** the Tampermonkey script itself, the diagnostic log, or any other userscripts.

---

## Browser, Google Drive or OneDrive backup

Tampermonkey can automatically sync its entire storage — including the Chat Power Tools script and all its settings — to Google Drive or OneDrive. Once set up, it runs on a schedule without any manual steps.

**When to use it:**
- You want a low-effort, always-on backup
- You already have a Google or Microsoft account
- You want the same setup on multiple computers with minimal maintenance

**What it backs up:** everything Tampermonkey stores — the CPT script, all CPT settings, and any other userscripts you have.

**What it doesn't back up:** your OMGChat login session or anything outside Tampermonkey.

**Setup:** see the full step-by-step guide → [Syncing your settings](syncing-settings.md)

Once you've finished setup, tick **"Disable warning for Browser, Google Drive or OneDrive backup"** in the Data tab to hide the reminder in the panel header.

---

## Google Firebase sync

Firebase gives you near-real-time, automatic two-way sync between browsers. When you change a setting on one device it appears on the other within seconds (depending on your auto-sync interval).

**When to use it:**
- You switch between two or more browsers/computers regularly
- You want newest-wins merging so you never have to think about which device has the "right" version

**What it backs up:** CPT settings and your user list. It does not sync the Tampermonkey script itself or other userscripts.

**What it doesn't back up:** anything outside Chat Power Tools.

**Requires:** a free Google account and a free Firebase project (Realtime Database). Takes about 15 minutes to set up.

**Per-account storage:** data is stored under `cpt/<your-username>` in the database — each chat account gets its own branch, so **multiple chat accounts can share one Firebase database/connection**. Sync only connects after you log in to chat.

**Login required for database operations:** Setup Database, Push, Pull, Sync Now, Export Firebase Backup, and Reset Firebase DB are all blocked until you're logged in to chat. Saving, Importing, and Exporting credentials work any time.

**Moving credentials between devices:** the Firebase credentials live only on the device where you enter them. Use **Export** (next to *Save Credentials*) to save a **password-encrypted** file, then **Import** it on your other devices using the same password. Set Firebase up once, then copy it everywhere.

**Setup:** see [Firebase Sync](firebase-sync.md)

> ⚠️ Don't enable Firebase at the same time as browser cloud backup. See the note at the top of this page.