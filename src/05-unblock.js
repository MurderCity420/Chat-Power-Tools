    // ============================================================
    // RELIABLE UNBLOCK
    // ============================================================
    // The chat socket's user_unblockUser event has proven unreliable on its
    // own. The site's user-list "Unblock" button uses the real, working code
    // path, so when the target is present in the room we click that. Otherwise
    // we fall back to the socket emit (best effort) and report back.
    // Returns 'clicked' | 'socket' | 'none'.
    // Session-level unblock: removes user from the in-memory _BLOCKED_USERS
    // array so their messages appear immediately this session. Also emits
    // the socket event (which only affects the current session). This does
    // NOT remove them from the server's persistent block list.
    function unblockUserSession(username) {
        const u = lc(username);
        if (!u) return;
        const esc = (window.CSS && CSS.escape) ? CSS.escape(u) : u;

        // Remove from in-memory array first
        if (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) {
            const idx = W.Chat._BLOCKED_USERS.indexOf(u);
            if (idx > -1) W.Chat._BLOCKED_USERS.splice(idx, 1);
        }

        // Try clicking the site's own unblock button in the user list
        let siteBtn = document.querySelector('#ul_list span.btn_blockUser[username="' + esc + '"][title="Unblock"]');
        if (!siteBtn) {
            const candidates = document.querySelectorAll('#ul_list span.btn_blockUser[username="' + esc + '"]');
            candidates.forEach((c) => { if (!siteBtn && c.querySelector('i.unblock')) siteBtn = c; });
        }
        if (siteBtn) {
            try { siteBtn.click(); } catch (e) {}
        } else {
            // Socket fallback for users not in the room
            try {
                if (W.Socket && W.Socket._IO)
                    W.Socket._IO.emit('user_unblockUser', { username: u });
            } catch (e) {}
        }

        // Always force the DOM update as a safety net (in case the site's
        // own click handler didn't remove the visual, or the user left)
        refreshUserBlockedUI(u);
        // Update the hide-list CSS rules too
        updateHideListStyle();
    }

    // Fix the user-list DOM after an unblock: remove the "blocked" visual
    // marker and switch the button back to "Block".
    function refreshUserBlockedUI(username) {
        const u = lc(username);
        if (!u) return;
        const esc = (window.CSS && CSS.escape) ? CSS.escape(u) : u;
        document.querySelectorAll('.c_nickname.blocked[username="' + esc + '"]').forEach((el) => {
            el.classList.remove('blocked');
        });
        document.querySelectorAll('.btn_blockUser[username="' + esc + '"]').forEach((btn) => {
            btn.title = 'Block';
            const icon = btn.querySelector('i');
            if (icon) { icon.className = 'block'; icon.textContent = 'Block'; }
        });
    }

    // Persistent (server-side) unblock — survives reloads.
    //
    // The site's "Unblock" button is an <input type="button"> with a jQuery
    // handler that fills hidden fields on the #full form and POSTs it:
    //   POST my_blocks.php  visit=<token> display= page=1 action=search
    //                       do=Delete fid=<block id> nick=<username>
    // Our synthetic .click() never triggered that handler, so we replicate the
    // POST directly. No iframe, no click — just the request the form makes.
    const BLOCKS_PAGE_PATH = '/1/omgchat/members/my_blocks.php';

    // POST a single Delete. Returns { ok, nextVisit } — nextVisit is the fresh
    // CSRF token parsed from the response (the site rotates it on every submit).
    async function _postUnblock(nick, fid, visit) {
        const body = new URLSearchParams();
        body.set('visit', visit || '');
        body.set('display', '');
        body.set('page', '1');
        body.set('action', 'search');
        body.set('do', 'Delete');
        body.set('fid', String(fid || ''));
        body.set('nick', nick);
        const resp = await fetch(location.origin + BLOCKS_PAGE_PATH, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            // Make the request look like it came from the blocks page itself, in
            // case the server checks the referer for this action.
            referrer: location.origin + BLOCKS_PAGE_PATH,
            body: body.toString()
        });
        const html = await resp.text();
        let nextVisit = visit;
        try {
            const d = new DOMParser().parseFromString(html, 'text/html');
            const v = d.querySelector('input[name="visit"]');
            if (v) nextVisit = (v.getAttribute('value') || v.value || visit);
        } catch (e) {}
        const ok = /has been removed from your block list/i.test(html);
        return { ok, nextVisit };
    }

    // Unblock a single user: walk the (paginated) blocks pages to find their fid
    // and a fresh visit token, then POST the Delete. cb('ok'|'notfound'|'error').
    async function unblockViaBlocksPage(username, cb) {
        const u = lc(username);
        if (!u) { if (cb) cb('error'); return; }
        const esc = (window.CSS && CSS.escape) ? CSS.escape(u) : u;
        try {
            let fid = '', visit = '';
            for (let page = 1; page <= 20; page++) {
                const url = location.origin + BLOCKS_PAGE_PATH + (page > 1 ? '?page=' + page : '');
                const resp = await fetch(url, { credentials: 'include' });
                if (!resp.ok) break;
                const html = await resp.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                if (!visit) { const v = doc.querySelector('input[name="visit"]'); if (v) visit = (v.getAttribute('value') || v.value || ''); }
                const btn = doc.querySelector('input.btn_remove[data-receiver="' + esc + '"][data-fid]');
                if (btn) { fid = btn.getAttribute('data-fid'); break; }
                if (/Congrats, you have no blocked users/i.test(html)) break;
                if (!doc.querySelector('#lpad tr input.btn_remove')) break; // empty page → past the end
            }
            if (!fid) {
                ptLog('Blocks', 'Unblock "' + u + '": not on server block list (already unblocked or session-only).');
                if (cb) cb('notfound');
                return;
            }
            const res = await _postUnblock(u, fid, visit);
            if (res.ok) {
                ptLog('Blocks', 'Unblocked "' + u + '" (persistent, server-side).');
                if (cb) cb('ok');
            } else {
                ptLog('Blocks', 'Unblock "' + u + '": POST sent but server did not confirm.');
                if (cb) cb('error');
            }
        } catch (e) {
            ptLog('Blocks', 'Unblock "' + u + '" error: ' + (e && e.message ? e.message : e));
            if (cb) cb('error');
        }
    }

    // Persistent (server-side) BLOCK — survives reloads, works even when the
    // target isn't in the room. The socket `user_blockUser` emit only persists
    // for a user the server can resolve to a live session (someone present), so
    // for blocking by name we replicate the site's my_blocks.php "Block User"
    // form: POST action=search do=Block search=<name> with a fresh visit token.
    // (The profile page uses a simpler `ajax_block.php` { u, visit }; we use the
    // my_blocks.php form because its path is known and matches the unblock POST.)
    async function blockViaBlocksPage(username, cb) {
        const u = lc(username);
        if (!u) { if (cb) cb('error'); return; }
        try {
            // Fetch the page once to get a fresh visit (CSRF) token.
            let visit = '';
            const pg = await fetch(location.origin + BLOCKS_PAGE_PATH, { credentials: 'include' });
            const phtml = await pg.text();
            try {
                const d0 = new DOMParser().parseFromString(phtml, 'text/html');
                const v = d0.querySelector('input[name="visit"]');
                if (v) visit = (v.getAttribute('value') || v.value || '');
            } catch (e) {}
            const body = new URLSearchParams();
            body.set('visit', visit);
            body.set('display', '');
            body.set('page', '1');
            body.set('action', 'search');
            body.set('do', 'Block');
            body.set('fid', '');
            body.set('nick', '');
            body.set('search', username); // server matches by name (case-insensitive)
            body.set('first', 'all');
            const resp = await fetch(location.origin + BLOCKS_PAGE_PATH, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                referrer: location.origin + BLOCKS_PAGE_PATH,
                body: body.toString()
            });
            const html = await resp.text();
            if (visit) _lastBlocksVisit = visit;
            // Confirm: the username now appears as a cell in the returned block
            // list (not just echoed in the search box), or an explicit message.
            const esc = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const ok = new RegExp('>\\s*' + esc + '\\s*<', 'i').test(html) || /has been (added|blocked)/i.test(html);
            if (ok) { ptLog('Blocks', 'Blocked "' + u + '" persistently (my_blocks.php do=Block).'); if (cb) cb('ok'); }
            else { ptLog('Blocks', 'Block "' + u + '": POST sent, no confirmation in response.'); if (cb) cb('error'); }
            _blocksPageFetched = false; // force a fresh read next time the Blocks tab opens
        } catch (e) {
            ptLog('Blocks', 'Block "' + u + '" error: ' + (e && e.message ? e.message : e));
            if (cb) cb('error');
        }
    }

    // Block immediately for the session AND persist server-side. Use for blocks
    // initiated by name (Blocks-tab box, Blocked tier) where the target may not
    // be in the room. Guest auto-block stays socket-only (those users ARE present
    // and get released shortly anyway).
    function blockUserPersistent(username, cb) {
        try { blockUserLocal(username, true); } catch (e) {}
        blockViaBlocksPage(username, cb);
    }

    // Periodic guest cleanup. Guest accounts are temporary; once one is on your
    // block list it just wastes a slot on the server-enforced 100-cap (and the
    // oldest real blocks get pushed off). The site auto-releases a guest block
    // after ~1 min only while you stay in the room — leave/close and the release
    // never fires, so guests accumulate. This sweep scrapes the blocks pages (one
    // pass, capturing each fid + the visit token) and POSTs a Delete for every
    // guest. Runs on login + every 30 min.
    // The sweep runs on a configurable interval (autoUnblockGuestIntervalMin,
    // minimum 5 minutes). The interval timer is (re)started by this helper so a
    // settings change takes effect without a reload.
    let _guestSweepTimer = null;
    function guestSweepIntervalMs() {
        let m = parseInt(settings.autoUnblockGuestIntervalMin, 10);
        if (isNaN(m) || m < 5) m = 5; // enforce the 5-minute floor
        return m * 60 * 1000;
    }
    function restartGuestSweepInterval() {
        if (_guestSweepTimer) { clearInterval(_guestSweepTimer); _guestSweepTimer = null; }
        _guestSweepTimer = setInterval(() => {
            if (settings.autoUnblockGuestBlocks) sweepGuestBlocks();
        }, guestSweepIntervalMs());
    }

    let _guestSweepRunning = false;
    async function sweepGuestBlocks() {
        if (_guestSweepRunning) return 0;
        _guestSweepRunning = true;
        let removed = 0;
        try {
            const rows = await fetchBlocksPageRows(); // includes fid; sets _lastBlocksVisit
            // Guests labeled by the page Type column, plus any blocked user we've
            // classified guest via profile scrape (logged-out "Profile not found").
            // Both come from the page so they carry a fid we can POST.
            const guests = rows.filter((r) => r.fid && (r.type === 'guest' || getUser(r.username).type === 'guest'));
            if (!guests.length) { ptLog('Guests', 'Sweep: no guest entries on the block list.'); return 0; }
            ptLog('Guests', 'Sweep: ' + guests.length + ' guest(s) to remove.');
            let visit = _lastBlocksVisit;
            for (const g of guests) {
                try {
                    const res = await _postUnblock(g.username, g.fid, visit);
                    if (res.ok) { removed++; unblockUserSession(g.username); }
                    if (res.nextVisit) visit = res.nextVisit; // rotate token for the next POST
                } catch (e) {}
                await new Promise((r) => setTimeout(r, 300));
            }
            _blocksPageFetched = false; // force a fresh read next time the Blocks tab opens
            try { purgeGuestTiers(); } catch (e) {} // guests should never persist in a tier
            // Refresh the room user list so unblocked guests lose their
            // strikethrough / hidden state immediately (the site doesn't redraw
            // them on its own after a server-side unblock).
            try { if (typeof markIgnoredInUserList === 'function') markIgnoredInUserList(); } catch (e) {}
            try { updateHideListStyle(); } catch (e) {}
            try { renderBlockedYou(); } catch (e) {}
            ptLog('Guests', 'Sweep complete: removed ' + removed + '/' + guests.length + '.');
        } catch (e) {
            ptLog('Guests', 'Sweep error: ' + (e && e.message ? e.message : e));
        } finally {
            _guestSweepRunning = false;
        }
        return removed;
    }

    // Optional diagnostic: log every socket emit so we can capture exactly what
    // the site sends when a real action (e.g. unblock) succeeds. Installed once;
    // gated at call time by settings.debugSocketEmits so it can be toggled live.
    let _emitHookInstalled = false;
    function installSocketEmitLogger() {
        if (_emitHookInstalled) return;
        try {
            if (!W.Socket || !W.Socket._IO || typeof W.Socket._IO.emit !== 'function') return;
            const io = W.Socket._IO;
            const orig = io.emit.bind(io);
            io.emit = function (event) {
                if (settings.debugSocketEmits) {
                    try {
                        const args = Array.prototype.slice.call(arguments, 1);
                        console.log('[PowerTools][emit]', event, JSON.parse(JSON.stringify(args)));
                    } catch (e) {
                        console.log('[PowerTools][emit]', event, Array.prototype.slice.call(arguments, 1));
                    }
                }
                return orig.apply(io, arguments);
            };
            _emitHookInstalled = true;
            console.log('[PowerTools] socket emit logger installed');
        } catch (e) {}
    }

    // Diagnostic: the My Account "Blocked Users" page does its unblock via an
    // HTTP request *inside the #browser iframe*, not over the chat socket — so
    // the socket logger can't see it. This hooks the iframe's fetch + XHR
    // (same origin, so we're allowed) and logs each request. Turn on the same
    // "Log socket events" toggle, open My Account → Blocked Users, click an
    // Unblock, and copy the logged [PowerTools][iframe-*] line.
    function hookIframeNetwork(win) {
        if (!win) return;
        try {
            // fetch
            if (win.fetch && !win.__ptFetchHooked) {
                const of = win.fetch.bind(win);
                win.fetch = function (input, init) {
                    if (settings.debugSocketEmits) {
                        try {
                            const url = (typeof input === 'string') ? input : (input && input.url);
                            console.log('[PowerTools][iframe-fetch]', (init && init.method) || 'GET', url, (init && init.body) || '');
                        } catch (e) {}
                    }
                    return of(input, init);
                };
                win.__ptFetchHooked = true;
            }
            // XMLHttpRequest
            const X = win.XMLHttpRequest;
            if (X && X.prototype && !X.prototype.__ptHooked) {
                const open = X.prototype.open;
                const send = X.prototype.send;
                X.prototype.open = function (method, url) {
                    this.__ptMethod = method; this.__ptUrl = url;
                    return open.apply(this, arguments);
                };
                X.prototype.send = function (body) {
                    if (settings.debugSocketEmits) {
                        try { console.log('[PowerTools][iframe-xhr]', this.__ptMethod, this.__ptUrl, body == null ? '' : body); } catch (e) {}
                    }
                    return send.apply(this, arguments);
                };
                X.prototype.__ptHooked = true;
            }
            // jQuery.ajax — my_account.php uses jQuery; hook it directly too in
            // case its $.ajax was bound to a cached transport we'd otherwise miss.
            if (win.jQuery && win.jQuery.ajax && !win.jQuery.__ptAjaxHooked) {
                const oa = win.jQuery.ajax;
                win.jQuery.ajax = function (url, opts) {
                    if (settings.debugSocketEmits) {
                        try {
                            const o = (typeof url === 'object') ? url : (opts || {});
                            console.log('[PowerTools][iframe-ajax]', (o.type || o.method || 'GET'), (typeof url === 'string' ? url : o.url), o.data || '');
                        } catch (e) {}
                    }
                    return oa.apply(this, arguments);
                };
                win.jQuery.__ptAjaxHooked = true;
            }
        } catch (e) { /* not ready / cross-origin */ }
    }

    // Recurse the whole frame tree under a window, hooking each same-origin
    // frame's network and re-hooking it whenever it navigates. The My Account
    // page loads its sections (including Blocked Users) in nested frames, so a
    // top-level-only hook misses the actual unblock request.
    function hookFrameTree(win) {
        if (!win) return;
        hookIframeNetwork(win);
        let frames;
        try { frames = win.document.querySelectorAll('iframe, frame'); } catch (e) { return; }
        frames.forEach((f) => {
            try { hookFrameTree(f.contentWindow); } catch (e) {}
            if (!f.__ptLoadHooked) {
                f.addEventListener('load', () => {
                    if (settings.debugSocketEmits) {
                        try { console.log('[PowerTools][iframe-nav]', f.id || f.name || '(frame)', f.contentWindow && f.contentWindow.location && f.contentWindow.location.href); } catch (e) {}
                    }
                    try { hookFrameTree(f.contentWindow); } catch (e) {}
                });
                f.__ptLoadHooked = true;
            }
        });
    }
    function installIframeNetworkLogger() {
        setInterval(() => {
            if (!settings.debugSocketEmits) return;
            // Walk from the top document so #browser AND any frames nested
            // inside it (and inside those) all get hooked.
            try { hookFrameTree(window); } catch (e) {}
        }, 1000);
    }

