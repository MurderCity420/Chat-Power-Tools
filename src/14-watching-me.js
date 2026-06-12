    // ============================================================
    // WATCHING-ME PANEL: sort & auto-block-guests
    // ============================================================
    // The site shows your viewers in `#wm_list`, with one `<div id="WL_<name>">`
    // per viewer. Each row has:
    //   .col_cam      — has a play icon if the viewer has their own cam on
    //   .col_gender   — has an i.ico_gender class with 'male'/'female'/'shemale'/etc.
    //   .col_username — has the .nick text and (for guests) a `.badge.guest`
    //
    // We hook this list with a MutationObserver. On every change:
    //   1. Apply the user's sort preference (name / gender / cam / none)
    //   2. For each new guest row, if auto-block-guests is on AND our cam is
    //      actually broadcasting, block them, then schedule an unblock after a
    //      delay. The broadcast check matters: #wm_list can hold stale viewer
    //      rows when the cam is off, and blocking those would hit people we
    //      never cammed to (only viewers ever appear here — never the room list).

    // --- SORT ---
    // The mapping is intentionally simple: read attributes, sort the children.
    function getViewerSortKey(row, mode) {
        if (mode === 'name') {
            return (row.getAttribute('username') || '').toLowerCase();
        }
        if (mode === 'gender') {
            // Female first, then male, then others, alphabetical inside each bucket.
            // Bucketed ordering: 0 = female, 1 = male, 2 = shemale/couple/group, 3 = unknown.
            const ig = row.querySelector('.col_gender .ico_gender, .col_gender .avatar');
            const cls = (ig && ig.className) || '';
            const isFemale = /female/.test(cls);
            const isMale = /(^|\s)male/.test(cls) && !isFemale; // 'male' but not 'female'
            const isOther = /shemale|couple|group/.test(cls);
            const bucket = isFemale ? 0 : isMale ? 1 : isOther ? 2 : 3;
            const name = (row.getAttribute('username') || '').toLowerCase();
            return `${bucket}_${name}`;
        }
        if (mode === 'cam') {
            // Rows where the viewer has their cam on first, then by name.
            // The .col_cam contains a span.webcamBtn for everyone in the WM list;
            // detect "has cam on" by checking if the play button is present and
            // the row also shows the smallWebcamBtn buttons (which are inserted
            // when the user is camming and selectable as a popout target).
            // Fallback: if .smallWebcamBtn count > 0 → has cam on.
            const hasSmallBtns = row.querySelectorAll('.smallWebcamBtn').length > 0;
            const bucket = hasSmallBtns ? 0 : 1;
            const name = (row.getAttribute('username') || '').toLowerCase();
            return `${bucket}_${name}`;
        }
        return '';
    }

    function applyViewerSort() {
        const mode = settings.viewerSort;
        if (!mode || mode === 'none') return;
        const list = document.getElementById('wm_list');
        if (!list) return;

        const rows = Array.from(list.querySelectorAll('div[id^="WL_"]'));
        if (rows.length < 2) return;

        // Compute sort key once per row, then sort.
        const decorated = rows.map((r) => ({ row: r, key: getViewerSortKey(r, mode) }));
        decorated.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

        // Only reorder if order actually changed (avoid feedback loop with MutationObserver).
        let changed = false;
        for (let i = 0; i < decorated.length; i++) {
            if (rows[i] !== decorated[i].row) { changed = true; break; }
        }
        if (!changed) return;

        // Append in sorted order — append moves the existing node.
        for (const { row } of decorated) list.appendChild(row);
    }

    // --- AUTO-BLOCK GUESTS ---
    // Each guest we block is tracked so we don't double-block & so we know to
    // unblock them after the timeout.
    const _guestBlockState = new Map(); // username -> { blockedAt, timeoutId }

    function isGuestRow(row) {
        if (!row) return false;
        return !!row.querySelector('.badge.guest, i.badge.guest');
    }

    function blockGuestThenRelease(username) {
        if (!username) return;
        if (_guestBlockState.has(username)) return;

        try {
            if (W.Socket && W.Socket._IO) {
                W.Socket._IO.emit('user_blockUser', { username: username, report: '0', comments: '' });
            }
            if (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS) && W.Chat._BLOCKED_USERS.indexOf(username) === -1) {
                W.Chat._BLOCKED_USERS.push(username);
            }
        } catch (e) {}

        const delay = Math.max(5000, settings.autoBlockGuestUnblockMs | 0);
        const timeoutId = setTimeout(() => {
            // Session-level unblock (immediate)
            unblockUserSession(username);
            // Persistent unblock (hidden iframe, same as My Account)
            unblockViaBlocksPage(username, (result) => {
                ptLog('Guests', 'Auto-released guest cammer "' + username + '" (' + result + ').');
            });
            _guestBlockState.delete(username);
            // Refresh the room user list (drop strikethrough/hidden state) and the
            // Blocks tab so the released guest disappears from "You Block" at once.
            try { if (typeof markIgnoredInUserList === 'function') markIgnoredInUserList(); } catch (e) {}
            try { updateHideListStyle(); } catch (e) {}
            try { renderBlockedYou(); } catch (e) {}
        }, delay);

        _guestBlockState.set(username, { blockedAt: Date.now(), releaseAt: Date.now() + delay, timeoutId });
        ptLog('Guests', 'Auto-blocked guest cammer "' + username + '" (releasing in ' + Math.round(delay / 1000) + 's).');
    }

    // Are we actually broadcasting our own cam right now? The auto-block-guest
    // feature only makes sense while publishing — "block guests who watch MY
    // cam". The #wm_list panel can still hold viewer rows when the cam is off
    // (stale entries from a prior broadcast), so without this guard the feature
    // blocks people we aren't even camming to. If we can't confirm publishing,
    // err on the side of NOT blocking.
    function isBroadcastingMyCam() {
        try {
            const pub = document.getElementById('publishStreamCheckbox');
            return !!(pub && pub.checked);
        } catch (e) { return false; }
    }

    let _lastNotBroadcastLog = 0;
    function scanForGuestCammers() {
        if (!settings.autoBlockGuestCammers) return;
        const list = document.getElementById('wm_list');
        if (!list) return;

        const rows = list.querySelectorAll('div[id^="WL_"]');

        // Hard gate: never block anyone unless our cam is actively broadcasting.
        if (!isBroadcastingMyCam()) {
            // Throttled note (max once / 5 min) so it's visible in the log why
            // nothing is being blocked despite viewers being present.
            if (rows.length && Date.now() - _lastNotBroadcastLog > 300000) {
                _lastNotBroadcastLog = Date.now();
                ptLog('Guests', 'Skipping guest auto-block — cam not broadcasting (' +
                    rows.length + ' viewer row(s) ignored).');
            }
            return;
        }

        for (const row of rows) {
            if (!isGuestRow(row)) continue;
            const username = row.getAttribute('username');
            if (!username) continue;
            // Don't block ourselves under any circumstance
            const me = (detectMyUsername() || (W.G?.USER?.username) || '').toLowerCase();
            if (lc(username) === me) continue;
            blockGuestThenRelease(username);
        }
    }

    // --- DEFAULT GENDER FILTER ---
    // The room user list has a gender filter bar (#c_genderFilter) with one
    // checkbox per gender (#show_female / #show_male / #show_tranny /
    // #show_couple / #show_group). Checked = show. We apply the user's saved
    // default ONCE at login by clicking any checkbox whose state differs — a
    // real click fires the site's own filter handler, so the list re-filters.
    function applyDefaultGenderFilter() {
        const f = settings.defaultGenderFilter || {};
        const map = { female: 'show_female', male: 'show_male', tranny: 'show_tranny', couple: 'show_couple', group: 'show_group' };
        let changed = 0;
        for (const [gender, id] of Object.entries(map)) {
            const cb = document.getElementById(id);
            if (!cb) continue;
            const desired = f[gender] !== false; // default = show
            if (cb.checked !== desired) { try { cb.click(); changed++; } catch (e) {} }
        }
        return changed;
    }

    function installDefaultGenderFilter() {
        let tries = 0;
        const tick = () => {
            if (document.getElementById('c_genderFilter')) {
                try {
                    const n = applyDefaultGenderFilter();
                    ptLog('Filter', 'Applied default gender filter (' + n + ' gender(s) toggled).');
                } catch (e) {}
                return;
            }
            if (tries++ > 30) return;
            setTimeout(tick, 1000);
        };
        tick();
    }

    // --- AUTO-CAM ---
    // When viewers appear in the My Viewers list (#wm_list), automatically open
    // their cam — docked Cam Panel slots (1-4) first, then floating cams — up to
    // a configured maximum, filtered by the same target groups as Auto booms.
    // Uses Video.viewCamNumber(username, slotNum): slot 1-4 = docked, 0 = float.
    const _autoCamAttempts = new Map(); // username -> last attempt ts (cooldown)
    const AUTOCAM_RETRY_MS = 60000;     // don't retry the same user more than 1/min

    // Own cam always excluded; others filtered by autoCamTarget.
    function _autoCamPassesTarget(user) {
        const me = (detectMyUsername() || '').toLowerCase();
        if (!user || user === me) return false;
        const t = settings.autoCamTarget || 'all';
        if (t === 'all') return true;
        if (t === 'friends_favs') return inFriendsOrFavorites(user);
        if (t === 'friends_only') return inFriend(user);
        if (t === 'favs_only') return inFavorites(user);
        return false;
    }

    // First free docked slot (1-4), or 0 to float if all docked slots are taken.
    function _autoCamFreeSlot() {
        try {
            const co = W.cams && W.cams.obj;
            for (let n = 1; n <= 4; n++) {
                if (!co || !co[n] || !co[n].user || !co[n].user.username) return n;
            }
        } catch (e) {}
        return 0; // floating
    }

    function scanForAutoCam() {
        if (!settings.autoCam) return;
        const list = document.getElementById('wm_list');
        if (!list) return;
        if (!(W.Video && typeof W.Video.viewCamNumber === 'function')) return;

        const max = Math.max(1, Math.min(15, parseInt(settings.autoCamMax, 10) || 4));
        // Cams already open (docked + floating) — gate on the TOTAL so a weak PC
        // never exceeds the user's chosen ceiling (manual opens count too).
        const open = (typeof getOpenCams === 'function') ? getOpenCams() : [];
        const openNames = new Set(open.map((c) => c.username));
        let openCount = open.length;
        if (openCount >= max) return;

        const me = (detectMyUsername() || '').toLowerCase();
        const now = Date.now();
        const rows = list.querySelectorAll('div[id^="WL_"]');
        for (const row of rows) {
            if (openCount >= max) break;
            const username = lc(row.getAttribute('username') || '');
            if (!username || username === me) continue;
            if (openNames.has(username)) continue;                 // already on cam
            if (!_autoCamPassesTarget(username)) continue;
            // Never auto-cam blocked / ignored users.
            if (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS) && W.Chat._BLOCKED_USERS.indexOf(username) > -1) continue;
            if (W.Chat && Array.isArray(W.Chat._IGNORED_USERS) && W.Chat._IGNORED_USERS.indexOf(username) > -1) continue;
            // Honor a recent manual close (shared with cam-recovery).
            try {
                if (typeof _intentionallyClosed !== 'undefined') {
                    const exp = _intentionallyClosed.get(username);
                    if (exp && exp > now) continue;
                }
            } catch (e) {}
            // Only cam users actually present in the current room (avoid stale
            // viewer rows opening cams that hang on a spinner).
            if (W.UserList && W.UserList._USERS && !W.UserList._USERS[username]) continue;
            // Per-user cooldown so a failed open doesn't get hammered every tick.
            if (now - (_autoCamAttempts.get(username) || 0) < AUTOCAM_RETRY_MS) continue;
            _autoCamAttempts.set(username, now);

            const slot = _autoCamFreeSlot();
            try {
                W.Video.viewCamNumber(username, slot);
                openNames.add(username);
                openCount++;
                ptLog('AutoCam', 'Auto-cammed viewer "' + username + '" (' + (slot ? 'docked slot ' + slot : 'floating') + ').');
            } catch (e) {
                ptLog('AutoCam', 'Auto-cam failed for "' + username + '": ' + (e && e.message ? e.message : e));
            }
        }
    }

    // --- INSTALL ---
    let _wmObserver = null;
    let _autoCamInterval = null;
    function installWatchingMeFeatures() {
        const tryInstall = () => {
            const list = document.getElementById('wm_list');
            if (!list) { setTimeout(tryInstall, 1000); return; }

            // Initial pass
            applyViewerSort();
            scanForGuestCammers();
            scanForAutoCam();

            if (_wmObserver) _wmObserver.disconnect();
            _wmObserver = new MutationObserver(() => {
                // Apply sort first (so the auto-block scan walks the sorted list,
                // not that it matters for correctness, just for tidiness in logs).
                applyViewerSort();
                scanForGuestCammers();
                scanForAutoCam();
            });
            _wmObserver.observe(list, { childList: true, subtree: false });

            // Also re-check periodically so freed slots (a cam closed, the cap
            // dropped below max) get refilled even without a viewer-list change.
            if (!_autoCamInterval) _autoCamInterval = setInterval(() => { try { scanForAutoCam(); } catch (e) {} }, 5000);
        };
        tryInstall();
    }
