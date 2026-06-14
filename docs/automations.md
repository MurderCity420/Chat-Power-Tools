# Automations

[← Back to README](../README.md)

The **Automations** tab holds features that act in chat *for* you in response to what happens around you.

---

## Auto rate back

When someone rates you, automatically rate them back the same score.

- **Auto rate back** — master on/off.
- **Rate 5's back for** — choose who gets an automatic 5 in return:
  - **All Users**
  - **Friends & Favorites**
  - **Friends Only**
  - **Favorites Only**
- **Auto-rate all 4's with a 4** — also return 4-ratings (to everyone).

A short random delay is added before the rate-back so it doesn't look scripted.

---

## Auto booms

When a **dice roll** or **slot play** produces a "boom" in chat, Chat Power Tools can automatically post a message you've configured.

- **Auto-send a chat message on dice & slot booms** — master on/off.
- **React to booms from** — which group's booms you respond to:
  - **All Users**
  - **Friends & Favorites**
  - **Friends Only**
  - **Favorites Only**

> **Your own booms always trigger**, regardless of the group setting. The group only filters *other* people's booms.

A short random delay is added before each message, and a minimum gap is enforced between sends so it stays natural and doesn't flood chat.

### Configure boom messages

Click **Configure boom messages…** to set what gets typed:

- **Slots (3 matching)** — one message per symbol: Birthday Cake, Diamond, Glass, Heart, Bomb, Star, Trophy.
- **Dice** — messages for the default boom rolls: **0**, **69**, and **100**.
- **Custom dice booms** — up to **5** personal numbers (1–99, except the reserved 69). Useful for a lucky number or a birth year. Whenever anyone rolls that number, your text is sent.

Leave any box blank to ignore that boom. **Each message is limited to 50 characters.**

> A few special back-to-back combos (two different people rolling certain numbers in a row) are handled automatically when Auto booms is on. These aren't configurable.

---

## Auto reply

Automatically reply in chat when an incoming message matches one of your rules.

- **Auto-reply to chat messages that match your rules** — master on/off.
- **Reply to messages from** — which group you respond to:
  - **All Users**
  - **Friends & Favorites**
  - **Friends Only**
  - **Favorites Only**

> Auto-reply **never fires on your own messages**, so it can't loop on itself.

### Configure replies

Click **Configure replies…** to manage your rules. Each rule has two columns:

- **Match** — the word or phrase to look for in incoming messages.
- **Reply** — the text sent when a message matches.

Add new rules from the row at the top; remove existing ones with the **Remove** button next to each. It ships with one default rule: **cheers → cheers**.

**Fuzzy matching:** matching is deliberately loose so creative spellings still work. Text is lowercased, punctuation is stripped, and **runs of repeated letters are collapsed** — so "cheers", "cheeers" and "cheeeers" all match a `cheers` rule. Single-word rules also tolerate a minor typo. Multi-word rules match when the whole phrase appears.

A short random delay is added before each reply, and the same minimum-gap rule as Auto booms keeps replies from flooding chat. Only **one reply is sent per incoming message**, even if several rules could match.

---

## Auto cam

Automatically open the cam of anyone who appears in your **My Viewers** list, so you cam back the people watching you without clicking.

- **Automatically open the cam of anyone who watches you** — master on/off.
- **Auto-cam viewers from** — which group gets auto-cammed:
  - **All Users**
  - **Friends & Favorites**
  - **Friends Only**
  - **Favorites Only**
- **Max cams to open** — 1 to 15. The feature stops opening new cams once this many are open. **Cams you opened manually count toward this limit**, so it's a ceiling on total simultaneous cams — useful if your PC or connection can't handle all 16 at once.

Cams fill the **4 docked Cam Panel slots first**, then **floating cams**. Users who are already on cam, blocked, ignored, or not currently in the room are skipped, and a cam you manually close won't be reopened for a short while.

### Floating Cam Docks

Turn saved layouts into **docks** your cams snap to, then drag cams between docks — including the 4 Cam Panel slots — instead of positioning each one by hand. (This was previously called "Automatically position and size floating cams.")

- **Floating Cam Docks** — master on/off.
- **Templates** — opens the layout manager (shown when the feature is enabled). The login **Default** dropdown lives inside this window now (to the right of **+ Add** / **Save**); it sets which layout becomes active **when you log in** and does **not** change the live layout.
- **Fill first** — when both the Pop Out Window and the in-page floating docks are on, this picks which fills first (**Floating Cam Docks** or **Pop-Out Window Docks**); once those are full, new cams spill into the other.
- The **live** layout is chosen from the dropdown next to the shield icon in the top bar. Switching it **rearranges the cams already open**; picking **(None)** stops positioning without deleting any layouts.

When a cam opens — whether you opened it or Auto cam did — it drops into the **lowest-numbered free dock** per the **Fill first** order. Close a cam and its dock frees up. If every dock is full, extra cams open wherever the site puts them.

#### Dragging cams between docks

With a layout live, every filled position is a **dock**. While you drag a cam, the dock outlines appear (faint, borders only — invisible otherwise) and the dock your cam's centre is over **glows** to show where it'll land:

