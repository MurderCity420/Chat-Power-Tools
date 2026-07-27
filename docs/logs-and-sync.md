# Log & Sync

[← Back to README](../README.md) · [All docs](getting-started.md)

This page covers the **Log** tab plus a background feature: **friend (Stars) sync**.

---

## The diagnostic Log

The **Log** tab records what Chat Power Tools *does* — syncs, blocks, unblocks, guest sweeps, page scrapes, cam fixes, rename detection, and more. It does **not** log chat messages.

| The Log tab |
|:---:|
| ![Log tab](../screenshots/log-tab.png) |

- **Format:** one human-readable line per event — `YYYY-MM-DD HH:MM:SS - LEVEL - Module - message`.
- **Levels:** every entry is tagged with a severity — **DEBUG** (verbose traces), **INFO** (normal actions), **WARN** (recoverable/skipped), **ERROR** (a failed operation), **CRITICAL** (data-safety events like the block-list safety freeze). Errors and criticals are also mirrored to the browser console as `console.warn`/`console.error`.
- **Show level:** the **Show level** dropdown (next to *Keep logs for*) filters the view to a minimum severity — **All / Info & up / Warnings & up / Errors & up / Critical only**. This only changes what's *shown*: **every entry is still recorded and kept**, so you can switch back to *All* at any time. Your choice is remembered per device.
- **Retention:** choose **1 (default) / 2 / 3 / 5 / 7 days** from the dropdown — older lines auto-prune. Shortening it prunes immediately instead of waiting for the next log entry.
- **Modules:** `Init`, `Blocks`, `Guests`, `Ignored`, `Favorites`, `Sync`, `Data`, `Firebase`, `Profile`, `Friends`, `Cam`, `Rate`, `Members`, `Scrape`, `Jerk`, `Translate`.
- **Controls:** Retention dropdown, Show-level dropdown, Filter, **Refresh**, **Download .txt**, **Clear log**.
- **↑ Push Logs / ↓ Pull Logs** *(greyed out unless [Firebase Sync](firebase-sync.md) is on and set up)* — send your log to Firebase, or pull another device's entries down and merge them (deduped by timestamp, kept within the 3-day window).

> **Local-only by default:** the diagnostic log lives **only on this device** and is **no longer auto-synced**. It's cheap to keep locally but was by far the biggest consumer of Firebase storage/bandwidth, so it's now push-on-demand. Use **↑ Push Logs** when you actually want to gather logs from several devices in one place, then **↓ Pull Logs** on the other device.

This is the first thing to grab when reporting a problem — open the tab, **Download .txt**, and attach it to your bug report.

> The Log tab also has a collapsed **Pre-wipe snapshots** section: whenever the chat is wiped, the visible chat is saved here first (last 10).

---

## Friend (Stars) sync

Reads your site **Stars** list and mirrors it into the tool, so your starred users are recognized as friends. Runs on login (throttled to roughly twice a day) and walks all pages of your Stars list. UID lookups during the scan also power automatic **username-rename detection** for members.

---

**Related:** [Firebase Sync](firebase-sync.md) for live cross-device sync · the [Blocks tab](ignore-and-blocks.md) and [Advanced](advanced.md) features are the main things that show up in the Log.
