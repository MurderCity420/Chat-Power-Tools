# Favorites

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Favorites** tab highlights messages from people you care about so they never get lost in a busy room. The highlight applies to **both Favorites and Friends** (your site star list) — in chat and, optionally, in the user & viewers lists.

| The Favorites tab |
|:---:|
| ![Favorites tab](../screenshots/favorites-tab.png) |

---

## Adding favorites

Type a username and click **Add**, or use the in-chat menu: click a user's name/avatar and choose **FAVORITE**. Remove anyone from the list with the **Remove** button. The **Search / filter** box next to Add narrows the list below — it matches current names **and** former usernames.

---

## The Favorites & Friends list

The list is a fixed-height (260px) scrolling area showing everyone you've marked, with a **member / guest / mod / verified-model** badge and a colored left edge:

- 🟡 **Fav Only** · 🔵 **Friend Only** · 🟢 **Friend & Fav**

Click any of those labels at the top to **filter** the list to that group; click **All** to show everyone. **Click a username** to open their profile in a new tab; **hover** it to see any former usernames (renames are tracked). You can also **highlight a name and Ctrl+C** to copy it.

**Friends** come from the site automatically (your star list) and can't be edited here. **Favorites** are added/removed from the in-chat user menu (or the **Add** box above). The **Remove** button appears only on rows where the person is a Favorite (Fav Only or Friend & Fav); it clears the Favorite flag only and does **not** change their Friend/star status on the site.

---

## Highlight style & color

Five styles:

| Style | Look |
|---|---|
| **Subtle** | Faint left border + gradient |
| **Strong highlight** | Solid background tint |
| **Bold** | Bold text |
| **Box** | Full border around the message |
| **Pixie dust** | Animated sparkles over the name |

**Highlight color** has two sources:

- **Senders color** — matches each favorite's own username color.
- **Custom color** — pick your own. The colours sit in a single row; the small **+** to the right of the last swatch adds another (up to **6**), and each swatch has a corner **×** to remove it. **One colour** = a single flat colour; **2–6 colours** switch on the multi-colour effects, which depend on the style:
  - **Subtle / Strong / Box** — the colours **cycle**, one per message (message 1 = colour 1, message 2 = colour 2, …).
  - **Pixie dust** — every sparkle particle takes a different colour from the set.
  - **Bold** — the name's letters are **rainbowed** across the colours.

### Who gets highlighted

Under the colour picker, a **Highlight** radio chooses who the highlight applies to: **Both** (default), **Favorites only**, or **Friends only**.

### Per-person override

Each row in the Favorites & Friends list has a **🎨** button (in its own column). It opens a (wide) editor where you pick **Default** (use the global colour) or **Custom color** — then add/remove up to 6 colours in a single row exactly like the tab above (1 = single, 2–6 = multi), independent of everyone else. A coloured underline on the 🎨 button means an override is set.

### Highlight in the user & viewers lists

Tick **"Also highlight favorite names in the user list & viewers list"** to apply the same style and colours (including pixie dust, letter-rainbow, and any per-person override) to favourite names in the room's **user list** — not just chat messages.

Applies to the **room user list only** (not the My Viewers list). A couple of list-specific notes: **Subtle** and **Strong** tint the **whole row** — play button, avatar, name and watcher count — matching the site's own grey "watching" highlight; **Box / Bold / Pixie dust** stay on the name. With multiple colours the region styles **stripe** by position — the first favourite gets colour 1, the next colour 2, and so on, wrapping around the palette. The stripe is recomputed only when the favourite set or order actually changes, so it stays put (no flicker) while the room ticks.

Changing any style or colour re-applies instantly to messages already on screen.

| A favorited user's message highlighted |
|:---:|
| ![Favorite highlight example](../screenshots/highlight-types.png) |
