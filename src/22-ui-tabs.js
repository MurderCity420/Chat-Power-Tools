    // Filter state for the Favorites and Ignored lists (persist across re-renders).
    let _favFilter = 'all';      // 'all' | 'fav' | 'friend' | 'both'
    let _ignoredFilter = 'all';  // 'all' | 'alerts' | 'ignored' | 'blocked'
    let _favText = '';           // free-text search box on the Favorites tab
    let _ignoredText = '';       // free-text search box on the Ignored tab
    let _panelRenderGeneration = 0;

    const _PT_DOCBASE = 'https://github.com/MurderCity420/Chat-Power-Tools/blob/main/docs/';
    function _tabDocHtml(page) {
        return '<a class="pt-tab-doc-link" href="' + _PT_DOCBASE + page + '" target="_blank" rel="noopener noreferrer" title="Open documentation for this tab">\u{1F4D6}</a>';
    }
    function _infoLink(page, anchor) {
        return '<a class="pt-info" href="' + _PT_DOCBASE + page + (anchor ? '#' + anchor : '') + '" target="_blank" rel="noopener noreferrer" title="Documentation">i</a>';
    }

    // A user's public profile URL (opens in a new tab).
    function profileUrl(u) { return location.origin + '/1/profile/' + encodeURIComponent(lc(u)); }

    // Hover tooltip for a username. We track renames, so show any former names
    // ("formerly: a, b, c"). Falls back to just the current name.
    function nameTitleAttr(u) {
        const p = getUser(u).prevNames;
        return (Array.isArray(p) && p.length) ? (lc(u) + ' — formerly: ' + p.join(', ')) : lc(u);
    }

    // Free-text search match for the list filter boxes: matches the current
    // username OR any tracked former username (renames). `q` is the (lowercased)
    // query; empty query matches everything.
    function matchesText(user, q) {
        if (!q) return true;
        q = String(q).toLowerCase();
        if (lc(user).includes(q)) return true;
        const p = getUser(user).prevNames;
        return Array.isArray(p) && p.some((n) => String(n).toLowerCase().includes(q));
    }

    function renderPanelLists() {
        const panel = document.getElementById('pt-panel');
        if (!panel) return;

        // IGNORED
        const ip = panel.querySelector('.pt-tabpane[data-pane="ignored"]');

        // Build combined entry list from unified users dict.
        const _entries = [];
        for (const [u, d] of Object.entries(settings.users || {})) {
            if (d.tier) _entries.push({ user: u, tier: d.tier });
        }
        // Include any live-blocked users not yet in the dict (first-run before updateBlockedBackup fires).
        const _liveBlocked = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS : [];
        _liveBlocked.forEach((u) => { const k = lc(u); if (k && !(settings.users[k] && settings.users[k].tier)) _entries.push({ user: k, tier: 'blocked' }); });
        _entries.sort((a, b) => a.user.localeCompare(b.user));

        ip.innerHTML = `
            ${_tabDocHtml('ignore-and-blocks.md')}
            <div class="pt-section">
                <h3>Display mode for hidden content ${_infoLink('ignore-and-blocks.md', 'display-mode-for-hidden-content')}</h3>
                <div class="pt-row">
                    <select id="pt-displaymode">
                        <option value="invisible">Invisible (gone entirely)</option>
                        <option value="collapsed">Collapsed (click placeholder to reveal)</option>
                        <option value="blurred">Blurred (hover to reveal)</option>
                    </select>
                </div>
                <div class="pt-toggle">
                    <input type="checkbox" id="pt-hidetickers">
                    <label for="pt-hidetickers">Also hide dice/slot/rating tickers from ignored users</label>
                </div>
                <div class="pt-toggle">
                    <input type="checkbox" id="pt-hide-from-list">
                    <label for="pt-hide-from-list">Remove ignored &amp; blocked users from the user list completely</label>
                </div>
            </div>
            <div class="pt-section">
                <div class="pt-row" style="gap:8px">
                    <div style="display:flex;flex:1;min-width:0;gap:6px">
                        <input type="text" id="pt-ignored-input" placeholder="username" style="flex:1;min-width:0">
                        <button id="pt-ignored-add">Ignore</button>
                    </div>
                    <input type="text" id="pt-ignored-search" placeholder="Search / filter…" style="flex:1;min-width:0;background:#111;color:#eee;border:1px solid #444;padding:4px 6px;border-radius:3px;font-size:12px">
                </div>
            </div>
            <div class="pt-section">
                <h3>Users (${_entries.length})</h3>
                <div class="pt-tier-scroll">
                <table class="pt-tier-table">
                    <thead>
                        <tr>
                            <th style="text-align:left">Name</th>
                            <th class="pt-igfilter" data-f="alerts" style="color:#ffd24d;cursor:pointer" title="Show only Alerts-tier users">Alerts</th>
                            <th class="pt-igfilter" data-f="ignored" style="color:#ff9933;cursor:pointer" title="Show only Ignored-tier users">Ignored</th>
                            <th class="pt-igfilter" data-f="blocked" style="color:#f88;cursor:pointer" title="Show only Blocked-tier users">Blocked</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="pt-ignored-list"></tbody>
                </table>
                </div>
            </div>
            <div class="pt-section" style="color:#888;font-size:11px">
                Alerts = suppress notifications only &nbsp;·&nbsp; Ignored = hide all messages &nbsp;·&nbsp; Blocked = server-side block (manage in Blocks tab)
            </div>
        `;

        // Header filters (click a column header to filter; click the active one again to clear).
        ip.querySelectorAll('.pt-igfilter').forEach((th) => {
            if (th.dataset.f === _ignoredFilter) { th.style.textDecoration = 'underline'; th.style.fontWeight = '700'; }
            th.addEventListener('click', () => {
                _ignoredFilter = (_ignoredFilter === th.dataset.f) ? 'all' : th.dataset.f;
                renderPanelLists();
            });
        });

        // Build the table rows, honouring the active tier filter (header click)
        // and the text search box. A closure so the search box can re-render only
        // the rows — keeping focus in the input.
        const list = ip.querySelector('#pt-ignored-list'); // <tbody>
        function fillIgnoredRows() {
            let _shown = (_ignoredFilter === 'all') ? _entries : _entries.filter((e) => e.tier === _ignoredFilter);
            if (_ignoredText) _shown = _shown.filter((e) => matchesText(e.user, _ignoredText));
            list.innerHTML = '';
            if (_shown.length === 0) {
                list.innerHTML = '<tr><td colspan="5" class="pt-empty">' + (_entries.length ? 'No users match this filter.' : 'No one here yet.') + '</td></tr>';
                return;
            }
            const TIER_COLORS = { alerts: '#ffd24d', ignored: '#ff9933', blocked: '#f88' };
            _shown.forEach(({ user, tier }) => {
                const tr = document.createElement('tr');

                const nameTd = document.createElement('td');
                nameTd.innerHTML = memberBadgeHtml(user) +
                    '<a class="pt-name-link" draggable="false" href="' + profileUrl(user) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(user) + '</a>';
                nameTd.title = nameTitleAttr(user);
                nameTd.style.cssText = 'max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
                    'border-left:3px solid ' + (TIER_COLORS[tier] || 'transparent') + ';padding-left:6px';

                // One checkbox per tier cell. Blocked ⊃ Ignored ⊃ Alerts:
                // checking a higher level auto-checks lower ones; unchecking a
                // lower level clears the higher ones. Effective tier = highest checked.
                const mkCell = (full) => {
                    const td = document.createElement('td');
                    td.style.textAlign = 'center';
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.title = full;
                    cb.style.cursor = 'pointer';
                    td.appendChild(cb);
                    return { td, cb };
                };
                const a = mkCell('Alerts — suppress notifications');
                const i = mkCell('Ignored — hide all messages (includes Alerts)');
                const b = mkCell('Blocked — server-side block + Blocks tab (includes Alerts & Ignored)');
                const cbA = a.cb, cbI = i.cb, cbB = b.cb;
                cbA.checked = (tier === 'alerts' || tier === 'ignored' || tier === 'blocked');
                cbI.checked = (tier === 'ignored' || tier === 'blocked');
                cbB.checked = (tier === 'blocked');

                // Mods can't be blocked unless you're a mod/model yourself, or you've
                // turned on "Allow Mod Blocking" (Features → Blocking). Leave the box
                // enabled when it's already checked so you can always UNblock — only a
                // fresh block of a mod is disallowed.
                if (getUser(user).mod && !cbB.checked && !amIModOrModel() && !settings.allowModBlocking) {
                    cbB.disabled = true;
                    cbB.style.cursor = 'not-allowed';
                    cbB.title = 'This user is a moderator. Enable "Allow Mod Blocking" (Features → Blocking) to block them.';
                }

                const apply = () => setUserTier(user, cbB.checked ? 'blocked' : cbI.checked ? 'ignored' : cbA.checked ? 'alerts' : '');
                cbA.addEventListener('change', () => {
                    if (!cbA.checked && (cbI.checked || cbB.checked)) {
                        const higher = cbB.checked ? 'Blocked' : 'Ignored';
                        if (!confirm('Unchecking Alerts will also remove "' + user + '" from your ' + higher + ' list. Continue?')) {
                            cbA.checked = true; // revert — keep them where they are
                            return;
                        }
                        cbI.checked = false; cbB.checked = false;
                    } else if (!cbA.checked) {
                        cbI.checked = false; cbB.checked = false;
                    }
                    apply();
                });
                cbI.addEventListener('change', () => { if (cbI.checked) cbA.checked = true; else cbB.checked = false; apply(); });
                cbB.addEventListener('change', () => { if (cbB.checked) { cbA.checked = true; cbI.checked = true; } apply(); });

                const remTd = document.createElement('td');
                remTd.style.textAlign = 'center';
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.title = 'Remove from all lists (also unblocks on the site if Blocked)';
                removeBtn.addEventListener('click', () => setUserTier(user, ''));
                remTd.appendChild(removeBtn);

                tr.appendChild(nameTd);
                tr.appendChild(a.td);
                tr.appendChild(i.td);
                tr.appendChild(b.td);
                tr.appendChild(remTd);
                list.appendChild(tr);
            });
        }
        fillIgnoredRows();

        ip.querySelector('#pt-ignored-add').addEventListener('click', () => {
            const inp = ip.querySelector('#pt-ignored-input');
            addIgnoredUser(inp.value);
            inp.value = '';
        });
        ip.querySelector('#pt-ignored-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') ip.querySelector('#pt-ignored-add').click();
        });
        const igSearch = ip.querySelector('#pt-ignored-search');
        if (igSearch) {
            igSearch.value = _ignoredText;
            igSearch.addEventListener('input', () => { _ignoredText = igSearch.value.trim().toLowerCase(); fillIgnoredRows(); });
        }
        const sel = ip.querySelector('#pt-displaymode');
        sel.value = settings.displayMode;
        sel.addEventListener('change', () => {
            saveSetting('displayMode', sel.value);
            reapplyModeToAllHidden();
        });
        const tc = ip.querySelector('#pt-hidetickers');
        tc.checked = settings.hideTickersFromIgnored;
        tc.addEventListener('change', () => saveSetting('hideTickersFromIgnored', tc.checked));

        const hfl = ip.querySelector('#pt-hide-from-list');
        hfl.checked = !!settings.hideIgnoredAndBlockedFromList;
        hfl.addEventListener('change', () => {
            saveSetting('hideIgnoredAndBlockedFromList', hfl.checked);
            updateHideListStyle();
            markIgnoredInUserList();
        });

        // FAVORITES
        const fp = panel.querySelector('.pt-tabpane[data-pane="favorites"]');
        fp.innerHTML = `
            ${_tabDocHtml('favorites.md')}
            <div class="pt-section">
                <h3>Highlight style ${_infoLink('favorites.md', 'highlight-style--color')}</h3>
                <div class="pt-row">
                    <select id="pt-fav-style">
                        <option value="subtle">Subtle (left border + gradient)</option>
                        <option value="highlight">Strong highlight (background)</option>
                        <option value="bold">Bold text</option>
                        <option value="box">Box border</option>
                    </select>
                </div>
            </div>
            <div class="pt-section">
                <h3>Highlight color ${_infoLink('favorites.md', 'highlight-style--color')}</h3>
                <div class="pt-row" style="flex-direction:column;align-items:flex-start;gap:6px">
                    <label><input type="radio" name="pt-fav-color-src" value="username"> Use sender's username color</label>
                    <label style="display:flex;align-items:center;gap:8px">
                        <input type="radio" name="pt-fav-color-src" value="custom">
                        Custom color:
                        <input type="color" id="pt-fav-custom-color" value="#ffd700" style="width:32px;height:24px;border:none;padding:0;background:none;cursor:pointer">
                    </label>
                </div>
                <div style="color:#888;font-size:11px;margin-top:6px">
                    Custom colors are contrast-checked against the chat background so they stay readable.
                </div>
            </div>
            <div class="pt-section">
                <h3>Add favorite user</h3>
                <div class="pt-row" style="gap:8px">
                    <div style="display:flex;flex:1;min-width:0;gap:6px">
                        <input type="text" id="pt-fav-input" placeholder="username" style="flex:1;min-width:0">
                        <button id="pt-fav-add">Add</button>
                    </div>
                    <input type="text" id="pt-fav-search" placeholder="Search / filter…" style="flex:1;min-width:0;background:#111;color:#eee;border:1px solid #444;padding:4px 6px;border-radius:3px;font-size:12px">
                </div>
            </div>
            <div class="pt-section">
                <h3>Favorites &amp; Friends (${Object.values(settings.users||{}).filter(d=>d.fav||d.friend).length})</h3>
                <div style="font-size:11px;margin-bottom:6px;display:flex;gap:12px;flex-wrap:wrap">
                    <span class="pt-favfilter" data-f="fav" style="color:#FFD700;cursor:pointer">■ Fav Only</span>
                    <span class="pt-favfilter" data-f="friend" style="color:#4488FF;cursor:pointer">■ Friend Only</span>
                    <span class="pt-favfilter" data-f="both" style="color:#44CC88;cursor:pointer">■ Friend &amp; Fav</span>
                    <span class="pt-favfilter" data-f="all" style="color:#ccc;cursor:pointer">All</span>
                </div>
                <ul class="pt-list" id="pt-fav-list"></ul>
            </div>
        `;
        const styleSel = fp.querySelector('#pt-fav-style');
        styleSel.value = settings.favoriteStyle || 'subtle';
        styleSel.addEventListener('change', () => {
            saveSetting('favoriteStyle', styleSel.value);
            reapplyFavoriteStyles();
        });
        // Color source radios
        const favRadios = fp.querySelectorAll('input[name="pt-fav-color-src"]');
        favRadios.forEach((r) => {
            if (r.value === (settings.favoriteColorSource || 'custom')) r.checked = true;
            r.addEventListener('change', () => {
                if (r.checked) {
                    saveSetting('favoriteColorSource', r.value);
                    reapplyFavoriteStyles();
                }
            });
        });
        const favCustomColor = fp.querySelector('#pt-fav-custom-color');
        favCustomColor.value = settings.favoriteCustomColor || '#ffd700';
        favCustomColor.addEventListener('input', () => {
            saveSetting('favoriteCustomColor', favCustomColor.value);
            const customRadio = fp.querySelector('input[name="pt-fav-color-src"][value="custom"]');
            if (!customRadio.checked) {
                customRadio.checked = true;
                saveSetting('favoriteColorSource', 'custom');
            }
            reapplyFavoriteStyles();
        });

        // Filter bar (Fav Only / Friend Only / Friend & Fav / All)
        fp.querySelectorAll('.pt-favfilter').forEach((s) => {
            if (s.dataset.f === _favFilter) { s.style.fontWeight = 'bold'; s.style.textDecoration = 'underline'; }
            s.addEventListener('click', () => { _favFilter = s.dataset.f; renderPanelLists(); });
        });

        // Combined Favorites & Friends list
        const flist = fp.querySelector('#pt-fav-list');
        const TYPE_COLORS = { fav: '#FFD700', friend: '#4488FF', both: '#44CC88' };
        const _combined = Object.entries(settings.users || {})
            .filter(([, d]) => d.fav || d.friend)
            .map(([u, d]) => ({ user: u, type: (d.fav && d.friend) ? 'both' : d.fav ? 'fav' : 'friend' }))
            .sort((a, b) => a.user.localeCompare(b.user));
        function fillFavRows() {
            let _favShown = (_favFilter === 'all') ? _combined : _combined.filter((e) => e.type === _favFilter);
            if (_favText) _favShown = _favShown.filter((e) => matchesText(e.user, _favText));
            flist.innerHTML = '';
            if (_favShown.length === 0) {
                flist.innerHTML = '<li class="pt-empty">' + (_combined.length ? 'No one matches this filter.' : 'No favorites or friends yet.') + '</li>';
                return;
            }
            _favShown.forEach(({ user, type }) => {
                const li = document.createElement('li');
                li.style.borderLeft = '3px solid ' + TYPE_COLORS[type];
                li.style.paddingLeft = '6px';

                const nameSpan = document.createElement('span');
                nameSpan.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center';
                nameSpan.title = nameTitleAttr(user);
                nameSpan.innerHTML = memberBadgeHtml(user) +
                    '<a class="pt-name-link" draggable="false" href="' + profileUrl(user) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(user) + '</a>';

                li.appendChild(nameSpan);

                // Remove is only meaningful for Favorites — it clears the Fav flag
                // and nothing else. Friends are pulled from the site (the star list)
                // and can't be removed here, so Friend-Only rows get no button.
                if (type === 'fav' || type === 'both') {
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = 'Remove';
                    removeBtn.title = 'Remove from Favorites (does not change their Friend/star status on the site)';
                    removeBtn.addEventListener('click', () => {
                        patchUser(user, { fav: undefined });
                        saveUsersSoon();
                        renderPanelLists();
                    });
                    li.appendChild(removeBtn);
                }

                flist.appendChild(li);
            });
        }
        fillFavRows();

        fp.querySelector('#pt-fav-add').addEventListener('click', () => {
            const inp = fp.querySelector('#pt-fav-input');
            addFavorite(inp.value);
            inp.value = '';
        });
        fp.querySelector('#pt-fav-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') fp.querySelector('#pt-fav-add').click();
        });
        const favSearch = fp.querySelector('#pt-fav-search');
        if (favSearch) {
            favSearch.value = _favText;
            favSearch.addEventListener('input', () => { _favText = favSearch.value.trim().toLowerCase(); fillFavRows(); });
        }

        // Resolve member type / mod flag for everyone shown in the Favorites and
        // Ignored lists so their badges populate, then re-render once. Guarded by
        // a generation counter so a newer render supersedes a stale fetch loop.
        (async () => {
            const gen = ++_panelRenderGeneration;
            const need = Array.from(new Set(_entries.map((e) => e.user).concat(_combined.map((c) => c.user))))
                .filter((u) => { const k = lc(u); return k && !getUser(k).type && !_memberTypeFetched.has(k); });
            let any = false;
            for (let i = 0; i < need.length; i += 4) {
                if (gen !== _panelRenderGeneration) return; // superseded
                await Promise.all(need.slice(i, i + 4).map((u) => fetchMemberType(u).then((t) => { if (t) any = true; })));
            }
            if (any && gen === _panelRenderGeneration) { try { renderPanelLists(); } catch (e) {} }
        })();

        // KEYWORDS
        const kp = panel.querySelector('.pt-tabpane[data-pane="keywords"]');
        kp.innerHTML = `
            ${_tabDocHtml('keywords.md')}
            <div class="pt-section">
                <h3>Filter mode ${_infoLink('keywords.md', 'filter-modes')}</h3>
                <div class="pt-row">
                    <select id="pt-kw-mode">
                        <option value="redact">Redact (replace matched word with ***)</option>
                        <option value="hide">Hide whole message</option>
                    </select>
                </div>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    Redact replaces just the matched word (whole word, case-insensitive). Hide removes the entire message containing the word.
                </div>
            </div>
            <div class="pt-section">
                <h3>Add a word or phrase to filter</h3>
                <div class="pt-row">
                    <input type="text" id="pt-kw-input" placeholder="word or phrase">
                    <button id="pt-kw-add">Add</button>
                </div>
            </div>
            <div class="pt-section">
                <h3>Filtered words (${settings.keywords.length})</h3>
                <ul class="pt-list" id="pt-kw-list"></ul>
            </div>
        `;
        const modeSel = kp.querySelector('#pt-kw-mode');
        modeSel.value = settings.keywordMode || 'redact';
        modeSel.addEventListener('change', () => saveSetting('keywordMode', modeSel.value));

        const klist = kp.querySelector('#pt-kw-list');
        if (settings.keywords.length === 0) {
            klist.innerHTML = '<li class="pt-empty">No keywords set.</li>';
        } else {
            settings.keywords.slice().sort().forEach((k) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${escapeHtml(k)}</span><button>Remove</button>`;
                li.querySelector('button').addEventListener('click', () => removeKeyword(k));
                klist.appendChild(li);
            });
        }
        kp.querySelector('#pt-kw-add').addEventListener('click', () => {
            const inp = kp.querySelector('#pt-kw-input');
            addKeyword(inp.value);
            inp.value = '';
        });
        kp.querySelector('#pt-kw-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') kp.querySelector('#pt-kw-add').click();
        });
    }

    function renderAdvancedPane() {
        const ap = document.querySelector('#pt-panel .pt-tabpane[data-pane="advanced"]');
        ap.innerHTML = `
            ${_tabDocHtml('advanced.md')}
            <div class="pt-section">
                <h3>Ticker filters ${_infoLink('advanced.md', 'ticker-filters')}</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-hide-dice"><label for="pt-hide-dice">Hide all dice rolls</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-hide-slots"><label for="pt-hide-slots">Hide all slot plays</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-hide-ratings"><label for="pt-hide-ratings">Hide all rating tickers</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-hide-tips"><label for="pt-hide-tips">Hide all tip tickers</label></div>
            </div>
            <div class="pt-section">
                <h3>Chat tweaks ${_infoLink('advanced.md', 'chat-tweaks')}</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-unicode"><label for="pt-unicode">Unlock unicode</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-zeroratedelay"><label for="pt-zeroratedelay">Remove rating delay</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-bypasscens"><label for="pt-bypasscens">Bypass censorship</label></div>
            </div>
        `;
        const bind = (id, key) => {
            const el = ap.querySelector('#' + id);
            el.checked = !!settings[key];
            el.addEventListener('change', () => saveSetting(key, el.checked));
        };
        bind('pt-hide-dice', 'hideAllDice');
        bind('pt-hide-slots', 'hideAllSlots');
        bind('pt-hide-ratings', 'hideAllRatings');
        bind('pt-hide-tips', 'hideAllTips');

        const uc = ap.querySelector('#pt-unicode');
        uc.checked = !!settings.unicodeUnlock;
        uc.addEventListener('change', () => setUnicodeUnlock(uc.checked));

        const zrd = ap.querySelector('#pt-zeroratedelay');
        zrd.checked = !!settings.zeroRateDelay;
        zrd.addEventListener('change', () => setZeroRateDelay(zrd.checked));

        const bc = ap.querySelector('#pt-bypasscens');
        bc.checked = !!settings.bypassCensorship;
        bc.addEventListener('change', () => setBypassCensorship(bc.checked));
    }

    function renderFeaturesPane() {
        const fp = document.querySelector('#pt-panel .pt-tabpane[data-pane="features"]');
        if (!fp) return;
        fp.innerHTML = `
            ${_tabDocHtml('features.md')}
            <div class="pt-section">
                <h3>User interface ${_infoLink('features.md', 'user-interface')}</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-smartcolor"><label for="pt-smartcolor">Smart font color correction</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-modernsmiley"><label for="pt-modernsmiley">Smiley picker</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-charcounter"><label for="pt-charcounter">Input helpers</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-holiday-effect"><label for="pt-holiday-effect">Holiday color effects</label></div>
                <div class="pt-row" style="align-items:center;gap:8px;margin-top:6px">
                    <label for="pt-viewer-sort" style="color:#ccc;white-space:nowrap">Viewer list sort</label>
                    <select id="pt-viewer-sort" style="flex:1;background:#111;color:#eee;border:1px solid #444;padding:4px;border-radius:3px">
                        <option value="none">None (site default)</option>
                        <option value="name">Name (A–Z)</option>
                        <option value="gender">Gender (Female first)</option>
                        <option value="cam">Has cam on first</option>
                    </select>
                </div>
                <div class="pt-toggle" style="margin-top:6px"><input type="checkbox" id="pt-scrolljump"><label for="pt-scrolljump">Scroll lock helper</label></div>
                <div class="pt-row" style="align-items:center;margin-top:4px;padding-left:20px">
                    <label for="pt-scrolllock-auto" style="white-space:nowrap;color:#aaa">Auto-disable after</label>
                    <input type="number" id="pt-scrolllock-auto" min="0" max="3600" step="1" style="width:70px;margin:0 6px">
                    <span style="white-space:nowrap;color:#aaa">seconds (0 = never)</span>
                </div>
            </div>
            <div class="pt-section">
                <h3>Blocking ${_infoLink('features.md', 'blocking')}</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-autoblock-guests"><label for="pt-autoblock-guests">Auto-block Guest Viewers</label></div>
                <div class="pt-row" style="align-items:center;gap:6px;margin-top:4px">
                    <label style="display:flex;align-items:center;gap:6px;flex:1;cursor:pointer"><input type="checkbox" id="pt-auto-unblock-guests"> Auto Unblock Guest Blocks</label>
                    <span style="color:#888">every</span>
                    <input type="number" id="pt-auto-unblock-min" min="5" max="1440" style="width:56px;background:#111;color:#eee;border:1px solid #444;padding:3px;border-radius:3px">
                    <span style="color:#888">min</span>
                </div>
                <div class="pt-row" style="align-items:center;gap:8px;margin-top:6px">
                    <label style="display:flex;align-items:center;gap:6px;flex:1;cursor:pointer"><input type="checkbox" id="pt-sync-block-to-ignored"> Auto-sync "You Block" → Ignored</label>
                    <button id="pt-sync-block-now" style="font-size:11px;white-space:nowrap">Sync now</button>
                </div>
                <div id="pt-sync-block-status" style="font-size:11px;margin-top:4px;color:#888"></div>
                <div class="pt-toggle" style="margin-top:6px"><input type="checkbox" id="pt-auto-block-ignored"><label for="pt-auto-block-ignored">Auto re-block accounts set to Blocked</label></div>
                <div class="pt-toggle" style="margin-top:6px"><input type="checkbox" id="pt-allow-mod-block"><label for="pt-allow-mod-block">Allow Mod Blocking</label></div>
            </div>
        `;

        // ---- User interface ----
        const sc = fp.querySelector('#pt-smartcolor');
        sc.checked = !!settings.smartColorCorrection;
        sc.addEventListener('change', () => {
            saveSetting('smartColorCorrection', sc.checked);
            if (sc.checked) detectChatBackground();
        });

        const ms = fp.querySelector('#pt-modernsmiley');
        ms.checked = !!settings.modernSmileyPicker;
        ms.addEventListener('change', () => {
            saveSetting('modernSmileyPicker', ms.checked);
            if (ms.checked) tryInstallSmileyPicker();
            else alert('Reload the page to restore the default smiley picker.');
        });

        const cc = fp.querySelector('#pt-charcounter');
        cc.checked = !!settings.showCharCounter;
        cc.addEventListener('change', () => {
            saveSetting('showCharCounter', cc.checked);
            if (cc.checked) installCharCounter();
            else uninstallCharCounter();
        });

        const hef = fp.querySelector('#pt-holiday-effect');
        hef.checked = !!settings.holidayEffectEnabled;
        hef.addEventListener('change', () => {
            saveSetting('holidayEffectEnabled', hef.checked);
            const holiday = getTodayHoliday();
            if (holiday) {
                if (hef.checked) _applyHolidayEffect(holiday);
                else _removeHolidayEffect(holiday);
            }
        });

        const vs = fp.querySelector('#pt-viewer-sort');
        vs.value = settings.viewerSort || 'none';
        vs.addEventListener('change', () => {
            saveSetting('viewerSort', vs.value);
            applyViewerSort();
        });

        const sjb = fp.querySelector('#pt-scrolljump');
        sjb.checked = !!settings.scrollLockButton;
        sjb.addEventListener('change', () => {
            saveSetting('scrollLockButton', sjb.checked);
            const btn = document.getElementById('pt-newmsg-btn');
            if (btn && !sjb.checked) btn.classList.remove('show');
        });
        const slAuto = fp.querySelector('#pt-scrolllock-auto');
        slAuto.value = settings.scrollLockAutoDisableSeconds || 0;
        slAuto.addEventListener('change', () => {
            const n = Math.max(0, parseInt(slAuto.value, 10) || 0);
            saveSetting('scrollLockAutoDisableSeconds', n);
            _scrollLockEngagedAt = 0;
        });

        // ---- Blocking ----
        const abg = fp.querySelector('#pt-autoblock-guests');
        abg.checked = !!settings.autoBlockGuestCammers;
        abg.addEventListener('change', () => {
            saveSetting('autoBlockGuestCammers', abg.checked);
            if (abg.checked) scanForGuestCammers();
        });

        const aug = fp.querySelector('#pt-auto-unblock-guests');
        const augMin = fp.querySelector('#pt-auto-unblock-min');
        const syncAugEnabled = () => { augMin.disabled = !aug.checked; augMin.style.opacity = aug.checked ? '1' : '0.5'; };
        aug.checked = !!settings.autoUnblockGuestBlocks;
        augMin.value = Math.max(5, parseInt(settings.autoUnblockGuestIntervalMin, 10) || 30);
        syncAugEnabled();
        aug.addEventListener('change', () => {
            saveSetting('autoUnblockGuestBlocks', aug.checked);
            syncAugEnabled();
            if (aug.checked) sweepGuestBlocks();
        });
        augMin.addEventListener('change', () => {
            let v = parseInt(augMin.value, 10);
            if (isNaN(v) || v < 5) v = 5; // floor of 5 minutes; 0–4 → 5
            augMin.value = v;
            saveSetting('autoUnblockGuestIntervalMin', v);
            restartGuestSweepInterval();
        });

        const syncChk = fp.querySelector('#pt-sync-block-to-ignored');
        const syncStatus = fp.querySelector('#pt-sync-block-status');
        syncChk.checked = !!settings.autoSyncBlockToIgnored;
        syncChk.addEventListener('change', () => saveSetting('autoSyncBlockToIgnored', syncChk.checked));

        fp.querySelector('#pt-sync-block-now').addEventListener('click', () => {
            const wasEnabled = settings.autoSyncBlockToIgnored;
            settings.autoSyncBlockToIgnored = true;
            const added = syncBlockListToIgnored();
            if (!wasEnabled) settings.autoSyncBlockToIgnored = false;
            syncStatus.style.color = '#8f8';
            syncStatus.textContent = added > 0
                ? `✓ Added ${added} member${added === 1 ? '' : 's'} to Blocked tier (guests skipped).`
                : `✓ All non-guest blocked users already in Blocked tier.`;
        });

        const autoBlkChk = fp.querySelector('#pt-auto-block-ignored');
        autoBlkChk.checked = !!settings.autoBlockIgnored;
        autoBlkChk.addEventListener('change', () => {
            saveSetting('autoBlockIgnored', autoBlkChk.checked);
            if (autoBlkChk.checked) updateBlockedBackup();
        });

        const allowModBlk = fp.querySelector('#pt-allow-mod-block');
        allowModBlk.checked = !!settings.allowModBlocking;
        allowModBlk.addEventListener('change', () => {
            saveSetting('allowModBlocking', allowModBlk.checked);
            // Re-render the Ignored list so the Blocked checkboxes for mods
            // enable/disable to match, and re-apply any mod blocks immediately.
            try { renderPanelLists(); } catch (e) {}
            if (allowModBlk.checked) { try { reapplyModBlocks(); } catch (e) {} }
        });
    }

    function renderTestPane() {
        const tp = document.querySelector('#pt-panel .pt-tabpane[data-pane="test"]');
        if (!tp) return;
        tp.innerHTML = `
            <div class="pt-section">
                <h3>Advanced options</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-reveal-blockedyou-t"><label for="pt-reveal-blockedyou-t">Show View button on Blocks You list <span class="pt-info" data-tip="Adds a View button next to each user in the Blocks You column. Clicking it removes them from _BLOCKED_YOU, letting you view their cam again this session. Resets on page reload since the server re-sends the block list.">i</span></label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-debug-emits-t"><label for="pt-debug-emits-t">Log socket + iframe network events <span class="pt-info" data-tip="Logs every chat socket event AND every network request made inside the My Account iframe, prefixed [PowerTools][emit] / [iframe-xhr] / [iframe-fetch]. To capture a real Unblock: turn this on, open My Account → Blocked Users, click Unblock on someone, and copy the [iframe-xhr] or [iframe-fetch] line that appears.">i</span></label></div>
            </div>
            <div class="pt-section">
                <h3>Cam recovery <span class="pt-info" data-tip="Type 1 (full crash — cam vanishes): auto-reopen from your side. Type 2 (mid-stream spinner): only the broadcaster can fix; for YOUR OWN cam we can bump the settings gear. Type 3 (dead from start): only the broadcaster can fix by toggling cam off/on. Won't reopen cams from blocked or ignored users.">i</span></h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-cam-recover"><label for="pt-cam-recover">Auto-reopen cams that crash (Type 1)</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-cam-fix-mine"><label for="pt-cam-fix-mine">Auto-fix my own stalled webcam (Type 2)</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-cam-dead-detect"><label for="pt-cam-dead-detect">Log dead-from-start cams (Type 3)</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-cam-log-crashes"><label for="pt-cam-log-crashes">Record crash timestamps</label></div>
            </div>
        `;

        // Advanced options bindings
        const rby = tp.querySelector('#pt-reveal-blockedyou-t');
        if (rby) {
            rby.checked = !!settings.revealBlockedYou;
            rby.addEventListener('change', () => saveSetting('revealBlockedYou', rby.checked));
        }
        const dbg = tp.querySelector('#pt-debug-emits-t');
        if (dbg) {
            dbg.checked = !!settings.debugSocketEmits;
            dbg.addEventListener('change', () => {
                saveSetting('debugSocketEmits', dbg.checked);
                if (dbg.checked) { installSocketEmitLogger(); installIframeNetworkLogger(); }
            });
        }

        // Cam recovery bindings
        const camRec = tp.querySelector('#pt-cam-recover');
        camRec.checked = !!settings.camAutoRecover;
        camRec.addEventListener('change', () => {
            saveSetting('camAutoRecover', camRec.checked);
            if (camRec.checked) {
                _knownCams.clear();
                refreshKnownCams();
            }
        });
        const camMine = tp.querySelector('#pt-cam-fix-mine');
        camMine.checked = !!settings.camAutoFixMyCam;
        camMine.addEventListener('change', () => {
            saveSetting('camAutoFixMyCam', camMine.checked);
            _lastMyCamCurrentTime = 0;
            _lastMyCamCurrentTimeAt = 0;
        });
        const camDead = tp.querySelector('#pt-cam-dead-detect');
        camDead.checked = !!settings.camDetectDeadStart;
        camDead.addEventListener('change', () => saveSetting('camDetectDeadStart', camDead.checked));
        const camLog = tp.querySelector('#pt-cam-log-crashes');
        camLog.checked = !!settings.camLogCrashes;
        camLog.addEventListener('change', () => saveSetting('camLogCrashes', camLog.checked));
    }

    // ----- AUTOMATIONS TAB -----
    // Slot symbols (key matches the site's `fa fa-<key>` class) and their labels.
    const AB_SLOTS = [
        { key: 'birthday-cake', label: 'Birthday Cake' },
        { key: 'diamond',       label: 'Diamond' },
        { key: 'glass',         label: 'Glass' },
        { key: 'heart',         label: 'Heart' },
        { key: 'bomb',          label: 'Bomb' },
        { key: 'star',          label: 'Star' },
        { key: 'trophy',        label: 'Trophy' },
    ];
    const AB_DICE_DEFAULTS = ['0', '69', '100'];
    const AB_MAX_TEXT = 50;
    const AB_MAX_CUSTOM = 5;

    function renderAutomationsPane() {
        const ap = document.querySelector('#pt-panel .pt-tabpane[data-pane="automations"]');
        if (!ap) return;
        ap.innerHTML = `
            ${_tabDocHtml('automations.md')}
            <div class="pt-section">
                <h3>Auto rate back</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-autorateback"><label for="pt-autorateback">Auto rate back</label></div>
                <div id="pt-autorate-sub" style="padding-left:24px;border-left:2px solid #333;margin:2px 0 6px">
                    <div style="margin-bottom:6px">
                        <div style="color:#aaa;font-size:11px;margin-bottom:4px">Rate 5's back for:</div>
                        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-rate5-target" value="all"> All Users</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-rate5-target" value="friends_favs"> Friends &amp; Favorites</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-rate5-target" value="friends_only"> Friends Only</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-rate5-target" value="favs_only"> Favorites Only</label>
                        </div>
                    </div>
                    <div class="pt-toggle"><input type="checkbox" id="pt-autorate-4"><label for="pt-autorate-4">Auto-rate all 4's with a 4</label></div>
                </div>
            </div>
            <div class="pt-section">
                <h3>Auto booms</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-autoboom"><label for="pt-autoboom">Auto-send a chat message on dice &amp; slot booms</label></div>
                <div id="pt-autoboom-sub" style="padding-left:24px;border-left:2px solid #333;margin:2px 0 6px">
                    <div style="margin-bottom:6px">
                        <div style="color:#aaa;font-size:11px;margin-bottom:4px">React to booms from:</div>
                        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-boom-target" value="all"> All Users</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-boom-target" value="friends_favs"> Friends &amp; Favorites</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-boom-target" value="friends_only"> Friends Only</label>
                            <label style="color:#ccc;font-size:12px"><input type="radio" name="pt-boom-target" value="favs_only"> Favorites Only</label>
                        </div>
                    </div>
                    <div class="pt-row" style="margin-top:6px">
                        <button id="pt-autoboom-config">Configure boom messages…</button>
                    </div>
                    <div style="color:#888;font-size:11px;margin-top:4px">
                        Your own booms always trigger; others' booms trigger only for the group above. A short random delay is added before sending.
                    </div>
                </div>
            </div>
        `;

        // ---- Auto rate back wiring ----
        const arb   = ap.querySelector('#pt-autorateback');
        const arSub = ap.querySelector('#pt-autorate-sub');
        const ar4   = ap.querySelector('#pt-autorate-4');
        const syncArSubVisible = () => { arSub.style.display = arb.checked ? '' : 'none'; };
        arb.checked = !!settings.autoRateBack;
        ar4.checked = !!settings.autoRate4Back;
        const curTarget = settings.autoRate5Target || 'all';
        const targetRadio = ap.querySelector(`input[name="pt-rate5-target"][value="${curTarget}"]`);
        if (targetRadio) targetRadio.checked = true;
        syncArSubVisible();
        arb.addEventListener('change', () => {
            saveSetting('autoRateBack', arb.checked);
            syncArSubVisible();
        });
        ap.querySelectorAll('input[name="pt-rate5-target"]').forEach((r) => {
            r.addEventListener('change', () => { if (r.checked) saveSetting('autoRate5Target', r.value); });
        });
        ar4.addEventListener('change', () => saveSetting('autoRate4Back', ar4.checked));

        // ---- Auto booms wiring ----
        const abEnable = ap.querySelector('#pt-autoboom');
        const abSub    = ap.querySelector('#pt-autoboom-sub');
        const syncAbSubVisible = () => { abSub.style.display = abEnable.checked ? '' : 'none'; };
        abEnable.checked = !!settings.autoBoom;
        const curBoomTarget = settings.autoBoomTarget || 'all';
        const boomTargetRadio = ap.querySelector(`input[name="pt-boom-target"][value="${curBoomTarget}"]`);
        if (boomTargetRadio) boomTargetRadio.checked = true;
        syncAbSubVisible();
        abEnable.addEventListener('change', () => {
            saveSetting('autoBoom', abEnable.checked);
            syncAbSubVisible();
        });
        ap.querySelectorAll('input[name="pt-boom-target"]').forEach((r) => {
            r.addEventListener('change', () => { if (r.checked) saveSetting('autoBoomTarget', r.value); });
        });
        ap.querySelector('#pt-autoboom-config').addEventListener('click', () => openAutoBoomEditor());
    }

    // Modal to configure the boom-message text for each slot symbol, each
    // default dice number, and up to 5 custom personal-number dice booms.
    function openAutoBoomEditor() {
        // Work on copies; persist on every edit so closing always keeps changes.
        const slots = Object.assign({}, settings.autoBoomSlots || {});
        const dice  = Object.assign({}, settings.autoBoomDice || {});
        let custom  = (settings.autoBoomCustom || []).slice();

        const slotRows = AB_SLOTS.map((s) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="width:130px;display:flex;align-items:center;gap:6px;color:#ccc">
                    <i class="fa fa-${s.key}" aria-hidden="true" style="width:16px;text-align:center"></i> ${s.label}
                </span>
                <input type="text" class="pt-ab-slot" data-key="${s.key}" maxlength="${AB_MAX_TEXT}" placeholder="text to send (max ${AB_MAX_TEXT})" value="${escapeHtml(slots[s.key] || '')}" style="flex:1;box-sizing:border-box">
            </div>
        `).join('');

        const diceRows = AB_DICE_DEFAULTS.map((n) => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="width:130px;color:#ccc">Rolled <strong>${n}</strong></span>
                <input type="text" class="pt-ab-dice" data-num="${n}" maxlength="${AB_MAX_TEXT}" placeholder="text to send (max ${AB_MAX_TEXT})" value="${escapeHtml(dice[n] || '')}" style="flex:1;box-sizing:border-box">
            </div>
        `).join('');

        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML = `
            <div class="pt-modal" style="width:480px">
                <div class="pt-modal-header">
                    <span>Configure Auto-booms</span>
                    <button class="pt-modal-close">×</button>
                </div>
                <div class="pt-modal-body">
                    <div style="color:#aaa;font-size:11px;margin-bottom:10px">
                        Leave a box blank to ignore that boom. Each message is max ${AB_MAX_TEXT} characters and is sent to main chat with a short delay.
                    </div>
                    <h3 style="margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#8af;letter-spacing:.05em">Slots (3 matching)</h3>
                    ${slotRows}
                    <h3 style="margin:12px 0 6px;font-size:12px;text-transform:uppercase;color:#8af;letter-spacing:.05em">Dice</h3>
                    ${diceRows}
                    <h3 style="margin:12px 0 6px;font-size:12px;text-transform:uppercase;color:#8af;letter-spacing:.05em">Custom dice booms (max ${AB_MAX_CUSTOM})</h3>
                    <div style="color:#888;font-size:11px;margin-bottom:6px">Personal numbers 1–99 (69 is reserved). Sends your text whenever anyone rolls that number.</div>
                    <div style="display:flex;gap:6px;margin-bottom:8px">
                        <input type="number" id="pt-ab-cust-num" min="1" max="99" placeholder="#" style="width:60px;box-sizing:border-box">
                        <input type="text" id="pt-ab-cust-text" maxlength="${AB_MAX_TEXT}" placeholder="text to send (max ${AB_MAX_TEXT})" style="flex:1;box-sizing:border-box">
                        <button id="pt-ab-cust-add" class="pt-btn-primary">Add</button>
                    </div>
                    <ul id="pt-ab-cust-list" class="pt-list" style="max-height:140px"></ul>
                </div>
                <div class="pt-modal-footer">
                    <button id="pt-ab-done" class="pt-btn-primary">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Live-persist slot + dice text boxes.
        modal.querySelectorAll('.pt-ab-slot').forEach((inp) => {
            inp.addEventListener('input', () => {
                slots[inp.dataset.key] = inp.value.slice(0, AB_MAX_TEXT);
                saveSetting('autoBoomSlots', slots);
            });
        });
        modal.querySelectorAll('.pt-ab-dice').forEach((inp) => {
            inp.addEventListener('input', () => {
                dice[inp.dataset.num] = inp.value.slice(0, AB_MAX_TEXT);
                saveSetting('autoBoomDice', dice);
            });
        });

        const custList = modal.querySelector('#pt-ab-cust-list');
        const renderCustom = () => {
            custList.innerHTML = '';
            if (!custom.length) {
                custList.innerHTML = '<li class="pt-empty">No custom dice booms yet.</li>';
                return;
            }
            custom.forEach((c, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `<span><strong>${escapeHtml(String(c.num))}</strong> → ${escapeHtml(c.text)}</span><button>Remove</button>`;
                li.querySelector('button').addEventListener('click', () => {
                    custom.splice(idx, 1);
                    saveSetting('autoBoomCustom', custom);
                    renderCustom();
                });
                custList.appendChild(li);
            });
        };
        renderCustom();

        const numInput  = modal.querySelector('#pt-ab-cust-num');
        const textInput = modal.querySelector('#pt-ab-cust-text');
        const addCustom = () => {
            const num = parseInt(numInput.value, 10);
            const text = textInput.value.trim().slice(0, AB_MAX_TEXT);
            if (isNaN(num) || num < 1 || num > 99) return alert('Enter a number from 1 to 99.');
            if (num === 69) return alert('69 is reserved — use the Dice section above for it.');
            if (AB_DICE_DEFAULTS.includes(String(num))) return alert('That number is a default boom — set it in the Dice section above.');
            if (!text) return alert('Enter the text to send.');
            if (custom.some((c) => String(c.num) === String(num))) return alert('You already have a boom for ' + num + '.');
            if (custom.length >= AB_MAX_CUSTOM) return alert('Maximum of ' + AB_MAX_CUSTOM + ' custom dice booms.');
            custom.push({ num: num, text: text });
            saveSetting('autoBoomCustom', custom);
            numInput.value = ''; textInput.value = '';
            renderCustom();
        };
        modal.querySelector('#pt-ab-cust-add').addEventListener('click', addCustom);
        textInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustom(); });

        const closeModal = () => modal.remove();
        modal.querySelector('.pt-modal-close').addEventListener('click', closeModal);
        modal.querySelector('#pt-ab-done').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    // Re-render whichever data-backed tab is currently active so its contents are
    // always current. Called when the panel opens (gear) and when a tab is
    // activated. Blocks also forces a fresh server scrape.
    function refreshActiveTab() {
        const panel = document.getElementById('pt-panel');
        if (!panel) return;
        const active = panel.querySelector('#pt-tabs button.active');
        const tab = active ? active.dataset.tab : '';
        try {
            if (tab === 'blockedyou') { _blocksPageFetched = false; renderBlockedYou(); }
            else if (tab === 'favorites' || tab === 'keywords' || tab === 'ignored') renderPanelLists();
            else if (tab === 'features') renderFeaturesPane();
            else if (tab === 'automations') renderAutomationsPane();
            else if (tab === 'alerts') renderAlertsPane();
        } catch (e) {}
    }

    function renderBlockedYou() {
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="blockedyou"]');
        _blocksRenderGeneration++;
        const gen = _blocksRenderGeneration;
        // Refresh learned member types from whoever's currently visible so the
        // badges below are as current as possible, then read the live arrays.
        scanMemberTypes();
        const blockedByYou = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS.slice() : [];
        const blockingYou = (W.Chat && Array.isArray(W.Chat._BLOCKED_YOU)) ? W.Chat._BLOCKED_YOU.slice() : [];

        // Mark this pane as wanting flex layout when active. We add a class
        // instead of inline style:display so the .pt-tabpane base rule
        // (display:none) still wins when this tab is NOT active.
        pane.classList.add('pt-pane-flex');

        pane.innerHTML = `
            ${_tabDocHtml('ignore-and-blocks.md')}
            <div style="display:flex;gap:8px;flex:1;min-height:0">
                <!-- LEFT: people you block -->
                <div style="flex:6;display:flex;flex-direction:column;min-width:0">
                    <h3 class="pt-bl-header" style="margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#8af;letter-spacing:0.05em">
                        You Block (${blockedByYou.length}/100, newest first)
                    </h3>
                    <div class="pt-row" style="margin-bottom:6px">
                        <input type="text" id="pt-bl-add" placeholder="username to block">
                        <button id="pt-bl-add-btn">Block</button>
                    </div>
                    <input type="text" id="pt-bl-filter" placeholder="Filter..." style="margin-bottom:6px;background:#111;color:#eee;border:1px solid #444;padding:4px 6px;border-radius:3px;font-size:12px">
                    <ul class="pt-list" id="pt-bl-list" style="flex:1;max-height:none"></ul>
                </div>
                <!-- RIGHT: people who block you -->
                <div style="flex:4;display:flex;flex-direction:column;min-width:0">
                    <h3 class="pt-by-header" style="margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#f88;letter-spacing:0.05em">
                        Blocks You (${blockingYou.length})
                    </h3>
                    <div class="pt-row" style="margin-bottom:6px">
                        <button id="pt-by-copy" style="flex:1">Copy</button>
                    </div>
                    <input type="text" id="pt-by-filter" placeholder="Filter..." style="margin-bottom:6px;background:#111;color:#eee;border:1px solid #444;padding:4px 6px;border-radius:3px;font-size:12px">
                    <ul class="pt-list" id="pt-by-list" style="flex:1;max-height:none"></ul>
                </div>
            </div>
            <div class="pt-row" style="margin-top:8px">
                <button id="pt-blocks-ignore-blocked-by-you" style="flex:1">Ignore all you block</button>
                <button id="pt-blocks-refresh" style="flex:1">↻ Refresh both lists</button>
                <button id="pt-blocks-ignore-blocking-you" style="flex:1">Ignore all blocks you</button>
            </div>
            <div class="pt-row" style="margin-top:6px">
                <button id="pt-blocks-sweep-guests" style="flex:1;background:#3a5">🧹 Remove all guest blocks now</button>
            </div>
            <div style="color:#888;font-size:11px;margin-top:8px">
                Server-enforced 100-user cap on your block list. Anyone you block can't see your messages and you can't see theirs. To bypass the cap, use the Ignored tab — but those people can still see your messages.
            </div>
        `;
        // (Layout is handled by the .pt-pane-flex.active CSS rule above.)

        // Helper to render either list with a current filter value.
        // sortMode: 'newest-first'      = match the site console (newest blocks first).
        //           'chronological-desc' = _BLOCKED_YOU newest is last; reverse to show newest first.
        //           'alpha'              = alphabetical.
        function renderBlockList(listEl, items, filter, makeRow, sortMode) {
            listEl.innerHTML = '';
            const f = (filter || '').toLowerCase();
            let ordered = items.filter((u) => matchesText(u, f));
            if (sortMode === 'alpha') {
                ordered = ordered.slice().sort();
            } else if (sortMode === 'newest-first') {
                // Sort by the order my_blocks.php lists them — that page is the
                // site's own newest-first ordering, so this matches the console
                // exactly. _blocksPageOrder is populated after the page fetch
                // resolves (renderLeft re-runs then). Users NOT on the page are
                // session-only blocks not yet persisted server-side (e.g. one you
                // just added by name) — they're the newest, so sort them to the
                // TOP (negative index) where you'd expect a fresh block to appear.
                if (_blocksPageOrder && _blocksPageOrder.length) {
                    const pos = (u) => {
                        const i = _blocksPageOrder.indexOf(lc(u));
                        return i === -1 ? -1 : i;
                    };
                    ordered = ordered.slice().sort((a, b) => pos(a) - pos(b));
                }
            } else if (sortMode === 'chronological-desc') {
                // _BLOCKED_YOU is appended to as blocks arrive; newest is last.
                // Reverse so newest shows at the top.
                ordered = ordered.slice().reverse();
            }
            if (ordered.length === 0) {
                listEl.innerHTML = '<li class="pt-empty">' + (items.length === 0 ? 'Empty.' : 'No matches.') + '</li>';
                return;
            }
            for (const u of ordered) {
                listEl.appendChild(makeRow(u));
            }
        }

        // LEFT — people you block
        const blList = pane.querySelector('#pt-bl-list');
        const blFilter = pane.querySelector('#pt-bl-filter');
        const renderLeft = () => {
            renderBlockList(blList, blockedByYou, blFilter.value, (u) => {
                const li = document.createElement('li');
                // Track whether this user is currently hidden from _BLOCKED_USERS locally
                const isHidden = () => W.Chat && Array.isArray(W.Chat._BLOCKED_USERS) &&
                    !W.Chat._BLOCKED_USERS.includes(u);
                let buttons = '<button class="pt-bl-unblock">Unblock</button>';
                if (settings.revealBlockedYou) {
                    buttons += `<button class="pt-bl-view">${isHidden() ? 'Hide' : 'View'}</button>`;
                }
                // Auto-blocked guests carry a live countdown to their scheduled release.
                const _gbState = (typeof _guestBlockState !== 'undefined') ? _guestBlockState.get(u) : null;
                const countdownHtml = _gbState
                    ? `<span class="pt-guest-countdown" data-user="${escapeHtml(u)}" title="Auto-blocked guest — releases automatically" style="color:#fb8;font-size:11px;white-space:nowrap;margin-right:6px">auto-unblock…</span>`
                    : '';
                li.innerHTML = `<span title="${escapeHtml(nameTitleAttr(u))}">${memberBadgeHtml(u)}<a class="pt-name-link" draggable="false" href="${profileUrl(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u)}</a></span><div class="pt-btn-group">${countdownHtml}${buttons}</div>`;
                li.querySelector('.pt-bl-unblock').addEventListener('click', (e) => {
                    const btn = e.currentTarget;
                    btn.textContent = '...';
                    btn.disabled = true;
                    // 1) Immediate session-level unblock (so messages appear now).
                    unblockUserSession(u);
                    // Unblocking should fully remove them from your lists — drop
                    // any persistent tier (Ignored / Blocked backup) too.
                    if (getUser(u).tier) {
                        patchUser(u, { tier: undefined, blockedBy: undefined });
                        saveUsersSoon();
                        try { syncIgnoredToChat(); } catch (e) {}
                        try { renderPanelLists(); } catch (e) {}
                        try { if (typeof markIgnoredInUserList === 'function') markIgnoredInUserList(); } catch (e) {}
                        try { updateHideListStyle(); } catch (e) {}
                    }
                    // 2) Persistent unblock via the account's Blocked Users page.
                    //    Loads my_blocks.php in a hidden iframe and clicks the real
                    //    Unblock button — the same mechanism as My Settings.
                    unblockViaBlocksPage(u, (result) => {
                        if (result === 'notfound') {
                            console.log('[PowerTools] "' + u + '" was not on the persistent block list (session-only block cleared).');
                        } else if (result === 'error' || result === 'timeout') {
                            console.log('[PowerTools] Persistent unblock for "' + u + '" may not have completed (' + result + '). Check My Account → Blocked Users.');
                        }
                        renderBlockedYou();
                    });
                });
                const viewBtn = li.querySelector('.pt-bl-view');
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        if (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) {
                            const idx = W.Chat._BLOCKED_USERS.indexOf(u);
                            if (idx > -1) {
                                // Currently blocking — remove locally so they can be seen
                                W.Chat._BLOCKED_USERS.splice(idx, 1);
                                viewBtn.textContent = 'Hide';
                            } else {
                                // Currently visible — re-add to block array
                                W.Chat._BLOCKED_USERS.push(u);
                                viewBtn.textContent = 'View';
                            }
                        }
                    });
                }
                return li;
            }, 'newest-first');
        };
        blFilter.addEventListener('input', renderLeft);
        renderLeft();

        // Live countdown for auto-blocked guests pending release. Updates the
        // "unblock in Ns" labels every second; self-stops when none remain.
        if (_guestCountdownTimer) { clearInterval(_guestCountdownTimer); _guestCountdownTimer = null; }
        const tickGuestCountdowns = () => {
            const spans = pane.querySelectorAll('.pt-guest-countdown');
            if (!spans.length) { if (_guestCountdownTimer) { clearInterval(_guestCountdownTimer); _guestCountdownTimer = null; } return; }
            const now = Date.now();
            spans.forEach((sp) => {
                const st = (typeof _guestBlockState !== 'undefined') ? _guestBlockState.get(sp.dataset.user) : null;
                if (!st) { sp.textContent = ''; return; }
                const rem = Math.max(0, Math.ceil((st.releaseAt - now) / 1000));
                sp.textContent = rem > 0 ? ('unblock in ' + rem + 's') : 'unblocking…';
            });
        };
        tickGuestCountdowns();
        if (pane.querySelector('.pt-guest-countdown')) _guestCountdownTimer = setInterval(tickGuestCountdowns, 1000);

        const addBtn = pane.querySelector('#pt-bl-add-btn');
        const addInp = pane.querySelector('#pt-bl-add');
        const doAdd = () => {
            const u = (addInp.value || '').trim().toLowerCase();
            if (!u) return;
            if (blockedByYou.length >= 100 && !blockedByYou.includes(u)) {
                alert('You\'ve hit the 100-user block cap. Use Ignored to mute more users (one-way).');
                return;
            }
            blockUserLocal(u, true);          // instant session block
            addInp.value = '';
            renderBlockedYou();
            // Persist server-side (works even if they're not in the room). The
            // socket emit alone only persists for users currently connected.
            blockViaBlocksPage(u, () => { _blocksPageFetched = false; renderBlockedYou(); });
        };
        addBtn.addEventListener('click', doAdd);
        addInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });

        // RIGHT — people blocking you
        const byList = pane.querySelector('#pt-by-list');
        const byFilter = pane.querySelector('#pt-by-filter');
        const renderRight = () => {
            renderBlockList(byList, blockingYou, byFilter.value, (u) => {
                const li = document.createElement('li');
                if (settings.revealBlockedYou) {
                    const isHidden = () => W.Chat && Array.isArray(W.Chat._BLOCKED_YOU) &&
                        !W.Chat._BLOCKED_YOU.includes(u);
                    li.innerHTML = `<span style="flex:1" title="${escapeHtml(nameTitleAttr(u))}">${escapeHtml(u)}</span><div class="pt-btn-group"><button class="pt-by-view">${isHidden() ? 'Hide' : 'View'}</button></div>`;
                    li.querySelector('.pt-by-view').addEventListener('click', (e) => {
                        const btn = e.currentTarget;
                        if (W.Chat && Array.isArray(W.Chat._BLOCKED_YOU)) {
                            const idx = W.Chat._BLOCKED_YOU.indexOf(u);
                            if (idx > -1) {
                                // Currently blocking — remove locally
                                W.Chat._BLOCKED_YOU.splice(idx, 1);
                                btn.textContent = 'Hide';
                            } else {
                                // Currently visible — re-add
                                W.Chat._BLOCKED_YOU.push(u);
                                btn.textContent = 'View';
                            }
                        }
                    });
                } else {
                    li.innerHTML = `<span style="flex:1" title="${escapeHtml(nameTitleAttr(u))}">${escapeHtml(u)}</span>`;
                }
                return li;
            }, 'chronological-desc');
        };
        byFilter.addEventListener('input', renderRight);
        renderRight();

        pane.querySelector('#pt-by-copy').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            // Copy in newest-first order to match what's displayed.
            const text = blockingYou.slice().reverse().join('\n');
            if (!text) { btn.textContent = 'Nothing to copy'; setTimeout(() => { btn.textContent = 'Copy'; }, 1200); return; }
            Promise.resolve(copyToClipboard(text)).then((ok) => {
                btn.textContent = ok ? 'Copied ' + blockingYou.length : 'Copy failed';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
            });
        });
        // Refresh re-reads BOTH server-side arrays and re-scans member types.
        // Also clears the member-type cache so badges are re-fetched from profiles.
        pane.querySelector('#pt-blocks-refresh').addEventListener('click', () => {
            // Clear fetched-set and cached types so everything is re-checked
            _memberTypeFetched.clear();
            _blocksPageFetched = false;
            blockedByYou.forEach((u) => { patchUser(u, { type: undefined }); });
            saveUsersSoon();
            renderBlockedYou();
        });

        // Manual guest trim — run the same sweep the periodic job uses, on demand.
        pane.querySelector('#pt-blocks-sweep-guests').addEventListener('click', async () => {
            const sb = pane.querySelector('#pt-blocks-sweep-guests');
            sb.disabled = true;
            sb.textContent = 'Removing guest blocks…';
            try {
                const n = await sweepGuestBlocks();
                sb.textContent = 'Removed ' + n + ' guest block(s)';
            } catch (e) {
                sb.textContent = 'Error — see Log';
            }
            // Re-read the (now-shorter) list shortly after.
            setTimeout(() => { try { renderBlockedYou(); } catch (e) {} }, 1200);
        });

        pane.querySelector('#pt-blocks-ignore-blocking-you').addEventListener('click', () => {
            if (!blockingYou.length) return;
            if (!confirm(`Add all ${blockingYou.length} user(s) from "Blocks You" to your Ignored list?`)) return;
            blockingYou.forEach((u) => addIgnoredUser(u));
        });

        pane.querySelector('#pt-blocks-ignore-blocked-by-you').addEventListener('click', () => {
            if (!blockedByYou.length) return;
            if (!confirm(`Add all ${blockedByYou.length} user(s) from "You Block" to the Blocked tier? Only members are added — guests (and not-yet-identified users) are skipped.`)) return;
            addToBlockedTier(blockedByYou);
        });

        // Bulk-load member types from my_blocks.php (all blocked users in one request).
        // Faster than fetching individual profiles — the page shows Member/Guest directly.
        // Falls through to per-profile fetches for anything the bulk load missed.
        fetchBlocksPageMemberTypes().then(() => {
            if (_blocksRenderGeneration === gen) renderLeft();
            ensureMemberTypes(blockedByYou, gen, () => { renderLeft(); });
        });
    }

    // Rate a user programmatically using the correct socket event and payload.
    function autoRateUser(username, value) {
        if (!username || !value) return;
        try {
            if (W.Socket && W.Socket._IO) {
                W.Socket._IO.emit('rate', {
                    ratee: username,
                    rating: String(value),
                    comments: ''
                });
                ptLog('Rate', 'Auto-rated "' + username + '" ' + value + '.');
            }
        } catch (e) {
            ptLog('Rate', 'Auto-rate failed for "' + username + '": ' + (e && e.message ? e.message : e));
        }
    }

    // Add/remove a user from the chat's server-side block list. We push directly
    // to _BLOCKED_USERS since receiveMessage checks that array by indexOf, and
    // emit the SAME event the site's own block uses (and that the guest
    // auto-block uses successfully): { username, report, comments }. The server
    // persists this reliably for a user it can resolve to a live session (e.g.
    // someone in the room); a typed name who isn't currently in chat may only be
    // blocked for the session.
    function blockUserLocal(username, block) {
        const u = lc(username);
        if (!u || !W.Chat || !Array.isArray(W.Chat._BLOCKED_USERS)) return;
        const idx = W.Chat._BLOCKED_USERS.indexOf(u);
        if (block && idx === -1) {
            W.Chat._BLOCKED_USERS.push(u);
            try {
                if (W.Socket && W.Socket._IO)
                    W.Socket._IO.emit('user_blockUser', { username: u, report: '0', comments: '' });
            } catch (e) {}
            ptLog('Blocks', 'Blocked "' + u + '".');
        } else if (!block && idx > -1) {
            W.Chat._BLOCKED_USERS.splice(idx, 1);
            try {
                // Correct payload: { username }
                if (W.Socket && W.Socket._IO)
                    W.Socket._IO.emit('user_unblockUser', { username: u });
            } catch (e) {}
            ptLog('Blocks', 'Unblocked "' + u + '" (session).');
        }
    }

    // ----- QUICK REPLY -----
    // The behavior is governed by settings.quickReplySend:
    //   true  → drop into input and click send (current default behavior)
    //   false → only drop into input, let the user edit and send manually
    function sendChatMessage(text) {
        const inp = document.getElementById('input_txt');
        const btn = document.getElementById('send_btn');
        if (!inp) return;
        inp.value = text;
        inp.focus();
        if (settings.quickReplySend && btn) {
            btn.click();
        } else {
            // Place caret at end so user can keep typing
            try {
                inp.selectionStart = inp.selectionEnd = inp.value.length;
            } catch (e) {}
        }
    }

    function renderQuickReply() {
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="quickreply"]');
        if (!pane) return;
        pane.innerHTML = `
            <div class="pt-section">
                <h3>Send behavior</h3>
                <div class="pt-toggle">
                    <input type="checkbox" id="pt-qr-typesend">
                    <label for="pt-qr-typesend">Type and Send <span class="pt-info" data-tip="When checked, clicking a saved reply sends it immediately. When unchecked, the text is dropped into the chat input so you can edit it before sending.">i</span></label>
                </div>
            </div>
            <div class="pt-section">
                <h3>Save a new quick reply</h3>
                <div class="pt-row">
                    <input type="text" id="pt-qr-input" placeholder="e.g. brb in 5 minutes">
                    <button id="pt-qr-add">Save</button>
                </div>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    Click any saved reply to use it. First 9 entries also bound to Alt+1 through Alt+9.
                </div>
            </div>
            <div class="pt-section">
                <h3>Saved replies (${settings.quickReplies.length})</h3>
                <ul class="pt-list" id="pt-qr-list"></ul>
            </div>
        `;
        const typeSend = pane.querySelector('#pt-qr-typesend');
        typeSend.checked = !!settings.quickReplySend;
        typeSend.addEventListener('change', () => saveSetting('quickReplySend', typeSend.checked));

        const list = pane.querySelector('#pt-qr-list');
        if (settings.quickReplies.length === 0) {
            list.innerHTML = '<li class="pt-empty">No quick replies yet.</li>';
        } else {
            settings.quickReplies.forEach((text, idx) => {
                const li = document.createElement('li');
                const hotkey = idx < 9 ? `Alt+${idx + 1}` : '';
                li.innerHTML = `
                    <span style="flex:1;cursor:pointer" class="pt-qr-text">${escapeHtml(text.length > 60 ? text.slice(0, 60) + '…' : text)}</span>
                    <span style="color:#888;font-size:10px;margin:0 8px">${hotkey}</span>
                    <button class="pt-qr-send" title="${settings.quickReplySend ? 'Send' : 'Type into chat'}">▶</button>
                    <button class="pt-qr-up" title="Move up" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button class="pt-qr-down" title="Move down" ${idx === settings.quickReplies.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="pt-qr-del" title="Delete">×</button>
                `;
                li.querySelector('.pt-qr-text').addEventListener('click', () => sendChatMessage(text));
                li.querySelector('.pt-qr-send').addEventListener('click', () => sendChatMessage(text));
                li.querySelector('.pt-qr-up').addEventListener('click', () => moveQuickReply(idx, -1));
                li.querySelector('.pt-qr-down').addEventListener('click', () => moveQuickReply(idx, 1));
                li.querySelector('.pt-qr-del').addEventListener('click', () => removeQuickReply(idx));
                list.appendChild(li);
            });
        }
        pane.querySelector('#pt-qr-add').addEventListener('click', () => {
            const inp = pane.querySelector('#pt-qr-input');
            if (inp.value.trim()) {
                addQuickReply(inp.value.trim());
                inp.value = '';
            }
        });
        pane.querySelector('#pt-qr-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') pane.querySelector('#pt-qr-add').click();
        });
    }

    function addQuickReply(text) {
        settings.quickReplies.push(text);
        saveSetting('quickReplies', settings.quickReplies);
        renderQuickReply();
    }
    function removeQuickReply(idx) {
        settings.quickReplies.splice(idx, 1);
        saveSetting('quickReplies', settings.quickReplies);
        renderQuickReply();
    }
    function moveQuickReply(idx, dir) {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= settings.quickReplies.length) return;
        const tmp = settings.quickReplies[idx];
        settings.quickReplies[idx] = settings.quickReplies[newIdx];
        settings.quickReplies[newIdx] = tmp;
        saveSetting('quickReplies', settings.quickReplies);
        renderQuickReply();
    }

    // ----- POWER TAB -----
    function renderPowerPane() {
        const pp = document.querySelector('#pt-panel .pt-tabpane[data-pane="power"]');
        if (!pp) return;
        pp.innerHTML = `
            ${_tabDocHtml('power.md')}
            <div class="pt-section">
                <h3>Power features ${_infoLink('power.md', 'power-features')}</h3>
                <div class="pt-toggle"><input type="checkbox" id="pt-antispam"><label for="pt-antispam">Disable spam check</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-zerochatdelay"><label for="pt-zerochatdelay">Remove chat delay</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-zeroactiondelay"><label for="pt-zeroactiondelay">Remove action delay</label></div>
                <div class="pt-toggle"><input type="checkbox" id="pt-autounmute"><label for="pt-autounmute">Auto-clear mute flags</label></div>
            </div>
        `;
        const bind = (id, key, setter) => {
            const el = pp.querySelector('#' + id);
            if (!el) return;
            el.checked = !!settings[key];
            el.addEventListener('change', () => {
                if (setter) setter(el.checked);
                else saveSetting(key, el.checked);
            });
        };
        bind('pt-antispam', 'antiSpam', setAntiSpam);
        bind('pt-zerochatdelay', 'zeroChatDelay', setZeroChatDelay);
        bind('pt-zeroactiondelay', 'zeroActionDelay', setZeroActionDelay);
        bind('pt-autounmute', 'autoUnmute', setAutoUnmute);
    }

