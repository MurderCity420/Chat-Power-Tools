
    // ============================================================
    // MEMBER TYPE DETECTION
    // ============================================================
    // Two types: 'guest' or 'member'. Detected from:
    //   1. The user-list DOM (fast, no network — for users in the room)
    //   2. The profile page at /1/profile/<username> (for everyone else)
    // Results are cached persistently so we only fetch once per user. We also
    // note whether a member is a moderator (stored as users[u].mod = true);
    // mods are treated as members but flagged for later features and shown with
    // the mod badge. Badges are the site's own icon images.
    // The badge icons are embedded as base64 data URIs (the source PNGs live in
    // src/badge_*.png) so they always render — no network fetch, CORS, or path
    // dependency. They're tiny (<1 KB each).
    const MEMBER_BADGE_URL = {
        guest:  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAAA20lEQVR42mMYBUSC7gwxpv7MSYz9mbeA+CsQ/2Lsz3oBpDcx9GWYETagL0sFqPgVEP/HgX8w9Gcb4TUDaOMxmAagaxYxTEgRZ+hJEwHyNwLxIyDezdCfEYvbhN5sNSQbPzLMTOPCVETYK74IQzLOIlyX+QHNSzdwGzIh0w+ucELmOXINUUdS+Imhu4QbNbwy7+A3BKHwFDxg+zIXM0zOkWKYlCvKMCEjBxQzRBnCMDFDB6joPUgxLsw0IXMp4QDuyZYHKpwO1HAXiL9BXfCAqT9jGUNvluNobiQMAGanldd5ztOVAAAAAElFTkSuQmCC',
        member: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAABcWlDQ1BpY2MAAHjaldE7SEJRHMfxr1oUURRUENFwB6slISqiMSySIEHUQKuh+/AF3qvcq7Q4Bq1CQ48lq6GludaG1iAIekA0NTYVtYTc7kFKCQz6Tx/+5/wP5/wOuCtZVbdaxkE3CmY44Jdi8RWp7ZlWemihn1FZtfLByEKUpvVxiwvgxifO4n/VpSUsFVwSMKvmzYLjdWB6o5AX3gX61LSsOT4Fxkzngo7vRV+p+UU4JYwbYTMannPcB0ipBisNVtOm7ngK8Gq6oTmO1awJl4T1bFGlVi6gM2EsR0QfGCLAIkFCSCgUyZClgI8MBhIWYQL4m8wPIuZDFFHIkkFFYp4cOjJiHvEHv7O1kpMTALg6/dD6ZNtvw9C2DdWybX8e2nb1CDyPcGHU53MVmHkHT7ne8x5A9yacXdZ7yg6cb8HAQ142ZQA8gDuZhNcT6IpD7zV0rIrcftY5voNoCZauYG8fRlLQvdbk3e2Nuf215zu/L15zcp/8iQn7AAABJUlEQVR42mMYBQRAQwMTw4TMGMb+jA2MfZn3GPszvwHxPyD+ARR7DMSrGSblyuA1AKhxM1DDToa+LDeG/kxPIPs/w8QsK4ZpmYIMfRkRQP4fpv7MfpxmABUFgmxjWBXKDOZPyEoFanoJMhxqCQuQ/x7kUtyG9GarMUzJFoZxmfqz5jJNyJwHtUCaqS9zDtCFhSQFD9DWayDvwDBDX7oJaQHcXyAAClCgzR4Mk3OkQAEMDItFpBkyIcMdqPEjQ18hJ8RrGZ1A/l+GiRk6ROmHapqA7H9Q7IACFYi3wMVmprFi1z0xTQ7oimCg07sZOtL4GRpC2RCxl5UPCZvMKJBLGfozHLDETro+UNFnpMD8ytCfbgmX/8/ACHThfKD4M1ByGM2Z+AEAljF2NfgVTQYAAAAASUVORK5CYII=',
        mod:    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAASCAYAAAC9+TVUAAABcWlDQ1BpY2MAAHjaldE7SEJRHMfxr1oUURRUENFwB6slISqiMSySIEHUQKuh+/AF3qvcq7Q4Bq1CQ48lq6GludaG1iAIekA0NTYVtYTc7kFKCQz6Tx/+5/wP5/wOuCtZVbdaxkE3CmY44Jdi8RWp7ZlWemihn1FZtfLByEKUpvVxiwvgxifO4n/VpSUsFVwSMKvmzYLjdWB6o5AX3gX61LSsOT4Fxkzngo7vRV+p+UU4JYwbYTMannPcB0ipBisNVtOm7ngK8Gq6oTmO1awJl4T1bFGlVi6gM2EsR0QfGCLAIkFCSCgUyZClgI8MBhIWYQL4m8wPIuZDFFHIkkFFYp4cOjJiHvEHv7O1kpMTALg6/dD6ZNtvw9C2DdWybX8e2nb1CDyPcGHU53MVmHkHT7ne8x5A9yacXdZ7yg6cb8HAQ142ZQA8gDuZhNcT6IpD7zV0rIrcftY5voNoCZauYG8fRlLQvdbk3e2Nuf215zu/L15zcp/8iQn7AAABMUlEQVR42mMYfEAn/1q4dv7VE5oF1wJ08i+LqxXfFAHyo4D4CogG8UHiIHmQOp28q2EoBqiX3eAFSrwG4v/E4yuvtLOu8MAN0c6/FgeSIBXr5F2LhRuilXd1LjmGgPQhueTqNmTJ1bue///z99//5jn3wfzCCXf+//z19//u469RXZJ/dSuSIVfWoRsCAh8///qf3nXr/+t3P0BchCEIvAZhSMHVmeiG/AW65OWbH2AXfPj06/+373+wuWQGcsBmYXjnz7//KR0QV5RMugNyFaYheVczEAFbeFUbmyFIYlgN0c69ogXSjxwuZ0g05BRCNyKa/UlMbH44kv7V9UQasI4BFwAlY6BBZwkYcAaW3PEapFVwdSU2A0DiIHnic3XBZQdg1K8FZUwQrZt73Z6mxQgArnvm8BOL92gAAAAASUVORK5CYII=',
    };
    const _memberTypeFetched = new Set(); // usernames already fetched this session
    let _blocksPageFetched = false;        // whether my_blocks.php bulk scrape has run this session
    let _blocksPageOrder = [];             // usernames in my_blocks.php order (the site lists newest blocks first)
    let _lastBlocksVisit = '';            // most recent my_blocks.php "visit" CSRF token (for POST unblock)

    // Move all user data from oldName to newName in settings.users when a profile
    // fetch reveals the same UID now belongs to a different username.
    function applyUsernameRename(oldName, newName) {
        oldName = lc(oldName);
        newName = lc(newName);
        if (!oldName || !newName || oldName === newName) return;
        if (!settings.users) return;
        const oldData = settings.users[oldName];
        if (!oldData) return;
        // Merge old record into new (preserve any existing new-name data)
        settings.users[newName] = Object.assign({}, oldData, settings.users[newName] || {});
        delete settings.users[oldName];
        saveUsersSoon();
        if (oldData.tier === 'ignored') syncIgnoredToChat();
        ptLog('Members', 'Username rename detected: "' + oldName + '" → "' + newName + '".');
        try { _noteProfileRename(); } catch (e) {}
        try { renderPanelLists(); } catch (e) {}
        try { updateHideListStyle(); } catch (e) {}
        try { if (typeof markIgnoredInUserList === 'function') markIgnoredInUserList(); } catch (e) {}
    }

    // Read type from a single user-list row. Guest rows have <i class="badge guest">.
    // Any other badge (vip, registered, verified, mod, king, highroller) → member.
    function rowMemberType(rowEl) {
        if (!rowEl) return '';
        const badge = rowEl.querySelector('i.badge');
        if (!badge) return '';
        return badge.classList.contains('guest') ? 'guest' : 'member';
    }
    // Mods carry an <i class="badge mod"> in the user list.
    function rowIsMod(rowEl) {
        return !!(rowEl && rowEl.querySelector('i.badge.mod'));
    }

    function scanMemberTypes() {
        const rows = document.querySelectorAll('#ul_list [username], #wm_list [username]');
        let changed = false;
        rows.forEach((row) => {
            const u = lc(row.getAttribute('username'));
            if (!u) return;
            const t = rowMemberType(row);
            if (t && getUser(u).type !== t) { patchUser(u, { type: t }); changed = true; }
            if (rowIsMod(row) && !getUser(u).mod) { patchUser(u, { mod: true }); changed = true; }
        });
        if (changed) saveUsersSoon();
        return changed;
    }

    function getMemberType(username) {
        const u = lc(username);
        if (!u) return '';
        const esc = (window.CSS && CSS.escape) ? CSS.escape(u) : u;
        const liveRow = document.querySelector('#ul_list [username="' + esc + '"], #wm_list [username="' + esc + '"]');
        if (liveRow) {
            const t = rowMemberType(liveRow);
            if (t) {
                if (getUser(u).type !== t) { patchUser(u, { type: t }); saveUsersSoon(); }
                return t;
            }
        }
        return getUser(u).type || '';
    }

    function memberBadgeHtml(username) {
        const u = lc(username);
        const t = getMemberType(u);
        if (t !== 'guest' && t !== 'member') return '';
        // Mods are members but get the mod badge.
        const kind = (t === 'member' && getUser(u).mod) ? 'mod' : t;
        const label = kind === 'guest' ? 'Guest' : kind === 'mod' ? 'Mod' : 'Member';
        return '<img class="pt-member-badge" src="' + MEMBER_BADGE_URL[kind] +
               '" title="' + label + '" alt="' + label + '"> ';
    }

    // --- Profile-scrape rollup ---
    // fetchMemberType hits /1/profile/<user> and is called in bursts (batches
    // of 4) from init, friend sync, and ensureMemberTypes. Rather than log each
    // hit, we tally results and flush ONE summary line ~1.5s after the burst
    // goes quiet (each new fetch resets the timer, so a batch = one line).
    let _profileScrapeStats = null;   // { fetched, member, guest, unknown, renames }
    let _profileScrapeTimer = null;
    function _psAccum() {
        if (!_profileScrapeStats) _profileScrapeStats = { fetched: 0, member: 0, guest: 0, unknown: 0, renames: 0 };
        return _profileScrapeStats;
    }
    function _scheduleProfileFlush() {
        if (_profileScrapeTimer) clearTimeout(_profileScrapeTimer);
        _profileScrapeTimer = setTimeout(_flushProfileScrapeStats, 1500);
    }
    function _recordProfileScrape(type) {
        const s = _psAccum();
        s.fetched++;
        if (type === 'member') s.member++;
        else if (type === 'guest') s.guest++;
        else s.unknown++;
        _scheduleProfileFlush();
    }
    function _noteProfileRename() { _psAccum().renames++; _scheduleProfileFlush(); }
    function _flushProfileScrapeStats() {
        _profileScrapeTimer = null;
        const s = _profileScrapeStats;
        _profileScrapeStats = null;
        if (!s || !s.fetched) return;
        let msg = 'profiles: fetched ' + s.fetched + ' (' + s.member + ' member, ' + s.guest + ' guest' +
                  (s.unknown ? ', ' + s.unknown + ' unknown' : '') + ')';
        if (s.renames) msg += ', ' + s.renames + ' rename(s)';
        ptLog('Scrape', msg);
    }

    // Thin wrapper: dedup/cache check, then record the network result for the
    // batch rollup. The actual scrape lives in _fetchMemberTypeRaw.
    async function fetchMemberType(username) {
        const u = lc(username);
        if (!u) return '';
        // Known guest — a temporary account; no UID/rename tracking is useful,
        // so don't even fetch the profile. This also stops the rename storm that
        // recycled guest UIDs would otherwise cause.
        if (getUser(u).type === 'guest') return 'guest';
        if (_memberTypeFetched.has(u)) return getUser(u).type || '';
        const result = await _fetchMemberTypeRaw(u);
        _recordProfileScrape(result);
        return result;
    }

    async function _fetchMemberTypeRaw(u) {
        _memberTypeFetched.add(u);
        try {
            const signal = (typeof AbortSignal !== 'undefined' && AbortSignal.timeout)
                ? AbortSignal.timeout(5000) : undefined;
            const resp = await fetch(
                location.origin + '/1/profile/' + encodeURIComponent(u),
                { credentials: 'include', ...(signal ? { signal } : {}) }
            );
            if (!resp.ok) return '';
            const html = await resp.text();
            // Profile page with no c_user container — guests have temporary
            // accounts that get cleaned up, leaving broken profile URLs.
            if (!html.includes('id="c_user"')) {
                patchUser(u, { type: 'guest' });
                saveUsersSoon();
                return 'guest';
            }

            // Determine type from the <h1> FIRST. "Profile not found" = a guest
            // that has logged out (the placeholder page still has id="c_user" and
            // an EMPTY id="badges", so it must be checked before the member
            // heuristic). "- guest" suffix = active guest. Otherwise a member.
            const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            const h1Text = m ? m[1].replace(/<[^>]*>/g, '').trim().toLowerCase() : '';
            const type = h1Text.includes('profile not found') ? 'guest'
                       : h1Text.includes('- guest') ? 'guest'
                       : html.includes('id="badges"') ? 'member' : '';

            // Guests are temporary accounts whose UIDs get recycled — tracking
            // their UID or detecting renames causes a rename storm as one UID is
            // passed between successive guests. Record the type only.
            if (type === 'guest') {
                patchUser(u, { type: 'guest' });
                saveUsersSoon();
                return 'guest';
            }

            // Members (and unknown real accounts): canonical username + UID +
            // rename detection.
            const canonicalMatch = html.match(/var\s+user\s*=\s*"([^"]+)"/);
            const canonical = canonicalMatch ? lc(canonicalMatch[1]) : u;
            if (canonical && canonical !== u) applyUsernameRename(u, canonical);
            const target = canonical || u; // write uid/type to the authoritative name

            const uidMatch = html.match(/var\s+uid\s*=\s*(\d+)/);
            if (uidMatch) {
                const uid = uidMatch[1];
                const prev = getUserByUid(uid);
                if (prev && prev.username !== target) applyUsernameRename(prev.username, target);
                patchUser(target, { uid });
                saveUsersSoon();
            }
            if (type) { patchUser(target, { type }); saveUsersSoon(); }
            // Note moderators (treated as members, flagged for later features).
            if (type === 'member' && /badge_mod\.png/i.test(html) && !getUser(target).mod) {
                patchUser(target, { mod: true });
                saveUsersSoon();
            }
            return type;
        } catch (e) { return ''; }
    }

    // Fetch ALL pages of my_blocks.php (paginated ~30/page via ?page=N) and return
    // parsed rows in page order: [{ username, type }]. The "Type" column says
    // "Member" or "Guest" directly. Side effects: refreshes the persistent
    // member-type cache and captures _blocksPageOrder (the site's newest-first order,
    // used to sort the "You Block" list to match the console).
    async function fetchBlocksPageRows() {
        const rows = [];
        // The blocks page is paginated (~30/page) via ?page=N. Walk pages until
        // the "Congrats, you have no blocked users!" sentinel (shown on the page
        // AFTER the last) or an empty page. ?action=all does NOT exist — it was
        // silently returning only page 1.
        let fetchedOk = false;
        try {
            for (let page = 1; page <= 20; page++) {
                const url = location.origin + '/1/omgchat/members/my_blocks.php' + (page > 1 ? '?page=' + page : '');
                const resp = await fetch(url, { credentials: 'include' });
                if (!resp.ok) break;
                const html = await resp.text();
                fetchedOk = true;
                if (/Congrats, you have no blocked users/i.test(html)) break; // past the last page
                const doc = new DOMParser().parseFromString(html, 'text/html');
                // Capture the form's CSRF "visit" token once — needed to POST unblocks.
                if (page === 1) {
                    const vEl = doc.querySelector('input[name="visit"]');
                    if (vEl) _lastBlocksVisit = vEl.getAttribute('value') || vEl.value || '';
                }
                let pageCount = 0;
                doc.querySelectorAll('#lpad tr').forEach((row) => {
                    const nameEl = row.querySelector('th span');
                    if (!nameEl) return;
                    const u = lc(nameEl.textContent.trim());
                    const tds = row.querySelectorAll('td');
                    if (!u || tds.length < 2) return;
                    // tds[0] = Status (Online/Offline), tds[1] = Type (Member/Guest)
                    const typeText = tds[1].textContent.trim().toLowerCase();
                    const type = typeText === 'member' ? 'member' : typeText === 'guest' ? 'guest' : '';
                    // The Unblock button carries the block-relationship id we POST as `fid`.
                    const rmBtn = row.querySelector('input.btn_remove[data-fid]');
                    const fid = rmBtn ? rmBtn.getAttribute('data-fid') : '';
                    // Note moderators if the row exposes a mod badge (best-effort).
                    if (row.querySelector('img[src*="badge_mod"], i.badge.mod') && !getUser(u).mod) {
                        patchUser(u, { mod: true });
                    }
                    rows.push({ username: u, type, fid });
                    pageCount++;
                });
                if (pageCount === 0) break; // no rows on this page → past the end
            }
        } catch (e) {}

        // Network failure before any page loaded — don't clobber state or log a
        // misleading "0 records / everyone removed".
        if (!fetchedOk) return rows;

        // Apply types + detect changes vs the previous scrape across the FULL roster.
        const prevOrder = _blocksPageOrder.slice();
        const prevSet = new Set(prevOrder);
        let updated = 0;
        const typeChanges = [];   // users already on the list whose Type flipped
        rows.forEach(({ username: u, type }) => {
            if (type && getUser(u).type !== type) {
                const prevType = getUser(u).type;
                patchUser(u, { type });
                updated++;
                if (prevSet.has(u) && prevType) typeChanges.push(u + ' (' + prevType + '→' + type + ')');
            }
        });
        _blocksPageOrder = rows.map((r) => r.username);

        // Diagnostic: totals, member/guest breakdown, and the delta vs last scrape.
        const curSet = new Set(_blocksPageOrder);
        const members = rows.filter((r) => r.type === 'member').length;
        const guests  = rows.filter((r) => r.type === 'guest').length;
        const unknown = rows.length - members - guests;
        const added   = rows.filter((r) => !prevSet.has(r.username))
                            .map((r) => r.username + '=' + (r.type || '?'));
        const removed = prevOrder.filter((u) => !curSet.has(u));
        let msg = 'my_blocks.php: ' + rows.length + ' record(s) (' + members + ' member, ' +
                  guests + ' guest' + (unknown ? ', ' + unknown + ' unknown' : '') + ')';
        if (added.length)       msg += '; added ' + added.length + ': ' + added.join(', ');
        if (removed.length)     msg += '; removed ' + removed.length + ': ' + removed.join(', ');
        if (typeChanges.length) msg += '; type changed: ' + typeChanges.join(', ');
        if (!added.length && !removed.length && !typeChanges.length) msg += '; no changes';
        ptLog('Scrape', msg);

        if (updated > 0) {
            saveUsersSoon();
            try { renderBlockedYou(); } catch (e) {}
        }
        return rows;
    }

    // Bulk-scrape member types from the blocks page. Far faster than fetching 100
    // individual profile pages. Call once per session; pass force=true to re-run
    // (e.g. after Refresh). Delegates to fetchBlocksPageRows.
    async function fetchBlocksPageMemberTypes(force) {
        if (_blocksPageFetched && !force) return;
        const rows = await fetchBlocksPageRows();
        // Only lock the once-per-session guard once we actually got data. An
        // empty result right after login (block list not ready on the page yet)
        // must not permanently disable the bulk type load — otherwise the You
        // Block badges never populate for the rest of the session.
        if (rows.length > 0) _blocksPageFetched = true;
    }

    let _blocksRenderGeneration = 0;
    async function ensureMemberTypes(usernames, generation, onUpdate) {
        const missing = usernames.filter((u) => {
            const k = lc(u);
            return k && !getUser(k).type && !_memberTypeFetched.has(k);
        });
        if (missing.length === 0) return;
        for (let i = 0; i < missing.length; i += 4) {
            if (_blocksRenderGeneration !== generation) return;
            const batch = missing.slice(i, i + 4);
            let batchChanged = false;
            await Promise.all(batch.map(async (u) => {
                const type = await fetchMemberType(u);
                if (type) batchChanged = true;
            }));
            if (batchChanged && onUpdate && _blocksRenderGeneration === generation) onUpdate();
        }
    }
