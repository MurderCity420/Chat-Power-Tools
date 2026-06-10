    // ============================================================
    // PROFILE SYNC
    // ============================================================
    // Stores a compact, obfuscated snapshot of settings in the
    // "More About Me" profile field as a hidden HTML comment:
    //   <!-- PT:BASE64ENCODED_XOR_DATA -->
    //
    // On login  : reads the comment, restores if the profile copy
    //             is newer than the local GM storage copy.
    // Every 30m : saves current settings back to the profile.
    //
    // Encoding  : JSON → compact → XOR bytes with key → base64.
    //             Not true encryption — enough to hide from casual
    //             profile viewers.
    // ============================================================

    const _PS_PROFILE_PATH = '/1/omgchat/members/my_profile.php';
    const _PS_COMMENT_RE   = /<!--\s*PT:([\w+/=]+)\s*-->/;
    const _PS_KEY          = 'ChatPowerTools';  // XOR obfuscation key

    // --- Encode / decode ---

    function _psEncode(obj) {
        try {
            const json  = JSON.stringify(obj);
            const bytes = new TextEncoder().encode(json);
            const key   = new TextEncoder().encode(_PS_KEY);
            const xored = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) xored[i] = bytes[i] ^ key[i % key.length];
            let bin = '';
            xored.forEach((b) => { bin += String.fromCharCode(b); });
            return btoa(bin);
        } catch (e) { return null; }
    }

    function _psDecode(encoded) {
        try {
            const bin   = atob(encoded);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const key   = new TextEncoder().encode(_PS_KEY);
            const xored = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) xored[i] = bytes[i] ^ key[i % key.length];
            return JSON.parse(new TextDecoder().decode(xored));
        } catch (e) { return null; }
    }

    // --- Build compact payload (strips re-derivable fields to reduce size) ---
    // users field keys: t=tier, f=fav, c=color, a=alias, p=prevNames  (type/uid/country omitted)

    function _psBuildPayload() {
        const SKIP = new Set(['holidayDismissed', 'debugSocketEmits']);
        const payload = { _ts: Date.now() };

        // All non-user settings
        for (const k of Object.keys(settings)) {
            if (k === 'users' || SKIP.has(k)) continue;
            payload[k] = settings[k];
        }

        // Compact users: only persistence-worthy fields, short key names
        const u = {};
        for (const [name, d] of Object.entries(settings.users || {})) {
            const c = {};
            if (d.tier)  c.t = d.tier;
            if (d.fav)   c.f = 1;
            if (d.color) c.c = d.color;
            if (d.alias) c.a = d.alias;
            // Rename history — only synced for people worth keeping: blocked /
            // ignored (tier), friends, or favorites. This also pulls a friend-only
            // user into the payload so their history survives across devices.
            if (Array.isArray(d.prevNames) && d.prevNames.length && (d.tier || d.fav || d.friend)) {
                c.p = d.prevNames;
            }
            if (Object.keys(c).length) u[name] = c;
        }
        payload.u = u;
        return payload;
    }

    // Expand compact payload back to full settings.users format
    function _psExpandUsers(compact) {
        const out = {};
        for (const [name, c] of Object.entries(compact || {})) {
            const d = {};
            if (c.t) d.tier  = c.t;
            if (c.f) d.fav   = true;
            if (c.c) d.color = c.c;
            if (c.a) d.alias = c.a;
            if (Array.isArray(c.p) && c.p.length) d.prevNames = c.p;
            if (Object.keys(d).length) out[name] = d;
        }
        return out;
    }

    // --- Read profile ---

    async function _psRead(username) {
        if (!username) return null;
        try {
            const signal = (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
                ? AbortSignal.timeout(8000) : undefined;
            const resp = await fetch(
                location.origin + '/1/profile/' + encodeURIComponent(username),
                { credentials: 'include', ...(signal ? { signal } : {}) }
            );
            if (!resp.ok) return null;
            const html = await resp.text();
            const m = html.match(_PS_COMMENT_RE);
            return m ? _psDecode(m[1]) : null;
        } catch (e) { return null; }
    }

    // --- Write profile (hidden iframe) ---

    function _psWrite(encoded, onDone) {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;width:1px;height:1px;border:0;' +
                               'left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
        let phase = 'loading';
        let tid   = null;

        const finish = (ok) => {
            if (phase === 'done') return;
            phase = 'done';
            if (tid) clearTimeout(tid);
            setTimeout(() => { try { iframe.remove(); } catch (e) {} }, 500);
            if (onDone) onDone(ok);
        };

        iframe.addEventListener('load', () => {
            if (phase === 'submitting') { finish(true); return; }
            if (phase !== 'loading')    { finish(false); return; }
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (!doc) { finish(false); return; }

                const textarea = doc.querySelector('#txt_about') || doc.querySelector('[name="me"]');
                const form     = doc.querySelector('#about_me')  || doc.querySelector('form[action="profile_ajax.php"]');
                if (!textarea || !form) { finish(false); return; }

                // Remove old PT comment, append new one
                let content = textarea.value.replace(_PS_COMMENT_RE, '').trimEnd();
                content    += '\n<!-- PT:' + encoded + ' -->';
                textarea.value = content;

                // Keep the visual editor in sync if present
                const editor = doc.querySelector('.trumbowyg-editor');
                if (editor) editor.innerHTML = content;

                phase = 'submitting';
                tid   = setTimeout(() => finish(true), 10000); // treat timeout as ok
                form.submit();
            } catch (e) { finish(false); }
        });

        iframe.addEventListener('error', () => finish(false));
        tid = setTimeout(() => finish(false), 20000);
        iframe.src = location.origin + _PS_PROFILE_PATH;
        document.body.appendChild(iframe);
    }

    // --- Save / restore ---

    let _psSaving = false;

    function saveSettingsToProfile() {
        // Firebase sync supersedes profile-field sync when enabled.
        if (GM_getValue('firebaseEnabled', false)) return;
        if (_psSaving) return;
        _psSaving = true;
        const payload = _psBuildPayload();
        const encoded = _psEncode(payload);
        if (!encoded) { _psSaving = false; return; }
        _psWrite(encoded, (ok) => {
            _psSaving = false;
            if (ok) {
                GM_setValue('_ptLastProfileSave', payload._ts);
                ptLog('Profile', 'Settings saved to profile (cross-device sync).');
            } else {
                ptLog('Profile', 'Save failed — profile page not found or inaccessible.');
            }
        });
    }

    async function syncSettingsFromProfile() {
        // Firebase sync supersedes profile-field sync when enabled.
        if (GM_getValue('firebaseEnabled', false)) return;
        const me     = detectMyUsername();
        const stored = await _psRead(me);
        const localTs = GM_getValue('_ptLastProfileSave', 0);

        if (!stored) {
            // Nothing on the profile yet — write current settings
            saveSettingsToProfile();
            return;
        }

        const profileTs = stored._ts || 0;

        if (profileTs > localTs) {
            // Profile copy is newer (written from another device) — restore it
            ptLog('Profile', 'Profile copy is newer (' + new Date(profileTs).toLocaleString() + ') — restoring.');

            const { _ts, u, ...rest } = stored;

            // Restore all non-user settings
            for (const k of Object.keys(rest)) {
                if (k in settings) { settings[k] = rest[k]; GM_setValue(k, rest[k]); }
            }

            // Restore users (merge: keep derived fields like uid/type/country,
            // overwrite user-set fields: tier/fav/color/alias)
            const expanded = _psExpandUsers(u);
            if (!settings.users) settings.users = {};
            for (const [name, d] of Object.entries(expanded)) {
                settings.users[name] = Object.assign({}, settings.users[name] || {}, d);
            }
            GM_setValue('users', settings.users);
            GM_setValue('_ptLastProfileSave', profileTs);

            // Re-apply live effects
            try { syncIgnoredToChat();       } catch (e) {}
            try { updateHideListStyle();     } catch (e) {}
            try { renderPanelLists();        } catch (e) {}
            ptLog('Profile', 'Settings restored from profile (newer remote copy applied).');
        } else {
            // Local is current or newer — push to profile
            saveSettingsToProfile();
        }
    }

    function installProfileSync() {
        // Wait a few seconds after login for username + session to settle
        setTimeout(syncSettingsFromProfile, 6000);
        // Periodic save every 30 minutes
        setInterval(saveSettingsToProfile, 30 * 60 * 1000);
    }
