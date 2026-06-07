    // ============================================================
    // USER LIST MARKING + USER MENU INJECTION
    // ============================================================
    // Mark ignored users in the right-side user list with an orange line.
    // The list is rebuilt as users join/leave/change watcher count, so we
    // use a MutationObserver to keep our marks fresh.
    function markIgnoredInUserList() {
        const list = document.getElementById('ul_list');
        if (!list) return;
        const rows = list.querySelectorAll('[username]');

        rows.forEach((row) => {
            const u = lc(row.getAttribute('username') || '');
            if (!u) return;
            const ignored = inIgnored(u);

            // CSS injection handles display:none for hide mode (no flicker).
            // Here we only manage strikethrough styling for ignored users.
            const nick = row.querySelector('.c_nickname');
            if (!nick) return;
            if (ignored) {
                nick.classList.add('pt-ignored');
            } else {
                nick.classList.remove('pt-ignored');
            }
            const camBtnContainer = row.querySelector('.c_webcamButtons');
            if (camBtnContainer) {
                camBtnContainer.style.display = ignored ? 'none' : '';
                camBtnContainer.style.pointerEvents = ignored ? 'none' : '';
            }
            row.querySelectorAll('.smallWebcamBtn').forEach((btn) => {
                btn.style.display = ignored ? 'none' : '';
                btn.style.pointerEvents = ignored ? 'none' : '';
            });
        });
    }

    // Maintain a <style> tag that instantly hides ignored/blocked users in the
    // user list via CSS. CSS applies synchronously before paint, so there's no
    // visible flash when the list redraws. The MutationObserver + markIgnoredInUserList
    // still runs for strikethrough styling; this just handles the hide mode.
    let _hideStyleEl = null;
    function updateHideListStyle() {
        if (!settings.hideIgnoredAndBlockedFromList) {
            if (_hideStyleEl) _hideStyleEl.textContent = '';
            return;
        }
        if (!_hideStyleEl) {
            _hideStyleEl = document.createElement('style');
            _hideStyleEl.id = 'pt-hide-list-style';
            document.head.appendChild(_hideStyleEl);
        }
        const selectors = [];
        // Hide ignored and blocked tiers (alerts tier still shows messages)
        for (const [u, d] of Object.entries(settings.users || {})) {
            if (d.tier === 'ignored' || d.tier === 'blocked') {
                selectors.push('#UL_' + CSS.escape(u));
            }
        }
        // Also include any live blocked users not yet in users dict
        const liveBlocked = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS : [];
        liveBlocked.forEach((u) => {
            const k = lc(u);
            if (k && !(settings.users[k] && settings.users[k].tier)) selectors.push('#UL_' + CSS.escape(k));
        });
        _hideStyleEl.textContent = selectors.length
            ? selectors.join(',\n') + ' { display: none !important; }'
            : '';
    }

    function installUserListMarker() {
        // Inject CSS rules immediately to prevent any flash on list redraws
        updateHideListStyle();
        // Initial pass
        markIgnoredInUserList();
        scanMemberTypes();
        // Watch for changes — the user list redraws constantly
        const list = document.getElementById('ul_list');
        if (!list) {
            // Not loaded yet, retry shortly
            setTimeout(installUserListMarker, 1000);
            return;
        }
        const obs = new MutationObserver(() => {
            // Debounce — multiple mutations often fire in a burst
            if (markIgnoredInUserList._t) clearTimeout(markIgnoredInUserList._t);
            markIgnoredInUserList._t = setTimeout(() => {
                markIgnoredInUserList();
                scanMemberTypes();
                updateHideListStyle();
            }, 50);
        });
        obs.observe(list, { childList: true, subtree: true, attributes: true });
    }

    // Watch for the user-menu popup that appears when you click a username
    // or avatar. Inject our Ignore/Unignore item just below Block/Unblock.
    function installUserMenuInjector() {
        // The menu is appended to the document dynamically. Watch the whole
        // body for new .c_userMenu nodes.
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    // Check the node itself and any children
                    const menus = [];
                    if (node.classList && node.classList.contains('c_userMenu')) menus.push(node);
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.c_userMenu').forEach((m) => menus.push(m));
                    }
                    for (const menu of menus) injectIgnoreIntoMenu(menu);
                }
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        // Also handle any menus already present
        document.querySelectorAll('.c_userMenu').forEach(injectIgnoreIntoMenu);
    }

    function injectIgnoreIntoMenu(menu) {
        if (menu.dataset.ptInjected === '1') return;
        menu.dataset.ptInjected = '1';

        // Try to find the username — look at the menu's own classes
        // (format: "c_userMenu USERNAME") and also at any child with
        // a username="..." attribute as a fallback.
        let username = '';
        for (const cls of menu.classList) {
            if (cls !== 'c_userMenu') { username = cls; break; }
        }
        if (!username) {
            const headerEl = menu.querySelector('[username]');
            if (headerEl) username = headerEl.getAttribute('username') || '';
        }
        username = lc(username);
        if (!username) return;

        // Find the <ul> of menu items
        const ul = menu.querySelector('ul');
        if (!ul) return;

        // Build the HIDE ALERTS / SHOW ALERTS item
        const isAlertsOnly = inAlertsOnly(username);
        const alertsLi = document.createElement('li');
        alertsLi.className = isAlertsOnly ? 'pt-show-alerts-item' : 'pt-hide-alerts-item';
        alertsLi.textContent = isAlertsOnly ? 'SHOW ALERTS' : 'HIDE ALERTS';
        alertsLi.addEventListener('click', (e) => {
            e.stopPropagation();
            if (inAlertsOnly(username)) {
                removeAlertsOnlyUser(username);
            } else {
                addAlertsOnlyUser(username);
            }
            markIgnoredInUserList();
            menu.style.display = 'none';
            setTimeout(() => menu.remove(), 100);
        });

        // Build the IGNORE item
        const isIgnored = inIgnored(username);
        const ignoreLi = document.createElement('li');
        ignoreLi.className = isIgnored ? 'pt-unignore-item' : 'pt-ignore-item';
        ignoreLi.textContent = isIgnored ? 'UNIGNORE' : 'IGNORE';
        ignoreLi.addEventListener('click', (e) => {
            e.stopPropagation();
            if (inIgnored(username)) {
                removeIgnoredUser(username);
            } else {
                addIgnoredUser(username);
            }
            markIgnoredInUserList();
            menu.style.display = 'none';
            setTimeout(() => menu.remove(), 100);
        });

        // Build the FAVORITE item
        const isFav = inFavorites(username);
        const favLi = document.createElement('li');
        favLi.className = isFav ? 'pt-unfavorite-item' : 'pt-favorite-item';
        favLi.textContent = isFav ? 'UNFAVORITE' : 'FAVORITE';
        favLi.addEventListener('click', (e) => {
            e.stopPropagation();
            if (inFavorites(username)) removeFavorite(username);
            else addFavorite(username);
            menu.style.display = 'none';
            setTimeout(() => menu.remove(), 100);
        });

        // Insert our three items as one contiguous group, in this order:
        //   Favorite / Unfavorite
        //   Hide Alerts / Show Alerts
        //   Ignore / Unignore
        // anchored just ABOVE the site's REPORT item, giving the full order:
        //   Rate → Favorite → Hide Alerts → Ignore → Report → Block.
        // (The site's Rate sits directly above Report in this menu, so this also
        // places Favorite right under Rate.) Fallbacks: above BLOCK, else append.
        const items = ul.querySelectorAll('li');
        let anchor = null;
        for (const item of items) {
            const t = (item.textContent || '').toLowerCase().trim();
            if (t === 'report') { anchor = item; break; }
        }
        if (!anchor) {
            for (const item of items) {
                const t = (item.textContent || '').toLowerCase().trim();
                if (t === 'block' || t === 'unblock') { anchor = item; break; }
            }
        }
        const ordered = [favLi, alertsLi, ignoreLi];
        if (anchor) {
            // Inserting each before the same anchor preserves their array order.
            ordered.forEach((node) => anchor.parentNode.insertBefore(node, anchor));
        } else {
            ordered.forEach((node) => ul.appendChild(node));
        }

        // If the user is currently ignored, lock down most actions in their
        // menu. We keep REPORT, BLOCK/UNBLOCK, and UNIGNORE active — anything
        // else (cam pop-outs 1-4, PROFILE, TIP $, PRIVATE CHAT, IM CHAT,
        // WATCHING, LOVE NOTE, RATE, and our own FAVORITE button) gets
        // visually grayed out and its clicks intercepted.
        //
        // We re-query items here because we just inserted FAVORITE and IGNORE.
        if (isIgnored) {
            applyIgnoredMenuLockdown(ul);
        }
    }

    // Walk every <li> in a c_userMenu and disable everything that isn't on
    // the allowlist (REPORT, BLOCK/UNBLOCK, UNIGNORE, and any pure-icon items
    // like the cam-position buttons row).
    //
    // Disabled items get .pt-menu-disabled (gray + strikethrough via CSS) and
    // a capture-phase click handler that swallows clicks before the site sees
    // them. The site uses jQuery delegation on the menu for click handling,
    // so we have to stop propagation at the capture phase to beat it.
    function applyIgnoredMenuLockdown(ul) {
        const ALLOW = new Set(['report', 'block', 'unblock', 'unignore', 'hide alerts', 'show alerts']);
        // The cam-position 1/2/3/4/play/refresh/expand row at the top of the
        // menu doesn't use <li> normally — it's a row of buttons. We disable
        // it by class match below.
        for (const item of ul.querySelectorAll('li')) {
            const t = (item.textContent || '').toLowerCase().trim();
            if (ALLOW.has(t)) continue;
            disableMenuItem(item);
        }
        // Also disable the cam position buttons row (the 1-4 / play / refresh
        // / expand icons that appear at the top of the menu for camming users).
        // These typically have classes like .c_userMenuTop, .c_userMenuCamCtrls,
        // or contain .smallWebcamBtn / .button. We match permissively so we
        // catch them across mod and non-mod menus.
        const camRows = ul.parentNode.querySelectorAll(
            '.c_userMenuTop, .c_userMenuCamCtrls, .c_userMenuButtons'
        );
        for (const row of camRows) disableMenuItem(row);
        // Belt-and-braces: any smallWebcamBtn / camPositionBtn left over
        for (const btn of ul.parentNode.querySelectorAll(
            '.smallWebcamBtn, .camPositionBtn, .btn_launchVP, .btn_launchCam'
        )) {
            disableMenuItem(btn);
        }
    }

    function disableMenuItem(el) {
        if (!el || el.dataset.ptDisabled === '1') return;
        el.dataset.ptDisabled = '1';
        el.classList.add('pt-menu-disabled');
        // Capture-phase swallow: site's jQuery delegation runs in bubble phase,
        // so this prevents the actual click action from firing.
        const swallow = (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
        };
        el.addEventListener('click', swallow, true);
        el.addEventListener('mousedown', swallow, true);
        el.addEventListener('mouseup', swallow, true);
    }
