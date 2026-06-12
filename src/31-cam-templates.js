    // ============================================================
    // CAM TEMPLATES — saved floating-cam layouts
    // ============================================================
    // A template is a named set of up to 12 positions/sizes for FLOATING cams
    // (the docked Cam Panel slots 1-4 are fixed by the site and not touched).
    // Each slot is { top, left, width, height } in px. When a cam is opened
    // (auto or manual) it's dropped into the next empty slot of the selected
    // template; switching templates re-packs the currently open floating cams.
    //
    // Positioning works by writing the same inline top/left/width/height styles
    // the site's own jQuery-UI draggable/resizable uses, so a placed cam stays
    // put until the user drags it (we never re-apply to an already-placed cam).

    const _ctAssign = new Map();   // username -> slot index (into template.slots)
    let _ctSweepTimer = null;

    function _ctNum(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }

    function _ctGetSelected() {
        if (!settings.camTemplateEnabled) return null;
        const list = settings.camTemplates || [];
        return list.find((t) => t.id === settings.camTemplateSelectedId) || null;
    }

    // Slots that are fully specified (all four numbers present), with their raw index.
    function _ctUsableSlots(tpl) {
        if (!tpl || !Array.isArray(tpl.slots)) return [];
        const out = [];
        tpl.slots.forEach((s, i) => {
            if (s && _ctNum(s.top) != null && _ctNum(s.left) != null &&
                _ctNum(s.width) != null && _ctNum(s.height) != null) out.push({ s, i });
        });
        return out;
    }

    function _ctApplySlot(el, slot) {
        if (!el || !slot) return;
        el.style.top    = _ctNum(slot.top) + 'px';
        el.style.left   = _ctNum(slot.left) + 'px';
        el.style.width  = _ctNum(slot.width) + 'px';
        el.style.height = _ctNum(slot.height) + 'px';
        // The site's jQuery-UI resizable writes pixel sizes onto the inner video
        // body during manual drag-resizes. Sizing only the .c_videop container
        // leaves those stale px in place, so the cam itself doesn't grow/shrink.
        // Force the inner body + video to fill the container so the cam resizes.
        const body = el.querySelector('.videobody_PS, .videobody');
        if (body) { body.style.width = '100%'; body.style.height = '100%'; }
        const vid = el.querySelector('video');
        if (vid) { vid.style.width = '100%'; vid.style.height = '100%'; }
    }

    function _ctUsername(el) { return el && el.id ? lc(el.id.replace(/^vp_/, '')) : ''; }

    // Place one (newly opened) floating cam into the next empty template slot.
    function _ctPlaceCam(el) {
        const tpl = _ctGetSelected();
        if (!tpl) return;
        const username = _ctUsername(el);
        if (!username || _ctAssign.has(username)) return;
        const usable = _ctUsableSlots(tpl);
        if (!usable.length) return;
        const taken = new Set(_ctAssign.values());
        const free = usable.find((u) => !taken.has(u.i));
        if (!free) return;                       // no empty slot — leave the cam alone
        _ctAssign.set(username, free.i);
        _ctApplySlot(el, tpl.slots[free.i]);
        ptLog('CamTpl', 'Placed cam "' + username + '" in slot ' + (free.i + 1) + ' of "' + (tpl.desc || 'template') + '".');
    }

    // Re-pack ALL currently open floating cams into the selected template, in
    // DOM order. Used when the active template changes or is (re)enabled.
    function _ctRepackAll() {
        _ctAssign.clear();
        const tpl = _ctGetSelected();
        if (!tpl) return;
        const usable = _ctUsableSlots(tpl);
        if (!usable.length) return;
        const cams = Array.from(document.querySelectorAll('.c_videop[id^="vp_"]'));
        for (let k = 0; k < cams.length && k < usable.length; k++) {
            const el = cams[k];
            const username = _ctUsername(el);
            if (!username) continue;
            _ctAssign.set(username, usable[k].i);
            _ctApplySlot(el, tpl.slots[usable[k].i]);
        }
        ptLog('CamTpl', 'Rearranged ' + Math.min(cams.length, usable.length) + ' cam(s) into "' + (tpl.desc || 'template') + '".');
    }

    // Backstop sweep: prune assignments for closed cams, place any unassigned ones.
    function _ctSweep() {
        if (!settings.camTemplateEnabled) return;
        const tpl = _ctGetSelected();
        if (!tpl) return;
        for (const u of Array.from(_ctAssign.keys())) {
            if (!document.querySelector('.c_videop[id="vp_' + u + '"]')) _ctAssign.delete(u);
        }
        document.querySelectorAll('.c_videop[id^="vp_"]').forEach((el) => {
            if (!_ctAssign.has(_ctUsername(el))) _ctPlaceCam(el);
        });
    }

    function _ctSweepDebounced() {
        if (_ctSweepTimer) return;
        _ctSweepTimer = setTimeout(() => { _ctSweepTimer = null; try { _ctSweep(); } catch (e) {} }, 200);
    }

    // Read up to 12 currently open floating cams' position+size (rounded to int).
    function _ctReadOpenFloating() {
        const out = [];
        document.querySelectorAll('.c_videop[id^="vp_"]').forEach((el) => {
            if (out.length >= 12) return;
            out.push({
                top:    Math.round(_ctNum(el.style.top)    != null ? _ctNum(el.style.top)    : (el.offsetTop || 0)),
                left:   Math.round(_ctNum(el.style.left)   != null ? _ctNum(el.style.left)   : (el.offsetLeft || 0)),
                height: Math.round(_ctNum(el.style.height) != null ? _ctNum(el.style.height) : (el.offsetHeight || 0)),
                width:  Math.round(_ctNum(el.style.width)  != null ? _ctNum(el.style.width)  : (el.offsetWidth || 0)),
            });
        });
        return out;
    }

    // ---- Nav-bar dropdown (next to the green shield / holiday icon) ----
    function _ctRenderNavDropdown() {
        let li = document.getElementById('pt-camtpl-nav');
        if (!settings.camTemplateEnabled) { if (li) li.remove(); return; }
        const gear = document.getElementById('pt-gear-nav');
        if (!gear) return;
        if (!li) {
            li = document.createElement('li');
            li.id = 'pt-camtpl-nav';
            // Layout comes from the #nav_chatTop li#pt-camtpl-nav CSS rule (mirrors
            // the gear so it flows inline with the site icons instead of floating
            // over them). No inline float — that was what put it under the icons.
            const sel = document.createElement('select');
            sel.id = 'pt-camtpl-select';
            sel.title = 'Active cam template';
            sel.addEventListener('change', () => {
                saveSetting('camTemplateSelectedId', sel.value);
                try { _ctRepackAll(); } catch (e) {}
            });
            li.appendChild(sel);
            // Insert AFTER the holiday badge if present, else after the gear.
            // In this nav, later-in-DOM renders further LEFT, so this lands the
            // dropdown to the left of the holiday icon / green shield.
            const holiday = document.getElementById('pt-holiday-nav');
            (holiday || gear).insertAdjacentElement('afterend', li);
        }
        const sel = li.querySelector('#pt-camtpl-select');
        const list = settings.camTemplates || [];
        // Built-in "(None)" (empty value) = no active template. If the saved id
        // no longer exists, the browser leaves the value blank → falls to (None).
        sel.innerHTML = '<option value="">(None)</option>' +
            list.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.desc || '(unnamed)') + '</option>').join('');
        sel.value = settings.camTemplateSelectedId || '';
        _ctRefreshDefaultDropdown();
    }

    // Keep the Automations-tab "Default" dropdown's options in sync with the
    // template list (it sets the login default, not the live active template).
    function _ctRefreshDefaultDropdown() {
        const sel = document.getElementById('pt-camtpl-default');
        if (!sel) return;
        const list = settings.camTemplates || [];
        sel.innerHTML = '<option value="">(None)</option>' +
            list.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.desc || '(unnamed)') + '</option>').join('');
        sel.value = settings.camTemplateDefaultId || '';
    }

    // ---- Settings manager modal ----
    function openCamTemplateManager() {
        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML =
            '<div class="pt-modal" style="width:460px">' +
                '<div class="pt-modal-header"><span>Cam Templates</span><button class="pt-modal-close">×</button></div>' +
                '<div class="pt-modal-body">' +
                    '<div style="display:flex;gap:6px;margin-bottom:8px">' +
                        '<button id="pt-ct-add" class="pt-btn-primary">+ Add</button>' +
                        '<button id="pt-ct-save" class="pt-btn-primary">Save</button>' +
                    '</div>' +
                    '<ul id="pt-ct-list" class="pt-list" style="max-height:300px"></ul>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        const listEl = modal.querySelector('#pt-ct-list');
        const renderList = () => {
            const list = settings.camTemplates || [];
            listEl.innerHTML = '';
            if (!list.length) { listEl.innerHTML = '<li class="pt-empty">No templates yet — click + Add.</li>'; return; }
            list.forEach((t, idx) => {
                const li = document.createElement('li');
                li.style.padding = '8px';      // taller row so the sort/edit icons aren't clipped
                li.innerHTML =
                    '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(t.desc || '(unnamed)') + '</span>' +
                    '<div class="pt-btn-group">' +
                        '<button class="pt-ct-up" title="Move up"' + (idx === 0 ? ' disabled' : '') + '>↑</button>' +
                        '<button class="pt-ct-down" title="Move down"' + (idx === list.length - 1 ? ' disabled' : '') + '>↓</button>' +
                        '<button class="pt-ct-edit" title="Edit">Edit</button>' +
                        '<button class="pt-ct-del" title="Delete">✕</button>' +
                    '</div>';
                li.querySelector('.pt-ct-up').addEventListener('click', () => {
                    if (idx > 0) { [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]]; saveSetting('camTemplates', list); renderList(); _ctRenderNavDropdown(); }
                });
                li.querySelector('.pt-ct-down').addEventListener('click', () => {
                    if (idx < list.length - 1) { [list[idx + 1], list[idx]] = [list[idx], list[idx + 1]]; saveSetting('camTemplates', list); renderList(); _ctRenderNavDropdown(); }
                });
                li.querySelector('.pt-ct-edit').addEventListener('click', () => openCamTemplateEditor(t.id, renderList));
                li.querySelector('.pt-ct-del').addEventListener('click', () => {
                    if (!confirm('Delete template "' + (t.desc || '(unnamed)') + '"?')) return;
                    const i = list.findIndex((x) => x.id === t.id);
                    if (i > -1) list.splice(i, 1);
                    if (settings.camTemplateSelectedId === t.id) saveSetting('camTemplateSelectedId', list[0] ? list[0].id : '');
                    saveSetting('camTemplates', list);
                    renderList(); _ctRenderNavDropdown();
                });
                listEl.appendChild(li);
            });
        };
        renderList();

        modal.querySelector('#pt-ct-add').addEventListener('click', () => openCamTemplateEditor(null, renderList));
        const close = () => modal.remove();
        modal.querySelector('#pt-ct-save').addEventListener('click', close);
        modal.querySelector('.pt-modal-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    }

    // ---- Add / edit editor modal ----
    function openCamTemplateEditor(existingId, onSaved) {
        const list = settings.camTemplates || [];
        const existing = existingId ? list.find((t) => t.id === existingId) : null;
        const slots = (existing && existing.slots) || [];

        let rowsHtml = '';
        for (let i = 0; i < 12; i++) {
            const s = slots[i] || {};
            const v = (x) => escapeHtml(x != null && x !== undefined ? String(x) : '');
            rowsHtml +=
                '<tr>' +
                    '<td style="text-align:center;color:#888;padding:2px 4px">' + (i + 1) + '</td>' +
                    '<td style="padding:2px"><input type="text" class="pt-ct-top" maxlength="6" value="' + v(s.top) + '" style="width:56px;box-sizing:border-box"></td>' +
                    '<td style="padding:2px"><input type="text" class="pt-ct-left" maxlength="6" value="' + v(s.left) + '" style="width:56px;box-sizing:border-box"></td>' +
                    '<td style="padding:2px"><input type="text" class="pt-ct-height" maxlength="6" value="' + v(s.height) + '" style="width:56px;box-sizing:border-box"></td>' +
                    '<td style="padding:2px"><input type="text" class="pt-ct-width" maxlength="6" value="' + v(s.width) + '" style="width:56px;box-sizing:border-box"></td>' +
                    '<td style="padding:2px;white-space:nowrap;text-align:center">' +
                        '<button class="pt-ct-rowup" data-i="' + i + '" title="Move up" style="padding:1px 5px;font-size:11px"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
                        '<button class="pt-ct-rowdown" data-i="' + i + '" title="Move down" style="padding:1px 5px;font-size:11px"' + (i === 11 ? ' disabled' : '') + '>↓</button>' +
                    '</td>' +
                '</tr>';
        }

        const modal = document.createElement('div');
        modal.className = 'pt-modal-overlay';
        modal.innerHTML =
            '<div class="pt-modal" style="width:470px">' +
                '<div class="pt-modal-header"><span>' + (existing ? 'Edit' : 'New') + ' Cam Template</span><button class="pt-modal-close">×</button></div>' +
                '<div class="pt-modal-body">' +
                    '<div style="margin-bottom:8px">' +
                        '<label style="display:block;color:#aaa;margin-bottom:2px">Description</label>' +
                        '<input type="text" id="pt-ct-desc" maxlength="40" value="' + escapeHtml(existing ? (existing.desc || '') : '') + '" style="width:100%;box-sizing:border-box">' +
                    '</div>' +
                    '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
                        '<thead><tr style="color:#8af;font-size:11px;text-transform:uppercase">' +
                            '<th style="width:20px">#</th><th>Top</th><th>Left</th><th>Height</th><th>Width</th><th>Sort</th>' +
                        '</tr></thead>' +
                        '<tbody id="pt-ct-rows">' + rowsHtml + '</tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="pt-modal-footer" style="display:flex;align-items:center;gap:8px">' +
                    '<button id="pt-ct-copy">Copy current cam positions</button>' +
                    '<span id="pt-ct-copy-status" style="color:#888;font-size:11px;flex:1;text-align:left"></span>' +
                    '<button id="pt-ct-cancel">Cancel</button>' +
                    '<button id="pt-ct-savebtn" class="pt-btn-primary">Save</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        const status = modal.querySelector('#pt-ct-copy-status');
        modal.querySelector('#pt-ct-copy').addEventListener('click', () => {
            const open = _ctReadOpenFloating();
            const trs = modal.querySelectorAll('#pt-ct-rows tr');
            trs.forEach((tr, i) => {
                const o = open[i];
                tr.querySelector('.pt-ct-top').value    = o ? o.top : '';
                tr.querySelector('.pt-ct-left').value   = o ? o.left : '';
                tr.querySelector('.pt-ct-height').value = o ? o.height : '';
                tr.querySelector('.pt-ct-width').value  = o ? o.width : '';
            });
            status.textContent = open.length
                ? '✓ Copied ' + open.length + ' open floating cam position(s).'
                : 'No floating cams are open right now.';
        });

        // Per-row up/down sort — swaps the four values with the neighbouring row.
        const swapRows = (i, j) => {
            const trs = modal.querySelectorAll('#pt-ct-rows tr');
            if (i < 0 || j < 0 || i >= trs.length || j >= trs.length) return;
            ['.pt-ct-top', '.pt-ct-left', '.pt-ct-height', '.pt-ct-width'].forEach((cls) => {
                const a = trs[i].querySelector(cls), b = trs[j].querySelector(cls);
                const tmp = a.value; a.value = b.value; b.value = tmp;
            });
        };
        modal.querySelectorAll('.pt-ct-rowup').forEach((b) => {
            b.addEventListener('click', () => { const i = parseInt(b.dataset.i, 10); swapRows(i, i - 1); });
        });
        modal.querySelectorAll('.pt-ct-rowdown').forEach((b) => {
            b.addEventListener('click', () => { const i = parseInt(b.dataset.i, 10); swapRows(i, i + 1); });
        });

        const close = () => modal.remove();
        modal.querySelector('#pt-ct-cancel').addEventListener('click', close);
        modal.querySelector('.pt-modal-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        modal.querySelector('#pt-ct-savebtn').addEventListener('click', () => {
            const desc = modal.querySelector('#pt-ct-desc').value.trim();
            if (!desc) return alert('Enter a description.');
            const newSlots = [];
            modal.querySelectorAll('#pt-ct-rows tr').forEach((tr) => {
                newSlots.push({
                    top:    tr.querySelector('.pt-ct-top').value.trim(),
                    left:   tr.querySelector('.pt-ct-left').value.trim(),
                    height: tr.querySelector('.pt-ct-height').value.trim(),
                    width:  tr.querySelector('.pt-ct-width').value.trim(),
                });
            });
            const cur = settings.camTemplates || [];
            if (existing) {
                existing.desc = desc; existing.slots = newSlots;
            } else {
                const id = 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
                cur.push({ id: id, desc: desc, slots: newSlots });
                // Don't auto-activate — leave the active selection (incl. "(None)")
                // as the user set it; they pick the new template from the dropdown.
            }
            saveSetting('camTemplates', cur);
            try { _ctRenderNavDropdown(); } catch (e) {}
            try { if (settings.camTemplateEnabled) _ctRepackAll(); } catch (e) {}
            if (typeof onSaved === 'function') onSaved();
            close();
        });
    }

    // ---- Install: nav dropdown + placement observer + backstop sweep ----
    function installCamTemplates() {
        let tries = 0;
        const navTick = () => {
            if (document.getElementById('pt-gear-nav')) { try { _ctRenderNavDropdown(); } catch (e) {} return; }
            if (tries++ > 60) return;
            setTimeout(navTick, 500);
        };
        navTick();

        const root = document.getElementById('chat_app') || document.body;
        try {
            const obs = new MutationObserver((muts) => {
                if (!settings.camTemplateEnabled) return;
                for (const m of muts) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType === 1 && node.matches && node.matches('.c_videop[id^="vp_"]')) { _ctSweepDebounced(); return; }
                    }
                    for (const node of m.removedNodes) {
                        if (node.nodeType === 1 && node.id && node.id.indexOf('vp_') === 0) _ctAssign.delete(lc(node.id.replace(/^vp_/, '')));
                    }
                }
            });
            obs.observe(root, { childList: true, subtree: false });
        } catch (e) {}

        setInterval(() => { try { _ctSweep(); } catch (e) {} }, 3000);
    }
