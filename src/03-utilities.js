
    // ============================================================
    // UTILITIES
    // ============================================================
    const lc = (s) => (typeof s === 'string') ? s.toLowerCase().trim() : '';

    // --- Unified user-record helpers ---

    // Read a user's record (never null — returns {} if unknown).
    function getUser(username) { return settings.users[lc(username)] || {}; }

    // Merge a patch into a user's record. Falsy fields are pruned so the store
    // stays compact. Pass undefined for a field to remove it.
    function patchUser(username, patch) {
        const k = lc(username);
        // Reject non-usernames: empty, or anything with whitespace (real
        // usernames have none). This stops phantom entries like "blocked user"
        // — a stray label that a bad scrape once stored — from ever coming back.
        if (!k || /\s/.test(k)) return;
        if (!settings.users) settings.users = {};
        const rec = Object.assign({}, settings.users[k] || {}, patch);
        for (const f of Object.keys(rec)) {
            if (rec[f] === undefined || rec[f] === null || rec[f] === false || rec[f] === '') delete rec[f];
        }
        if (Object.keys(rec).length === 0) delete settings.users[k];
        else settings.users[k] = rec;
    }

    // Debounced save — batches rapid patchUser calls into a single GM_setValue.
    let _saveUsersTimer = null;
    function saveUsersSoon() {
        if (_saveUsersTimer) return;
        _saveUsersTimer = setTimeout(() => {
            _saveUsersTimer = null;
            try { saveSetting('users', settings.users); } catch (e) {}
        }, 300);
    }

    // --- Cross-field lookups (O(n) but n is typically small) ---

    // Find a user record by their UID string. Returns { username, ...record } or null.
    function getUserByUid(uid) {
        if (!uid) return null;
        const s = String(uid);
        const entry = Object.entries(settings.users || {}).find(([, d]) => d.uid === s);
        return entry ? Object.assign({ username: entry[0] }, entry[1]) : null;
    }

    // Find a user record by their hashid. Returns { username, ...record } or null.
    function getUserByHashid(hashid) {
        if (!hashid) return null;
        const entry = Object.entries(settings.users || {}).find(([, d]) => d.hashid === hashid);
        return entry ? Object.assign({ username: entry[0] }, entry[1]) : null;
    }

    // --- Tier / status helpers ---

    function inIgnored(user)           { return getUser(user).tier === 'ignored';             }
    function inAlertsOnly(user)        { return getUser(user).tier === 'alerts';               }
    function inFavorites(user)         { return !!getUser(user).fav;                           }
    function inFriend(user)            { return !!getUser(user).friend;                        }
    function inFriendsOrFavorites(user){ return inFriend(user) || inFavorites(user);           }

    function detectMyUsername() {
        if (settings.myUsernameOverride) return lc(settings.myUsernameOverride);
        try {
            if (W.G && W.G.USER && W.G.USER.username) return lc(W.G.USER.username);
        } catch (e) {}
        return '';
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function syncIgnoredToChat() {
        if (!Array.isArray(W.Chat._IGNORED_USERS)) W.Chat._IGNORED_USERS = [];
        W.Chat._IGNORED_USERS.length = 0;
        for (const [u, d] of Object.entries(settings.users || {})) {
            if (d.tier === 'ignored') W.Chat._IGNORED_USERS.push(u);
        }
    }
