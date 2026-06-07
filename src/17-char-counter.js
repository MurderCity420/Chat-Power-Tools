    // ============================================================
    // CHARACTER COUNTER on the input
    // ============================================================
    function uninstallCharCounter() {
        const c = document.getElementById('pt-charcount-main');
        if (c) c.remove();
        const inp = document.getElementById('input_txt');
        // Restore the original width override (we shrank the input to make
        // room for the counter).
        if (inp && inp.dataset.ptOriginalWidth != null) {
            inp.style.width = inp.dataset.ptOriginalWidth;
            delete inp.dataset.ptOriginalWidth;
        }
        // Defensive: clear any padding-right left over from older versions
        // of this script that used the padding approach.
        if (inp && inp.dataset.ptOriginalPadRight != null) {
            inp.style.paddingRight = inp.dataset.ptOriginalPadRight;
            delete inp.dataset.ptOriginalPadRight;
        }
        // Restore the original maxlength. Site originally has it at 300 but
        // user can keep typing past 200 — server enforces. We restore to 300
        // so disabling the counter doesn't artificially shorten the user's
        // limit either.
        if (inp) inp.setAttribute('maxlength', '300');
    }

    function installCharCounter() {
        if (!settings.showCharCounter) return;
        const inp = document.getElementById('input_txt');
        if (!inp) {
            setTimeout(installCharCounter, 1000);
            return;
        }
        if (document.getElementById('pt-charcount-main')) return;

        // Server enforces ~200 — that's the meaningful soft limit.
        // We set maxlength=200 directly on the main chat input so the browser
        // hard-caps typing at 200 chars (paste, IME, drag-drop, everything).
        // This is safe because we only target #input_txt (main chat); IM inputs
        // are distinct elements with id="input_txt_<user>" and keep their own
        // maxlength="150" unchanged.
        const softLimit = 200;
        inp.setAttribute('maxlength', String(softLimit));

        const counter = document.createElement('span');
        counter.className = 'pt-charcount';
        counter.id = 'pt-charcount-main';
        counter.textContent = softLimit;

        const wrapper = inp.parentNode; // #c_chatInput
        const cs = window.getComputedStyle(wrapper);
        if (cs.position === 'static') wrapper.style.position = 'relative';
        wrapper.appendChild(counter);

        // Position the counter and shrink the input to make room for it.
        //
        // The site CSS sets `#input_txt { width: calc(100% - 44px) }` to
        // reserve space for the smiley + saved-messages buttons. We need to
        // expand that reservation to also cover our counter. Setting
        // `width: calc(100% - Npx)` cleanly shrinks the input element so its
        // text content stops short of the counter, with no feedback loop
        // (the input's outer width is computed from the parent, not from its
        // own content). This sidesteps every issue we had trying to use
        // padding-right.
        //
        // Counter is positioned absolutely via CSS `right: Npx`. We pick a
        // fixed offset that puts it just to the left of the smiley button.
        const COUNTER_RIGHT_OFFSET = 46; // px from wrapper's right edge
        const COUNTER_RESERVED_WIDTH = 46; // approximate counter slot width (~"200" + padding)
        // Total width reservation = site's original 44px reservation
        // + counter slot (46px) — total ~90px which matches what the user
        // verified manually in DevTools.
        const TOTAL_RESERVED = 90;

        const positionCounter = () => {
            counter.style.right = COUNTER_RIGHT_OFFSET + 'px';
            counter.style.top = '50%';
            counter.style.transform = 'translateY(-50%)';

            // Stash original inline width so we can restore on uninstall.
            // The site sets width via stylesheet (not inline) so the inline
            // value is normally empty. We still record it for safety.
            if (inp.dataset.ptOriginalWidth == null) {
                inp.dataset.ptOriginalWidth = inp.style.width || '';
            }
            inp.style.width = 'calc(100% - ' + TOTAL_RESERVED + 'px)';
        };
        positionCounter();
        window.addEventListener('resize', positionCounter);
        setTimeout(positionCounter, 500);
        setTimeout(positionCounter, 2000);

        const update = () => {
            // Enforce the 200-char soft limit as a hard cap. The site's server
            // rejects anything over 200 anyway, so we truncate here so the user
            // sees the boundary directly instead of having the message silently
            // rejected. Track caret position so truncation doesn't jump it.
            if (inp.value.length > softLimit) {
                const caretPos = inp.selectionStart;
                inp.value = inp.value.slice(0, softLimit);
                // Restore caret — if it was past the cut, clamp to new end
                const newCaret = Math.min(caretPos, softLimit);
                try { inp.setSelectionRange(newCaret, newCaret); } catch (e) {}
            }
            const len = inp.value.length;
            const remaining = softLimit - len;
            counter.textContent = remaining;
            counter.classList.remove('warn', 'danger');
            if (remaining < 0) counter.classList.add('danger');
            else if (remaining <= 30) counter.classList.add('warn');
            // No need to reposition — width reservation is fixed and the
            // counter's text changing doesn't affect input geometry.
        };
        inp.addEventListener('input', update);
        inp.addEventListener('change', update);
        // Also catch paste — paste fires 'input' but only after the value lands,
        // so the existing handler catches it. Defensive: re-run after a tick in
        // case of any composition events (IME input) that don't fire 'input'.
        inp.addEventListener('paste', () => setTimeout(update, 0));
        const sendBtn = document.getElementById('send_btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => setTimeout(update, 50));
        }
        update();
    }
