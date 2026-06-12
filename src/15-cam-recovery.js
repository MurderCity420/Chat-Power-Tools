    // ============================================================
    // CAM RECOVERY — monitor open cams and fix what's actually fixable
    // ============================================================
    //
    // Three observed crash types (from user reports):
    //
    // TYPE 1 — FULL CRASH:
    //   Cam disappears entirely from viewers' screens. Viewers freeze on the
    //   last frame, then the slot empties out. Fix: viewers must close and
    //   reopen the cam. This is the only crash type we can usefully recover
    //   from on the viewer side, and `camAutoRecover` handles it.
    //
    // TYPE 2 — MID-STREAM SPINNER:
    //   A previously-working cam shows a spinning wheel center-screen.
    //   Viewers keep their slot but see nothing. ONLY the broadcaster can
    //   fix this (by bumping their own gear or toggling cam off/on). We
    //   CANNOT fix this from the viewer side — closing & reopening the cam
    //   does NOT help. We do this for our OWN cam via `camAutoFixMyCam`.
    //
    // TYPE 3 — DEAD FROM START:
    //   Viewer opens a cam, gets an empty box with a tiny spinner in the
    //   corner. The cam never starts. The broadcaster doesn't even see the
    //   viewer connect. Fix: broadcaster must toggle cam off and back on.
    //   From the viewer side, we can DETECT this (cam stayed loading past
    //   threshold) and surface a notification — but we can't fix it.
    //
    // STRATEGY:
    //   - Track every cam we see open in _knownCams
    //   - Every camRecoverCheckIntervalMs:
    //     * For each tracked cam, check whether its DOM element still exists
    //     * If gone (Type 1) and auto-recover is on → reopen via Video.viewCamNumber
    //     * If present but .cam_loader has been visible since the cam was opened
    //       (Type 3) → log a notice once, do not retry
    //   - For our own cam, watch #myvideo's currentTime for stalls

    const _knownCams = new Map(); // username -> { slot, slotNum, firstSeenAt, lastSeenAt, loaderEverHidden, deadStartReported }
    const _crashLog = []; // [{ username, type: 'fullcrash'|'deadstart', at: ms }]
    // Usernames the user just intentionally closed. The recovery loop must NOT
    // reopen these. Entries expire after a few seconds so future legitimate
    // crashes of the same person can still be recovered.
    const _intentionallyClosed = new Map(); // username -> expiresAtMs
    const INTENTIONAL_CLOSE_TTL_MS = 30000; // 30s — long enough that we won't reopen what they just closed
    let _camRecoverInterval = null;
    let _closeListenersInstalled = false;
    let _roomChangeObserverInstalled = false;

    // Capture-phase listener: when the user clicks any close-cam button, mark
    // that user as intentionally closed so the recovery loop won't reopen them.
    function installCloseListeners() {
        if (_closeListenersInstalled) return;
        _closeListenersInstalled = true;
        document.addEventListener('click', (e) => {
            const closeBtn = e.target && e.target.closest && e.target.closest('.btn_closeVP');
            if (!closeBtn) return;
            // Figure out which username this close button belongs to.
            // Docked: button has data-cam="N" where N is the slot number, look up cams.obj[N].user.username
            // Floating: button is inside a #vp_<username> container
            let username = null;
            const dataCam = closeBtn.getAttribute('data-cam');
            if (dataCam) {
                try {
                    const slot = parseInt(dataCam, 10);
                    const co = W.cams && W.cams.obj && W.cams.obj[slot];
                    if (co && co.user && co.user.username) username = lc(co.user.username);
                } catch (err) {}
            }
            if (!username) {
                // Floating: walk up to find the #vp_<username> container
                const vp = closeBtn.closest('.c_videop[id^="vp_"]');
                if (vp) username = lc(vp.id.replace(/^vp_/, ''));
            }
            if (username) {
                _intentionallyClosed.set(username, Date.now() + INTENTIONAL_CLOSE_TTL_MS);
                // Also drop from _knownCams so we definitely don't try to reopen
                _knownCams.delete(username);
            }
        }, true); // capture phase, before the site's handlers
    }

    // When the user changes rooms, the chat clears and a new user list loads.
    // Any cams we were tracking from the previous room are now stale — those
    // people aren't in this room, so any "reopen" attempts would fail (or open
    // a cam in a room we can't view, producing the stuck spinner the user
    // reported). Clear the tracking on room change.
    function installRoomChangeObserver() {
        if (_roomChangeObserverInstalled) return;
        // Hook RoomList.gotoRoom / goRoom if present. Both are documented
        // navigation entry points.
        try {
            if (W.RoomList) {
                ['gotoRoom', 'goRoom'].forEach(fn => {
                    if (typeof W.RoomList[fn] === 'function' && !W.RoomList[fn].__ptWrapped) {
                        const orig = W.RoomList[fn];
                        W.RoomList[fn] = function() {
                            // Wipe stale cam tracking BEFORE the room actually changes
                            _knownCams.clear();
                            _intentionallyClosed.clear();
                            console.log('[PowerTools] Room change detected via ' + fn + ' — cleared cam tracking');
                            return orig.apply(this, arguments);
                        };
                        W.RoomList[fn].__ptWrapped = true;
                    }
                });
                _roomChangeObserverInstalled = true;
            }
        } catch (e) {
            console.log('[PowerTools] Room change hook failed:', e);
        }
    }


    // Detect all currently-open cams (docked + floating) from the DOM
    function getOpenCams() {
        const cams = []; // { username, slot, slotNum, loaderVisible, element }

        // Docked cams 1-4: cams.obj[N].user.username is set when active
        try {
            const co = W.cams && W.cams.obj;
            if (co) {
                for (let n = 1; n <= 4; n++) {
                    if (co[n] && co[n].user && co[n].user.username) {
                        const username = co[n].user.username;
                        const el = document.getElementById('camslot_' + n);
                        const loader = el && el.querySelector('.cam_loader');
                        // The site toggles loader visibility with inline style display
                        const loaderVisible = !!(loader && loader.offsetParent !== null);
                        cams.push({
                            username: lc(username),
                            slot: 'docked',
                            slotNum: n,
                            loaderVisible,
                            element: el
                        });
                    }
                }
            }
        } catch (e) {}

        // Floating cams: each is a <div id="vp_<username>" class="c_videop">
        document.querySelectorAll('.c_videop[id^="vp_"]').forEach((vp) => {
            const username = vp.id.replace(/^vp_/, '');
            if (!username) return;
            const loader = vp.querySelector('.cam_loader');
            const loaderVisible = !!(loader && loader.offsetParent !== null);
            cams.push({
                username: lc(username),
                slot: 'floating',
                slotNum: 0,
                loaderVisible,
                element: vp
            });
        });

        return cams;
    }

    function refreshKnownCams() {
        const now = Date.now();
        const open = getOpenCams();
        const seen = new Set();
        for (const c of open) {
            seen.add(c.username);
            const prev = _knownCams.get(c.username);
            if (prev) {
                prev.lastSeenAt = now;
                prev.slot = c.slot;
                prev.slotNum = c.slotNum;
                // Once the loader has been hidden even once, we know the cam
                // actually started streaming. Use this to distinguish Type 1
                // (full crash — was working, then disappeared) from Type 3
                // (dead from start — loader never went away).
                if (!c.loaderVisible) prev.loaderEverHidden = true;
            } else {
                _knownCams.set(c.username, {
                    slot: c.slot,
                    slotNum: c.slotNum,
                    firstSeenAt: now,
                    lastSeenAt: now,
                    loaderEverHidden: !c.loaderVisible,
                    deadStartReported: false
                });
            }
        }
        return { open, seen };
    }

    // Reopen a cam that disappeared. Uses Video.viewCamNumber which verifies
    // _BLOCKED_YOU first; if we're blocked it silently no-ops.
    function reopenCam(username, slotNum) {
        if (!username) return false;
        // Honor explicit user closure — never reopen something they just closed
        const closedExp = _intentionallyClosed.get(username);
        if (closedExp && closedExp > Date.now()) {
            return false;
        }
        // Also check the user is in the CURRENT room's user list. If they're
        // not, the cam is likely stale from a previous room.
        if (W.UserList && W.UserList._USERS && !W.UserList._USERS[username]) {
            // Drop them from tracking so we stop retrying on every tick
            _knownCams.delete(username);
            return false;
        }
        if (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS) && W.Chat._BLOCKED_USERS.indexOf(username) > -1) return false;
        if (W.Chat && Array.isArray(W.Chat._IGNORED_USERS) && W.Chat._IGNORED_USERS.indexOf(username) > -1) return false;
        try {
            if (W.Video && typeof W.Video.viewCamNumber === 'function') {
                W.Video.viewCamNumber(username, slotNum || 0);
                ptLog('Cam', 'Auto-reopened crashed cam "' + username + '" (slot ' + (slotNum || 0) + ').');
                return true;
            }
        } catch (e) {
            ptLog('Cam', 'Reopen failed for "' + username + '": ' + (e && e.message ? e.message : e));
        }
        return false;
    }

    // Periodic cleanup: drop expired entries from _intentionallyClosed so the
    // map doesn't grow forever during a long session.
    function cleanupIntentionalClosed() {
        const now = Date.now();
        for (const [name, exp] of _intentionallyClosed.entries()) {
            if (exp <= now) _intentionallyClosed.delete(name);
        }
    }


    // Click the gear → close it. The site rebuilds your webcam stream when
    // the settings modal opens & closes. Only useful for OUR own cam.
    function bumpOwnWebcamGear() {
        try {
            const gear = document.getElementById('webcamConfigBtn');
            if (!gear) return false;
            gear.click();
            // Give the modal a moment to render, then dismiss it without changes
            setTimeout(() => {
                const cb = document.getElementById('webcamChoose_close') || document.getElementById('close_webcamChoose');
                if (cb) cb.click();
            }, 800);
            ptLog('Cam', 'Auto-fixing own stalled webcam (gear bump).');
            return true;
        } catch (e) {
            ptLog('Cam', 'Gear bump failed: ' + (e && e.message ? e.message : e));
            return false;
        }
    }

    // Detect whether our own broadcast has stalled. Symptoms: publishing is
    // on, but #myvideo.currentTime hasn't advanced for a while.
    let _lastMyCamCurrentTime = 0;
    let _lastMyCamCurrentTimeAt = 0;
    function checkOwnCam() {
        if (!settings.camAutoFixMyCam) return;
        const pub = document.getElementById('publishStreamCheckbox');
        if (!pub || !pub.checked) return; // not publishing → nothing to fix
        const myVideo = document.getElementById('myvideo');
        if (!myVideo) return;
        const now = Date.now();
        const t = myVideo.currentTime;
        if (t !== _lastMyCamCurrentTime) {
            _lastMyCamCurrentTime = t;
            _lastMyCamCurrentTimeAt = now;
            return;
        }
        const threshold = settings.camMyStallThresholdMs || 20000;
        if (_lastMyCamCurrentTimeAt && now - _lastMyCamCurrentTimeAt > threshold) {
            bumpOwnWebcamGear();
            _lastMyCamCurrentTimeAt = now; // avoid immediate retrigger
        }
    }

    // Record a crash event for pattern analysis
    function logCrash(username, type) {
        if (!settings.camLogCrashes) return;
        _crashLog.push({ username, type, at: Date.now() });
        // Cap the log at the most recent 500 events so it doesn't grow unboundedly
        if (_crashLog.length > 500) _crashLog.splice(0, _crashLog.length - 500);
        try {
            GM_setValue('pt_crash_log', JSON.stringify(_crashLog));
        } catch (e) {}
    }

    // Surface a Type 3 (dead from start) notice. We don't auto-fix it but we
    // let the user know the cam likely needs the broadcaster to toggle.
    function reportDeadCam(username) {
        ptLog('Cam', 'Cam dead-from-start: "' + username + '" (broadcaster must toggle cam off/on).');
        // We could also surface a toast in our UI later — for now console is enough
    }

    function tickCamRecovery() {
        cleanupIntentionalClosed();
        const { seen } = refreshKnownCams();
        const now = Date.now();

        // Walk known cams looking for two situations:
        //   (a) Cam is missing from the current open set → Type 1 (full crash)
        //   (b) Cam is present but the loader never hid → Type 3 (dead from start)
        for (const [username, info] of _knownCams.entries()) {
            if (!seen.has(username)) {
                // Type 1 — gone from DOM. Give 4s grace for transient drops.
                if (now - info.lastSeenAt < 4000) continue;
                // Skip if the user manually closed this cam
                const closedExp = _intentionallyClosed.get(username);
                if (closedExp && closedExp > now) {
                    _knownCams.delete(username);
                    continue;
                }
                logCrash(username, 'fullcrash');
                if (settings.camAutoRecover) {
                    reopenCam(username, info.slot === 'docked' ? info.slotNum : 0);
                }
                _knownCams.delete(username);
            } else if (!info.loaderEverHidden && !info.deadStartReported) {
                // Type 3 — the cam slot exists but the loader never went away,
                // meaning the stream never started. We need to wait past the
                // threshold before declaring it dead (so we don't false-positive
                // on a slow-starting stream).
                const ageMs = now - info.firstSeenAt;
                if (ageMs >= (settings.camDeadStartThresholdMs || 20000)) {
                    info.deadStartReported = true;
                    logCrash(username, 'deadstart');
                    if (settings.camDetectDeadStart) reportDeadCam(username);
                }
            }
        }

        checkOwnCam();
    }

    function installCamRecovery() {
        if (_camRecoverInterval) return;
        // Install the click listener for manual cam closes + the room change hook
        installCloseListeners();
        installRoomChangeObserver();
        // Restore prior crash log if any
        try {
            const raw = GM_getValue('pt_crash_log', '[]');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                _crashLog.length = 0;
                _crashLog.push(...parsed);
            }
        } catch (e) {}
        _camRecoverInterval = setInterval(tickCamRecovery, settings.camRecoverCheckIntervalMs || 5000);
        tickCamRecovery();
    }
