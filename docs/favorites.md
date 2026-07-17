# Favorites

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Favorites** tab highlights people you care about so they never get lost in a busy room. The highlight applies to **both Favorites and Friends** (your site star list). There are **two independent highlights**, each on its own sub-tab at the top of the Favorites tab:

- **Chat Highlight** — how their **messages** look in the chat stream.
- **User List Highlight** — how their **row** looks in the room user list.

The **Add favorite** box and the **Favorites & Friends** list below the sub-tabs stay visible whichever sub-tab you're on — they manage *who* is a favorite, not how a highlight looks.

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

Each sub-tab (Chat Highlight and User List Highlight) has its own **Highlight style** and **Highlight color**, set independently.

**Styles:**

| Style | Look |
|---|---|
| **None** | Off — disables that highlight entirely |
| **Subtle** | Faint left border + gradient |
| **Strong highlight** | Solid background tint |
| **Bold** | Bold text |
| **Box** | Full border around the message / name |
| **Pixie dust** | Animated sparkles over the name |

**Highlight color:**

- **Chat Highlight** offers two sources: **Senders color** (matches each favorite's own username color) or **Custom color**.
- **User List Highlight** is **always a custom color** — you can't know a sender's own color until they've actually chatted, so there's no "Senders color" option there.

For custom colours, the swatches sit in a single row; the small **+** to the right of the last swatch adds another (up to **6**), and each swatch has a corner **×** to remove it. **One colour** = a single flat colour; **2–6 colours** switch on the multi-colour effects, which depend on the style:

- **Subtle / Strong / Box** — the colours **cycle**, one per message (message 1 = colour 1, message 2 = colour 2, …).
- **Pixie dust** — every sparkle particle takes a different colour from the set.
- **Bold** — the name's letters are **rainbowed** across the colours.

A **Transparency** slider next to the swatches controls how see-through the fill is.

### Who gets highlighted

Each sub-tab has its own **Highlight** radio choosing who it applies to: **Both** (default), **Favorites only**, or **Friends only** — so (for example) chat can highlight everyone while the user list highlights only Favorites.

### User List Highlight notes

Applies to the **room user list only** (not the My Viewers list). **Subtle** and **Strong** tint the **whole row** — play button, avatar, name and watcher count — matching the site's own grey "watching" highlight; **Box / Bold / Pixie dust** stay on the name. With multiple colours the region styles **stripe** by position — the first favourite gets colour 1, the next colour 2, and so on, wrapping around the palette. The stripe is recomputed only when the favourite set or order actually changes, so it stays put (no flicker) while the room ticks.

#### Remove Highlight When Viewing

When you watch someone's cam, the site draws a grey "watching" overlay over their user-list row. If the User List Highlight (Strong/Subtle) paints over that overlay you can't tell you're already watching them. Tick **Remove Highlight When Viewing** and the user-list highlight steps aside for anyone whose cam you currently have open (docked or floating), so the grey overlay stays visible; the highlight returns as soon as you close their cam. (This affects the user list only — the Chat Highlight is unchanged.)

### Per-person override

Each row in the Favorites & Friends list has a **🎨** button (in its own column). It opens an editor with **two independent sections — Chat highlight color and User list highlight color**. In each, pick **Default** (use that highlight's global colour) or **Custom color**, then add/remove up to 6 colours (1 = single, 2–6 = multi) with a Transparency slider, independent of everyone else. A coloured underline on the 🎨 button means at least one override is set.

Changing any style or colour re-applies instantly to messages/rows already on screen.

| A favorited user's message highlighted |
|:---:|
| ![Favorite highlight example](../screenshots/highlight-types.png) |
