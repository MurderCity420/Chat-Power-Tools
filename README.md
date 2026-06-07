# Chat Power Tools

A feature-rich Tampermonkey userscript for **OMGChat** (cammedia) that adds an unlimited ignore list, tiered blocking, keyword filtering, favorites, mention alerts, automatic guest-block cleanup, fan-mail templates, cam recovery, and much more — all stored locally, no backend required.

![Power Tools panel](screenshots/panel-overview.png)

---

## Quick start

1. **[Install Tampermonkey + the script →](docs/installation.md)**
2. Reload your OMGChat tab.
3. Click the green **🛡️ shield** icon in the chat top bar to open the panel.

➡️ **[Install Chat Power Tools](https://raw.githubusercontent.com/MurderCity420/Chat-Power-Tools/main/Chat-Power-Tools.user.js)** (requires Tampermonkey — see the [installation guide](docs/installation.md) first)

---

## Features at a glance

| Feature | What it does |
|---|---|
| **Mention Alerts** | Visual flash + chime when your name or custom keywords appear |
| **Favorites** | Highlight specific users so they stand out |
| **Keyword Filter** | Redact or hide unwanted words |
| **Tiered user lists** | Per-user **Alerts → Ignored → Blocked** with one set of checkboxes |
| **Unlimited Ignore List** | Ignore as many users as you want |
| **Blocks manager** | View/manage your server block list and see who blocks you |
| **Guest-block auto-cleanup** | Automatically unblocks throwaway guest accounts so they don't fill your 100-block cap |
| **Cam recovery** | Auto-reopen crashed cams and bump your own stalled webcam |
| **Modern emoji picker** | Categorized, searchable smiley picker |
| **Quality-of-life** | Character counter, scroll-lock helper, smart font contrast, viewer sorting |
| **Diagnostic log** | A 3-day, copyable record of what the tool did (syncs, blocks, scrapes…) |
| **Cross-device sync** | Optionally mirrors your settings via your profile + syncs your Stars list |
| **Holiday easter-eggs** | Awareness-day icons and effects |

---

## Documentation

### Getting going
- **[Installation](docs/installation.md)** — install Tampermonkey and the script
- **[Getting Started](docs/getting-started.md)** — the panel, tabs, and basics
- **[Syncing your settings](docs/syncing-settings.md)** — back up & sync via OneDrive or Google Drive
- **[Updating & Uninstalling](docs/updating-and-uninstalling.md)**

### Using each tab
- **[Alerts](docs/alerts.md)** — mention pings and rating alerts
- **[Favorites](docs/favorites.md)** — highlight people you care about
- **[Keywords](docs/keywords.md)** — redact or hide words
- **[Ignored & Blocks](docs/ignore-and-blocks.md)** — the tier system, the block manager, and guest cleanup
- **[Advanced](docs/advanced.md)** — ticker filters, emoji picker, cam recovery, auto-rate, and more
- **[Log & Sync](docs/logs-and-sync.md)** — the diagnostic log, profile sync, and friend sync

---

## Browser compatibility

| Browser | Supported |
|---|---|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Safari | ❌ (Tampermonkey not supported) |

---

## License

[MIT](LICENSE) © 2026 MurderCity420

> Building or modifying the script? See **[AGENTS.md](AGENTS.md)** for the source layout and build instructions.
