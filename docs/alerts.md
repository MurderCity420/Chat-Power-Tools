# Alerts

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Alerts** tab pings you when your username — or any keyword you choose — appears in chat.

| The Alerts tab |
|:---:|
| ![Alerts tab](../screenshots/alerts-tab.png) |

---

## Your username

Your name is auto-detected from the chat. Once you're logged in, the detected name is shown as **"Hi <username>"** in the panel's top header bar (next to the version number) so you can confirm it's right. Alerts fire whenever that name appears (as `@you` or as a standalone word).

---

## Extra keywords / nicknames

Add other words that should ping you — nicknames, a shortened first name, common misspellings.

- Matching is **whole-word and case-insensitive**: a keyword of `ag` fires only on a standalone "ag", never inside "again" or "agree".
- Useful for short nicknames that would otherwise cause false pings.

---

## Highlight style

Choose how a message that mentions you is marked:

| Style | Look |
|---|---|
| **Subtle** | Faint left border + gradient |
| **Strong highlight** | Solid background tint |
| **Bold** | Bold text |
| **Box** | Full border around the message |


**Highlight color** works exactly like the [Favorites](favorites.md#highlight-style--color) tab: pick **Senders color** (the mentioner's own name colour) or **Custom color** with up to **6** colours (the small **+** adds one, each swatch has a **×**). **One colour** = a flat colour; **2–6** switch on the multi-colour effects — Subtle/Strong/Box **cycle** one colour per message, **Pixie dust** uses all at once, and **Bold** rainbows the letters.


---

## Alert behavior

- **Chime when mentioned** — plays your chosen chime. Sits beside **Alert when rated** in a two-column layout.
- **Alert when rated** — fires the same chime/flash whenever you receive a rating (any score), so you know who just rated you.

### Chime sound

Next to the **▶ play button** is a **chime picker** with many options — Classic, Tri-tone, Facebook Pop, Messenger Ding, Over the Horizon, Windows Ding, Windows Error, Google Pop, Skype Message, Ding-Dong, Westminster, Store Entry, Microwave Beep-Beep, Harp, and Horns. Picking one saves it and plays a quick preview. *(All chimes are synthesized in the browser — original approximations of each sound, not the actual recordings.)*
- **Flash the Browser tab** — flashes `🔔 Mention!` in the tab title when the tab is in the background.
- A small **▶ play button** to the right of the **Alert behavior** heading plays the selected chime so you can check your volume.

| Alert highlights in chat |
|:---:|
| ![Mention highlight example](../screenshots/highlight-types.png) |

---

**Related:** [Favorites](favorites.md) uses the same highlight-style options for people you choose.
