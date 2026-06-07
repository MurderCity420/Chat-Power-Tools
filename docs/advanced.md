# Advanced

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Advanced** tab is home to ticker filters, quality-of-life tweaks, the emoji picker, auto-rate, guest handling, and cam recovery.

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

---

## Quality-of-life features

- **Smart font color correction** — detects your chat background and rewrites incoming message colors that don't have enough contrast (keeps the hue; affects only your view).
- **Smiley picker** — replaces the default smiley popup with a modern, categorized, searchable picker (works in main chat and IM windows).
- **Input helpers** — shows a live character counter by the input; turns red as you approach the ~200-char server limit.
- **Peek mode** — temporarily reveals all hidden/ignored messages. Hotkey: **Shift + P**.
- **Scroll lock helper** — a floating jump-to-bottom arrow appears when scroll lock is on and you've scrolled up. Optional **auto-disable after N seconds**.
- **Viewer list sort** — sort your "Watching Me" viewers by **none / name / gender / cam-on**.

| Modern emoji picker |
|:---:|
| ![Emoji picker](../screenshots/emoji-picker.png) |

---

## Auto rate back

When someone rates you, automatically rate them back:

- **Auto rate back** — rate a 5 back when you receive a 5.
- **Only auto-rate favorites a 5** — restrict 5-for-5 to your Favorites list.
- **Auto-rate all 4's with a 4** — also return 4s.

---

## Auto-block guest cammers

When a **guest** watches your cam, block them server-side immediately, then release the block after a delay to free the slot. This is separate from the [Blocks-tab guest cleanup](ignore-and-blocks.md) — it only acts while **you are actively broadcasting**.

---

## Cam recovery

Monitors open cams and helps recover from three crash types:

| Type | Symptom | What the tool can do |
|---|---|---|
| **Type 1 — full crash** | Cam vanishes from viewers | **Auto-reopen** it from your side |
| **Type 2 — mid-stream spinner** | A working cam freezes on a spinner | Only the broadcaster can fix; for **your own** cam it can bump the settings gear to reset the stream |
| **Type 3 — dead from start** | Opened cam never starts | Can only **detect/log** it (broadcaster must toggle their cam) |

Toggles:

- **Auto-reopen cams that crash (Type 1)**
- **Auto-fix my own stalled webcam (Type 2)**
- **Log dead-from-start cams (Type 3)**
- **Record crash timestamps** (for pattern analysis)

Crashed cams from **blocked or ignored** users are never reopened.

---

**Related:** [Log & Sync](logs-and-sync.md) to see what auto-rate, cam recovery, and guest handling did.
