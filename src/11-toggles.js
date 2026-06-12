    // ============================================================
    // TOGGLE FEATURES
    // ============================================================
    let _origCheckSpam, _origCheckUnicode;
    let _origChatDelay, _origActionDelay, _origRateDelay;
    function captureOriginals() {
        _origCheckSpam = W.Chat.checkSpam;
        _origCheckUnicode = W.Chat.checkUnicode;
        _origChatDelay = W.Chat._CHAT_DELAY;
        _origActionDelay = W.Chat._ACTION_DELAY;
        _origRateDelay = W.Chat._RATE_DELAY;
        try { _origCensored = W.G.CENSORED_WORDS; } catch (e) {}
    }
    function setAntiSpam(on) {
        saveSetting('antiSpam', on);
        W.Chat.checkSpam = on ? (() => false) : _origCheckSpam;
    }
    function setUnicodeUnlock(on) {
        saveSetting('unicodeUnlock', on);
        W.Chat.checkUnicode = on ? (() => false) : _origCheckUnicode;
    }
    function setZeroChatDelay(on) {
        saveSetting('zeroChatDelay', on);
        W.Chat._CHAT_DELAY = on ? 0 : _origChatDelay;
    }
    function setZeroActionDelay(on) {
        saveSetting('zeroActionDelay', on);
        W.Chat._ACTION_DELAY = on ? 0 : _origActionDelay;
    }
    function setZeroRateDelay(on) {
        saveSetting('zeroRateDelay', on);
        W.Chat._RATE_DELAY = on ? 0 : _origRateDelay;
    }

    let _autoUnmuteTimer = null;
    function setAutoUnmute(on) {
        saveSetting('autoUnmute', on);
        if (_autoUnmuteTimer) { clearInterval(_autoUnmuteTimer); _autoUnmuteTimer = null; }
        if (on) {
            // Aggressively clear all mute flags every 500ms
            _autoUnmuteTimer = setInterval(() => {
                try {
                    W.Chat._MUTED = false;
                    W.Chat._ACTION_MUTED = false;
                    W.Chat._RATE_MUTED = false;
                    W.Chat._PRIVATE_MUTED = false;
                } catch (e) {}
            }, 500);
        }
    }

    function setBypassCensorship(on) {
        saveSetting('bypassCensorship', on);
        if (on) {
            // Wipe the censored words pattern so the regex matches nothing
            try { W.G.CENSORED_WORDS = '__never_match_this_xyzzy__'; } catch (e) {}
        } else {
            // We can't easily restore without saving the original; warn
            try {
                if (_origCensored !== undefined) W.G.CENSORED_WORDS = _origCensored;
            } catch (e) {}
        }
    }
    let _origCensored;
