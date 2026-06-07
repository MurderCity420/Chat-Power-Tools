    // ============================================================
    // LIST MUTATIONS
    // ============================================================

    // --- Shared downstream update helper ---
    function _applyUserChange(opts) {
        if (opts.sync) syncIgnoredToChat();
        if (opts.render) renderPanelLists();
        if (opts.list) { updateHideListStyle(); if (typeof markIgnoredInUserList === 'function') markIgnoredInUserList(); }
    }

    // --- Tier helpers ---

    function addToBlockedTier(userList) {
        // Stamp the CURRENT account as an owner of each backup entry. The block
        // backup lives in shared Tampermonkey storage (one store for every site
        // account in this browser), so without ownership the auto-re-block would
        // re-block one account's blocks while logged into another account.
        const me = detectMyUsername();
        let added = 0, needSync = false, changed = false;
        userList.forEach((u) => {
            const k = lc(u);
            // Only back up / sync MEMBERS (registered / VIP / model / etc.).
            // Guests are temporary accounts we actively unblock, so they must
            // never enter the backup tier. Unknown types are skipped too — they
            // get picked up on a later pass once their type is resolved.
            if (!k || getMemberType(k) !== 'member') return;
            const rec = getUser(k);
            const patch = {};
            if (rec.tier !== 'blocked') {
                if (rec.tier === 'ignored') needSync = true;
                patch.tier = 'blocked';
                added++;
            }
            if (me) {
                const owners = Array.isArray(rec.blockedBy) ? rec.blockedBy.slice() : [];
                if (!owners.includes(me)) { owners.push(me); patch.blockedBy = owners; }
            }
            if (Object.keys(patch).length) { patchUser(k, patch); changed = true; }
        });
        if (changed) {
            saveUsersSoon();
            _applyUserChange({ sync: needSync, render: true, list: true });
        }
        if (added > 0) ptLog('Sync', 'Tiered ' + added + ' blocked user(s) into the backup tier' +
            (me ? ' (owner: ' + me + ')' : '') + '.');
        return added;
    }

    function removeFromBlockedBackup(user) {
        const k = lc(user);
        if (!k || getUser(k).tier !== 'blocked') return;
        patchUser(k, { tier: undefined, blockedBy: undefined });
        saveUsersSoon();
        _applyUserChange({ render: true, list: true });
    }

    // Set a user's tier from the hierarchical Alerts/Ignored/Blocked checkboxes
    // (Blocked ⊃ Ignored ⊃ Alerts). `tier` is 'alerts' | 'ignored' | 'blocked'
    // | '' (none). Crossing the Blocked boundary also blocks/unblocks them
    // server-side so the Blocked checkbox reflects the real site block state.
    function setUserTier(user, tier) {
        const k = lc(user);
        if (!k) return;
        const prev = getUser(k).tier || '';
        if (tier === prev) return;
        const wasBlocked = prev === 'blocked';

        if (tier === 'blocked') {
            const me = detectMyUsername();
            const owners = Array.isArray(getUser(k).blockedBy) ? getUser(k).blockedBy.slice() : [];
            if (me && !owners.includes(me)) owners.push(me);
            patchUser(k, { tier: 'blocked', blockedBy: owners.length ? owners : undefined });
            blockUserLocal(k, true); // server-side block + appears on the Blocks tab
            ptLog('Blocks', 'Set "' + k + '" to Blocked (server-side block).');
        } else if (tier === 'ignored' || tier === 'alerts') {
            patchUser(k, { tier: tier, blockedBy: undefined });
        } else {
            patchUser(k, { tier: undefined, blockedBy: undefined });
        }
        // Dropped out of Blocked → release the server-side block (session + persistent).
        if (wasBlocked && tier !== 'blocked') {
            blockUserLocal(k, false);
            try { unblockViaBlocksPage(k, function () {}); } catch (e) {}
        }
        saveUsersSoon();
        _applyUserChange({ sync: true, render: true, list: true });
    }

    function updateBlockedBackup() {
        const blocked = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS : [];
        if (blocked.length > 0) addToBlockedTier(blocked);
    }

    // Guests are temporary accounts and must never live in any persistent tier
    // (ignored / blocked backup / alerts). Strip the tier from any user we know
    // to be a guest. Run on login and on every sync so old entries get cleaned.
    function purgeGuestTiers() {
        if (!settings.users) return 0;
        let removed = 0, needSync = false;
        for (const [u, d] of Object.entries(settings.users)) {
            if (!d || !d.tier) continue;
            if (getMemberType(u) === 'guest') {
                if (d.tier === 'ignored') needSync = true;
                patchUser(u, { tier: undefined, blockedBy: undefined });
                removed++;
            }
        }
        if (removed > 0) {
            saveUsersSoon();
            if (needSync) syncIgnoredToChat();
            _applyUserChange({ render: true, list: true });
            ptLog('Sync', 'Removed ' + removed + ' guest account(s) from the ignored/blocked tiers.');
        }
        return removed;
    }

    function runAutoBlockIgnored() {
        if (!settings.autoBlockIgnored || !settings.users) return;
        // Only re-block entries the CURRENTLY logged-in account actually blocked.
        // The store is shared across all accounts in this browser, so without
        // this check a second account would re-block the first account's list
        // off the room user list. No confirmed account → do nothing (safe).
        const me = detectMyUsername();
        if (!me) return;
        const usersInRoom = new Set();
        document.querySelectorAll('#ul_list [username]').forEach((el) => {
            const u = lc(el.getAttribute('username') || '');
            if (u) usersInRoom.add(u);
        });
        const currentlyBlocked = new Set(
            (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS.map(lc) : []
        );
        for (const [u, d] of Object.entries(settings.users)) {
            if (d.tier === 'blocked' && usersInRoom.has(u) && !currentlyBlocked.has(u)
                && Array.isArray(d.blockedBy) && d.blockedBy.includes(me)) {
                ptLog('Blocks', 'Auto-block-ignored: re-blocking "' + u + '" (re-entered room, fell off server list).');
                blockUserLocal(u, true);
            }
        }
    }

    function syncBlockListToIgnored() {
        // Always strip any guests that snuck into the tiers, even if the auto-sync
        // toggle is off — guests should never persist in a tier.
        purgeGuestTiers();
        if (!settings.autoSyncBlockToIgnored) return 0;
        const blocked = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS : [];
        return addToBlockedTier(blocked);
    }

    // --- Alerts-only tier ---

    function addAlertsOnlyUser(user) {
        const k = lc(user);
        if (!k || inAlertsOnly(k)) return;
        patchUser(k, { tier: 'alerts' });
        saveUsersSoon();
        _applyUserChange({ render: true, list: true });
    }
    function removeAlertsOnlyUser(user) {
        const k = lc(user);
        if (!k || getUser(k).tier !== 'alerts') return;
        patchUser(k, { tier: undefined });
        saveUsersSoon();
        _applyUserChange({ render: true, list: true });
    }

    // --- Ignored tier ---

    function addIgnoredUser(user) {
        const k = lc(user);
        if (!k || inIgnored(k)) return;
        patchUser(k, { tier: 'ignored' });
        saveUsersSoon();
        _applyUserChange({ sync: true, render: true, list: true });
    }
    function removeIgnoredUser(user) {
        const k = lc(user);
        if (!k || getUser(k).tier !== 'ignored') return;
        patchUser(k, { tier: undefined });
        saveUsersSoon();
        _applyUserChange({ sync: true, render: true, list: true });
    }

    // --- Favorites ---

    function addFavorite(user) {
        const k = lc(user);
        if (!k || inFavorites(k)) return;
        patchUser(k, { fav: true });
        saveUsersSoon();
        _applyUserChange({ render: true });
        // Fetch UID so rename detection works for this user going forward
        if (!getUser(k).uid) setTimeout(() => fetchMemberType(k), 0);
    }
    function removeFavorite(user) {
        const k = lc(user);
        if (!k || !inFavorites(k)) return;
        patchUser(k, { fav: undefined });
        saveUsersSoon();
        _applyUserChange({ render: true });
    }

    // --- Friends (site Stars list) ---

    function addFriend(user, fid) {
        const k = lc(user);
        if (!k) return;
        const patch = { friend: true };
        if (fid) patch.fid = fid;
        patchUser(k, patch);
        saveUsersSoon();
        _applyUserChange({ render: true });
        if (!getUser(k).uid) setTimeout(() => fetchMemberType(k), 0);
    }
    function removeFriend(user) {
        const k = lc(user);
        if (!k) return;
        patchUser(k, { friend: undefined, fid: undefined });
        saveUsersSoon();
        _applyUserChange({ render: true });
    }

    // --- Style reapplication (no storage change) ---

    function reapplyFavoriteStyles() {
        document.querySelectorAll('#chatText > .pt-favorite').forEach((n) => {
            n.classList.remove('pt-fav-subtle', 'pt-fav-highlight', 'pt-fav-bold', 'pt-fav-box');
            n.classList.add('pt-fav-' + (settings.favoriteStyle || 'subtle'));
            let favColor = '#ffd700';
            const src = settings.favoriteColorSource || 'custom';
            if (src === 'username') {
                const span = n.querySelector('.username, strong .username, .nick');
                if (span) {
                    const c = (span.style && span.style.color) || getComputedStyle(span).color;
                    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') favColor = c;
                }
            } else if (src === 'custom') {
                favColor = getSafeColor(settings.favoriteCustomColor || '#ffd700');
            }
            n.style.setProperty('--pt-fav-color', favColor);
            n.style.setProperty('--pt-fav-color-bg', toRgbaString(favColor, 0.18));
            n.style.setProperty('--pt-fav-color-grad', toRgbaString(favColor, 0.12));
        });
    }
    function reapplyMentionStyles() {
        document.querySelectorAll('#chatText > .pt-mention').forEach((n) => {
            n.classList.remove('pt-mention-subtle', 'pt-mention-highlight', 'pt-mention-bold', 'pt-mention-box');
            n.classList.add('pt-mention-' + (settings.mentionStyle || 'subtle'));
            let mColor = '#ff5050';
            const src = settings.mentionColorSource || 'custom';
            if (src === 'username') {
                const span = n.querySelector('.username, strong .username, .nick');
                if (span) {
                    const c = (span.style && span.style.color) || getComputedStyle(span).color;
                    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') mColor = c;
                }
            } else if (src === 'custom') {
                mColor = getSafeColor(settings.mentionCustomColor || '#ff5050');
            }
            n.style.setProperty('--pt-mention-color', mColor);
            n.style.setProperty('--pt-mention-color-bg', toRgbaString(mColor, 0.18));
            n.style.setProperty('--pt-mention-color-grad', toRgbaString(mColor, 0.12));
        });
    }

    // --- Keywords ---

    function addKeyword(kw) {
        kw = lc(kw);
        if (!kw || settings.keywords.includes(kw)) return;
        settings.keywords.push(kw);
        saveSetting('keywords', settings.keywords);
        renderPanelLists();
    }
    function removeKeyword(kw) {
        kw = lc(kw);
        settings.keywords = settings.keywords.filter((k) => k !== kw);
        saveSetting('keywords', settings.keywords);
        renderPanelLists();
    }
    function addMentionKeyword(kw) {
        kw = lc(kw);
        if (!kw || settings.mentionKeywords.includes(kw)) return;
        settings.mentionKeywords.push(kw);
        saveSetting('mentionKeywords', settings.mentionKeywords);
        renderAlertsPane();
    }
    function removeMentionKeyword(kw) {
        kw = lc(kw);
        settings.mentionKeywords = settings.mentionKeywords.filter((k) => k !== kw);
        saveSetting('mentionKeywords', settings.mentionKeywords);
        renderAlertsPane();
    }

    // cleanupDuplicateEntries: with the unified users dict, duplicates can't occur.
    // Run a compact pass to remove empty records and any invalid keys (e.g. the
    // phantom "blocked user" entry — a stray label with a space that an old
    // scrape stored; real usernames never contain whitespace).
    function cleanupDuplicateEntries() {
        if (!settings.users) return;
        let changed = false;
        for (const u of Object.keys(settings.users)) {
            const rec = settings.users[u];
            const invalidKey = !u || /\s/.test(u);
            if (invalidKey || !rec || typeof rec !== 'object' || Object.keys(rec).length === 0) {
                delete settings.users[u]; changed = true;
            }
        }
        if (changed) { saveUsersSoon(); try { syncIgnoredToChat(); } catch (e) {} }
    }
