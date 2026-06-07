    // ============================================================
    // FRIEND SYNC — reads my_stars.php and syncs the site's Stars
    // list into settings.users[u].friend + fid.
    //
    // Runs on login (if 12+ hours since last scan) and on demand.
    // UID fetching reuses fetchMemberType so rename detection fires
    // automatically through the existing applyUsernameRename path.
    // ============================================================

    const STARS_PAGE_PATH    = '/1/omgchat/members/my_stars.php';
    const FRIEND_SCAN_MIN_MS = 12 * 60 * 60 * 1000; // 12 hours

    let _friendScanRunning = false;

    // Parse a DOMParser document from my_stars.php and return
    // { count, friends: [{username, fid}] }
    function _parseStarsDoc(doc) {
        const result = { count: 0, friends: [] };

        // Total count — inside "You have <strong>N</strong> stars"
        doc.querySelectorAll('td strong').forEach((el) => {
            const n = parseInt(el.textContent.trim(), 10);
            if (!isNaN(n) && /stars/i.test(el.closest('td') && el.closest('td').textContent || '')) {
                result.count = n;
            }
        });

        // Friend rows — th contains the username, action buttons carry data-fid
        doc.querySelectorAll('#lpad tr').forEach((row) => {
            const nameEl = row.querySelector('th .thumbnails span');
            const fidEl  = row.querySelector('[data-fid]');
            if (!nameEl || !fidEl) return;
            const username = lc(nameEl.textContent.trim());
            const fid      = fidEl.getAttribute('data-fid');
            if (username && fid) result.friends.push({ username, fid });
        });

        return result;
    }

    async function _fetchAllStars() {
        // The stars page is paginated (~30/page) via ?page=N. Walk pages until
        // the "You have no stars yet!" sentinel (shown on the page AFTER the
        // last) or an empty page. ?action=all does NOT exist — it only ever
        // returned page 1.
        const all = { count: 0, friends: [] };
        let fetchedOk = false;
        try {
            for (let page = 1; page <= 20; page++) {
                const signal = (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
                    ? AbortSignal.timeout(20000) : undefined;
                const url = location.origin + STARS_PAGE_PATH + (page > 1 ? '?page=' + page : '');
                const resp = await fetch(url, { credentials: 'include', ...(signal ? { signal } : {}) });
                if (!resp.ok) break;
                const html = await resp.text();
                fetchedOk = true;
                if (/You have no stars yet/i.test(html)) break; // past the last page
                const parsed = _parseStarsDoc(new DOMParser().parseFromString(html, 'text/html'));
                if (page === 1 && parsed.count) all.count = parsed.count;
                if (!parsed.friends.length) break; // no rows → past the end
                all.friends.push(...parsed.friends);
            }
        } catch (e) { return null; }
        return fetchedOk ? all : null;
    }

    // Main scan function. Pass force=true to bypass the 12-hour throttle.
    async function scanFriends(force) {
        if (_friendScanRunning) return;

        const now      = Date.now();
        const lastScan = settings.lastFriendScan || 0;
        if (!force && (now - lastScan) < FRIEND_SCAN_MIN_MS) return;

        _friendScanRunning = true;
        try {
            const data = await _fetchAllStars();
            if (!data || !data.friends.length) {
                // Don't record a failed scan timestamp — allow a retry next time
                _friendScanRunning = false;
                return;
            }

            const { count, friends } = data;
            saveSetting('lastFriendScan', now);
            saveSetting('friendCount', count);

            // Build lookup: scanned username → fid
            const scannedMap = new Map(friends.map(f => [f.username, f.fid]));

            // Snapshot the friends we knew about before this scan, for the diff log.
            const prevFriends = new Set(
                Object.entries(settings.users || {}).filter(([, d]) => d.friend).map(([u]) => u)
            );
            const removedNames = [];

            // --- Step 1: Mark all scanned users as friends ---
            for (const { username, fid } of friends) {
                const rec = getUser(username);
                if (!rec.friend || rec.fid !== fid) {
                    patchUser(username, { friend: true, fid });
                }
            }

            // --- Step 2: Fetch UIDs for new friends (rename detection fires automatically) ---
            const needsUid = friends
                .filter(f => !getUser(f.username).uid && !_memberTypeFetched.has(f.username))
                .map(f => f.username);

            for (let i = 0; i < needsUid.length; i += 4) {
                const batch = needsUid.slice(i, i + 4);
                await Promise.all(batch.map(u => fetchMemberType(u)));
                if (i + 4 < needsUid.length) await new Promise(r => setTimeout(r, 1000));
            }

            // --- Step 3: Clear friend flag from users no longer in the scan ---
            // After UID fetches, applyUsernameRename may have already updated renamed users.
            // Re-check the map with the potentially-updated names.
            for (const [username, d] of Object.entries(settings.users || {})) {
                if (!d.friend) continue;
                if (scannedMap.has(username)) continue; // still in scan, keep

                // Not in scan by current name — check if their UID appears under a new name
                let renamedInScan = false;
                if (d.uid) {
                    for (const [scannedName] of scannedMap) {
                        if (getUser(scannedName).uid === d.uid) { renamedInScan = true; break; }
                    }
                }
                if (!renamedInScan) {
                    // Genuinely removed from Stars list
                    patchUser(username, { friend: undefined, fid: undefined });
                    removedNames.push(username);
                }
            }

            saveUsersSoon();
            try { renderPanelLists(); } catch (e) {}

            const addedNames = friends.filter(f => !prevFriends.has(f.username)).map(f => f.username);
            let msg = 'my_stars.php: ' + count + ' star(s)';
            if (addedNames.length)   msg += '; added ' + addedNames.length + ': ' + addedNames.join(', ');
            if (removedNames.length) msg += '; removed ' + removedNames.length + ': ' + removedNames.join(', ');
            if (!addedNames.length && !removedNames.length) msg += '; no changes';
            if (needsUid.length)     msg += '; ' + needsUid.length + ' new UID(s) fetched';
            ptLog('Friends', msg);
        } finally {
            _friendScanRunning = false;
        }
    }

    function installFriendSync() {
        // Run after login with a longer delay to avoid competing with other init fetches
        setTimeout(() => scanFriends(false), 10000);
    }
