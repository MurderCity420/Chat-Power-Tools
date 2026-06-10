
    // ============================================================
    // UTILITIES
    // ============================================================
    const lc = (s) => (typeof s === 'string') ? s.toLowerCase().trim() : '';

    // --- Unified user-record helpers ---

    // Read a user's record (never null — returns {} if unknown).
    function getUser(username) { return settings.users[lc(username)] || {}; }

    // Fields whose change makes a record "meaningfully different" for cross-device
    // sync. Mirrors _FB_TS_FIELDS in 30-firebase.js. A change to any of these bumps
    // the record's `ts` and marks it dirty; re-derived fields (mod/model/hashid/
    // fid/friend/country) do NOT, so room traffic and scrapes don't churn the sync.
    const _SYNC_FIELDS = ['tier', 'fav', 'uid', 'type', 'alias', 'color', 'blockedBy', 'prevNames'];
    function _syncFieldsSignature(rec) {
        if (!rec) return '';
        return _SYNC_FIELDS.map((f) => {
            const v = rec[f];
            return Array.isArray(v) ? v.join('|') : (v == null ? '' : String(v));
        }).join('\x1f');
    }

    // Merge a patch into a user's record. Falsy fields are pruned so the store
    // stays compact. Pass undefined for a field to remove it.
    function patchUser(username, patch) {
        const k = lc(username);
        // Reject non-usernames: empty, or anything with whitespace (real
        // usernames have none). This stops phantom entries like "blocked user"
        // — a stray label that a bad scrape once stored — from ever coming back.
        if (!k || /\s/.test(k)) return;
        if (!settings.users) settings.users = {};
        const before = _syncFieldsSignature(settings.users[k]);
        const rec = Object.assign({}, settings.users[k] || {}, patch);
        for (const f of Object.keys(rec)) {
            if (rec[f] === undefined || rec[f] === null || rec[f] === false || rec[f] === '') delete rec[f];
        }
        // Stamp ts + mark dirty only when a synced field actually changed AND
        // Firebase sync is on — so add_user/scrape writes of re-derived fields
        // never churn the sync, and records stay untouched when sync is off.
        let _fbOn = false;
        try { _fbOn = fbEnabled(); } catch (e) {}
        if (_fbOn && _syncFieldsSignature(rec) !== before) {
            if (Object.keys(rec).length) rec.ts = Date.now();
            try { markUserDirty(k); } catch (e) {}
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

    // --- Tier / status helpers ---

    function inIgnored(user)           { return getUser(user).tier === 'ignored';             }
    function inAlertsOnly(user)        { return getUser(user).tier === 'alerts';               }
    function inFavorites(user)         { return !!getUser(user).fav;                           }
    function inFriend(user)            { return !!getUser(user).friend;                        }
    function inFriendsOrFavorites(user){ return inFriend(user) || inFavorites(user);           }

    // Whether the LOGGED-IN account is itself a moderator or a model. The site
    // only lets mods/models block other mods; we detect this from our own
    // add_user payload (see installAddUserListener) and cache it as a setting.
    function amIModOrModel()           { return !!settings.iAmMod || !!settings.iAmModel;       }

    // Copy text to the clipboard. navigator.clipboard can be missing or blocked
    // inside the page context (and accessing .writeText then throws synchronously,
    // so a trailing .catch never attaches) — fall back to a hidden textarea +
    // execCommand. Returns a Promise<boolean> of whether the copy succeeded.
    function copyToClipboard(text) {
        const fallback = () => {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
                document.body.appendChild(ta);
                ta.focus(); ta.select();
                const ok = document.execCommand('copy');
                ta.remove();
                return ok;
            } catch (e) { return false; }
        };
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text).then(() => true, () => fallback());
            }
        } catch (e) {}
        return Promise.resolve(fallback());
    }

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
