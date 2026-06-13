# Chat Power Tools

A feature-rich Tampermonkey userscript for **OMGChat** (cammedia) that adds an unlimited ignore list, tiered blocking, keyword filtering, favorites, mention alerts, automatic guest-blocking, and much more — all stored locally, no backend required.

![Power Tools panel](screenshots/panel-overview.png)

---

## Quick start

1. **[Install Tampermonkey + the script →](docs/installation.md)**
2. Reload your OMGChat tab.
3. Click the green **🛡️ shield** icon in the chat top bar to open the panel.

➡️ **[Install / Update Chat Power Tools](https://raw.githubusercontent.com/MurderCity420/Chat-Power-Tools/main/Chat-Power-Tools.user.js)** (requires Tampermonkey — see the [installation guide](docs/installation.md) first)

---

## Features at a glance

| Feature | What it does |
|---|---|
| **Mention Alerts** | Visual flash + chime when your name or custom keywords appear |
| **Favorites** | Highlight specific users so they stand out |
| **Keyword Filter** | Redact or hide unwanted words |
| **Tiered Ignore List** | Per-user **Alerts → Ignored → Blocked** with one set of checkboxes |
| **Unlimited Ignore List** | Ignore as many users as you want |
| **Blocks manager** | View/manage your server block list and see who blocks you |
| **Guest Auto-Block** | Automatically block guests that cam you |
| **Guest-block Unblock** | Automatically unblocks guest accounts after a period of time so they don't fill your 100-block cap |
| **Modern emoji picker** | Categorized, searchable smiley picker |
| **Scroll Lock Management** | Larger icon when scroll lock is on and you are behind in chat. Turn off scroll lock after a period of time |
| **Smart Fonts** | No more black font on a black background or white font on a white background |
| **My Viewers Sort** | Change the default for how My Viewers is sorted |
| **Input Helper** | Character counter like twitter |
| **Holiday Effects** | Holiday icons and effects |
| **Floating Cam Docks** | Save cam layouts; docks resize responsively, maintain aspect ratio, and never overlap |
| **Cross-device sync** | Optionally mirrors your settings via your profile + syncs your Stars list |


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
- **[Filters](docs/keywords.md)** — redact or hide words
- **[Ignored & Blocks](docs/ignore-and-blocks.md)** — the tier system, the block manager, and guest cleanup
- **[Features](docs/features.md)** — emoji picker, smart contrast, guest blocking, and more
- **[Automations](docs/automations.md)** — auto rate-back, auto booms, auto reply, and Fan Mail
- **[Advanced](docs/advanced.md)** — ticker filters and chat tweaks
- **[Data](docs/data.md)** — settings backup/restore and Firebase cross-device sync
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

[MIT](LICENSE) © 2026
