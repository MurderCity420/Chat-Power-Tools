    function renderSnapshots() {
        // Log tab — shows the Power Tools diagnostic log (its own actions:
        // syncs, blocks, unblocks, cam recovery, etc.).
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="snapshots"]');
        if (!pane) return;

        const stats = getDiagLogStats();
        const currentText = getDiagLogPretty();

        pane.innerHTML = `
            <div class="pt-section">
                <h3>Diagnostic log <span class="pt-info" data-tip="Records Chat Power Tools' own actions (syncs, blocks, unblocks, guest sweeps, cam recovery, rename detection, etc.) — not chat messages. Kept for 3 days, stored locally. Copy this and paste it back into chat for diagnostics.">i</span></h3>
                <input type="text" id="pt-log-filter" placeholder="Filter lines (case-insensitive)..." style="width:100%;background:#111;color:#eee;border:1px solid #444;padding:4px 6px;border-radius:3px;font-size:12px;margin-bottom:6px">
                <div class="pt-row" style="margin-bottom:6px">
                    <button id="pt-log-refresh">↻ Refresh</button>
                    <button id="pt-log-download">Download .txt</button>
                    <button id="pt-log-copy">Copy all</button>
                    <button id="pt-log-clear" style="background:#622">Clear log</button>
                </div>
                <textarea id="pt-log-view" readonly style="width:100%;height:320px;background:#0a0a0a;color:#ddd;border:1px solid #333;border-radius:3px;padding:8px;font-family:monospace;font-size:11px;resize:vertical;white-space:pre"></textarea>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    ${stats.lines} entries, ${(stats.bytes / 1024).toFixed(1)} KB — kept for 3 days. Format: Date &amp; Time - Module - Log.
                </div>
            </div>
        `;

        // ---- Diagnostic log wiring ----
        const view = pane.querySelector('#pt-log-view');
        const filter = pane.querySelector('#pt-log-filter');

        function applyFilter() {
            const f = (filter.value || '').toLowerCase();
            if (!f) { view.value = currentText; return; }
            const lines = currentText.split('\n');
            view.value = lines.filter((l) => l.toLowerCase().includes(f)).join('\n');
        }
        view.value = currentText;
        // Scroll to bottom (most recent)
        setTimeout(() => { view.scrollTop = view.scrollHeight; }, 0);

        filter.addEventListener('input', applyFilter);

        pane.querySelector('#pt-log-refresh').addEventListener('click', () => renderSnapshots());

        pane.querySelector('#pt-log-download').addEventListener('click', () => {
            const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const stamp = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `power-tools-log-${stamp}.txt`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        });

        pane.querySelector('#pt-log-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(currentText).then(() => {
                const btn = pane.querySelector('#pt-log-copy');
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 1200);
            }).catch(() => prompt('Copy this:', currentText));
        });

        pane.querySelector('#pt-log-clear').addEventListener('click', () => {
            if (!confirm('Clear the diagnostic log? This cannot be undone.')) return;
            clearDiagLog();
            renderSnapshots();
        });
    }

    function renderDataPane() {
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="data"]');
        pane.innerHTML = `
            <div class="pt-section">
                <h3>Export</h3>
                <div class="pt-row">
                    <button id="pt-export">Copy all settings as JSON</button>
                </div>
            </div>
            <div class="pt-section">
                <h3>Import (paste JSON, overwrites everything)</h3>
                <textarea id="pt-import-text" style="width:100%;height:120px;background:#111;color:#eee;border:1px solid #444;border-radius:3px;padding:6px;font-family:monospace;font-size:11px"></textarea>
                <div class="pt-row" style="margin-top:6px">
                    <button id="pt-import-btn">Import</button>
                    <button id="pt-reset-btn" style="background:#622">Reset to defaults</button>
                </div>
            </div>
            <div class="pt-section" style="color:#888;font-size:11px">
                Tip: export your config occasionally as backup, especially if you've added lots of ignored users.
            </div>
        `;
        pane.querySelector('#pt-export').addEventListener('click', () => {
            const json = JSON.stringify(settings, null, 2);
            navigator.clipboard.writeText(json).then(() => {
                alert('Copied to clipboard.');
            }).catch(() => {
                prompt('Copy this:', json);
            });
        });
        pane.querySelector('#pt-import-btn').addEventListener('click', () => {
            const text = pane.querySelector('#pt-import-text').value;
            try {
                const parsed = JSON.parse(text);
                for (const k of Object.keys(DEFAULTS)) {
                    if (k in parsed) saveSetting(k, parsed[k]);
                }
                syncIgnoredToChat();
                applyAllDelays();
                renderPanelLists();
                renderAdvancedPane();
                alert('Imported.');
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
            }
        });
        pane.querySelector('#pt-reset-btn').addEventListener('click', () => {
            if (!confirm('Reset all settings to defaults? Your ignore list, favorites, keywords, etc. will be cleared.')) return;
            for (const k of Object.keys(DEFAULTS)) {
                GM_deleteValue(k);
            }
            settings = loadSettings();
            syncIgnoredToChat();
            setAntiSpam(false);
            setUnicodeUnlock(false);
            setZeroChatDelay(false);
            setZeroActionDelay(false);
            setZeroRateDelay(false);
            renderPanelLists();
            renderAdvancedPane();
        });
    }

    function buildGearAndCounter() {
        // The nav uses float:right, which reverses the visual order from the
        // DOM order. We use insertBefore on the first child so our element
        // is the FIRST DOM child — appearing visually at the far-RIGHT.
        // Reason: appending was placing our <li> in a DOM position that
        // appeared to break the click target for #btn_launchIM (the user's
        // own IM button), which lives in the same nav.
        let attempts = 0;
        const tryInject = () => {
            const nav = document.getElementById('nav_chatTop');
            if (nav) {
                const li = document.createElement('li');
                li.id = 'pt-gear-nav';
                li.title = 'Power Tools settings';
                li.innerHTML = '<span><i class="fa fa-shield"></i></span>';
                // Insert at the END (DOM-wise) so we appear visually FIRST in
                // the right-floated row, well away from #btn_launchIM.
                nav.appendChild(li);
                li.addEventListener('click', () => {
                    const panel = document.getElementById('pt-panel');
                    const opening = !panel.classList.contains('open');
                    panel.classList.toggle('open');
                    if (opening) { try { refreshActiveTab(); } catch (e) {} }
                });
                // Diagnostic: if #btn_launchIM exists nearby, log its position
                const ilb = document.getElementById('btn_launchIM');
                if (ilb) {
                    console.log('[PowerTools] gear injected. btn_launchIM bounding rect:', ilb.getBoundingClientRect());
                    console.log('[PowerTools] gear bounding rect:', li.getBoundingClientRect());
                }
                return true;
            }
            return false;
        };

        if (tryInject()) return;

        const timer = setInterval(() => {
            attempts++;
            if (tryInject() || attempts > 40) {
                clearInterval(timer);
                if (!document.getElementById('pt-gear-nav')) {
                    // Fallback: floating gear in the corner
                    const gear = document.createElement('div');
                    gear.id = 'pt-gear-floating';
                    gear.textContent = '⚙';
                    gear.title = 'Power Tools settings';
                    gear.innerHTML = '⚙';
                    gear.addEventListener('click', () => {
                        const panel = document.getElementById('pt-panel');
                        const opening = !panel.classList.contains('open');
                        panel.classList.toggle('open');
                        if (opening) { try { refreshActiveTab(); } catch (e) {} }
                    });
                    document.body.appendChild(gear);
                }
            }
        }, 250);
    }
