(function () {
    'use strict';

    // ============================================================
    // SETUP
    // ============================================================
    // The chat object lives on the iframe's window. Tampermonkey isolates us
    // by default, so we reach through unsafeWindow to get the real one.
    const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // Wait until the chat object is actually loaded. It's created by the
    // page's own scripts, so we poll until it shows up.
    function waitForChat(callback) {
        if (W.Chat && typeof W.Chat.receiveMessage === 'function') {
            callback();
            return;
        }
        const start = Date.now();
        const timer = setInterval(() => {
            if (W.Chat && typeof W.Chat.receiveMessage === 'function') {
                clearInterval(timer);
                callback();
            } else if (Date.now() - start > 30000) {
                clearInterval(timer);
                console.error('[PowerTools] Chat object never appeared. Aborting.');
            }
        }, 250);
    }

    // ============================================================
    // SETTINGS - all persisted via GM_setValue
    // ============================================================
    const DEFAULTS = {
        // Single unified user store. Each entry: { tier?, fav?, friend?, fid?, uid?, color?, alias?, type?, mod?, model?, blockedBy?, prevNames? }
        // tier: 'alerts'|'ignored'|'blocked'  fav: true  type: 'guest'|'member'
        // mod: true — a moderator  model: true — a Verified Model
        // blockedBy: [account usernames] that own this 'blocked' backup entry
        //   (storage is shared across accounts; auto-re-block is scoped to the owner)
        users: {},
        favoriteStyle: 'subtle',
        favoriteColorSource: 'custom',
        favoriteCustomColor: '#ffd700',
        keywords: [],
        keywordMode: 'redact',
        mentionStyle: 'subtle',
        mentionColorSource: 'custom',
        mentionCustomColor: '#ff5050',
        mentionKeywords: [],
        displayMode: 'invisible',
        hideTickersFromIgnored: true,
        hideIgnoredAndBlockedFromList: false,
        hideAllDice: false,
        hideAllSlots: false,
        hideAllRatings: false,
        hideAllTips: false,
        autoRateBack: false,
        autoRate5Target: 'all',    // 'all' | 'friends_favs' | 'friends_only' | 'favs_only'
        autoRate4Back: false,
        lastFriendScan: 0,         // unix ms of last my_stars.php scan
        friendCount: 0,            // friend count at last scan (for quick change detection)
        antiSpam: false,
        unicodeUnlock: false,
        zeroChatDelay: false,
        zeroActionDelay: false,
        zeroRateDelay: false,
        autoUnmute: false,
        bypassCensorship: false,
        showCharCounter: true,
        scrollLockButton: true,
        scrollLockAutoDisableSeconds: 0,
        smartColorCorrection: true,
        viewerSort: 'none',
        autoSyncBlockToIgnored: false,
        autoBlockIgnored: false,
        allowModBlocking: false,        // lets a non-mod/model block a moderator; re-applied each login since the server won't persist it
        iAmMod: false,                  // detected from our own add_user payload — are WE a moderator?
        iAmModel: false,                // detected from our own add_user payload — are WE a model?
        autoBlockGuestCammers: false,
        autoBlockGuestUnblockMs: 60000,
        autoUnblockGuestBlocks: true,   // periodically scan my_blocks.php and unblock any Guest-type entries
        autoUnblockGuestIntervalMin: 30, // how often the guest-block sweep runs (minutes; minimum 5)
        camAutoRecover: false,
        camDetectDeadStart: false,
        camDeadStartThresholdMs: 20000,
        camLogCrashes: false,
        camRecoverCheckIntervalMs: 5000,
        camAutoFixMyCam: false,
        camMyStallThresholdMs: 20000,
        tabVisibility: {
            ignored: true, favorites: true, keywords: true, alerts: true,
            features: true, advanced: true, blockedyou: true, fanmail: false, snapshots: true,
            power: true, test: false, data: true,
        },
        revealBlockedYou: false,
        fanMailTemplates: [],
        fanMailRandomSubjects: [],
        modernSmileyPicker: true,
        backupConfigured: false, // user confirmed they've set up cloud backup → hides the header reminder
        mentionAlertSound: true,
        mentionAlertFlashTitle: true,
        alertOnRating: false,
        myUsernameOverride: '',
        debugSocketEmits: false,
        holidayDismissed: '',       // 'YYYY-MM-DD' ET — badge stays dismissed all day even across logins
        holidayEffectEnabled: true, // enable/disable username color cycling effect
    };

    // One-time migration: reads old separate arrays/objects from GM storage and
    // converts them into the unified users: {} format. Returns the populated map.
    function _migrateToUsers() {
        try {
            const g = (k) => GM_getValue(k, null);
            const arr = (v) => (Array.isArray(v) ? v : []);
            const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
            const users = {};
            const get = (u) => { if (!users[u]) users[u] = {}; return users[u]; };
            // Tier priority: blocked wins over alerts wins over ignored
            arr(g('ignoredUsers')).forEach((u) => { const k = (u||'').toLowerCase().trim(); if (k) get(k).tier = 'ignored'; });
            arr(g('alertsOnlyUsers')).forEach((u) => { const k = (u||'').toLowerCase().trim(); if (k) get(k).tier = 'alerts'; });
            arr(g('blockedBackup')).forEach((u) => { const k = (u||'').toLowerCase().trim(); if (k) get(k).tier = 'blocked'; });
            arr(g('favoriteUsers')).forEach((u) => { const k = (u||'').toLowerCase().trim(); if (k) get(k).fav = true; });
            // uidMap was { uid: username } — invert to username: { uid }
            Object.entries(obj(g('uidMap'))).forEach(([uid, name]) => { const k = (name||'').toLowerCase().trim(); if (k && uid) get(k).uid = uid; });
            Object.entries(obj(g('colorOverrides'))).forEach(([u, c]) => { const k = (u||'').toLowerCase().trim(); if (k && c) get(k).color = c; });
            Object.entries(obj(g('aliases'))).forEach(([u, a]) => { const k = (u||'').toLowerCase().trim(); if (k && a) get(k).alias = a; });
            Object.entries(obj(g('memberTypeCache'))).forEach(([u, t]) => { const k = (u||'').toLowerCase().trim(); if (k && t && !get(k).type) get(k).type = t; });
            // Prune empty records
            for (const u of Object.keys(users)) { if (!Object.keys(users[u]).length) delete users[u]; }
            console.log('[PowerTools] Migrated user data to unified store (' + Object.keys(users).length + ' entries).');
            return users;
        } catch (e) {
            console.error('[PowerTools] User data migration failed:', e);
            return {};
        }
    }

    function loadSettings() {
        const out = {};
        for (const k of Object.keys(DEFAULTS)) {
            const v = GM_getValue(k, undefined);
            out[k] = (v === undefined) ? structuredClone(DEFAULTS[k]) : v;
        }
        // Merge new tabVisibility keys so existing users get defaults for newly added tabs.
        if (out.tabVisibility && typeof out.tabVisibility === 'object') {
            for (const k of Object.keys(DEFAULTS.tabVisibility)) {
                if (!(k in out.tabVisibility)) out.tabVisibility[k] = DEFAULTS.tabVisibility[k];
            }
        }
        // Migrate removed color-source 'default' value.
        if (out.favoriteColorSource === 'default') out.favoriteColorSource = 'custom';
        if (out.mentionColorSource === 'default') out.mentionColorSource = 'custom';
        // Migrate autoRate5FavoritesOnly → autoRate5Target
        if (!out.autoRate5Target || out.autoRate5Target === 'all') {
            const old = GM_getValue('autoRate5FavoritesOnly', null);
            if (old === true) out.autoRate5Target = 'favs_only';
        }
        // One-time migration: if users is empty but old-format data exists, convert it.
        if (!out.users || Object.keys(out.users).length === 0) {
            out.users = _migrateToUsers();
            if (Object.keys(out.users).length > 0) GM_setValue('users', out.users);
        }
        return out;
    }
    function saveSetting(key, value) {
        GM_setValue(key, value);
        settings[key] = value;
        // Mark the general-settings blob dirty for Firebase sync. Per-user
        // changes ('users') are tracked individually in patchUser, so skip them.
        if (key !== 'users') { try { markSettingsDirty(); } catch (e) {} }
    }

    let settings = loadSettings();
