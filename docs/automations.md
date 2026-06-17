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
