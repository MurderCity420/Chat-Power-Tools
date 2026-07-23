# Features

[← Back to README](../README.md) · [All docs](getting-started.md)

The **Features** tab collects the general optional enhancements. Everything about the **webcam area** — your own cam's position & height, floating cam docks, the pop-out windows, the mutual-watch dot, and the viewer/user-list controls — now lives on its own **[Cams](#cams-tab)** sub-tab (next to Features).

| The Features tab |
|:---:|
| ![Features tab](../screenshots/features-tab.png) |

---

## User interface

The controls appear in this order:

- **Smart font color correction** — detects your chat background and rewrites incoming message colors that don't have enough contrast (keeps the hue; affects only your view).
- **Smiley picker** — replaces the default smiley popup with a modern, categorized, searchable picker (works in main chat and IM windows).
- **Input helpers** — shows a live character counter by the input; turns red as you approach the ~200-char server limit.
- **Hide Ignored/Blocked users** — hides anyone in your Ignored or Blocked tier from the room user list.
- **Bulk Mail Manager** — adds checkboxes and Bulk Delete / Bulk Move to the site's Mail page.
- **Holiday color effects** — colors usernames with a holiday palette on special days. The holiday icon/tooltip stay regardless of this toggle.
- **Fan Mail template picker** — Templates & Subjects for fan mail.
- **Conversions** — detects measurements and money in chat and shows them in your preferred units; the two dropdowns pick the **unit system** and the **currency**.
- **Auto-translate chat** — detects messages written in another language and replaces them inline with a translation into your language, with a **🌐** you click to flip back to the original (messages already in your language are left alone). Pick your **target language** (or Auto, from your browser) and the **engine**: **Google (free)** needs no setup; **DeepL (free, no key)** uses DeepL's own web endpoint (no signup, but unofficial and rate-limited — best for lighter use); or **DeepL (API key)** with a key you paste (a free DeepL key works, higher/steadier limits). It's per-reader — nothing you send is changed. Translations are cached and rate-limited, so a busy room stays smooth; if the free engine ever throttles, messages simply stay in their original language for a bit (see the **Log** tab, `Translate` module). Works fine alongside a hover-tooltip translator extension like *MouseTooltipTranslator* — this one does the inline replacement. Translated messages carry a small **translate icon (文A)** to flip back to the original.
- **Write in another language (outbound)** — the **translate icon next to the Stop button** (top nav) opens a picker: search and select a target language (Google + DeepL languages, including regional variants like *Portuguese (Brazil)* and *Portuguese (Portugal)*). Then type in the **main chat box, any IM, or your pop-out IM** and press the **hotkey** (default **Right Alt**) to translate what you typed into that language in place — you review and send it yourself. The hotkey is rebindable from the same popup (**Change** → press a key). Uses whichever engine you selected above.
- **Scroll Lock** — a floating jump-to-bottom arrow appears when scroll lock is on and you've scrolled up. Optional **auto-disable after N seconds** (box on the same row).

| Modern emoji picker |
|:---:|
| ![Emoji picker](../screenshots/emoji-picker.png) |

---

## Cams tab

The **Cams** sub-tab (in Settings, next to Features) holds everything about the webcam area:

