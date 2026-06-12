    // ============================================================
    // SCROLL-LOCK + NEW MESSAGES JUMP BUTTON
    // ============================================================
    // When scroll lock is engaged and new messages arrive while the user is
    // scrolled away from the bottom, show a floating button. Click it to
    // unlock and jump to the bottom.
    // ============================================================
    // SCROLL LOCK CONTROL
    // ============================================================
    function setScrollLock(on) {
        // Mirror what the site's button does: toggle Chat._SCROLL_LOCK and the
        // visual 'locked' class on #btn_scrollLock.
        try {
            W.Chat._SCROLL_LOCK = !!on;
            const lockBtn = document.getElementById('btn_scrollLock');
            if (lockBtn) {
                if (on) lockBtn.classList.add('locked');
                else lockBtn.classList.remove('locked');
            }
            // If unlocking, also jump to bottom
            if (!on) {
                const scrollEl = document.getElementById('chatText_PS');
                if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
            }
        } catch (e) {}
    }

    let _scrollLockAutoTimer = null;
    let _scrollLockEngagedAt = 0;
    function setupScrollLockAutoDisable() {
        // Poll: if scroll lock is engaged and has been on longer than the
        // configured timeout, auto-disable it.
        if (_scrollLockAutoTimer) clearInterval(_scrollLockAutoTimer);
        _scrollLockAutoTimer = setInterval(() => {
            // Whole feature gated on the master toggle
            if (!settings.scrollLockButton) {
                _scrollLockEngagedAt = 0;
                return;
            }
            const seconds = settings.scrollLockAutoDisableSeconds;
            if (!seconds || seconds <= 0) {
                _scrollLockEngagedAt = 0;
                return;
            }
            const isLocked = !!(W.Chat && W.Chat._SCROLL_LOCK);
            if (isLocked) {
                if (_scrollLockEngagedAt === 0) {
                    _scrollLockEngagedAt = Date.now();
                } else if (Date.now() - _scrollLockEngagedAt >= seconds * 1000) {
                    setScrollLock(false);
                    _scrollLockEngagedAt = 0;
                }
            } else {
                _scrollLockEngagedAt = 0;
            }
        }, 1000);
    }

    function installScrollLockButton() {
        // Note: we always install the button infrastructure; the show/hide
        // logic gates on settings.scrollLockButton so toggling the master
        // option works live without a reload.
        const scrollEl = document.getElementById('chatText_PS');
        const lockBtn = document.getElementById('btn_scrollLock');
        const chatInput = document.getElementById('c_chat');
        if (!scrollEl || !lockBtn || !chatInput) {
            setTimeout(installScrollLockButton, 1000);
            return;
        }
        if (document.getElementById('pt-newmsg-btn')) return;

        const btn = document.createElement('div');
        btn.className = 'pt-newmsg-btn';
        btn.id = 'pt-newmsg-btn';
        btn.innerHTML = '<i class="fa fa-arrow-down"></i>';
        btn.title = 'New messages — click to jump to bottom';

        // Position relative to the chat-input bar, above it and slightly left
        // The button is added to the chat panel container so it can sit
        // absolutely positioned just above the input.
        const container = chatInput.parentNode;
        if (container) {
            const cs = window.getComputedStyle(container);
            if (cs.position === 'static') container.style.position = 'relative';
            container.appendChild(btn);
        } else {
            document.body.appendChild(btn);
        }

        // Position: roughly 30px above the chat input bar, 10px from right
        const positionButton = () => {
            const inputRect = chatInput.getBoundingClientRect();
            const containerRect = (container || document.body).getBoundingClientRect();
            btn.style.bottom = (containerRect.bottom - inputRect.top + 30) + 'px';
            btn.style.right = '10px';
        };

        btn.addEventListener('click', () => {
            // Unlock scroll if locked
            if (W.Chat && W.Chat._SCROLL_LOCK) {
                W.Chat._SCROLL_LOCK = false;
                lockBtn.classList.remove('locked');
            }
            // Jump to bottom
            scrollEl.scrollTop = scrollEl.scrollHeight;
            btn.classList.remove('show');
        });

        // Check function — runs on scroll AND when new messages arrive
        const isLocked = () => !!(W.Chat && W.Chat._SCROLL_LOCK);
        const isAwayFromBottom = () => {
            // 30px tolerance — close enough to "bottom"
            return (scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight) > 30;
        };
        const update = () => {
            if (!settings.scrollLockButton) {
                btn.classList.remove('show');
                return;
            }
            if (isLocked() && isAwayFromBottom()) {
                positionButton();
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        };

        scrollEl.addEventListener('scroll', update);
        // When new messages append, recheck
        const chatText = document.getElementById('chatText');
        if (chatText) {
            const obs = new MutationObserver(() => setTimeout(update, 50));
            obs.observe(chatText, { childList: true });
        }
        // Also re-check periodically in case scroll lock toggles or layout shifts
        setInterval(update, 1000);
        // Initial position + state
        setTimeout(update, 500);
        window.addEventListener('resize', positionButton);
    }
    function applyAllDelays() {
        // Called on init — re-apply persisted settings
        if (settings.antiSpam) W.Chat.checkSpam = () => false;
        if (settings.unicodeUnlock) W.Chat.checkUnicode = () => false;
        if (settings.zeroChatDelay) W.Chat._CHAT_DELAY = 0;
        if (settings.zeroActionDelay) W.Chat._ACTION_DELAY = 0;
        if (settings.zeroRateDelay) W.Chat._RATE_DELAY = 0;
        if (settings.autoUnmute) setAutoUnmute(true);
        if (settings.bypassCensorship) setBypassCensorship(true);
    }
