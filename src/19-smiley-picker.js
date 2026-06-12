    // ============================================================
    // MODERN SMILEY PICKER
    // ============================================================
    let _smileyPickerBuilt = false;
    let _smileyCategorized = null;
    let _smileyBasePath = '../_themes/__images/chat/smileys/';

    // Tracks the currently-targeted input element for the picker.
    // For main chat: input_txt. For IMs: input_txt_<username>.
    let _smileyTargetInputId = 'input_txt';

    function buildModernSmileyPicker() {
        if (_smileyPickerBuilt) return;
        const codes = extractSmileyCodes();
        if (codes.size === 0) {
            console.log('[PowerTools] smiley picker waiting — no codes found yet');
            return; // smileys not loaded yet
        }
        console.log('[PowerTools] building smiley picker with', codes.size, 'smileys');
        _smileyCategorized = categorizeSmileys(codes);

        // Try to detect the actual base path from an existing img if available.
        // Both main chat (#c_smileys_img) and IM picker (#c_smileys_img_<user>)
        // share the same path so either source works.
        const existingImg = document.querySelector('[id^="c_smileys_img"] img');
        if (existingImg) {
            const src = existingImg.getAttribute('src') || '';
            const m = src.match(/^(.*\/smileys\/)/);
            if (m) _smileyBasePath = m[1];
        }

        // Build a new container floated near the input. We position it as a
        // floating popover above whichever smiley button was clicked.
        const container = document.createElement('div');
        container.id = 'pt-smileypicker';
        container.innerHTML = `
            <div id="pt-sp-header">
                <input type="text" id="pt-sp-search" placeholder="Search smileys..." autocomplete="off">
                <span id="pt-sp-close" title="Close">×</span>
            </div>
            <div class="pt-tabrow">
                <button class="pt-tabscroll-btn" data-dir="left">&#8249;</button>
                <div id="pt-sp-tabs"></div>
                <button class="pt-tabscroll-btn" data-dir="right">&#8250;</button>
            </div>
            <div id="pt-sp-grid"></div>
        `;
        document.body.appendChild(container);

        const tabs = container.querySelector('#pt-sp-tabs');
        const grid = container.querySelector('#pt-sp-grid');
        const cats = Object.keys(_smileyCategorized);

        cats.forEach((cat, i) => {
            const btn = document.createElement('button');
            btn.className = 'pt-sp-tab';
            btn.dataset.cat = cat;
            // Prefer PT_ICONS.smileyTabs from the loader (kept outside the
            // obfuscation so they're easy to edit), then SMILEY_CATEGORY_ICONS,
            // then the raw category name as fallback.
            const iconOverrides = (W.PT_ICONS && W.PT_ICONS.smileyTabs) || {};
            btn.textContent = iconOverrides[cat] || SMILEY_CATEGORY_ICONS[cat] || cat;
            btn.title = cat;
            if (i === 0) btn.classList.add('active');
            btn.addEventListener('click', () => {
                tabs.querySelectorAll('.pt-sp-tab').forEach((t) => t.classList.remove('active'));
                btn.classList.add('active');
                renderSmileyGrid(cat, '');
                container.querySelector('#pt-sp-search').value = '';
            });
            tabs.appendChild(btn);
        });

        // Smiley tab row scroll arrow buttons
        const spTabRow = tabs.parentElement;
        const spBtnL = spTabRow.querySelector('[data-dir="left"]');
        const spBtnR = spTabRow.querySelector('[data-dir="right"]');
        spBtnL.addEventListener('click', () => { tabs.scrollBy({ left: -80, behavior: 'smooth' }); });
        spBtnR.addEventListener('click', () => { tabs.scrollBy({ left: 80, behavior: 'smooth' }); });

        function renderSmileyGrid(cat, filter) {
            grid.innerHTML = '';
            let codes;
            if (filter) {
                const f = filter.toLowerCase();
                codes = [];
                for (const c of Object.values(_smileyCategorized)) {
                    for (const code of c) if (code.toLowerCase().includes(f)) codes.push(code);
                }
            } else {
                codes = _smileyCategorized[cat] || [];
            }
            for (const code of codes) {
                const img = document.createElement('img');
                img.src = _smileyBasePath + '{' + code + '}.gif';
                img.title = '{' + code + '}';
                img.alt = code;
                img.addEventListener('click', () => {
                    // Insert into whichever input is currently being targeted.
                    // _smileyTargetInputId is updated each time a smiley button
                    // is clicked (see capture handler below).
                    const inp = document.getElementById(_smileyTargetInputId);
                    if (inp) {
                        inp.value = inp.value + '{' + code + '}';
                        inp.focus();
                    }
                });
                grid.appendChild(img);
            }
        }

        renderSmileyGrid(cats[0], '');

        container.querySelector('#pt-sp-close').addEventListener('click', () => {
            container.classList.remove('open');
        });

        container.querySelector('#pt-sp-search').addEventListener('input', (e) => {
            const v = e.target.value.trim();
            const activeBtn = tabs.querySelector('.pt-sp-tab.active');
            const cat = activeBtn ? activeBtn.dataset.cat : cats[0];
            renderSmileyGrid(cat, v);
        });

        // Hide the native smiley pickers via CSS — both the main chat one
        // (#c_smileys) and each IM's (#c_smileys_<username>). They all share
        // the .c_smileys class so we hide by class.
        const styleHide = document.createElement('style');
        styleHide.id = 'pt-hide-native-smileys';
        styleHide.textContent = '.c_smileys { display: none !important; }';
        document.head.appendChild(styleHide);

        // Use event capture to intercept clicks on ANY smiley button before
        // the site's jQuery handler fires. This catches:
        //   - #smiley_btn          (main chat)
        //   - .smiley_btn[data-user=<u>]  (each IM window)
        document.addEventListener('click', (e) => {
            if (!settings.modernSmileyPicker) return;

            // Main chat smiley button
            const mainBtn = e.target.closest('#smiley_btn');
            // IM smiley button — match the class but exclude the main one (which
            // is matched by ID above). The .smiley_btn class is used by both,
            // but the main one is the only one that has #smiley_btn as its ID.
            const imBtn = e.target.closest('.smiley_btn[data-user]');

            let targetUser = null;
            if (mainBtn) {
                targetUser = null; // main chat
            } else if (imBtn) {
                targetUser = imBtn.getAttribute('data-user');
            }

            if (mainBtn || imBtn) {
                e.stopPropagation();
                e.preventDefault();
                // Decide which input to target
                _smileyTargetInputId = targetUser ? ('input_txt_' + targetUser) : 'input_txt';
                // Reposition the picker near the clicked button so it pops up
                // next to that IM (not always over the main input).
                positionSmileyPickerNear(mainBtn || imBtn);
                container.classList.toggle('open');
                return;
            }

            // Close on outside click
            if (!container.contains(e.target) && container.classList.contains('open')) {
                container.classList.remove('open');
            }
        }, true); // <-- capture phase

        _smileyPickerBuilt = true;
        console.log('[PowerTools] smiley picker ready (main chat + IM)');
    }

    // Position the picker so it appears just above & to the left of the clicked
    // smiley button. Uses fixed positioning so it floats over everything.
    function positionSmileyPickerNear(btn) {
        const picker = document.getElementById('pt-smileypicker');
        if (!picker || !btn) return;
        const rect = btn.getBoundingClientRect();
        // Picker is 330x350 (see CSS). Place its bottom-right corner near the
        // button so the picker sits above it. If too close to viewport edges,
        // clamp inside the visible area.
        const pickerW = 330;
        const pickerH = 350;
        let left = rect.right - pickerW;
        let top = rect.top - pickerH - 8;
        if (left < 8) left = 8;
        if (top < 8) top = rect.bottom + 8; // not enough room above → show below
        if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8;
        picker.style.left = left + 'px';
        picker.style.top = top + 'px';
        picker.style.right = 'auto';
        picker.style.bottom = 'auto';
    }

    function tryInstallSmileyPicker() {
        if (!settings.modernSmileyPicker) return;

        // Pre-load smileys by triggering the site's own loader once
        ensureSmileyDataLoaded();

        // Poll for up to 30s; the smiley list might be slow to load
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            if (attempts % 4 === 0) ensureSmileyDataLoaded(); // retry the loader every 2s
            buildModernSmileyPicker();
            if (_smileyPickerBuilt) {
                clearInterval(timer);
                console.log('[PowerTools] smiley picker installed after', attempts * 500, 'ms');
            } else if (attempts > 60) {
                clearInterval(timer);
                console.error('[PowerTools] smiley picker gave up — _EMOTES_POPPED never populated');
            }
        }, 500);
    }