- **Self Cam Position** — moves your own webcam preview, and its "My Webcam" control bar above it, **left / center / right** instead of the site's default centered spot. The control bar always stays centered directly above the preview, whichever side it's on.
- **Self Cam Height** — tick to set the **starting height** of your own webcam preview, then enter a value from **110 to 600 px**. It's applied when you log in and re-applied when you turn your cam on/off (which otherwise resets it). You can still drag the divider to resize afterward — this only sets the size it *starts* at.
- **Floating Cam Docks** — saved cam layouts your cams snap to; the **Templates** button (same row) opens the layout manager. See [Floating Cam Docks](#floating-cam-docks).
- **Pop-Out Cam Window** — mirrors your floating cams into a separate, movable window. See [Pop-Out Cam Window](#pop-out-cam-window).
- **Pop-Out Multi-IM** — combines your open IMs into one tabbed window; the **Tab order** dropdown (same row) sets the tab order. See [Pop-Out Multi-IM](#pop-out-multi-im).
- **Watching "My Viewer" dot** — on the **My Viewers** list, shows a green dot on anyone who is watching you **and** whose cam you also have open (docked or floating) — i.e. you're watching each other. On by default.
- **Viewer list sort** — sort your "Watching Me" viewers by **none / name / gender / cam-on**.
- **User list filter** — see below.

### User list filter

The room user list has a row of gender filter buttons at the top — **Female, Male, Trans, Couple, Group**. Clicking one shows/hides that gender.

**Default gender filter** lets you decide which of those are shown when you first log in. Tick a gender to **show** it by default; untick it to **hide** it. All five are ticked (shown) by default.

> This is applied **once at login** — it sets the site's filter buttons to your preferred starting state. You can still click the site's buttons freely afterward; the script won't override your choices during a session.

---

## Floating Cam Docks

Turn saved layouts into **docks** your cams snap to, then drag cams between docks — including the 4 Cam Panel slots — instead of positioning each one by hand.

- **Floating Cam Docks** — master on/off. The **Templates** button (on the same row) opens the layout manager; the login **Default** dropdown lives inside that window (to the right of **+ Add** / **Save**) and sets which layout is active **at login** without changing the live layout.
- The **live** layout is chosen from the dropdown next to the shield icon in the top bar. Switching it **rearranges the cams already open**; **(None)** stops positioning without deleting any layouts.
- New cams drop into the **lowest-numbered free dock**. Close a cam and its dock frees up; if every dock is full, extra cams open wherever the site puts them.

**Dragging cams between docks** — with a layout live, every filled position is a dock. Dock outlines appear while you drag and the one your cam's centre is over **glows**:

- **Floating → floating** moves; dropping on an occupied dock **swaps**. Drop where nothing glows to **free** the cam (auto-placement leaves it alone). Hold **Ctrl** to place freely anywhere.
- **The 4 Cam Panel slots are docks too** (2×2: 1 = top-left … 4 = bottom-right). Slot ↔ floating drags work and **swap**; moving in/out of a panel slot re-subscribes the stream (brief black flash). Floating docks win a drop over a panel slot they overlap.

**Resizing** — resizing the window (or the camsDivider) repositions/resizes docks proportionally; no dock shrinks below **198 × 148 px** and docks never overlap.

**Templates** — the manager has **+ Add**, **Save**, per-row **up/down / Edit / delete**, and **Copy current cam positions** (captures your open floating cams). Up to **12 docks**, each with Top/Left/Height/Width (px); overlapping docks block **Save** until separated.

## Pop-Out Cam Window

Mirrors your floating cams into a separate, movable browser window (drag it to a second monitor). It has **its own checkbox** here, independent of Floating Cam Docks. Ticking it adds a **⤢ pop-out toggle** next to the shield icon; click that toggle to open/close the window (it glows blue while open).

- **Layouts** — pick from the dropdown in the pop-out's bar: `1×1` · `1 row × 2` · `2×2` · `Big left` · `Big right` · `3×3` · `4 rows × 3`. Switching keeps the cams already in the window, dropping only those that no longer fit back to the main chat.
- **Resizable dividers** — drag the gutters between cam rows/columns to resize whole tracks.
- **Sending a cam to it** — from any user's menu, the **⤢ pop-out button** (next to the cam-position buttons) opens that cam straight into the pop-out window. It's only active while the window is open.
- Each tile shows the **name** (click for the user menu), the **cam message** (on hover), and a control bar (close / profile / private / rate / tip / mute). Drag a tile to another dock to move/swap.
- Closing the window (or unticking the box) returns those cams to the main chat.

> The pop-out is a normal pop-up window, so it must be opened by **clicking the toggle** (it can't auto-open after a reload) and Chrome may show a thin address strip. Allow pop-ups for the site if nothing opens. Chrome/Edge only.

## Pop-Out Multi-IM

Combines your open IMs into one tabbed window. Ticking the box adds a **💬 toggle** next to the cam pop-out button; click it to open/close the window.

- **Tabs** — each open IM is a tab, **three per row**, wrapping to new rows. Your **own IM is always the first tab**.
- **Tab order** — the dropdown on the same row chooses **Order opened** or **Alphabetical** (your own IM stays first either way).
- **Missed-message counter** — a blue circle on a tab you're not viewing counts new messages and clears when you switch to it.
- **User list** — the 👥 icon shows/hides everyone in the active IM.
- **Sending** — type and press **Enter**; the **smiley picker** matches main chat, **saved messages** and a **scroll lock** (CPT helper) are included.
- **Closing** — the **×** on a tab closes that IM.

**Inside the cam pop-out** — when the Pop-Out Cam Window is open, its bar has a **💬 button** that docks the same multi-IM interface as a 465px column beside the cams (cams fill the rest), plus a **⇄ button** to flip the column to the other side. Turning it off there returns the IMs to the standalone IM window (if that's on) or the main page.

> Like the cam pop-out, the IM window must be opened by clicking its toggle and won't auto-reopen after a reload.

---

## Blocking

- **Auto-block Guest Viewers** — when a guest watches your cam, block them server-side immediately, then release the block after ~60 s to free the slot. Only acts while **you are broadcasting**.
- **Auto Unblock Guest Blocks** — scans your Blocked Users page on login and on the interval to its right (**every N min**, minimum 1; default 20) and unblocks anyone whose Type is **Guest**. Guests are throwaway accounts, so this stops dead guests from filling your 100-user block cap. *(The Blocks tab also has a manual "Remove all guest blocks now" button — see [Ignored & Blocks](ignore-and-blocks.md).)*
- **Auto-sync "You Block" → Ignored** + **Sync now** — backs up the **members** on your server block list (guests skipped) so they can be auto-re-blocked if they fall off the cap. **Sync now** runs it immediately.
- **Auto re-block accounts set to Blocked** — every 30 s, if someone in your **Blocked** tier enters the room while not currently blocked (the 100-cap pushed them off), they're re-blocked. Only the **Blocked** tier — never Alerts/Ignored. Account-scoped to the logged-in account.

> **Block-list safety.** Your **Blocked** tier is a *master list* that outlives the site's 100-user cap, so people pushed off the server list get re-blocked automatically the next time you share a room with them. Two safeguards protect it from being wiped:
> - **The site is authoritative when the app is behind.** If your local list has fewer people than the site, the missing users are re-imported from the site — the app never trims your list to match a shorter one.
> - **Automatic freeze on a sudden collapse.** If your local master list looks wiped while the site still has your blocks (e.g. after browser/extension storage is cleared), the app **freezes all automatic site-side removals** (the guest sweep) for that session and re-imports the site list, so the loss can't cascade into unblocking everyone on the site. It logs a **SAFETY LOCK** line and clears on the next reload.
>
> The **only** way the app removes someone from the *site* block list is the **Blocks tab → Unblock** button. No automatic path and no tier change ever unblocks on the site.
- **Allow Mod Blocking** — by default the site only lets moderators/models block another moderator; for everyone else, blocking a mod silently fails on the server. Turn this on to block mods anyway. Because the server won't keep that block (it does **not** consume one of your 100 slots), it's **re-applied automatically at every login** — it shows in your console and the Blocks tab, but is session-only. *(If you're a mod or model yourself, you can block mods without this setting; it's detected automatically when you log in.)*

> The tier system (Alerts / Ignored / Blocked) is managed on the **[Ignored](ignore-and-blocks.md)** tab. The Blocked checkbox for a moderator is disabled unless you're a mod/model or have **Allow Mod Blocking** on.

---

**Related:** [Ignored & Blocks](ignore-and-blocks.md) · [Advanced](advanced.md) · [Log & Sync](logs-and-sync.md)
