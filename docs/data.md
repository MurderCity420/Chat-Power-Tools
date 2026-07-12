# Data: backing up your settings

[← Back to README](../README.md)

The **Data** tab (Settings → Data) gives you three ways to back up and restore your Chat Power Tools settings, each on its own sub-tab — **Import / Export**, **Cloud Backup**, and **Firebase** — plus a **Statistics** sub-tab (the default one) with a read-only breakdown of what's stored. Don't guess which backup method to use — here's the short version:

## Which one should I use?

- **Just want a safety net in case a PC dies?** → **Tampermonkey Cloud backup** (Google Drive / OneDrive). Set it once, it runs on a schedule. → [Setup guide](syncing-settings.md)
- **Use Chat Power Tools on two or more devices and want them to stay in sync automatically?** → **Firebase live sync**. → [Setup guide](firebase-sync.md)
- **Moving to a new PC once, or want a quick manual copy before a big change?** → **Export / Import** files (below). No accounts, no setup.

You can pair **Export/Import** (a manual safety copy) with *either* of the other two. Two rules:

> ⚠️ **Don't run Firebase sync and Tampermonkey Cloud backup at the same time** — they write the same data independently and can overwrite each other. Pick one.

> ⚠️ **Don't use Tampermonkey's *Browser Sync* option for Chat Power Tools.** That feature (Settings → *Sync via browser storage*) rides on the browser's tiny sync-storage quota (~100 KB), and CPT's data — your block list, cam templates, and logs — is far larger. It can sync only partially or fail silently. Use **Cloud backup** (Google Drive / OneDrive / Dropbox / WebDAV) instead, which has no such limit. **"Cloud backup" and "Browser Sync" are different Tampermonkey features — use Cloud backup.**

---

## Quick comparison

| | Export / Import files | Tampermonkey **Cloud** backup (Google Drive / OneDrive / Dropbox) | Firebase live sync |
|---|---|---|---|
| **Type** | Manual snapshot | Scheduled snapshot backup | Live two-way sync |
| **Setup** | None | ~5 min | ~15 min |
| **Backs up** | CPT settings + full user list | All Tampermonkey scripts + settings | CPT settings + user list |
| **Merges devices?** | ❌ overwrites on restore | ❌ newest backup wins on restore | ✅ per-setting, newest-field wins |
| **Live sync** | ❌ manual only | ❌ scheduled / manual restore | ✅ near real-time |
| **Works offline** | ✅ | ✅ (restore needs internet) | ❌ needs internet |
| **Cross-browser** | ✅ copy file anywhere | ✅ same cloud account | ✅ any browser with credentials |
| **Best for** | One-off transfers / disaster recovery | Most users wanting set-and-forget backup | Power users on multiple active devices |

> ⚠️ **Don't run Firebase sync and Tampermonkey Cloud backup at the same time.** They both write to the same stored data independently and can overwrite each other. Pick one.
>
> ⚠️ **Use Tampermonkey *Cloud* backup, not Tampermonkey *Browser Sync*.** Browser Sync has a ~100 KB storage cap that Chat Power Tools' data exceeds, so it can sync only part of your settings (or none). The Cloud providers (Drive / OneDrive / Dropbox / WebDAV) have no such limit.

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

## Tampermonkey Cloud backup (Google Drive / OneDrive / Dropbox)

Tampermonkey can automatically back up its entire storage — including the Chat Power Tools script and all its settings — to a cloud drive (Google Drive, OneDrive, Dropbox, or WebDAV). Once set up, it runs on a schedule without any manual steps.

> **Use the *Cloud* backup, not *Browser Sync*.** In Tampermonkey's Settings there's both a **Cloud** backup section (this one — use it) and a **Browser Sync** / *sync via browser storage* option (don't use it for CPT — its ~100 KB cap is too small for your block list and logs). This guide uses the **Cloud** section.

**When to use it:**
- You want a low-effort, always-on backup
- You already have a Google or Microsoft account
- You want the same setup on multiple computers with minimal maintenance

**What it backs up:** everything Tampermonkey stores — the CPT script, all CPT settings, and any other userscripts you have.

**What it doesn't back up:** your Chat Site login session or anything outside Tampermonkey.

**Setup:** see the full step-by-step guide → [Syncing your settings](syncing-settings.md)

> **Shortcut to the settings page:** the Data tab has a **🔗 Tampermonkey settings link** button. It copies the correct Tampermonkey settings-page link for your browser (Chrome/Edge). Browsers don't let a web page *open* extension pages directly, so **paste the copied link into a new tab's address bar** and press Enter. On **Firefox** the link is unique to each install and can't be built, so open Tampermonkey from its **toolbar icon → Dashboard → Settings** instead.

Once you've finished setup, tick **"I've set up a cloud backup — stop reminding me"** (on the **Statistics** sub-tab, under Database statistics) to hide the reminder in the panel header and stop the login pop-up.

> **Login reminder:** if Chat Power Tools is storing more than ~100 KB in this browser and you haven't set up a backup (or enabled Firebase sync), a warning pops up shortly after you log in, offering **Cloud Backup (Recommended)** or **Firebase (Advanced)**. Its **Never show this again** checkbox does the same thing as the checkbox above.

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