    // ============================================================
    // INIT
    // ============================================================
    // Fire cb once the user is actually authenticated in chat (W.G.USER.username
    // is set). Account-dependent work — guest sweep, block→ignored sync, blocked
    // backup, profile/friend sync — must wait for this. The chat object exists
    // (waitForChat fires) well before the user logs in; acting then would scrape
    // and delete blocks while not logged into chat. Gives up after 15 min.
    function whenLoggedIn(cb) {
        const start = Date.now();
        const tick = () => {
            let user = '';
            try { user = (W.G && W.G.USER && W.G.USER.username) || ''; } catch (e) {}
            if (user) { try { cb(); } catch (e) { console.error('[PowerTools] whenLoggedIn cb failed', e); } return; }
            if (Date.now() - start > 15 * 60 * 1000) return;
            setTimeout(tick, 1000);
        };
        tick();
    }

    waitForChat(() => {
        try {
            captureOriginals();
            syncIgnoredToChat();
            installHooks();
            applyAllDelays();
            injectStyles();
            buildPanel();
            buildGearAndCounter();
            installHolidayBadge();
            installKeyboard();
            tryInstallSmileyPicker();
            installUserListMarker();
            installUserMenuInjector();
            installFanMailIframeWatcher();
            // Restore the original maxlength in case an earlier version of
            // this script clamped it to 200 — that broke the IM-open path.
            try {
                const inp = W.document.getElementById('input_txt');
                if (inp) inp.setAttribute('maxlength', '300');
            } catch (e) {}
            installCharCounter();
            installScrollLockButton();
            setupScrollLockAutoDisable();
            purgeLegacyChatLogs();
            installWatchingMeFeatures();
            installCamRecovery();
            installSocketEmitLogger();
            installIframeNetworkLogger();
            installAddUserListener();
            installAutoBoom();
            installHourlyTzPoster();
            installCamTemplates();
            // Detect chat background for smart color correction (delay so the
            // chat's own styles have fully applied first)
            setTimeout(detectChatBackground, 1500);
            cleanupDuplicateEntries();
            // Everything below needs the user actually logged into chat — wait
            // for it, then give _BLOCKED_USERS a couple seconds to populate from
            // the socket before the block-list work runs.
            whenLoggedIn(() => {
                try {
                    const hiEl = document.getElementById('pt-hi-user');
                    if (hiEl) hiEl.textContent = 'Hi ' + (detectMyUsername() || '');
                } catch (e) {}
                try { installDefaultGenderFilter(); } catch (e) {}
                // Apply the saved login-default cam template as the live active one.
                try {
                    saveSetting('camTemplateSelectedId', settings.camTemplateDefaultId || '');
                    if (typeof _ctRenderNavDropdown === 'function') _ctRenderNavDropdown();
                    if (settings.camTemplateEnabled && typeof _ctRepackAll === 'function') _ctRepackAll();
                } catch (e) {}
                setTimeout(async () => {
                    installProfileSync();
                    installFirebaseSync();
                    installFriendSync();
                    // Resolve member/guest types for every blocked user BEFORE the
                    // backup/sync runs, so guests are correctly excluded from it.
                    try { await fetchBlocksPageRows(); } catch (e) {}
                    purgeGuestTiers(); // strip any guests already sitting in a tier
                    syncBlockListToIgnored();
                    updateBlockedBackup();
                    // Mod blocks don't persist on the server (for non-mods), so
                    // re-apply them client-side now that we're logged in.
                    reapplyModBlocks();
                    if (settings.autoUnblockGuestBlocks) sweepGuestBlocks();
                    setInterval(syncBlockListToIgnored, 30 * 60 * 1000);
                    setInterval(updateBlockedBackup, 30 * 60 * 1000);
                    // Guest block sweep on its own configurable interval (min 5 min),
                    // (re)started here and whenever the interval setting changes.
                    restartGuestSweepInterval();
                    // Background UID fetch for rename detection: fetch profiles for
                    // all currently-blocked users in batches of 4. fetchMemberType
                    // dedups via _memberTypeFetched (and skips known guests).
                    (async () => {
                        const blocked = (W.Chat && Array.isArray(W.Chat._BLOCKED_USERS))
                            ? W.Chat._BLOCKED_USERS.slice() : [];
                        const total = blocked.length;
                        if (total) setScrapeProgress(0, total, 'Initial scan (blocked users)');
                        for (let i = 0; i < blocked.length; i += 4) {
                            const batch = blocked.slice(i, i + 4);
                            await Promise.all(batch.map((u) => fetchMemberType(lc(u))));
                            if (total) setScrapeProgress(Math.min(i + 4, total), total, 'Initial scan (blocked users)');
                            if (i + 4 < blocked.length) {
                                await new Promise((r) => setTimeout(r, 1000));
                            }
                        }
                        if (total) { setScrapeProgress(total, total, 'Initial scan complete'); setTimeout(() => setScrapeProgress(0, 0, ''), 4000); }
                    })();
                    // Auto Block Ignored: poll every 30s for backed-up users who
                    // re-enter the room but fell off the server block list.
                    setInterval(runAutoBlockIgnored, 30 * 1000);
                }, 2000);
            });
            const _ignoredCount = Object.values(settings.users || {}).filter((d) => d.tier === 'ignored').length;
            ptLog('Init', 'Power Tools loaded. Ignored: ' + _ignoredCount + ', blocked (in-memory): ' +
                ((W.Chat && Array.isArray(W.Chat._BLOCKED_USERS)) ? W.Chat._BLOCKED_USERS.length : 0) + '.');
        } catch (err) {
            console.error('[PowerTools] Init failed', err);
        }
    });
})();