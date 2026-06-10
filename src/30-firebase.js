    // ============================================================
    // FIREBASE SYNC + DATA TAB
    // ============================================================
    // Optional real-time cross-device settings sync via Google Firebase
    // Realtime Database (REST API — no SDK). When enabled, this SUPERSEDES the
    // profile-field sync in 28-profile-sync.js (which self-disables while
    // firebaseEnabled is true).
    //
    // Credentials and Firebase prefs live in their OWN GM keys (camelCase),
    // NEVER inside `settings` — so profile-sync and the settings export can't
    // leak them, and they're never written to Firebase:
    //   firebaseEnabled, firebaseApiKey, firebaseDbUrl, firebaseEmail,
    //   firebasePassword, firebaseSyncInterval (sec; 0=off), firebaseDeviceId,
    //   firebaseSettingsTs (last local settings-blob change), firebaseLastSync.
    //
    // Per-record sync: only user-set / identity fields are pushed
    // (tier, fav, uid, type, alias, color, blockedBy, prevNames, ts). The
    // re-derivable fields (mod, model, hashid, fid, friend, country) are NEVER
    // synced — they're rebuilt locally from add_user / scrapes. Guests are
    // never synced.
    // ============================================================

    const _FB_SCHEMA_VERSION = 1;
    const _FB_ROOT = 'cpt';
    // Fields whose change makes a record "meaningfully different" → bump ts +
    // mark dirty. Re-derived fields (mod/model/hashid/fid/friend/country) are
    // excluded so room traffic (add_user) and scrapes don't churn the sync.
    const _FB_TS_FIELDS = ['tier', 'fav', 'uid', 'type', 'alias', 'color', 'blockedBy', 'prevNames'];
    // Non-user settings that must never sync (device-local / transient).
    const _FB_SETTINGS_SKIP = new Set(['holidayDismissed', 'debugSocketEmits']);

    // --- Local-only pref accessors (own GM keys, not in `settings`) ---
    function fbEnabled()      { return !!GM_getValue('firebaseEnabled', false); }
    function fbInterval()     { const n = parseInt(GM_getValue('firebaseSyncInterval', 60), 10); return isNaN(n) ? 60 : n; }
    function fbCreds() {
        return {
            apiKey: GM_getValue('firebaseApiKey', ''),
            dbUrl:  (GM_getValue('firebaseDbUrl', '') || '').replace(/\/+$/, ''),
            email:  GM_getValue('firebaseEmail', ''),
            pass:   GM_getValue('firebasePassword', ''),
        };
    }
    function fbHasCreds() { const c = fbCreds(); return !!(c.apiKey && c.dbUrl && c.email && c.pass); }
    function fbDeviceId() {
        let id = GM_getValue('firebaseDeviceId', '');
        if (!id) {
            const ua = navigator.userAgent || '';
            const browser = /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox'
                          : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'browser';
            const plat = /Mobi|Android/i.test(ua) ? 'mobile' : 'desktop';
            const rand = Math.floor(1000 + Math.random() * 9000);
            id = plat + '-' + browser + '-' + rand;
            GM_setValue('firebaseDeviceId', id);
        }
        return id;
    }

    // ============================================================
    // DIRTY TRACKING (called from patchUser / saveSetting)
    // ============================================================
    // Function declarations so they're hoisted and callable from 03/01 even
    // though this file is concatenated after them.
    const _fbDirtyUsers = new Set();
    let _fbSettingsDirty = false;
    let _fbApplying = false;   // true while applying a pull — suppresses dirty marks

    function markUserDirty(username) {
        if (_fbApplying || !fbEnabled()) return;
        const u = lc(username);
        if (u) _fbDirtyUsers.add(u);
    }
    function markSettingsDirty() {
        if (_fbApplying || !fbEnabled()) return;
        _fbSettingsDirty = true;
        try { GM_setValue('firebaseSettingsTs', Date.now()); } catch (e) {}
    }

    // ============================================================
    // AUTH (Firebase Identity Toolkit REST)
    // ============================================================
    const FirebaseAuth = {
        _token: null, _refreshToken: null, _expiry: 0, _refreshTimer: null,

        async signIn() {
            const { apiKey, email, pass } = fbCreds();
            if (!apiKey || !email || !pass) throw new Error('Credentials not configured');
            const r = await fetch(
                'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(apiKey),
                { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password: pass, returnSecureToken: true }) }
            );
            const data = await r.json();
            if (data.error) throw new Error(data.error.message || 'AUTH_FAILED');
            this._token = data.idToken;
            this._refreshToken = data.refreshToken;
            this._expiry = Date.now() + (parseInt(data.expiresIn, 10) * 1000);
            this._scheduleRefresh(parseInt(data.expiresIn, 10));
            return this._token;
        },

        async refresh() {
            const { apiKey } = fbCreds();
            if (!this._refreshToken) return this.signIn();
            const r = await fetch(
                'https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(apiKey),
                { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(this._refreshToken) }
            );
            const data = await r.json();
            if (data.error) throw new Error(data.error.message || 'REFRESH_FAILED');
            this._token = data.id_token;
            this._refreshToken = data.refresh_token;
            this._expiry = Date.now() + (parseInt(data.expires_in, 10) * 1000);
            this._scheduleRefresh(parseInt(data.expires_in, 10));
            return this._token;
        },

        _scheduleRefresh(expiresInSec) {
            clearTimeout(this._refreshTimer);
            const ms = Math.max(60, (expiresInSec - 300)) * 1000;
            this._refreshTimer = setTimeout(() => { this.refresh().catch(() => {}); }, ms);
        },

        async getToken() {
            if (!this._token) return this.signIn();
            if (Date.now() > this._expiry - 60000) return this.refresh();
            return this._token;
        },

        reset() {
            this._token = null; this._refreshToken = null; this._expiry = 0;
            clearTimeout(this._refreshTimer); this._refreshTimer = null;
        },
    };

    // ============================================================
    // DB (Firebase Realtime Database REST)
    // ============================================================
    const FirebaseDB = {
        async _url(path) {
            const { dbUrl } = fbCreds();
            const token = await FirebaseAuth.getToken();
            return dbUrl + '/' + path + '.json?auth=' + token;
        },
        // Run an op; on 401 refresh the token once and retry.
        async _do(method, path, body) {
            const attempt = async () => {
                const url = await this._url(path);
                const opts = { method };
                if (body !== undefined) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = JSON.stringify(body); }
                return fetch(url, opts);
            };
            let r = await attempt();
            if (r.status === 401) { await FirebaseAuth.refresh(); r = await attempt(); }
            if (!r.ok) throw new Error('Firebase ' + method + ' ' + path + ' → ' + r.status);
            return (method === 'DELETE') ? null : r.json();
        },
        get(path)            { return this._do('GET', path); },
        set(path, data)      { return this._do('PUT', path, data); },
        update(path, data)   { return this._do('PATCH', path, data); },
        remove(path)         { return this._do('DELETE', path); },
    };

    // ============================================================
    // RECORD HELPERS
    // ============================================================
    // A guest, or a bare record with nothing worth syncing, is excluded.
    function _fbShouldSync(rec) {
        if (!rec) return false;
        if (rec.type === 'guest') return false;
        return !!(rec.tier || rec.fav || rec.uid);
    }
    // Build the sync-safe projection (synced fields only).
    function _fbProjection(rec) {
        const o = {};
        if (rec.tier)  o.tier  = rec.tier;
        if (rec.fav)   o.fav   = true;
        if (rec.uid)   o.uid   = rec.uid;
        if (rec.type)  o.type  = rec.type;
        if (rec.alias) o.alias = rec.alias;
        if (rec.color) o.color = rec.color;
        if (Array.isArray(rec.blockedBy) && rec.blockedBy.length) o.blockedBy = rec.blockedBy;
        if (Array.isArray(rec.prevNames) && rec.prevNames.length) o.prevNames = rec.prevNames;
        o.ts = rec.ts || Date.now();
        return o;
    }
    // Merge a remote synced record into the local record: remote owns the synced
    // fields, local keeps re-derived fields (mod/model/hashid/fid/friend/country).
    function _fbMergeInto(local, remote) {
        const out = Object.assign({}, local || {});
        // Clear synced fields first so removals on the remote propagate.
        for (const f of _FB_TS_FIELDS) delete out[f];
        if (remote.tier)  out.tier  = remote.tier;
        if (remote.fav)   out.fav   = true;
        if (remote.uid)   out.uid   = remote.uid;
        if (remote.type)  out.type  = remote.type;
        if (remote.alias) out.alias = remote.alias;
        if (remote.color) out.color = remote.color;
        if (Array.isArray(remote.blockedBy) && remote.blockedBy.length) out.blockedBy = remote.blockedBy;
        if (Array.isArray(remote.prevNames) && remote.prevNames.length) out.prevNames = remote.prevNames;
        out.ts = remote.ts || Date.now();
        return out;
    }

    // ============================================================
    // PUSH (dirty batch → Firebase)
    // ============================================================
    let _fbPushing = false;
    async function fbPush() {
        if (!fbEnabled() || !fbHasCreds()) return;
        if (_fbPushing) return;
        if (_fbDirtyUsers.size === 0 && !_fbSettingsDirty) return;
        _fbPushing = true;
        try {
            const users = settings.users || {};

            if (_fbDirtyUsers.size > 0) {
                const batch = {};
                const claimed = Array.from(_fbDirtyUsers);
                _fbDirtyUsers.clear(); // claim now; re-add on failure
                for (const u of claimed) {
                    const rec = users[u];
                    if (!rec) { batch[u] = null; continue; }       // deleted locally
                    if (!_fbShouldSync(rec)) continue;             // guest / nothing to sync
                    batch[u] = _fbProjection(rec);
                }
                if (Object.keys(batch).length) {
                    try {
                        await FirebaseDB.update(_FB_ROOT + '/users', batch);
                    } catch (e) {
                        claimed.forEach((u) => _fbDirtyUsers.add(u)); // requeue
                        throw e;
                    }
                }
            }

            if (_fbSettingsDirty) {
                _fbSettingsDirty = false;
                const blob = _fbBuildSettingsBlob();
                try {
                    await FirebaseDB.set(_FB_ROOT + '/settings', blob);
                } catch (e) { _fbSettingsDirty = true; throw e; }
            }

            await FirebaseDB.update(_FB_ROOT + '/meta', {
                last_sync: Date.now(), last_device: fbDeviceId(),
            });
            GM_setValue('firebaseLastSync', Date.now());
        } catch (e) {
            ptLog('Firebase', 'Push failed: ' + (e && e.message ? e.message : e));
        } finally {
            _fbPushing = false;
        }
    }

    // The general-settings blob: every DEFAULTS key except `users` and SKIP, + ts.
    function _fbBuildSettingsBlob() {
        const blob = {};
        for (const k of Object.keys(settings)) {
            if (k === 'users' || _FB_SETTINGS_SKIP.has(k)) continue;
            blob[k] = settings[k];
        }
        blob.ts = GM_getValue('firebaseSettingsTs', Date.now());
        return blob;
    }

    // ============================================================
    // PULL (Firebase → local, newer-ts-wins per record)
    // ============================================================
    async function fbPull() {
        if (!fbEnabled() || !fbHasCreds()) return;
        let remote;
        try { remote = await FirebaseDB.get(_FB_ROOT); }
        catch (e) { ptLog('Firebase', 'Pull failed: ' + (e && e.message ? e.message : e)); return; }
        if (!remote || typeof remote !== 'object') return;

        _fbApplying = true;
        let userChanges = 0;
        try {
            if (!settings.users) settings.users = {};
            const local = settings.users;
            const remoteUsers = remote.users || {};

            for (const [u, rRec] of Object.entries(remoteUsers)) {
                if (!rRec || typeof rRec !== 'object') continue;
                const lRec = local[u];
                const rTs = rRec.ts || 0;
                const lTs = (lRec && lRec.ts) || 0;
                if (!lRec || rTs > lTs) {
                    const merged = _fbMergeInto(lRec, rRec);
                    // Prune empties (e.g. tier removed remotely and nothing else)
                    if (_FB_TS_FIELDS.some((f) => merged[f]) || merged.ts) local[u] = merged;
                    else delete local[u];
                    userChanges++;
                }
            }

            if (userChanges > 0) {
                saveSetting('users', settings.users);
                try { syncIgnoredToChat(); }   catch (e) {}
                try { updateHideListStyle(); }  catch (e) {}
                try { renderPanelLists(); }     catch (e) {}
            }

            // General settings blob — newer ts wins (whole-blob).
            if (remote.settings && typeof remote.settings === 'object' && remote.settings.ts) {
                const localTs = GM_getValue('firebaseSettingsTs', 0);
                if (remote.settings.ts > localTs) {
                    const blob = remote.settings;
                    for (const k of Object.keys(blob)) {
                        if (k === 'ts' || k === 'users' || _FB_SETTINGS_SKIP.has(k)) continue;
                        if (k in DEFAULTS) saveSetting(k, blob[k]);
                    }
                    GM_setValue('firebaseSettingsTs', blob.ts);
                    try { renderFeaturesPane(); }  catch (e) {}
                    try { renderAdvancedPane(); }  catch (e) {}
                }
            }
            GM_setValue('firebaseLastSync', Date.now());
        } finally {
            _fbApplying = false;
        }
        if (userChanges) ptLog('Firebase', 'Pull merged ' + userChanges + ' user record(s).');
    }

    async function fbSyncNow() { await fbPull(); await fbPush(); }

    // ============================================================
    // FULL PUSH / PULL (overwrite, used by Data-tab buttons)
    // ============================================================
    async function fbPushAll() {
        if (!fbHasCreds()) throw new Error('Credentials not configured');
        const users = settings.users || {};
        const batch = {};
        let n = 0;
        for (const [u, rec] of Object.entries(users)) {
            if (!_fbShouldSync(rec)) continue;
            batch[u] = _fbProjection(rec);
            n++;
        }
        await FirebaseDB.set(_FB_ROOT + '/users', batch);
        await FirebaseDB.set(_FB_ROOT + '/settings', _fbBuildSettingsBlob());
        await FirebaseDB.update(_FB_ROOT + '/meta', { last_sync: Date.now(), last_device: fbDeviceId() });
        GM_setValue('firebaseLastSync', Date.now());
        return n;
    }
    async function fbPullAll() {
        if (!fbHasCreds()) throw new Error('Credentials not configured');
        const remote = await FirebaseDB.get(_FB_ROOT);
        if (!remote) return 0;
        _fbApplying = true;
        let n = 0;
        try {
            const local = {};
            for (const [u, rRec] of Object.entries(remote.users || {})) {
                if (!rRec || typeof rRec !== 'object') continue;
                // Keep local re-derived fields where the user already exists.
                local[u] = _fbMergeInto(settings.users[u], rRec);
                n++;
            }
            settings.users = local;
            saveSetting('users', settings.users);
            if (remote.settings && remote.settings.ts) {
                for (const k of Object.keys(remote.settings)) {
                    if (k === 'ts' || k === 'users' || _FB_SETTINGS_SKIP.has(k)) continue;
                    if (k in DEFAULTS) saveSetting(k, remote.settings[k]);
                }
                GM_setValue('firebaseSettingsTs', remote.settings.ts);
            }
            try { syncIgnoredToChat(); }   catch (e) {}
            try { updateHideListStyle(); }  catch (e) {}
            try { renderPanelLists(); }     catch (e) {}
            try { renderFeaturesPane(); }   catch (e) {}
            try { renderAdvancedPane(); }   catch (e) {}
            GM_setValue('firebaseLastSync', Date.now());
        } finally { _fbApplying = false; }
        return n;
    }

    // ============================================================
    // SETUP WIZARD
    // ============================================================
    const MIGRATIONS = {
        1: null, // initial structure; no migration
        // Future: 2: async function(token){ ... }
    };

    // step(label, ok, detail) — UI callback per step. Throws to abort.
    async function fbSetupDatabase(step) {
        // Step 1 — auth
        try { await FirebaseAuth.signIn(); step('Test connection', true, 'Authenticated'); }
        catch (e) { step('Test connection', false, e.message); throw e; }

        // Step 2 — structure
        let meta;
        try { meta = await FirebaseDB.get(_FB_ROOT + '/meta'); }
        catch (e) { step('Database structure', false, e.message); throw e; }
        if (!meta) {
            await FirebaseDB.set(_FB_ROOT, {
                meta: { schema_version: _FB_SCHEMA_VERSION, created_at: Date.now(),
                        last_sync: Date.now(), last_device: fbDeviceId() },
                users: {}, settings: {},
            });
            step('Database structure', true, 'Created (v' + _FB_SCHEMA_VERSION + ')');
            meta = { schema_version: _FB_SCHEMA_VERSION };
        } else {
            step('Database structure', true, 'Already exists (v' + (meta.schema_version || '?') + ')');
        }

        // Step 3 — migrations
        let v = parseInt(meta.schema_version, 10) || 1;
        const ran = [];
        while (v < _FB_SCHEMA_VERSION) {
            const next = v + 1;
            const fn = MIGRATIONS[next];
            if (typeof fn === 'function') { await fn(); ran.push('v' + v + '→v' + next); }
            v = next;
        }
        if (v !== (parseInt(meta.schema_version, 10) || 1)) {
            await FirebaseDB.update(_FB_ROOT + '/meta', { schema_version: v });
        }
        step('Migrations', true, ran.length ? ('Migrated ' + ran.join(', ')) : 'Up to date');

        // Step 4 — migrate local data (newer-wins, don't clobber newer remote)
        let migrated = 0, skipped = 0;
        try {
            const remoteUsers = (await FirebaseDB.get(_FB_ROOT + '/users')) || {};
            const batch = {};
            for (const [u, rec] of Object.entries(settings.users || {})) {
                if (!_fbShouldSync(rec)) continue;
                const proj = _fbProjection(rec);
                const rRec = remoteUsers[u];
                if (rRec && rRec.ts && rRec.ts > proj.ts) { skipped++; continue; }
                batch[u] = proj; migrated++;
            }
            if (Object.keys(batch).length) await FirebaseDB.update(_FB_ROOT + '/users', batch);
            // Settings blob — only if local is newer.
            const remoteSettings = await FirebaseDB.get(_FB_ROOT + '/settings');
            const localSettingsTs = GM_getValue('firebaseSettingsTs', 0) || Date.now();
            if (!remoteSettings || !remoteSettings.ts || localSettingsTs >= remoteSettings.ts) {
                if (!GM_getValue('firebaseSettingsTs', 0)) GM_setValue('firebaseSettingsTs', localSettingsTs);
                await FirebaseDB.set(_FB_ROOT + '/settings', _fbBuildSettingsBlob());
            }
            step('Data migration', true, 'Migrated ' + migrated + ' user(s), ' + skipped + ' skipped (Firebase newer)');
        } catch (e) { step('Data migration', false, e.message); throw e; }

        // Step 5 — round-trip verify
        try {
            await FirebaseDB.set(_FB_ROOT + '/_verify', { test: true, ts: Date.now() });
            const back = await FirebaseDB.get(_FB_ROOT + '/_verify');
            await FirebaseDB.remove(_FB_ROOT + '/_verify');
            if (!back || back.test !== true) throw new Error('Mismatch');
            step('Verification', true, 'Read/write confirmed');
        } catch (e) { step('Verification', false, e.message); throw e; }

        GM_setValue('firebaseSetupDone', true);
    }

    async function fbResetDatabase() {
        await FirebaseDB.remove(_FB_ROOT);
        GM_setValue('firebaseSetupDone', false);
    }

    function fbExportBackupFromRemote() {
        return FirebaseDB.get(_FB_ROOT);
    }

    // ============================================================
    // SYNC TIMER
    // ============================================================
    let _fbTimer = null;
    function fbStartTimer() {
        fbStopTimer();
        const sec = fbInterval();
        if (!fbEnabled() || sec <= 0) return;
        _fbTimer = setInterval(() => { fbPush().catch(() => {}); }, sec * 1000);
    }
    function fbStopTimer() { if (_fbTimer) { clearInterval(_fbTimer); _fbTimer = null; } }

    // Called from init after login. Sign in, pull, then start the push timer.
    function installFirebaseSync() {
        if (!fbEnabled() || !fbHasCreds()) return;
        FirebaseAuth.signIn()
            .then(() => fbPull())
            .then(() => { fbStartTimer(); ptLog('Firebase', 'Sync active (device ' + fbDeviceId() + ', every ' + fbInterval() + 's).'); })
            .catch((e) => ptLog('Firebase', 'Init failed: ' + (e && e.message ? e.message : e)));
    }

    // ============================================================
    // DATA TAB UI
    // ============================================================
    function _fbTimeAgo(ms) {
        if (!ms) return 'never';
        const s = Math.floor((Date.now() - ms) / 1000);
        if (s < 60) return s + 's ago';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return Math.floor(s / 86400) + 'd ago';
    }

    function renderDataPane() {
        const dp = document.querySelector('#pt-panel .pt-tabpane[data-pane="data"]');
        if (!dp) return;
        const c = fbCreds();
        const enabled = fbEnabled();
        const setupDone = !!GM_getValue('firebaseSetupDone', false);

        dp.innerHTML = `
            <div class="pt-section">
                <h3>Local backup &amp; restore</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-data-backup-configured"><label for="pt-data-backup-configured">Settings backup is set up <span class="pt-info" data-tip="Check this once you've set up cloud backup (OneDrive/Google Drive in Tampermonkey, or Firebase below) — it hides the reminder in the panel header.">i</span></label></div>
                <p style="color:#aaa;font-size:11px;margin:8px 0">Download a JSON copy of every setting (and your full user list) to back up or move to another browser.</p>
                <div class="pt-row" style="gap:6px">
                    <button id="pt-data-download" style="flex:1">Download Settings</button>
                    <button id="pt-data-upload" style="flex:1">Upload Settings</button>
                </div>
                <input type="file" id="pt-data-upload-file" accept=".json,application/json" style="display:none">
                <div id="pt-data-local-status" style="font-size:11px;margin-top:6px"></div>
            </div>

            <div class="pt-section">
                <h3>Google Firebase sync</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-fb-enabled" ${enabled ? 'checked' : ''}><label for="pt-fb-enabled">Enable Google Firebase sync <span class="pt-info" data-tip="Real-time cross-device sync via your own free Firebase database. While enabled, the profile-field backup is paused.">i</span></label></div>
                <div id="pt-fb-config" style="${enabled ? '' : 'display:none'}">
                    <p style="color:#aaa;font-size:11px;margin:6px 0">Credentials are stored on this device only — never synced or exported.</p>
                    <div class="pt-fb-field"><label>Firebase API Key</label><input type="text" id="pt-fb-apikey" placeholder="AIzaSy..." value="${escapeHtml(c.apiKey)}"></div>
                    <div class="pt-fb-field"><label>Database URL</label><input type="text" id="pt-fb-dburl" placeholder="https://your-project-default-rtdb.firebaseio.com" value="${escapeHtml(c.dbUrl)}"></div>
                    <div class="pt-fb-field"><label>Email</label><input type="text" id="pt-fb-email" placeholder="cpt@cpt.local" value="${escapeHtml(c.email)}"></div>
                    <div class="pt-fb-field"><label>Password</label><input type="password" id="pt-fb-password" placeholder="••••••••" value="${escapeHtml(c.pass)}"></div>
                    <div class="pt-row" style="gap:6px;margin-top:6px">
                        <button id="pt-fb-save" style="flex:1">Save Credentials</button>
                    </div>
                    <div id="pt-fb-status" style="font-size:12px;margin-top:8px;padding:6px;background:#111;border-radius:3px"></div>
                    <p style="margin-top:8px;font-size:12px">
                        <a href="https://github.com/MurderCity420/Chat-Power-Tools/blob/main/docs/firebase-sync.md" target="_blank" rel="noopener" style="color:#8af">How to set up Firebase (free) →</a>
                    </p>
                </div>
            </div>

            <div class="pt-section" id="pt-fb-manage" style="${enabled && fbHasCreds() ? '' : 'display:none'}">
                <h3>Database setup &amp; sync</h3>
                <div class="pt-row" style="gap:6px">
                    <button id="pt-fb-setup" style="flex:1">${setupDone ? 'Re-run Setup' : 'Setup Database'}</button>
                </div>
                <div id="pt-fb-setup-log" style="font-size:11px;margin-top:6px;font-family:monospace;white-space:pre-wrap;color:#cfc"></div>
                <div class="pt-row" style="gap:6px;margin-top:8px">
                    <button id="pt-fb-push" style="flex:1">Push Local → FB</button>
                    <button id="pt-fb-pull" style="flex:1">Pull FB → Local</button>
                    <button id="pt-fb-syncnow" style="flex:1">Sync Now</button>
                </div>
                <div class="pt-row" style="align-items:center;gap:8px;margin-top:8px">
                    <label for="pt-fb-interval" style="color:#ccc;white-space:nowrap">Auto-sync</label>
                    <select id="pt-fb-interval" style="flex:1;background:#111;color:#eee;border:1px solid #444;padding:4px;border-radius:3px">
                        <option value="0">Off</option>
                        <option value="30">Every 30 seconds</option>
                        <option value="60">Every 1 minute</option>
                        <option value="300">Every 5 minutes</option>
                        <option value="900">Every 15 minutes</option>
                    </select>
                </div>
                <div id="pt-fb-sync-status" style="font-size:11px;margin-top:6px;color:#aaa"></div>

                <h3 style="margin-top:14px;color:#f88">Danger zone</h3>
                <div class="pt-row" style="gap:6px">
                    <button id="pt-fb-export" style="flex:1">Export Firebase Backup</button>
                </div>
                <div class="pt-row" style="gap:6px;margin-top:6px;align-items:center">
                    <input type="text" id="pt-fb-reset-confirm" placeholder='Type RESET to enable' style="flex:1;background:#111;color:#eee;border:1px solid #633;padding:4px;border-radius:3px">
                    <button id="pt-fb-reset" disabled style="opacity:.5">Reset Firebase DB</button>
                </div>
            </div>
        `;

        _fbWireDataPane(dp);
    }

    function _fbWireDataPane(dp) {
        const q = (id) => dp.querySelector(id);

        // --- backup-configured checkbox ---
        const bkc = q('#pt-data-backup-configured');
        if (bkc) {
            bkc.checked = !!settings.backupConfigured;
            bkc.addEventListener('change', () => {
                saveSetting('backupConfigured', bkc.checked);
                if (typeof updateBackupWarning === 'function') updateBackupWarning();
            });
        }

        // --- Download settings → JSON file ---
        const localStatus = q('#pt-data-local-status');
        q('#pt-data-download').addEventListener('click', () => {
            const payload = { _meta: { exportedAt: new Date().toISOString(), version: W.PT_VERSION || '', source: 'local' } };
            for (const k of Object.keys(DEFAULTS)) payload[k] = settings[k];
            const json = JSON.stringify(payload, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cpt-settings-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            localStatus.textContent = '✓ Downloaded.';
            localStatus.style.color = '#8f8';
        });

        // --- Upload settings ← JSON file ---
        const fileInput = q('#pt-data-upload-file');
        q('#pt-data-upload').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                let parsed;
                try { parsed = JSON.parse(reader.result); } catch (e) {
                    localStatus.textContent = '✗ Invalid settings file. Expected a CPT settings JSON export.';
                    localStatus.style.color = '#f88'; fileInput.value = ''; return;
                }
                const known = Object.keys(DEFAULTS).some((k) => k in parsed);
                if (!parsed || (!parsed._meta && !known)) {
                    localStatus.textContent = '✗ Invalid settings file. Expected a CPT settings JSON export.';
                    localStatus.style.color = '#f88'; fileInput.value = ''; return;
                }
                if (!confirm('This will replace all current settings. Are you sure?')) { fileInput.value = ''; return; }
                let count = 0;
                for (const k of Object.keys(DEFAULTS)) { if (k in parsed) { saveSetting(k, parsed[k]); count++; } }
                try { syncIgnoredToChat(); } catch (e) {}
                try { updateHideListStyle(); } catch (e) {}
                try { renderPanelLists(); renderFeaturesPane(); renderAdvancedPane(); } catch (e) {}
                if (fbEnabled()) markSettingsDirty();
                localStatus.textContent = '✓ Imported ' + count + ' settings. Reload the page to apply everything.';
                localStatus.style.color = '#8f8';
                fileInput.value = '';
            };
            reader.readAsText(file);
        });

        // --- Enable toggle ---
        const enabledCb = q('#pt-fb-enabled');
        enabledCb.addEventListener('change', () => {
            GM_setValue('firebaseEnabled', enabledCb.checked);
            q('#pt-fb-config').style.display = enabledCb.checked ? '' : 'none';
            q('#pt-fb-manage').style.display = (enabledCb.checked && fbHasCreds()) ? '' : 'none';
            if (enabledCb.checked) {
                installFirebaseSync();
            } else {
                fbStopTimer(); FirebaseAuth.reset();
            }
            _fbRefreshStatus(dp);
        });

        // --- Save credentials + test ---
        q('#pt-fb-save').addEventListener('click', async () => {
            GM_setValue('firebaseApiKey',  q('#pt-fb-apikey').value.trim());
            GM_setValue('firebaseDbUrl',   q('#pt-fb-dburl').value.trim().replace(/\/+$/, ''));
            GM_setValue('firebaseEmail',   q('#pt-fb-email').value.trim());
            GM_setValue('firebasePassword', q('#pt-fb-password').value);
            FirebaseAuth.reset();
            const statusEl = q('#pt-fb-status');
            statusEl.textContent = 'Testing connection…';
            statusEl.style.color = '#aaa';
            try {
                await FirebaseAuth.signIn();
                statusEl.textContent = '✅ Connected — credentials valid.';
                statusEl.style.color = '#8f8';
                q('#pt-fb-manage').style.display = fbHasCreds() ? '' : 'none';
                fbStartTimer();
            } catch (e) {
                statusEl.textContent = '❌ ' + (e && e.message ? e.message : 'Connection failed');
                statusEl.style.color = '#f88';
            }
        });

        // --- Setup wizard ---
        const setupLog = q('#pt-fb-setup-log');
        q('#pt-fb-setup').addEventListener('click', async () => {
            setupLog.textContent = '';
            const step = (label, ok, detail) => {
                setupLog.textContent += (ok ? '✅ ' : '❌ ') + label + (detail ? ' — ' + detail : '') + '\n';
            };
            try {
                await fbSetupDatabase(step);
                setupLog.textContent += '\nSetup complete.';
                q('#pt-fb-setup').textContent = 'Re-run Setup';
                fbStartTimer();
            } catch (e) {
                setupLog.textContent += '\nAborted: ' + (e && e.message ? e.message : e);
            }
        });

        // --- Push / Pull / Sync Now ---
        const syncStatus = q('#pt-fb-sync-status');
        const guardConfirm = (msg) => confirm(msg);
        q('#pt-fb-push').addEventListener('click', async () => {
            if (!guardConfirm('This will overwrite all Firebase data with your local settings. Continue?')) return;
            syncStatus.textContent = 'Pushing…';
            try { const n = await fbPushAll(); syncStatus.textContent = '✓ Pushed ' + n + ' user(s) to Firebase.'; }
            catch (e) { syncStatus.textContent = '✗ ' + e.message; }
            _fbRefreshStatus(dp);
        });
        q('#pt-fb-pull').addEventListener('click', async () => {
            if (!guardConfirm('This will overwrite all local settings with Firebase data. Continue?')) return;
            syncStatus.textContent = 'Pulling…';
            try { const n = await fbPullAll(); syncStatus.textContent = '✓ Pulled ' + n + ' user(s) from Firebase.'; }
            catch (e) { syncStatus.textContent = '✗ ' + e.message; }
            _fbRefreshStatus(dp);
        });
        q('#pt-fb-syncnow').addEventListener('click', async () => {
            syncStatus.textContent = 'Syncing…';
            try { await fbSyncNow(); syncStatus.textContent = '✓ Synced (merge, newer wins).'; }
            catch (e) { syncStatus.textContent = '✗ ' + e.message; }
            _fbRefreshStatus(dp);
        });

        // --- Interval ---
        const intervalSel = q('#pt-fb-interval');
        intervalSel.value = String(fbInterval());
        intervalSel.addEventListener('change', () => {
            GM_setValue('firebaseSyncInterval', parseInt(intervalSel.value, 10));
            fbStartTimer();
            _fbRefreshStatus(dp);
        });

        // --- Export Firebase backup ---
        q('#pt-fb-export').addEventListener('click', async () => {
            syncStatus.textContent = 'Fetching Firebase data…';
            try {
                const data = await fbExportBackupFromRemote();
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cpt-firebase-backup-' + new Date().toISOString().slice(0, 10) + '.json';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                syncStatus.textContent = '✓ Firebase backup downloaded.';
            } catch (e) { syncStatus.textContent = '✗ ' + e.message; }
        });

        // --- Reset (requires typing RESET) ---
        const resetInput = q('#pt-fb-reset-confirm');
        const resetBtn = q('#pt-fb-reset');
        resetInput.addEventListener('input', () => {
            const ok = resetInput.value.trim() === 'RESET';
            resetBtn.disabled = !ok;
            resetBtn.style.opacity = ok ? '1' : '.5';
        });
        resetBtn.addEventListener('click', async () => {
            if (resetInput.value.trim() !== 'RESET') return;
            syncStatus.textContent = 'Resetting Firebase database…';
            try {
                await fbResetDatabase();
                resetInput.value = ''; resetBtn.disabled = true; resetBtn.style.opacity = '.5';
                setupLog.textContent = '';
                syncStatus.textContent = '✓ Firebase database wiped. Click Setup Database to recreate.';
                q('#pt-fb-setup').textContent = 'Setup Database';
            } catch (e) { syncStatus.textContent = '✗ ' + e.message; }
        });

        _fbRefreshStatus(dp);
    }

    function _fbRefreshStatus(dp) {
        const statusEl = dp.querySelector('#pt-fb-status');
        const syncStatus = dp.querySelector('#pt-fb-sync-status');
        if (statusEl && !statusEl.textContent) {
            if (!fbHasCreds()) { statusEl.textContent = '⚠️ Credentials not configured'; statusEl.style.color = '#fb8'; }
            else if (FirebaseAuth._token) { statusEl.textContent = '✅ Connected | Last sync: ' + _fbTimeAgo(GM_getValue('firebaseLastSync', 0)); statusEl.style.color = '#8f8'; }
            else { statusEl.textContent = 'ℹ️ Credentials saved — not yet connected this session.'; statusEl.style.color = '#aaa'; }
        }
        if (syncStatus && !syncStatus.textContent) {
            const sec = fbInterval();
            syncStatus.textContent = (sec > 0 ? ('Auto-sync every ' + sec + 's. ') : 'Auto-sync off. ') +
                                     'Last sync: ' + _fbTimeAgo(GM_getValue('firebaseLastSync', 0)) + ' · device ' + fbDeviceId();
        }
    }
