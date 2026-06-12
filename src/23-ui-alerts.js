    // ----- FAN MAIL TAB -----
    // Token values allowed by the site's <select>
    const FM_TOKEN_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

    // Render the templates list into a container (used by the Templates modal).
    // No send/play button — move-up / move-down / delete only.
    function _fmRenderTemplatesList(listEl) {
        if (!listEl) return;
        const templates = settings.fanMailTemplates || [];
        if (templates.length === 0) {
            listEl.innerHTML = '<div style="color:#666;font-style:italic;padding:8px">No templates yet — click + New to create one.</div>';
            return;
        }
        const fmIcons = (W.PT_ICONS && W.PT_ICONS.fanMail) || {};
        const upIcon   = fmIcons.up   || '↑';
        const downIcon = fmIcons.down || '↓';
        const delIcon  = fmIcons.del  || '🗑';
        const tbl = document.createElement('table');
        tbl.className = 'pt-fm-table';
        tbl.innerHTML = `
            <thead><tr>
                <th style="text-align:left">Description</th>
                <th style="text-align:center;width:60px">Tokens</th>
                <th style="text-align:right;width:96px">Actions</th>
            </tr></thead>
            <tbody></tbody>
        `;
        const tbody = tbl.querySelector('tbody');
        templates.forEach((t, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:4px 6px">${escapeHtml(t.description || '(no description)')}</td>
                <td style="padding:4px 6px;text-align:center">${t.tokens || 0}</td>
                <td style="padding:4px 6px;text-align:right;white-space:nowrap">
                    <button class="pt-fm-up" data-idx="${idx}" title="Move up" ${idx === 0 ? 'disabled' : ''}>${upIcon}</button>
                    <button class="pt-fm-down" data-idx="${idx}" title="Move down" ${idx === templates.length - 1 ? 'disabled' : ''}>${downIcon}</button>
                    <button class="pt-fm-del" data-idx="${idx}" title="Delete">${delIcon}</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        listEl.innerHTML = '';
        listEl.appendChild(tbl);

        listEl.querySelectorAll('.pt-fm-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                if (idx > 0) {
                    [templates[idx - 1], templates[idx]] = [templates[idx], templates[idx - 1]];
                    saveSetting('fanMailTemplates', templates);
                    _fmRenderTemplatesList(listEl);
                }
            });
        });
        listEl.querySelectorAll('.pt-fm-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                if (idx < templates.length - 1) {
                    [templates[idx + 1], templates[idx]] = [templates[idx], templates[idx + 1]];
                    saveSetting('fanMailTemplates', templates);
                    _fmRenderTemplatesList(listEl);
                }
            });
        });
        listEl.querySelectorAll('.pt-fm-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                if (confirm('Delete template "' + (templates[idx].description || '(no description)') + '"?')) {
                    templates.splice(idx, 1);
                    saveSetting('fanMailTemplates', templates);
                    _fmRenderTemplatesList(listEl);
                }
            });
        });
    }

    // Templates modal — opened from the Automations tab's "Templates…" button.
    function openFanMailTemplatesModal() {
        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML = `
            <div class="pt-modal" style="width:480px">
                <div class="pt-modal-header">
                    <span>Fan Mail Templates</span>
                    <button class="pt-modal-close">×</button>
                </div>
                <div class="pt-modal-body">
                    <div style="display:flex;gap:6px;margin-bottom:8px">
                        <button id="pt-fm-new" class="pt-btn-primary">+ New</button>
                    </div>
                    <div id="pt-fm-list"></div>
                </div>
                <div class="pt-modal-footer">
                    <button id="pt-fm-done" class="pt-btn-primary">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        _fmRenderTemplatesList(modal.querySelector('#pt-fm-list'));
        modal.querySelector('#pt-fm-new').addEventListener('click', () => openFanMailEditor(null));
        const closeModal = () => modal.remove();
        modal.querySelector('.pt-modal-close').addEventListener('click', closeModal);
        modal.querySelector('#pt-fm-done').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    // Editor modal for creating/editing a template
    function openFanMailEditor(existingIdx) {
        const templates = settings.fanMailTemplates || [];
        const existing = existingIdx !== null ? templates[existingIdx] : null;
        const tokenOptionsHtml = FM_TOKEN_OPTIONS.map(v =>
            `<option value="${v}" ${existing && existing.tokens == v ? 'selected' : ''}>${v}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML = `
            <div class="pt-modal" style="width:540px">
                <div class="pt-modal-header">
                    <span>${existing ? 'Edit' : 'New'} Fan Mail Template</span>
                    <button class="pt-modal-close">×</button>
                </div>
                <div class="pt-modal-body">
                    <div style="margin-bottom:8px">
                        <label style="display:block;color:#aaa;margin-bottom:2px">Description <span style="color:#f55">*</span> <span style="color:#666;font-size:11px">(max 50)</span></label>
                        <input type="text" id="pt-fme-desc" maxlength="50" style="width:100%;box-sizing:border-box" value="${escapeHtml(existing?.description || '')}">
                    </div>
                    <div style="margin-bottom:8px">
                        <label style="display:block;color:#aaa;margin-bottom:2px">Subject <span style="color:#666;font-size:11px">(optional, max 50 — uses a random subject if blank)</span></label>
                        <input type="text" id="pt-fme-subject" maxlength="50" style="width:100%;box-sizing:border-box" value="${escapeHtml(existing?.subject || '')}">
                    </div>
                    <div style="margin-bottom:8px">
                        <label style="display:block;color:#aaa;margin-bottom:2px">Tokens</label>
                        <select id="pt-fme-tokens" style="width:80px">${tokenOptionsHtml}</select>
                    </div>
                    <div>
                        <label style="display:block;color:#aaa;margin-bottom:2px">Message <span style="color:#f55">*</span></label>
                        <textarea id="pt-fme-message" style="width:500px;height:300px;box-sizing:border-box;resize:none">${escapeHtml(existing?.message || '')}</textarea>
                    </div>
                </div>
                <div class="pt-modal-footer">
                    <button id="pt-fme-cancel">Cancel</button>
                    <button id="pt-fme-save" class="pt-btn-primary">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.pt-modal-close').addEventListener('click', closeModal);
        modal.querySelector('#pt-fme-cancel').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        modal.querySelector('#pt-fme-save').addEventListener('click', () => {
            const desc = modal.querySelector('#pt-fme-desc').value.trim();
            const subject = modal.querySelector('#pt-fme-subject').value.trim();
            const tokens = parseInt(modal.querySelector('#pt-fme-tokens').value, 10) || 0;
            const message = modal.querySelector('#pt-fme-message').value.trim();
            if (!desc) return alert('Description is required.');
            if (!message) return alert('Message is required.');
            const entry = { description: desc, subject, tokens, message };
            if (existingIdx !== null) templates[existingIdx] = entry;
            else templates.push(entry);
            saveSetting('fanMailTemplates', templates);
            closeModal();
            // Refresh the Templates modal list underneath, if it's open.
            const listEl = document.querySelector('.pt-modal-overlay #pt-fm-list');
            if (listEl) _fmRenderTemplatesList(listEl);
        });
    }

    // Random subjects editor
    function openFanMailRandomEditor() {
        const subjects = (settings.fanMailRandomSubjects || []).slice();
        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML = `
            <div class="pt-modal" style="width:480px">
                <div class="pt-modal-header">
                    <span>Random Subjects</span>
                    <button class="pt-modal-close">×</button>
                </div>
                <div class="pt-modal-body">
                    <div style="color:#aaa;font-size:11px;margin-bottom:8px">
                        When a template has no subject, one of these is picked at random.
                    </div>
                    <div style="display:flex;gap:6px;margin-bottom:8px">
                        <input type="text" id="pt-fmr-input" maxlength="50" placeholder="Add a subject..." style="flex:1">
                        <button id="pt-fmr-add" class="pt-btn-primary">+ Add</button>
                    </div>
                    <ul id="pt-fmr-list" class="pt-list" style="max-height:280px;overflow-y:auto"></ul>
                </div>
                <div class="pt-modal-footer">
                    <button id="pt-fmr-close">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const ul = modal.querySelector('#pt-fmr-list');
        const renderList = () => {
            ul.innerHTML = '';
            if (subjects.length === 0) {
                ul.innerHTML = '<li style="color:#666;font-style:italic">No subjects yet.</li>';
                return;
            }
            subjects.forEach((s, idx) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${escapeHtml(s)}</span><div class="pt-btn-group"><button>Remove</button></div>`;
                li.querySelector('button').addEventListener('click', () => {
                    subjects.splice(idx, 1);
                    saveSetting('fanMailRandomSubjects', subjects);
                    renderList();
                });
                ul.appendChild(li);
            });
        };
        renderList();

        const addInput = modal.querySelector('#pt-fmr-input');
        const addNow = () => {
            const v = addInput.value.trim();
            if (!v) return;
            subjects.push(v);
            saveSetting('fanMailRandomSubjects', subjects);
            addInput.value = '';
            renderList();
        };
        modal.querySelector('#pt-fmr-add').addEventListener('click', addNow);
        addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addNow(); });

        const closeModal = () => modal.remove();
        modal.querySelector('.pt-modal-close').addEventListener('click', closeModal);
        modal.querySelector('#pt-fmr-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    // Get the iframe document for the profile popup (if open)
    function getProfileIframeDoc() {
        const iframe = document.getElementById('browser');
        if (!iframe || !iframe.contentDocument) return null;
        return iframe.contentDocument;
    }

    // Pick a random subject from the saved list (or empty if none)
    function pickRandomSubject() {
        const list = settings.fanMailRandomSubjects || [];
        if (list.length === 0) return '';
        return list[Math.floor(Math.random() * list.length)];
    }

    // Fill in the iframe's Fan Mail compose fields from a template.
    // Does NOT click Send — user reviews and submits.
    function applyFanMailTemplate(template, iframeDoc) {
        if (!template || !iframeDoc) return false;
        const subjectInput = iframeDoc.querySelector('input[name="subject"]');
        const tokensSelect = iframeDoc.querySelector('select[name="Tokens"]');
        const messageArea  = iframeDoc.querySelector('#message, textarea[name="message"]');
        if (!subjectInput || !tokensSelect || !messageArea) return false;

        const subjectToUse = (template.subject && template.subject.trim()) || pickRandomSubject();
        subjectInput.value = subjectToUse;
        tokensSelect.value = String(template.tokens || 0);
        messageArea.value = template.message || '';
        // Fire input/change events so any site listeners pick it up
        subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
        tokensSelect.dispatchEvent(new Event('change', { bubbles: true }));
        messageArea.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }

    // Inject the template dropdown into the iframe's Fan Mail compose page.
    // We watch the profile-popup iframe and re-inject every time it loads a
    // page that looks like the Fan Mail compose form.
    function installFanMailIframeWatcher() {
        const checkIframe = () => {
            const iframe = document.getElementById('browser');
            if (!iframe) return;
            try {
                const doc = iframe.contentDocument;
                if (!doc) return;
                const existing = doc.getElementById('pt-fm-iframe-dd');
                // Feature off → make sure no dropdown is showing, then bail.
                if (!settings.fanMailEnabled) {
                    if (existing) existing.remove();
                    return;
                }
                // Look for the compose page's Tokens cell
                const tokensSelect = doc.querySelector('select[name="Tokens"]');
                if (!tokensSelect) return;
                // Already injected?
                if (existing) return;
                injectFanMailDropdown(doc, tokensSelect);
            } catch (e) {
                // Cross-origin or not ready — ignore
            }
        };

        // Poll every 500ms. The iframe also has an onload handler but the
        // browser may strip/sanitize it, so polling is safer.
        setInterval(checkIframe, 500);
    }

    function injectFanMailDropdown(doc, tokensSelect) {
        const templates = settings.fanMailTemplates || [];
        // Build the dropdown — put it in the same <td> as Tokens, with 50px spacing
        const dd = doc.createElement('select');
        dd.id = 'pt-fm-iframe-dd';
        dd.style.marginLeft = '50px';
        dd.style.maxWidth = '260px';
        dd.innerHTML = '<option value="">— Choose a Fan Mail template —</option>' +
            templates.map((t, i) =>
                `<option value="${i}">${escapeHtml(t.description || '(no description)')}</option>`
            ).join('');

        dd.addEventListener('change', () => {
            const idx = parseInt(dd.value, 10);
            if (isNaN(idx)) return;
            applyFanMailTemplate(templates[idx], doc);
        });

        tokensSelect.parentNode.appendChild(dd);
    }

    // ----- WIPE SNAPSHOTS -----
    function renderAdminPane() {
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="admin"]');
        if (!pane) return;
        // Build a checkbox for each non-admin tab
        const tabs = [
            { key: 'alerts', label: 'Alerts' },
            { key: 'favorites', label: 'Favorites' },
            { key: 'keywords', label: 'Filters' },
            { key: 'automations', label: 'Automations' },
            { key: 'ignored', label: 'Ignored' },
            { key: 'blockedyou', label: 'Blocks' },
            { key: 'features', label: 'Features' },
            { key: 'advanced', label: 'Advanced' },
            { key: 'power', label: 'Power' },
            { key: 'data', label: 'Data' },
            { key: 'snapshots', label: 'Log' },
            { key: 'test', label: 'Test' },
        ];
        const rows = tabs.map((t) => {
            // Mirror refreshTabVisibility's resolver: saved bool wins, else default.
            const saved = settings.tabVisibility?.[t.key];
            const def = DEFAULTS.tabVisibility?.[t.key];
            const isVisible = (typeof saved === 'boolean') ? saved
                            : (typeof def === 'boolean')   ? def
                            : true;
            const checked = isVisible ? 'checked' : '';
            return `<div class="pt-toggle"><input type="checkbox" id="pt-tabvis-${t.key}" ${checked}><label for="pt-tabvis-${t.key}">Show ${t.label} tab</label></div>`;
        }).join('');

        pane.innerHTML = `
            <div class="pt-section">
                <h3>Admin <span class="pt-info" data-tip="This tab is hidden unless you Ctrl+Shift+click the panel header and enter the password. Re-locks automatically on page reload.">i</span></h3>
                <div style="color:#888;font-size:11px;margin-bottom:8px">
                    Use the toggles below to show or hide tabs. Hidden tabs are gone from the tab bar entirely. Settings persist across reloads.
                </div>
            </div>
            <div class="pt-section">
                <h3>Tab visibility</h3>
                ${rows}
            </div>
            <div class="pt-section">
                <h3>Maintenance</h3>
                <button id="pt-admin-rescrape">Re-scrape all accounts</button>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    Re-fetches member type, mod / model status, and rename info for every tracked account. Not normally needed — useful while testing when something doesn't update. The login scan also reports here.
                </div>
                <button id="pt-admin-inspect-blocks" style="margin-top:8px">Inspect blocks page (diagnostic)</button>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    Fetches my_blocks.php and copies its block form details to your clipboard (and the Log tab) — used to debug persistent blocking. Paste the result to the developer.
                </div>
                <div id="pt-scrape-progress" style="display:none;margin-top:8px">
                    <div style="height:14px;background:#111;border:1px solid #444;border-radius:7px;overflow:hidden">
                        <div id="pt-scrape-fill" style="height:100%;width:0;background:#3a7;transition:width 0.2s"></div>
                    </div>
                    <div id="pt-scrape-text" style="color:#aaa;font-size:11px;margin-top:3px"></div>
                </div>
            </div>
            <div class="pt-section">
                <h3>Re-lock</h3>
                <button id="pt-admin-lock" style="background:#722;color:white">Lock admin now</button>
                <div style="color:#888;font-size:11px;margin-top:4px">
                    Locks the admin features and immediately hides the Admin tab plus any tabs you have set to hidden.
                </div>
            </div>
            <div class="pt-section">
                <h3>Notes <span class="pt-info" data-tip="Tab visibility is obscurity, not security. Anyone with browser DevTools could read the script source, see the password hash, and bypass this. Treat this as 'hide from casual snoopers', not as real protection.">i</span></h3>
                <div style="color:#888;font-size:11px">
                    Tab visibility is obscurity, not security. Don't rely on it for anything sensitive.
                </div>
            </div>
        `;

        // Bind each visibility checkbox
        tabs.forEach((t) => {
            const cb = pane.querySelector('#pt-tabvis-' + t.key);
            cb.addEventListener('change', () => {
                if (!settings.tabVisibility) settings.tabVisibility = {};
                settings.tabVisibility[t.key] = cb.checked;
                saveSetting('tabVisibility', settings.tabVisibility);
                refreshTabVisibility();
            });
        });

        const rescrapeBtn = pane.querySelector('#pt-admin-rescrape');
        if (rescrapeBtn) rescrapeBtn.addEventListener('click', () => { rescrapeAllAccounts(); });
        // Reflect any scrape already in progress (e.g. the login scan).
        try { updateScrapeProgressUI(); } catch (e) {}

        const inspectBtn = pane.querySelector('#pt-admin-inspect-blocks');
        if (inspectBtn) inspectBtn.addEventListener('click', async () => {
            inspectBtn.disabled = true;
            const prev = inspectBtn.textContent;
            inspectBtn.textContent = 'Inspecting…';
            try {
                await inspectBlocksForm();
                inspectBtn.textContent = 'Copied to clipboard — see Log tab';
            } catch (e) {
                inspectBtn.textContent = 'Failed — see Log tab';
            }
            setTimeout(() => { inspectBtn.textContent = prev; inspectBtn.disabled = false; }, 3000);
        });

        pane.querySelector('#pt-admin-lock').addEventListener('click', () => {
            _adminUnlocked = false;
            refreshTabVisibility();
            // Switch to a visible tab
            const firstVisible = document.querySelector('#pt-tabs button[data-tab]:not([style*="display: none"])');
            if (firstVisible) firstVisible.click();
        });

    }

    function renderAlertsPane() {
        const pane = document.querySelector('#pt-panel .pt-tabpane[data-pane="alerts"]');
        if (!pane) return;
        pane.innerHTML = `
            ${_tabDocHtml('alerts.md')}
            <div class="pt-section">
                <h3>Highlight style ${_infoLink('alerts.md', 'highlight-style')}</h3>
                <div class="pt-row">
                    <select id="pt-mention-style">
                        <option value="subtle">Subtle (left border)</option>
                        <option value="highlight">Strong highlight (background)</option>
                        <option value="bold">Bold text</option>
                        <option value="box">Box border</option>
                    </select>
                </div>
            </div>
            <div class="pt-section">
                <h3>Highlight color ${_infoLink('alerts.md', 'highlight-style')}</h3>
                <div class="pt-row" style="align-items:center;gap:16px;flex-wrap:wrap">
                    <label><input type="radio" name="pt-mention-color-src" value="username"> Use sender's username color</label>
                    <label style="display:flex;align-items:center;gap:8px">
                        <input type="radio" name="pt-mention-color-src" value="custom">
                        Custom color:
                        <input type="color" id="pt-mention-custom-color" value="#ff5050" style="width:32px;height:24px;border:none;padding:0;background:none;cursor:pointer">
                    </label>
                </div>
            </div>
            <div class="pt-section">
                <h3 style="margin:0 0 6px 0">Alert behavior <button id="pt-mention-preview" title="Preview chime" style="width:24px;height:20px;padding:0;font-size:13px;line-height:1">&#9654;</button> ${_infoLink('alerts.md', 'alert-behavior')}</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 8px;margin-bottom:4px">
                    <div class="pt-toggle"><input type="checkbox" id="pt-mention-sound"><label for="pt-mention-sound">Chime when mentioned</label></div>
                    <div class="pt-toggle"><input type="checkbox" id="pt-alert-rating"><label for="pt-alert-rating">Alert when rated</label></div>
                </div>
                <div class="pt-toggle"><input type="checkbox" id="pt-mention-title"><label for="pt-mention-title">Flash the browser tab title when mentioned (only when tab is in background)</label></div>
            </div>
            <div class="pt-section">
                <h3>Add an extra word/nickname to ping on</h3>
                <div class="pt-row">
                    <input type="text" id="pt-mk-input" placeholder="e.g. nickname, first name, variation">
                    <button id="pt-mk-add">Add</button>
                </div>
            </div>
            <div class="pt-section pt-fill">
                <h3>Extra mention keywords (${settings.mentionKeywords.length})</h3>
                <ul class="pt-list" id="pt-mk-list"></ul>
            </div>
        `;

        const mklist = pane.querySelector('#pt-mk-list');
        if (settings.mentionKeywords.length === 0) {
            mklist.innerHTML = '<li class="pt-empty">No extra keywords yet.</li>';
        } else {
            settings.mentionKeywords.slice().sort().forEach((k) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${escapeHtml(k)}</span><button>Remove</button>`;
                li.querySelector('button').addEventListener('click', () => removeMentionKeyword(k));
                mklist.appendChild(li);
            });
        }
        pane.querySelector('#pt-mk-add').addEventListener('click', () => {
            const inp = pane.querySelector('#pt-mk-input');
            if (inp.value.trim()) {
                addMentionKeyword(inp.value.trim());
                inp.value = '';
            }
        });
        pane.querySelector('#pt-mk-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') pane.querySelector('#pt-mk-add').click();
        });

        const ms = pane.querySelector('#pt-mention-sound');
        ms.checked = !!settings.mentionAlertSound;
        ms.addEventListener('change', () => saveSetting('mentionAlertSound', ms.checked));

        const mt = pane.querySelector('#pt-mention-title');
        mt.checked = !!settings.mentionAlertFlashTitle;
        mt.addEventListener('change', () => saveSetting('mentionAlertFlashTitle', mt.checked));

        const ar = pane.querySelector('#pt-alert-rating');
        ar.checked = !!settings.alertOnRating;
        ar.addEventListener('change', () => saveSetting('alertOnRating', ar.checked));

        // Mention highlight style dropdown
        const mStyle = pane.querySelector('#pt-mention-style');
        mStyle.value = settings.mentionStyle || 'subtle';
        mStyle.addEventListener('change', () => {
            saveSetting('mentionStyle', mStyle.value);
            reapplyMentionStyles();
        });

        // Mention color source radios
        const mRadios = pane.querySelectorAll('input[name="pt-mention-color-src"]');
        mRadios.forEach((r) => {
            if (r.value === (settings.mentionColorSource || 'custom')) r.checked = true;
            r.addEventListener('change', () => {
                if (r.checked) {
                    saveSetting('mentionColorSource', r.value);
                    reapplyMentionStyles();
                }
            });
        });
        const mCustomColor = pane.querySelector('#pt-mention-custom-color');
        mCustomColor.value = settings.mentionCustomColor || '#ff5050';
        mCustomColor.addEventListener('input', () => {
            saveSetting('mentionCustomColor', mCustomColor.value);
            const customRadio = pane.querySelector('input[name="pt-mention-color-src"][value="custom"]');
            if (!customRadio.checked) {
                customRadio.checked = true;
                saveSetting('mentionColorSource', 'custom');
            }
            reapplyMentionStyles();
        });

        // Preview chime button — plays the alert sound on demand so the user
        // can tell whether their volume is right and they like the tone.
        pane.querySelector('#pt-mention-preview').addEventListener('click', () => {
            const play = ensureMentionAudio();
            if (play) try { play(); } catch (e) {}
        });
    }

