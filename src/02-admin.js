
    // ============================================================
    // ADMIN GATE
    // ============================================================
    // Locked debug tabs unlock via Ctrl+Shift+click on the panel header text,
    // then entering the correct password. The plaintext password is never in
    // the script; only its SHA-256 hash. Note: anyone with DevTools can
    // bypass this by flipping _adminUnlocked at runtime — it's obscurity,
    // not security.
    const _ADMIN_HASH = '19b4966b32411a28b50c67186a2df68a5f91310629b25b065e8ccef6a532fd43';
    const _POWER_HASH = 'c622170a23a7fd4d3d3364f3b24d6b1fe98871255686fdc45cdc348af17ffafe';
    let _adminUnlocked = false; // session-only; resets each page load
    let _powerUnlocked = false; // session-only; resets each page load

    async function sha256Hex(str) {
        const bytes = new TextEncoder().encode(String(str));
        const buf = await crypto.subtle.digest('SHA-256', bytes);
        return Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function tryAdminUnlock() {
        // Already unlocked? Offer to lock instead.
        if (_adminUnlocked || _powerUnlocked) {
            const parts = [];
            if (_adminUnlocked) parts.push('Admin');
            if (_powerUnlocked) parts.push('Power');
            if (confirm(parts.join(' + ') + ' features are unlocked. Lock them again now?')) {
                _adminUnlocked = false;
                _powerUnlocked = false;
                refreshTabVisibility();
                alert('Locked. Hidden tabs are hidden again.');
            }
            return;
        }
        const entered = prompt('Enter password:');
        if (entered == null || entered === '') return;
        const h = await sha256Hex(entered);
        if (h === _ADMIN_HASH) {
            _adminUnlocked = true;
            _powerUnlocked = true; // admin password also unlocks power
            refreshTabVisibility();
            alert('Admin unlocked (includes Power features). Re-locks on page reload.');
        } else if (h === _POWER_HASH) {
            _powerUnlocked = true;
            refreshTabVisibility();
            alert('Power tab unlocked. Re-locks on page reload.');
        } else {
            alert('Wrong password.');
        }
    }

    // Apply tabVisibility settings to the actual tab buttons. The Admin tab
    // is special: visible only when _adminUnlocked === true.
    function refreshTabVisibility() {
        const tabBar = document.getElementById('pt-tabs');
        if (!tabBar) return;
        const buttons = tabBar.querySelectorAll('button[data-tab]');
        let activeHidden = false;
        // Resolve "is this tab visible?" by checking the saved setting first,
        // falling back to the DEFAULTS entry. This way tabs that default to
        // hidden (like power / test) stay hidden until the user opts in via Admin.
        const resolveVisible = (tab) => {
            const saved = settings.tabVisibility?.[tab];
            if (typeof saved === 'boolean') return saved;
            const def = DEFAULTS.tabVisibility?.[tab];
            return typeof def === 'boolean' ? def : true;
        };
        buttons.forEach((btn) => {
            const tab = btn.dataset.tab;
            let visible;
            if (tab === 'admin') {
                visible = _adminUnlocked;
            } else if (tab === 'power') {
                // Power needs both: password unlocked AND not hidden by admin
                visible = _powerUnlocked && resolveVisible('power');
            } else {
                visible = resolveVisible(tab);
            }
            btn.style.display = visible ? '' : 'none';
            if (!visible && btn.classList.contains('active')) activeHidden = true;
        });
        // If the currently-active tab was hidden, switch to the first visible one
        if (activeHidden) {
            const firstVisible = Array.from(buttons).find((b) => b.style.display !== 'none');
            if (firstVisible) firstVisible.click();
        }
    }