- **Floating cam → floating dock** — drag it onto another dock to move there; drop on an occupied dock to **swap** the two. Drop **where no dock is glowing** and the cam is **freed** — it stays where you put it and auto-placement leaves it alone.
- **Free placement (Ctrl)** — hold **Ctrl** while dragging a floating cam to ignore the docks entirely and drop it anywhere; the dock outlines hide while Ctrl is down. (Ctrl doesn't apply to the Pop Out Window, which is purely docked.) Drag a freed cam back onto a dock to re-dock it.
- **The 4 Cam Panel slots are docks too** — laid out as a 2×2 grid (1 = top-left, 2 = top-right, 3 = bottom-left, 4 = bottom-right). Grab a slot cam by the area **above or below its cam message** (not the message itself, the buttons, or the bottom video controls) — a blue name ghost follows your cursor. You can drop a cam onto any quarter of the panel, including an **empty** slot.
- **Across types** — slot → floating dock and floating dock → slot both work and **swap** the two cams.
- **Floating docks take priority over Cam Panel slots** — floating docks are drawn on top of any cam panel slot they overlap. When you drag a cam over an area where a floating dock and a cam panel slot share the same space, the **floating dock wins the drop**, not the panel slot behind it.

> Moving a cam into or out of a Cam Panel slot re-subscribes its stream, so expect a brief black flash on those drags. Floating-to-floating moves are instant.

> The 4 Cam Panel slots aren't template-configurable (the site fixes their size); only the up-to-12 **floating** docks are. Your own self-cam isn't touched.

#### Resizing the window

When you **resize the browser window** or drag the **camsDivider** (which resizes the Cam Panel), every floating dock repositions and resizes to stay in the right place relative to the panel:

- **Docks to the right of the panel** slide to maintain their offset from the panel's right edge — as the panel widens or narrows, they follow.
- **Docks over the panel** (col1 / inside the cam panel area) scale proportionally with the panel's width and height, preserving their position as a fraction of the panel.
- **All docks** resize proportionally, maintaining their aspect ratio. No dock will shrink below **198 × 148 px** (width × height). Once a dock hits its minimum size, it stops shrinking and bumps the nearest edge rather than overlapping another dock — **docks never overlap each other**, regardless of how small the window gets.

Switching templates recalculates positions the same way.

#### Pop Out Window

Next to the live-template dropdown (left of it, by the shield icon) is a **Pop Out toggle**. Click it to open a separate, movable browser window (drag it to a second monitor) that mirrors your floating cams into a **dock grid**, defaulting to a **2 × 2 (4-dock)** layout (the layout dropdown there is sorted fewest → most docks). The window opens at a fixed size you can resize freely afterward. The toggle glows blue while the window is open.

The Pop Out Window is **independent of the live template** — you can run both at once, and the **Fill first** setting decides which set of docks new cams populate first.

Each tile shows the **name** (always visible, top-left — click it for the full user menu), the **cam message** (centred, on hover), and a control bar (close / profile / private / rate / tip; click a tile to mute). Resizing the window resizes the docks and the cams in them. **Drag a cam** onto another dock to move it (a translucent name ghost shows where it'll land); drop on an occupied dock to **swap**. New cams drop into the lowest-numbered empty dock.

Clicking the toggle again, closing the pop-out window, or turning the feature off **closes the window and returns those cams to the main chat** (into floating docks if a template is live).

> Browser limits: the pop-out is a normal pop-up window, so Chrome may show a thin (non-removable) address strip, and it must be opened by **clicking the toggle** (a pop-up can't auto-open at login, so it won't reopen by itself after a reload). If nothing opens, allow pop-ups for the site. Chrome/Edge only.

#### Default templates

The feature ships with three example layouts to start from — use them as-is, **edit**, or **delete** them:

- **4 Cams (2×2 Medium)**
- **6 Cams (2×2 Medium + 2 Medium)**
- **11 Cams (3×3 Small + 2 Med)**

#### Managing templates

The manager has **+ Add**, **Save**, and a list with **up / down**, **Edit**, and **delete** per layout.

**Creating or editing a template:**

- **Description** — a name for the layout.
- **Copy current cam positions** — reads the position and size of every floating cam you currently have open and fills the table. The intended workflow: drag and resize your cams how you like, then click Copy to capture them.
- Up to **12 docks**, each with **Top**, **Left**, **Height**, **Width** (pixels, from the top-left of the chat area) and **up / down** to reorder. Leave a row blank to use fewer than 12.
- **No overlaps** — if any two filled docks overlap, **Save is blocked** and the offending rows turn **red** until you separate them (touching edges is allowed).

---

## Fan mail

Fan Mail used to have its own tab — it now lives here in **Automations**. It lets you save reusable Fan Mail templates and pick one from a dropdown on the site's Fan Mail compose page.

- **Show Fan Mail template picker on the compose page** — master on/off. When OFF, the template dropdown does **not** appear on the site's Fan Mail compose page (`mail_send.php`), and the **Templates…** / **Subjects…** buttons below are hidden.

When ON, two buttons appear:

- **Templates…** — opens a popup listing your saved templates, with a **+ New** button to create one and **move-up / move-down / delete** controls on each row. (Templates are applied via the dropdown on the compose page, so there's no send/play button here.)
- **Subjects…** — opens the **Random Subjects** manager, the pool of subjects used when a template has no subject of its own.

### Creating or editing a template

- **Description** — required, max 50 characters.
- **Subject** — optional, max 50 characters. If left blank, a random subject from the Subjects pool is used.
- **Tokens** — the tokens for the mail.
- **Message** — required.

### How it's used

With the feature enabled, open a user's profile → **Fan Mail** on the site. A **"— Choose a Fan Mail template —" dropdown** appears next to the Tokens field on the compose page. Picking a template fills in the subject, tokens, and message for you to review and send.

---

> ⚠️ Auto booms and Auto reply post to **main chat** automatically. Overusing chat automations can get you muted by the site — the built-in delays help, but use sensible messages.
