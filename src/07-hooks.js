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

                // Auto-reply: fuzzy-match the (original, pre-redaction) text and
                // auto-send a configured reply. Never fires on our own messages.
                try { _arHandleMessage(userA, messageText); } catch (e) {}
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
                                    } else if (target === 'friends_only') {
                                        shouldRate = inFriend(rater);
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
    // AUTO-BOOMS
    // ============================================================
    // Watches #chatText for dice/slot "boom" tickers and auto-sends a configured
    // chat message. Detection is DOM-based (the rendered <p class="ticker"> node)
    // so it doesn't depend on undocumented socket payload field names.
    let _abLastDice = null;        // { num, user } — previous dice roll seen (for back-to-back combos)
    let _abLastSendAt = 0;         // timestamp the next/last send is scheduled for
    const _abRecent = new Map();   // dedupe key -> ts (guards against MutationObserver re-fires)

    function _abFaSymbol(iEl) {
        const cls = (iEl && iEl.className) || '';
        const m = cls.match(/fa-(birthday-cake|diamond|glass|heart|bomb|star|trophy)\b/);
        return m ? m[1] : '';
    }

    // My own booms always fire; others fire only if they match the target group.
    function _abPassesTarget(user) {
        const me = detectMyUsername();
        if (user && me && user === me) return true;
        const t = settings.autoBoomTarget || 'all';
        if (t === 'all') return true;
        if (t === 'friends_favs') return inFriendsOrFavorites(user);
        if (t === 'friends_only') return inFriend(user);
        if (t === 'favs_only') return inFavorites(user);
        return false;
    }

    function _abForceSend(text) {
        const inp = document.getElementById('input_txt');
        const btn = document.getElementById('send_btn');
        if (!inp || !btn) return false;
        inp.value = text;
        try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        btn.click();
        return true;
    }

    function _abQueueSend(text, key) {
        if (!settings.autoBoom || !text) return;
        const now = Date.now();
        const k = key || text;
        if (_abRecent.has(k) && now - _abRecent.get(k) < 5000) return;  // de-dupe ticker re-renders
        _abRecent.set(k, now);
        if (_abRecent.size > 60) { for (const [kk, ts] of _abRecent) { if (now - ts > 30000) _abRecent.delete(kk); } }
        let delay = 1500 + Math.random() * 2000;          // natural 1.5–3.5s delay
        const projected = now + delay;
        if (projected - _abLastSendAt < 5000) delay += 5000 - (projected - _abLastSendAt); // >=5s between sends
        _abLastSendAt = now + delay;
        setTimeout(() => {
            try { if (settings.autoBoom) { _abForceSend(text); ptLog('Boom', 'Auto-boom sent: ' + text); } } catch (e) {}
        }, delay);
    }

    // Hidden, non-configurable combos: two DIFFERENT people rolling these
    // numbers back-to-back. Order-independent.
    function _abHiddenCombo(prevNum, num) {
        if ((prevNum === 66 && num === 6) || (prevNum === 6 && num === 66)) return '{lucifer} B666M {lucifer}';
        if ((prevNum === 4 && num === 20) || (prevNum === 20 && num === 4)) return '{smoke}b420m{smoke}';
        return '';
    }

    function _abHandleDice(user, num) {
        // 1) Hidden back-to-back combos (needs two different rollers).
        if (_abLastDice && _abLastDice.user && _abLastDice.user !== user) {
            const combo = _abHiddenCombo(_abLastDice.num, num);
            if (combo) _abQueueSend(combo, 'combo:' + _abLastDice.num + '+' + num + ':' + _abLastDice.user + '+' + user);
        }
        _abLastDice = { num: num, user: user };
        // 2) Configured dice booms (defaults 0/69/100 + custom personal numbers).
        if (!_abPassesTarget(user)) return;
        const sNum = String(num);
        let text = (settings.autoBoomDice && settings.autoBoomDice[sNum]) || '';
        if (!text && Array.isArray(settings.autoBoomCustom)) {
            const hit = settings.autoBoomCustom.find((c) => String(c.num) === sNum);
            if (hit) text = hit.text || '';
        }
        if (text) _abQueueSend(text, 'dice:' + sNum + ':' + user);
    }

    function _abHandleSlots(user, sym) {
        if (!_abPassesTarget(user)) return;
        const text = (settings.autoBoomSlots && settings.autoBoomSlots[sym]) || '';
        if (text) _abQueueSend(text, 'slots:' + sym + ':' + user);
    }

    function _abProcessTicker(p) {
        try {
            const text = p.textContent || '';
            const userEl = p.querySelector('.username');
            const user = lc(userEl ? userEl.textContent.trim() : '');
            if (!user) return;
            if (/\brolled\b/i.test(text)) {
                const strongs = p.querySelectorAll('strong:not(.username)');
                if (!strongs.length) return;
                const num = parseInt((strongs[strongs.length - 1].textContent || '').trim(), 10);
                if (!isNaN(num)) _abHandleDice(user, num);
            } else if (/played slots/i.test(text)) {
                const icons = p.querySelectorAll('strong:not(.username) i[class*="fa-"]');
                const syms = Array.from(icons).map(_abFaSymbol).filter(Boolean);
                if (syms.length >= 3 && syms.every((s) => s === syms[0])) _abHandleSlots(user, syms[0]);
            }
        } catch (e) {}
    }

    function installAutoBoom() {
        const attach = () => {
            const chat = document.getElementById('chatText');
            if (!chat) { setTimeout(attach, 1000); return; }
            const obs = new MutationObserver((muts) => {
                for (const m of muts) {
                    for (const node of m.addedNodes) {
                        if (!node || node.nodeType !== 1) continue;
                        if (node.matches && node.matches('p.ticker')) _abProcessTicker(node);
                        else if (node.querySelectorAll) node.querySelectorAll('p.ticker').forEach(_abProcessTicker);
                    }
                }
            });
            obs.observe(chat, { childList: true });
        };
        attach();
    }

    // ============================================================
    // AUTO-REPLY
    // ============================================================
    // Fuzzy-matches incoming chat messages against user-defined rules and
    // auto-sends a reply. "Light" fuzzy matching handles creative spellings:
    // we lowercase, strip punctuation, and COLLAPSE runs of repeated letters
    // (so "cheers" / "cheeers" / "cheeeers" all normalise to "chers"), then
    // allow a small edit-distance slack on single-word matches.
    const _arRecent = new Map();   // dedupe key -> ts

    function _arNormalize(s) {
        return String(s || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')   // drop punctuation / emoji / symbols
            .replace(/(.)\1+/g, '$1')      // collapse repeated chars: cheeers -> chers
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Levenshtein edit distance (small strings only).
    function _arLev(a, b) {
        if (a === b) return 0;
        const al = a.length, bl = b.length;
        if (!al) return bl;
        if (!bl) return al;
        let prev = new Array(bl + 1);
        for (let j = 0; j <= bl; j++) prev[j] = j;
        for (let i = 1; i <= al; i++) {
            const cur = [i];
            for (let j = 1; j <= bl; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
            }
            prev = cur;
        }
        return prev[bl];
    }

    // Never reply to ourselves (would loop). Others filtered by autoReplyTarget.
    function _arPassesTarget(user) {
        const me = detectMyUsername();
        if (!user || (me && user === me)) return false;
        const t = settings.autoReplyTarget || 'all';
        if (t === 'all') return true;
        if (t === 'friends_favs') return inFriendsOrFavorites(user);
        if (t === 'friends_only') return inFriend(user);
        if (t === 'favs_only') return inFavorites(user);
        return false;
    }

    function _arQueueReply(text, key) {
        if (!settings.autoReply || !text) return;
        const now = Date.now();
        const k = key || text;
        if (_arRecent.has(k) && now - _arRecent.get(k) < 8000) return;  // de-dupe bursts
        _arRecent.set(k, now);
        if (_arRecent.size > 60) { for (const [kk, ts] of _arRecent) { if (now - ts > 60000) _arRecent.delete(kk); } }
        let delay = 1500 + Math.random() * 2000;            // natural 1.5–3.5s delay
        const projected = now + delay;
        // Share the auto-boom send clock so booms + replies never flood (>=5s apart).
        if (projected - _abLastSendAt < 5000) delay += 5000 - (projected - _abLastSendAt);
        _abLastSendAt = now + delay;
        setTimeout(() => {
            try { if (settings.autoReply) { _abForceSend(text); ptLog('AutoReply', 'Auto-reply sent: ' + text); } } catch (e) {}
        }, delay);
    }

    function _arHandleMessage(user, text) {
        if (!settings.autoReply) return;
        const rules = settings.autoReplyRules || [];
        if (!rules.length || !text) return;
        if (!_arPassesTarget(user)) return;
        const norm = _arNormalize(text);
        if (!norm) return;
        const tokens = norm.split(' ');
        for (const rule of rules) {
            if (!rule || !rule.match || !rule.reply) continue;
            const m = _arNormalize(rule.match);
            if (!m) continue;
            let hit = false;
            if (m.includes(' ')) {
                hit = norm.includes(m);                     // multi-word: phrase contained
            } else {
                const maxDist = m.length >= 4 ? 1 : 0;      // single word: small typo slack
                hit = tokens.some((tok) => tok === m || (maxDist > 0 && _arLev(tok, m) <= maxDist));
            }
            if (hit) { _arQueueReply(rule.reply, 'ar:' + m + ':' + user); break; } // one reply per message
        }
    }

    // ============================================================
    // HOURLY TIME-ZONE SHOUT-OUT (Test tab)
    // ============================================================
    // At :20 past every UTC hour, post the user's message followed by the
    // cities in whichever UTC zone(s) are currently at local midnight (00:xx) —
    // i.e. the part of the world just starting a new day. The selected zone
    // rotates hour by hour. Offsets are FIXED (no daylight-saving adjustment),
    // so DST cities can be ~1h off in summer.
    const _TZ_ZONES = [
        { off: -720, cities: ['Baker Island', 'Howland Island'] },
        { off: -660, cities: ['Niue', 'Samoa', 'Midway Atoll'] },
        { off: -600, cities: ['Honolulu'] },
        { off: -540, cities: ['Anchorage', 'Juneau', 'Fairbanks'] },
        { off: -480, cities: ['Los Angeles', 'Vancouver', 'Seattle', 'San Diego', 'San Jose'] },
        { off: -420, cities: ['Phoenix', 'Denver', 'Mexico', 'Calgary', 'Edmonton'] },
        { off: -360, cities: ['Mexico City', 'Chicago', 'Houston', 'Dallas', 'Monterrey'] },
        { off: -300, cities: ['New York City', 'Toronto', 'Peru', 'Colombia', 'Miami'] },
        { off: -240, cities: ['Chile', 'Venezuela', 'Dominican Republic', 'Cuba', 'Brazil'] },
        { off: -180, cities: ['São Paulo', 'Argentina', 'Uruguay'] },
        { off: -120, cities: ['Nanuk', 'Greenland'] },
        { off: -60,  cities: ['Cape Verde', 'Azores'] },
        { off: 0,    cities: ['United Kingdom', 'Morocco', 'Ireland', 'Ivory Coast', 'Ghana'] },
        { off: 60,   cities: ['DR Congo', 'Nigeria', 'France', 'Germany', 'Spain'] },
        { off: 120,  cities: ['Cairo', 'South Africa', 'Sudan', 'Alexandria', 'Ukraine'] },
        { off: 180,  cities: ['Russia', 'Turkey', 'Saudi Arabia', 'Iraq', 'Kenya'] },
        { off: 210,  cities: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz'] }, // Iran +3:30
        { off: 240,  cities: ['United Arab Emirates', 'Azerbaijan', 'Georgia', 'Armenia', 'Oman'] },
        { off: 270,  cities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad'] },
        { off: 300,  cities: ['Karachi', 'Lahore', 'Uzbekistan', 'Kazakhstan', 'Turkmenistan'] },
        { off: 330,  cities: ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai'] },
        { off: 345,  cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bharatpur', 'Biratnagar'] },
        { off: 360,  cities: ['Dhaka', 'Kazakhstan', 'Kyrgyzstan', 'Chittagong', 'Khulna'] },
        { off: 390,  cities: ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Taunggyi'] },
        { off: 420,  cities: ['Indonesia', 'Thailand', 'Ho Chi Minh City', 'Hanoi', 'Russia'] },
        { off: 480,  cities: ['Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Philippines'] },
        { off: 540,  cities: ['Tokyo', 'South Korea', 'Osaka', 'Nagoya', 'North Korea'] },
        { off: 570,  cities: ['Adelaide', 'Darwin', 'Alice Springs', 'Palmerston', 'Katherine'] },
        { off: 600,  cities: ['Sydney', 'Melbourne', 'Brisbane', 'Russia', 'Papua New Guinea'] },
        { off: 660,  cities: ['New Caledonia', 'Solomon Islands', 'Russia', 'Vanuatu', 'Micronesia'] },
        { off: 720,  cities: ['Auckland', 'Christchurch', 'Wellington', 'Fiji', 'Kiribati'] },
        { off: 765,  cities: ['Chatham Islands'] },
        { off: 780,  cities: ['Tonga', 'Samoa', 'Fakaofo', 'Atafu', 'Nukunonu'] },
        { off: 840,  cities: ['Kiribati'] },
    ];

    let _tzLastFiredKey = '';

    // Cities in every zone currently at local hour 0 (00:00–00:59), deduped.
    function _tzMidnightCities() {
        const now = new Date();
        const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
        const out = [];
        for (const z of _TZ_ZONES) {
            let local = (utcMin + z.off) % 1440;
            if (local < 0) local += 1440;
            if (local < 60) {
                for (const c of z.cities) if (out.indexOf(c) === -1) out.push(c);
            }
        }
        return out;
    }

    // Build the message text that would be posted right now.
    function _tzBuildText() {
        const msg = (settings.hourlyTzMessage || '').trim();
        const cities = _tzMidnightCities();
        let text = cities.length ? ((msg ? msg + ' ' : '') + cities.join(', ')) : msg;
        if (text.length > 290) text = text.slice(0, 287) + '…';
        return text;
    }

    function _tzPostNow() {
        const text = _tzBuildText();
        if (!text) return false;
        const ok = _abForceSend(text);
        if (ok) ptLog('HourlyPost', 'Posted hourly time-zone message.');
        return ok;
    }

    function installHourlyTzPoster() {
        // Check every 20s; the minute==20 window lasts 60s so we never miss it.
        setInterval(() => {
            if (!settings.hourlyTzPost) return;
            const now = new Date();
            if (now.getUTCMinutes() !== 20) return;
            const key = now.getUTCFullYear() + '-' + now.getUTCMonth() + '-' + now.getUTCDate() + '-' + now.getUTCHours();
            if (_tzLastFiredKey === key) return;   // already fired this hour
            _tzLastFiredKey = key;
            try { _tzPostNow(); } catch (e) {}
        }, 20000);
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
            const country = ((data && data.country) || '').toUpperCase();
            if (!u) return;

            const truthy = (v) => v === true || v === 1 || v === '1' || v === 'true';
            const has    = (k) => Object.prototype.hasOwnProperty.call(data, k);

            // Always update OUR OWN mod/model status — gates the "block a mod"
            // checkbox regardless of whether our own account is "tracked".
            const me = detectMyUsername();
            if (me && u === me) {
                let gateChanged = false;
                if (has('isMod')) {
                    const m = truthy(data.isMod);
                    if (m !== !!settings.iAmMod) { saveSetting('iAmMod', m); gateChanged = true; }
                }
                if (has('isModel') || has('isVerified')) {
                    const md = truthy(data.isModel) || truthy(data.isVerified);
                    if (md !== !!settings.iAmModel) { saveSetting('iAmModel', md); gateChanged = true; }
                }
                if (gateChanged) { try { renderPanelLists(); } catch (e) {} }
            }

            // Only store per-user data for accounts we're actively tracking
            // (blocked/ignored tier, favorites, friends). Every user entering the
            // room fires add_user — a busy room has ~16,000 unique accounts. Storing
            // country/type for all of them bloats the database and queues
            // thousands of profile fetches we'll never use.
            const rec = getUser(u);
            if (!(rec.tier || rec.fav || rec.friend)) return;

            const patch = {};
            if (country) patch.country = country;

            // Membership signals from the add_user payload — the most reliable
            // source (the page sends these directly). Fields are mixed types
            // (true / 1 / "0"), so normalise with truthy().
            const isMember = truthy(data.isRegistered) || truthy(data.isVerified) ||
                             truthy(data.isVIP) || truthy(data.isModel) ||
                             truthy(data.isMod) || truthy(data.isKing);
            if (!rec.type) patch.type = isMember ? 'member' : 'guest';
            // If the payload clearly shows guest but we have 'member' stored (stale
            // type from a prior false rename), correct it so purgeGuestTiers catches them.
            if (!isMember && rec.type === 'member') patch.type = 'guest';
            // Guest with a tier in our DB: contamination from a prior false rename.
            // Clear it now so they leave the Ignored/Blocked lists immediately.
            if (!isMember && rec.tier) {
                patch.tier = undefined;
                patch.blockedBy = undefined;
                ptLog('Sync', 'Cleared stale tier from guest "' + u + '" on room entry.');
            }

            // Moderators and models are members but flagged for the mod-blocking
            // rules. add_user is authoritative and self-refreshing for these flags.
            if (has('isMod')) {
                const m = truthy(data.isMod);
                if (m !== !!rec.mod) patch.mod = m;
            }
            if (has('isModel') || has('isVerified')) {
                const md = truthy(data.isModel) || truthy(data.isVerified);
                if (md !== !!rec.model) patch.model = md;
            }

            if (Object.keys(patch).length) { patchUser(u, patch); saveUsersSoon(); }

            // Queue a profile fetch for UID resolution (members only; guests are
            // disposable and need no UID/rename tracking).
            if (!_memberTypeFetched.has(u) && !rec.uid && rec.type !== 'guest') {
                _queue.push(u);
                _drain();
            }
        });
    }
