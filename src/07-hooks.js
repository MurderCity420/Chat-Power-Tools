    // ============================================================
    // HOOKING THE CHAT
    // ============================================================
    let _origReceive, _origTicker;

    function installHooks() {
        _origReceive = W.Chat.receiveMessage.bind(W.Chat);
        _origTicker = W.Chat.tickerUpdate ? W.Chat.tickerUpdate.bind(W.Chat) : null;

        // Wrap receiveMessage. The native function drops ignored users entirely,
        // which is what 'invisible' mode wants. For 'collapsed' and 'blurred'
        // modes we want the message to render but be hidden, so we let it
        // through and mark it after the fact.
        //
        // OMGChat's chat message object has shape: {color, message, username}
        // (NOT userA — that's only on certain ticker types).
        W.Chat.receiveMessage = function (msg) {
            try {
                const userA = lc((msg && (msg.username || msg.userA)) || '');
                const messageText = (msg && typeof msg.message === 'string') ? msg.message : '';

                // Ignored user handling
                if (userA && inIgnored(userA)) {
                    if (settings.displayMode === 'invisible') {
                        return; // native code would also drop it; this is belt-and-suspenders
                    } else {
                        // Temporarily remove from _IGNORED_USERS so native code renders it,
                        // then we'll find that fresh node and hide/blur it.
                        const idx = W.Chat._IGNORED_USERS.indexOf(userA);
                        if (idx > -1) W.Chat._IGNORED_USERS.splice(idx, 1);
                        const result = _origReceive(msg);
                        if (idx > -1) W.Chat._IGNORED_USERS.push(userA);
                        markLastMessageHidden(userA, 'ignored');
                        return result;
                    }
                }

                // Keyword filter — two modes:
                //   'redact' (default): replace matched word with asterisks
                //   'hide': hide the whole message
                if (messageText && settings.keywords.length) {
                    const lower = messageText.toLowerCase();
                    if (settings.keywordMode === 'hide') {
                        // Hide mode — original behavior
                        for (const kw of settings.keywords) {
                            if (kw && lower.includes(kw)) {
                                if (settings.displayMode === 'invisible') {
                                    return;
                                } else {
                                    const result = _origReceive(msg);
                                    markLastMessageHidden(userA, 'keyword');
                                    return result;
                                }
                            }
                        }
                    } else {
                        // Redact mode — replace each matched word with asterisks
                        // We do case-insensitive find-and-replace but preserve case
                        // of surrounding text. Word-boundary matched so we don't
                        // match inside larger words ('class' wouldn't match in 'classic').
                        let redactedText = msg.message;
                        let didRedact = false;
                        for (const kw of settings.keywords) {
                            if (!kw) continue;
                            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const re = new RegExp('\\b' + escaped + '\\b', 'gi');
                            if (re.test(redactedText)) {
                                redactedText = redactedText.replace(re, '*'.repeat(kw.length));
                                didRedact = true;
                            }
                        }
                        if (didRedact) {
                            // Mutate msg.message in place so the original render uses redacted text
                            msg.message = redactedText;
                        }
                    }
                }

                // Smart color correction: rewrite msg.color so the chat's own
                // rendering uses a readable color against the current background.
                if (settings.smartColorCorrection && msg && typeof msg.color === 'string') {
                    const safe = getSafeColor(msg.color);
                    if (safe !== msg.color) msg.color = safe;
                }

                const result = _origReceive(msg);

                // Post-render decoration: favorites, color overrides, aliases, mentions
                decorateLastMessage(msg);
                return result;
            } catch (err) {
                console.error('[PowerTools] receiveMessage hook error', err);
                return _origReceive(msg);
            }
        };

        // Wrap tickerUpdate to hide rolls/slots/ratings selectively.
        if (_origTicker) {
            W.Chat.tickerUpdate = function (msg) {
                try {
                    // Different ticker variants use different field names — try both.
                    // From a real capture: rolls look like {userA, action:'roll', value}
                    const type = (msg && (msg.action || msg.type)) || '';
                    const userA = lc(msg && msg.userA);
                    const userB = lc(msg && msg.userB);

                    // Per-type kill switches
                    if (settings.hideAllDice && type === 'roll') return swallowTicker();
                    if (settings.hideAllSlots && type === 'slots') return swallowTicker();
                    if (settings.hideAllRatings && type === 'rate') return swallowTicker();
                    if (settings.hideAllTips && (type === 'tip' || type === 'tokens' ||
                        (msg && typeof msg.message === 'string' && /sent\s+\d+\s+Tokens?\s+to/i.test(msg.message)))) {
                        return swallowTicker();
                    }

                    if (settings.hideTickersFromIgnored && (inIgnored(userA) || inIgnored(userB))) {
                        return swallowTicker();
                    }

                    // Auto-rate-back: if someone rates ME a 4 or 5, rate them back the same.
                    if (type === 'rate') {
                        try {
                            const me = detectMyUsername();
                            const ratedUser = lc(msg.ratee || msg.userB || msg.to || '');
                            const rater = lc(msg.rater || msg.userA || msg.from || '');
                            let value = parseInt(msg.rating || msg.value || msg.rank, 10);
                            if (isNaN(value) && msg.message) {
                                const m = String(msg.message).match(/:\s*(\d)/);
                                if (m) value = parseInt(m[1], 10);
                            }
                            const iWasRated = ratedUser === me && rater && rater !== me;

                            // Alert (chime + tab flash) when rated, any score
                            if (iWasRated && settings.alertOnRating && !inAlertsOnly(rater)) {
                                try { fireMentionAlert(); } catch (e) {}
                            }

                            // Auto-rate-back logic
                            if (settings.autoRateBack && iWasRated && (value === 4 || value === 5)) {
                                let shouldRate = false;
                                if (value === 5) {
                                    const target = settings.autoRate5Target || 'all';
                                    if (target === 'all') {
                                        shouldRate = true;
                                    } else if (target === 'friends_favs') {
                                        shouldRate = inFriendsOrFavorites(rater);
                                    } else if (target === 'favs_only') {
                                        shouldRate = inFavorites(rater);
                                    }
                                } else if (value === 4) {
                                    shouldRate = !!settings.autoRate4Back;
                                }
                                if (shouldRate) {
                                    setTimeout(() => autoRateUser(rater, value), 2000 + Math.random() * 2000);
                                }
                            }
                        } catch (e) {}
                    }

                    return _origTicker(msg);
                } catch (err) {
                    console.error('[PowerTools] tickerUpdate hook error', err);
                    return _origTicker(msg);
                }
            };
        }

        function swallowTicker() {
            // Returning undefined skips rendering. Some branches inside the
            // native code append to #chatText directly, so we just don't call it.
            return;
        }
    }

    // ============================================================
    // ADD-USER UID RESOLVER
    // ============================================================
    // Listens to every add_user socket event so we passively build the
    // uid ↔ username mapping as people enter the room — without waiting
    // for the user to open the Blocks tab. When fetchMemberType finds a
    // UID that was previously stored under a different username it calls
    // applyUsernameRename automatically, keeping all lists up to date.
    //
    // Fetches are rate-limited: 4 at a time with a 1-second gap between
    // batches. Users already fetched this session (_memberTypeFetched) or
    // already resolved (getUser(u).uid exists) are skipped.
    function installAddUserListener() {
        if (!W.Socket || !W.Socket._IO) {
            setTimeout(installAddUserListener, 1000);
            return;
        }

        const _queue = [];
        let _running = false;

        async function _drain() {
            if (_running || !_queue.length) return;
            _running = true;
            // Let the user-list rows (with their membership badges) render first
            // so we can read each user's type from the DOM without a network hit.
            await new Promise((r) => setTimeout(r, 1500));
            while (_queue.length) {
                const batch = _queue.splice(0, 4);
                await Promise.all(batch.map((u) => {
                    // Resolve type from the live user-list badge — no network.
                    // Guests are disposable (UID/name don't matter, and we'd
                    // unblock them anyway), so never scrape their profile.
                    let t = '';
                    try { t = getMemberType(u); } catch (e) {}
                    if (t === 'guest' || getUser(u).type === 'guest') return Promise.resolve();
                    return fetchMemberType(u);
                }));
                if (_queue.length) await new Promise((r) => setTimeout(r, 1000));
            }
            _running = false;
        }

        W.Socket._IO.on('add_user', (data) => {
            const u       = lc((data && data.username) || '');
            const hashid  = (data && data.hashid)  || '';
            const country = ((data && data.country) || '').toUpperCase();
            if (!u) return;

            // Build the patch from whatever the payload gives us.
            const patch = {};

            // Country — authoritative from server, no DOM scraping needed.
            if (country) patch.country = country;

            // Hashid — stable per-account identifier; used for instant rename detection.
            if (hashid) {
                const prev = getUserByHashid(hashid);
                if (prev && prev.username !== u) applyUsernameRename(prev.username, u);
                patch.hashid = hashid;
            }

            // Also capture registered/VIP/mod status if we don't have a type yet.
            if (!getUser(u).type) {
                if (data && (data.isRegistered || data.isVIP)) patch.type = 'member';
            }

            if (Object.keys(patch).length) { patchUser(u, patch); saveUsersSoon(); }

            // Queue profile fetch for UID resolution if not yet known.
            if (!_memberTypeFetched.has(u) && !getUser(u).uid) {
                _queue.push(u);
                _drain();
            }
        });
    }
