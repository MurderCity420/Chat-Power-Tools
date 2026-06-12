    // ============================================================
    // UI: PANEL
    // ============================================================

    // Header right-of-title control: show the "set up backup" reminder until the
    // user marks it done, then swap to a Docs button (main GitHub page).
    function updateBackupWarning() {
        const warn = document.getElementById('pt-backup-warn');
        const docs = document.getElementById('pt-docs-link');
        const done = !!settings.backupConfigured;
        if (warn) warn.style.display = done ? 'none' : '';
        if (docs) docs.style.display = done ? '' : 'none';
    }

    function buildPanel() {
        const panel = document.createElement('div');
        panel.id = 'pt-panel';
        panel.innerHTML = `
            <header>
                <span id="pt-header-text">Chat Power Tools</span>
                <span id="pt-backup-warn" title="Your settings aren't backed up yet — click to learn how">
                    <a href="https://github.com/MurderCity420/Chat-Power-Tools/blob/main/docs/syncing-settings.md" target="_blank" rel="noopener noreferrer">⚠ Set up settings backup</a>
                    <span id="pt-backup-done" title="I've set up cloud backup — hide this reminder">✓ done</span>
                </span>
                <a id="pt-docs-link" href="https://github.com/MurderCity420/Chat-Power-Tools/" target="_blank" rel="noopener noreferrer" title="Open the documentation on GitHub" style="display:none">📖 Docs</a>
                <span id="pt-version" title="Installed version">${W.PT_VERSION ? 'v' + W.PT_VERSION : ''}</span>
                <span id="pt-hi-user"></span>
                <span class="pt-close" title="Close">×</span>
            </header>
            <div class="pt-tabrow">
                <button class="pt-tabscroll-btn" data-dir="left">&#8249;</button>
                <div id="pt-tabs">
                    <button data-tab="alerts" class="active">Alerts</button>
                    <button data-tab="favorites">Favorites</button>
                    <button data-tab="keywords">Filters</button>
                    <button data-tab="automations">Automations</button>
                    <button data-tab="ignored">Ignored</button>
                    <button data-tab="blockedyou">Blocks</button>
                    <button data-tab="features">Features</button>
                    <button data-tab="advanced">Advanced</button>
                    <button data-tab="power">Power</button>
                    <button data-tab="data">Data</button>
                    <button data-tab="snapshots">Log</button>
                    <button data-tab="test">Test</button>
                    <button data-tab="admin">Admin</button>
                </div>
                <button class="pt-tabscroll-btn" data-dir="right">&#8250;</button>
            </div>
            <div id="pt-body"></div>
        `;
        document.body.appendChild(panel);

        const body = panel.querySelector('#pt-body');
        body.innerHTML = `
            <div class="pt-tabpane active" data-pane="alerts"></div>
            <div class="pt-tabpane" data-pane="favorites"></div>
            <div class="pt-tabpane" data-pane="keywords"></div>
            <div class="pt-tabpane" data-pane="ignored"></div>
            <div class="pt-tabpane" data-pane="features"></div>
            <div class="pt-tabpane" data-pane="automations"></div>
            <div class="pt-tabpane" data-pane="advanced"></div>
            <div class="pt-tabpane" data-pane="data"></div>
            <div class="pt-tabpane" data-pane="snapshots"></div>
            <div class="pt-tabpane" data-pane="blockedyou"></div>
            <div class="pt-tabpane" data-pane="power"></div>
            <div class="pt-tabpane" data-pane="test"></div>
            <div class="pt-tabpane" data-pane="admin"></div>
        `;

        // Backup reminder — shown until the user confirms they've set up cloud
        // backup. (A userscript can't read Tampermonkey's cloud-sync state, so
        // this is a manual acknowledgement, not auto-detection.)
        const backupDone = panel.querySelector('#pt-backup-done');
        if (backupDone) {
            backupDone.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Hide the backup reminder?\n\nOnly do this once you have set up OneDrive or Google Drive backup in Tampermonkey (see the linked guide). You can re-show it later from the Advanced tab.')) {
                    saveSetting('backupConfigured', true);
                    updateBackupWarning();
                }
            });
        }
        updateBackupWarning();

        // Header text Ctrl+Shift+click → admin unlock
        const headerText = panel.querySelector('#pt-header-text');
        if (headerText) {
            headerText.addEventListener('click', (e) => {
                if (e.ctrlKey && e.shiftKey) {
                    e.stopPropagation();
                    tryAdminUnlock();
                }
            });
        }

        panel.querySelector('.pt-close').addEventListener('click', () => {
            panel.classList.remove('open');
        });

        // Click outside the panel to close it. Clicks on the gear icon
        // (which toggles the panel) are handled separately and should NOT
        // be treated as outside-clicks. Same for any modal we opened.
        document.addEventListener('mousedown', (e) => {
            if (!panel.classList.contains('open')) return;
            if (panel.contains(e.target)) return;
            // Ignore clicks on the gear (it has its own toggle handler that
            // would race with this and re-open the panel).
            if (e.target.closest('#pt-gear-nav, #pt-gear-floating')) return;
            // Ignore clicks inside any of our modals
            if (e.target.closest('.pt-modal-overlay')) return;
            panel.classList.remove('open');
        });

        // Pressing Escape also closes the panel — but only if no modal is open
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                // If a modal is open, let it handle Escape instead
                if (document.querySelector('.pt-modal-overlay')) return;
                panel.classList.remove('open');
            }
        });

        panel.querySelectorAll('#pt-tabs button').forEach((btn) => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('#pt-tabs button').forEach((b) => b.classList.remove('active'));
                panel.querySelectorAll('.pt-tabpane').forEach((p) => p.classList.remove('active'));
                btn.classList.add('active');
                panel.querySelector(`.pt-tabpane[data-pane="${btn.dataset.tab}"]`).classList.add('active');
                if (btn.dataset.tab === 'blockedyou') { _blocksPageFetched = false; renderBlockedYou(); }
                if (btn.dataset.tab === 'favorites' || btn.dataset.tab === 'keywords' || btn.dataset.tab === 'ignored') renderPanelLists();
                if (btn.dataset.tab === 'features') renderFeaturesPane();
                if (btn.dataset.tab === 'automations') renderAutomationsPane();
                if (btn.dataset.tab === 'snapshots') renderSnapshots();
                if (btn.dataset.tab === 'alerts') renderAlertsPane();
                if (btn.dataset.tab === 'admin') renderAdminPane();
                if (btn.dataset.tab === 'test') renderTestPane();
                if (btn.dataset.tab === 'power') renderPowerPane();
                if (btn.dataset.tab === 'data') renderDataPane();
            });
        });

        renderPanelLists();
        renderFeaturesPane();
        renderAutomationsPane();
        renderAdvancedPane();
        renderTestPane();
        renderAlertsPane();
        // Hide locked tabs initially
        refreshTabVisibility();

        // Tab row scroll arrow buttons
        const tabsEl = panel.querySelector('#pt-tabs');
        const tabRow = tabsEl.parentElement;
        const tabBtnL = tabRow.querySelector('[data-dir="left"]');
        const tabBtnR = tabRow.querySelector('[data-dir="right"]');
        tabBtnL.addEventListener('click', () => { tabsEl.scrollBy({ left: -120, behavior: 'smooth' }); });
        tabBtnR.addEventListener('click', () => { tabsEl.scrollBy({ left: 120, behavior: 'smooth' }); });
    }

