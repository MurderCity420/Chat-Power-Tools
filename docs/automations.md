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

A short **2–3 second** delay is added before each message, and a minimum gap is enforced between sends so it stays natural and doesn't flood chat.

### Configure boom messages

Click **Configure boom messages…** for three tabs. **Every trigger supports multiple entries** — if a trigger has more than one message, one is picked **at random** each time it fires (add the same trigger twice for variety).

- **Slots** — pick a symbol (Birthday Cake, Diamond, Glass, Heart, Bomb, Star, Trophy), type your message, and **Add**. Add as many entries per symbol as you like.
- **2 Digit Dice** — enter any number **0–100** and a message, then **Add**. Duplicates are allowed. (0, 69 and 100 are just ordinary numbers now — no dedicated boxes.)
- **Back2Back Dice** — posts when two different users roll numbers back-to-back. Enter a **1st** and **2nd** number (0–100), optionally tick **Any order**; or tick **Same** for **any doubles** (the same number rolled twice, any value — ticking Same greys out the number fields). **Add** as many as you like.

Each message is limited to 100 characters.

> A few special back-to-back combos (e.g. certain lucky pairs) are also handled automatically when Auto booms is on. These aren't configurable.

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

Add new rules from the row at the top; edit or remove existing ones with the icons next to each. It ships with one default rule: **cheers → cheers**. The same **Match** word can be added **multiple times** with different replies — when a message matches, one reply is picked **at random**.

**Fuzzy matching:** matching is deliberately loose so creative spellings still work. Text is lowercased, punctuation is stripped, and **runs of repeated letters are collapsed** — so "cheers", "cheeers" and "cheeeers" all match a `cheers` rule. Single-word rules also tolerate a minor typo. Multi-word rules match when the whole phrase appears. Tick **Exact** to require the precise word/phrase with no fuzzy tolerance.

A short random delay is added before each reply, and the same minimum-gap rule as Auto booms keeps replies from flooding chat. Only **one reply is sent per incoming message**, even if several rules match.

---

## Auto tip replies

Automatically post a thank-you (or anything you like) when someone **tips you tokens**.

- **Auto-reply when someone tips you tokens** — master on/off.
- **Reply to tips from** — which group you respond to: **All**, **Friends & Favs**, or **Selective** (adds an inline ⚡ button on the tip so you send with one click).

> Replies fire even if you have "Hide all tip tickers" on. Your own tips never trigger a reply.

### Configure tip replies

Click **Configure tip replies…** to manage rules. Each rule has:

- **Name** — the tipper's username, or **Default** for anyone not otherwise listed.
- **Min / Max** — the token-amount range the rule covers. Leave **Max** blank for open-ended (e.g. `100` and blank = **100+**).
- **Reply** — the text to send.

A **named** rule always wins over **Default**; if several rules match the same tipper and amount, one is chosen **at random** (so you can add several variations). A **filter** box above the list narrows it by name, and each row has **edit** and **delete** icons. If a listed tipper renames on the site, the rule follows them automatically.

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
