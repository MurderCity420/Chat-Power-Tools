# Advanced

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Advanced** tab holds ticker filters and local chat tweaks. (Feature toggles like the emoji picker, auto-rate, and guest handling live on the **[Features](features.md)** tab. Settings backup, restore, and cross-device sync moved to the **[Data](firebase-sync.md)** tab.)

| The Advanced tab |
|:---:|
| ![Advanced tab](../screenshots/advanced-tab.png) |

---

## Ticker filters

Hide the noisy game/economy tickers:

- **Hide all dice rolls**
- **Hide all slot plays**
- **Hide all rating tickers**
- **Hide all tip tickers** (e.g. "user1 sent 10 Tokens to user2")

---

## Chat tweaks

> The server may still enforce its own rules — these only disable the **local** checks.

- **Unlock unicode** — allow unicode characters in your messages.
- **Remove rating delay** — drop the client-side cooldown between ratings.
- **Bypass censorship** — skip the local censored-word replacement.

> **Cam templates** are now **[Floating Cam Docks](automations.md#floating-cam-docks)** on the **Automations** tab.

---

## Backup & sync *(moved)*

Settings backup, restore, and cross-device sync now live on the **Data** tab:

- **Download / Upload Settings** — save or restore your whole configuration as a JSON file.
- **Google Firebase sync** — live, automatic multi-device sync — see **[Firebase Sync](firebase-sync.md)**.

For Tampermonkey's whole-script cloud backup instead, see **[Syncing your settings](syncing-settings.md)**.

---

**Related:** [Features](features.md) for the toggles that moved off this tab · [Firebase Sync](firebase-sync.md) and [Syncing your settings](syncing-settings.md) for backup · [Log & Sync](logs-and-sync.md) to see what the tool did.
