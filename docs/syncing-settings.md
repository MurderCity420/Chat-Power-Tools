# Syncing your settings

[← Back to README](../README.md) · [All docs](getting-started.md)

Chat Power Tools offers three ways to back up and restore your settings. This page covers **browser cloud backup** via Tampermonkey (Google Drive or OneDrive). For a side-by-side comparison of all three methods, see [Data: backing up your settings](data.md).

---

## Which method is right for me?

| | [Export / Import files](data.md#export-and-import-files) | **Browser cloud** *(this page)* | [Firebase live sync](firebase-sync.md) |
|---|---|---|---|
| Setup | None | ~5 min | ~15 min |
| Backs up | CPT settings + user list | All Tampermonkey scripts + settings | CPT settings + user list |
| Live sync | ❌ manual | ❌ scheduled / manual | ✅ near real-time |
| Best for | One-off transfers | Most users | Multiple active devices |

> ⚠️ Don't use Firebase sync and Tampermonkey Cloud backup at the same time — they can overwrite each other. Pick one.

> ⚠️ **Cloud backup ≠ Browser Sync.** Tampermonkey has *two* different features: a **Cloud** backup section (Google Drive / OneDrive / Dropbox / WebDAV — what this page sets up) and a separate **Browser Sync** / *sync via browser storage* option. **Use Cloud backup.** Browser Sync rides on the browser's ~100 KB sync-storage limit, which is far too small for Chat Power Tools' block list, cam templates, and logs — it can sync only part of your data or fail silently.

---

## Browser cloud backup (Google Drive / OneDrive)

Your Chat Power Tools settings — favorites, ignore/block tiers, keywords, alerts, fan-mail templates, and everything else — are stored **by Tampermonkey**, inside your browser. Tampermonkey can automatically **back those up to a cloud drive** and restore them on another computer or browser. This keeps your setup identical everywhere you chat.

> **You almost certainly already have one of these:**
> - If you have a **Gmail / Google** account → you have **Google Drive**.
> - If you have an **Outlook / Hotmail / Microsoft** account → you have **OneDrive**.
>
> Use whichever you already have. No new sign-ups needed.

This syncs **everything Tampermonkey stores** — the Chat Power Tools script itself *and* all of its saved settings.

> Until you've done this, the panel header shows a **⚠ Set up settings backup** reminder. Once you've finished, tick **"Disable warning for Browser, Google Drive or OneDrive backup"** in the **Data** tab to hide it.

---

## Before you start

- Tampermonkey must be installed (see [Installation](installation.md)).
- Do this on the computer that already has your settings the way you like them — that becomes the "source".
- Some cloud options only appear when Tampermonkey is in **Advanced** config mode (see the tip at the end if you don't see them).

---

## Step 1 — Open Tampermonkey's settings

1. Click the **Tampermonkey icon** in your toolbar.
2. Click **Dashboard**.
3. Click the **Settings** tab at the top.

| Tampermonkey → Dashboard → Settings |
|:---:|
| ![Tampermonkey settings tab](../screenshots/sync-settings-tab.png) |

---

## Step 2 — Find the Backup → Cloud section

Scroll down to the **Backup** section. You'll see a **Cloud** row with buttons for each provider — **Google Drive**, **OneDrive**, **Dropbox**, and **WebDAV**.

| The Backup / Cloud section |
|:---:|
| ![Backup cloud section](../screenshots/sync-backup-cloud.png) |

> Wording and layout vary slightly between Tampermonkey versions and browsers — look for the **Backup → Cloud** area with provider buttons (Google Drive / OneDrive / Dropbox / WebDAV). If you also see a **Browser Sync** / *sync via browser storage* toggle elsewhere in Settings, leave it off — it's the wrong feature for CPT (see the warning above).

---

## Step 3 — Connect your cloud drive

### Option A — Google Drive *(Gmail users)*

1. Click the **Google Drive** button in the Cloud row.
2. A Google sign-in window opens. Choose your Google account.
3. Click **Allow** to let Tampermonkey store backups in your Drive.

| Google Drive authorization |
|:---:|
| ![Google Drive authorize](../screenshots/sync-gdrive-authorize.png) |

### Option B — OneDrive *(Outlook / Microsoft users)*

1. Click the **OneDrive** button in the Cloud row.
2. A Microsoft sign-in window opens. Choose your Microsoft account.
3. Click **Yes / Accept** to let Tampermonkey store backups in your OneDrive.

| OneDrive authorization |
|:---:|
| ![OneDrive authorize](../screenshots/sync-onedrive-authorize.png) |

After authorizing, Tampermonkey remembers the connection.

---

## Step 4 — Make your first backup

Click **Backup to cloud** (sometimes shown as an upload ⬆️ icon next to the provider). Tampermonkey uploads your scripts and their settings to the drive.

To keep it updated automatically, turn on **Automatic** backup (and set how often, if asked).

| Backup to cloud + automatic toggle |
|:---:|
| ![Backup to cloud](../screenshots/sync-backup-now.png) |

✅ Your settings are now safely in your cloud drive.

---

## Step 5 — Restore on another device

On the second computer or browser:

1. Install Tampermonkey ([Installation](installation.md)).
2. Open **Dashboard → Settings → Backup → Cloud**.
3. Connect the **same** cloud provider (Step 3) — sign in with the **same account**.
4. Click **Restore from cloud** (the download ⬇️ icon).

| Restore from cloud |
|:---:|
| ![Restore from cloud](../screenshots/sync-restore-cloud.png) |

Refresh OMGChat — Chat Power Tools and all your settings appear, identical to your other device.

> **Heads-up:** *Restore* replaces that device's Tampermonkey data with the cloud copy. If both devices have settings you care about, back up the "good" one and restore *onto* the other — not the reverse.

---

## Keeping devices in sync going forward

- With **Automatic** backup on, the device where you make changes uploads them on a schedule.
- On the other device, run **Restore from cloud** when you want to pull the latest, then refresh OMGChat.
- Tampermonkey does **not** merge two devices — the most recent backup wins. Pick one device as your "main" and restore onto the others.

---

## What gets synced

| Synced ✅ | Not synced ❌ |
|---|---|
| The Chat Power Tools script | Anything outside Tampermonkey |
| All your settings (favorites, tiers, keywords, alerts, fan mail…) | Your OMGChat login/session |
| Other userscripts you have | — |
| The 3-day diagnostic log *(if present at backup time)* | — |

---

## Troubleshooting

- **Don't see the Cloud buttons?** Set **Config mode** to **Advanced** at the top of the Settings tab, then re-check the Backup section.
- **Sign-in window blocked?** Allow pop-ups for the Tampermonkey dashboard, then try again.
- **Settings didn't change after Restore?** Refresh (or fully close and reopen) your OMGChat tab — Tampermonkey applies restored data on the next page load.
- **Two accounts in one browser?** Tampermonkey storage is shared across all OMGChat accounts in that browser, so a restore brings settings for all of them.

---

> **No-setup alternative:** the script can also mirror your settings through your OMGChat **profile** automatically (same account, any device) — see [Log & Sync](logs-and-sync.md). The cloud method on this page is broader: it backs up the whole script + settings and works across different accounts and browsers.

> **Live multi-device sync:** for near-real-time syncing with automatic newest-wins merging, set up **[Firebase Sync](firebase-sync.md)** on the Data tab. Don't use both Firebase and cloud backup at the same time.

> **One-off file transfer:** the Data tab also has **Download / Upload Settings** buttons that save or restore a `.json` file — no accounts needed. See [Data: backing up your settings](data.md).
