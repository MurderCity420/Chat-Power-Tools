# Ignored & Blocks

[← Back to README](../README.md) · [All docs](getting-started.md)

These two tabs work together to manage who you mute and who you block. They share one idea: every user can sit in a **tier**.

---

## The tier system

Each user can be placed in one of three cumulative tiers, set with checkboxes on the **Ignored** tab:

| Tier | Effect | Includes |
|---|---|---|
| **Alerts** | Suppresses notifications from them only | — |
| **Ignored** | Hides all their messages | + Alerts |
| **Blocked** | Server-side block (they can't see you, you can't see them) | + Ignored + Alerts |

The tiers are **cumulative** — checking **Ignored** auto-checks **Alerts**; checking **Blocked** auto-checks both lower boxes. Unchecking a lower box clears the higher ones.

Checking **Blocked** also **blocks the user on the site** and adds them to your Blocks tab. Unchecking it **unblocks them on the server** again.

| The Ignored tab — Name / Alerts / Ignored / Blocked / Remove |
|:---:|
| ![Ignored tab tier table](../screenshots/ignored-tab.png) |

### Display mode for hidden content

Choose what an ignored message looks like:

- **Invisible** — gone entirely
- **Collapsed** — a clickable placeholder you can expand
- **Blurred** — blurred until you hover

Other options on the Ignored tab:

- **Hide dice/slot/rating tickers from ignored users**
- **Remove ignored & blocked users from the user list completely**

> **Tip:** You can also right-click… actually, just click a user's name/avatar in chat and choose **IGNORE** / **FAVORITE** from the menu.

---

## Block List Sync

A small section on the Ignored tab controls automatic syncing:

- **Auto-sync "You Block" → Ignored** — backs up the **members** on your server block list so they can be auto-re-blocked if they fall off the cap. **Guests are skipped** (they're temporary).
- **Auto re-block accounts set to Blocked** — every 30 s, if someone in your **Blocked** tier enters the room while not currently blocked (e.g. the 100-cap pushed them off), they're re-blocked. Only affects the **Blocked** tier — never Alerts/Ignored. **Account-scoped:** only re-blocks people the account you're logged into actually blocked.
- **Sync now** — runs the sync immediately.

---

## The Blocks tab

| The Blocks tab |
|:---:|
| ![Blocks tab](../screenshots/blocks-tab.png) |

**You Block** (left) shows your server block list, **newest first** to match the site, with a **Member / Guest** badge on each entry:

- **Unblock** — removes them server-side (and from your tiers).
- **Filter** box to search.

**Blocks You** (right) shows accounts that have blocked *you* (read-only; **Copy** to clipboard).

Buttons:

- **↻ Refresh both lists** — re-reads everything from the server.
- **Ignore all you block / Ignore all blocks you** — bulk tier actions.

The server enforces a **100-user block cap**; older blocks get pushed off as you add new ones. To mute beyond the cap, use the **Ignored** tier instead (one-way: they can still see you).

---

## Guest-block auto-cleanup

Guests are throwaway accounts. The site only auto-releases a guest block after ~1 minute **while you stay in the room** — if you leave, the block sticks and slowly fills your 100-cap, pushing off real blocks.

Under the Blocks tab:

- **🧹 Remove all guest blocks now** — sweeps your block list and unblocks every guest immediately.
- **Automatically remove guest blocks** — when checked, runs that sweep on login and on a repeating interval.
- **every `N` min** — how often the automatic sweep runs (**minimum 5 minutes**; values below 5 snap to 5).

| Guest cleanup controls |
|:---:|
| ![Guest block cleanup controls](../screenshots/blocks-guest-cleanup.png) |

The sweep also runs once shortly after you log in. Guests are never kept in your Ignored/Blocked tiers.

---

**Related:** [Advanced → Auto-block guest cammers](advanced.md) blocks guests who watch *your* cam (a different feature). [Log & Sync](logs-and-sync.md) records every block/unblock the tool performs.
