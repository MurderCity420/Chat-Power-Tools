    // ============================================================
    // DIAGNOSTIC LOG
    // ============================================================
    // Records Chat Power Tools' OWN actions — syncs, blocks, unblocks, guest
    // sweeps, cam recovery, rename detection, etc. It does NOT log chat
    // messages (that earlier feature was removed; it ate too much storage).
    //
    // One human-readable line per event, single column:
    //   YYYY-MM-DD HH:MM:SS - Module - message
    // Stored in a single GM key with a hidden "<unix_ms>|" prefix so we can
    // prune by age. The prefix is stripped on display/export.
    //
    // Retention: 3 days (older lines pruned on every write). Designed to be
    // copied straight out of the Log tab for diagnostics.

    const DIAG_LOG_KEY      = 'pt_diag_log';
    const DIAG_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
    const DIAG_MAX_BYTES    = 1_000_000;               // ~1 MB hard cap (safety)

    function _diagStamp(ms) {
        const d = new Date(ms);
        const p = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
               ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    // Append one diagnostic entry. `module` is a short tag (e.g. 'Blocks',
    // 'Guests', 'Sync', 'Cam'); `message` is a short human-readable string.
    // Also mirrors to the console so live debugging still works.
    function ptLog(module, message) {
        try {
            const now = Date.now();
            const mod = String(module || 'General');
            const msg = String(message == null ? '' : message).replace(/[\r\n]+/g, ' ');
            try { console.log('[PowerTools][' + mod + '] ' + msg); } catch (e) {}
            const line = now + '|' + _diagStamp(now) + ' - ' + mod + ' - ' + msg + '\n';
            let combined = (GM_getValue(DIAG_LOG_KEY, '') || '') + line;
            combined = pruneOldEntries(combined, now - DIAG_RETENTION_MS);
            // Hard size cap — trim oldest lines if somehow still over.
            while (combined.length > DIAG_MAX_BYTES) {
                const nl = combined.indexOf('\n');
                if (nl === -1) { combined = combined.slice(-DIAG_MAX_BYTES); break; }
                combined = combined.slice(nl + 1);
            }
            GM_setValue(DIAG_LOG_KEY, combined);
        } catch (e) { /* never let logging break a feature */ }
    }

    // Each stored line is "<unix_ms>|<text>". Return everything from the first
    // line whose timestamp is still within the retention window.
    function pruneOldEntries(rawText, cutoffMs) {
        if (!rawText) return '';
        let idx = 0;
        const len = rawText.length;
        while (idx < len) {
            const pipe = rawText.indexOf('|', idx);
            if (pipe === -1) break;
            const ts = parseInt(rawText.slice(idx, pipe), 10);
            if (!isNaN(ts) && ts >= cutoffMs) return rawText.slice(idx);
            const nl = rawText.indexOf('\n', pipe);
            if (nl === -1) return ''; // malformed tail
            idx = nl + 1;
        }
        return '';
    }

    // Display/export text — the hidden "<ms>|" prefix stripped from each line.
    function getDiagLogPretty() {
        let raw = '';
        try { raw = GM_getValue(DIAG_LOG_KEY, '') || ''; } catch (e) { return ''; }
        return raw.replace(/^\d+\|/gm, '');
    }

    function getDiagLogStats() {
        let raw = '';
        try { raw = GM_getValue(DIAG_LOG_KEY, '') || ''; } catch (e) { return { lines: 0, bytes: 0 }; }
        const lines = raw ? (raw.match(/\n/g) || []).length : 0;
        return { lines, bytes: raw.length };
    }

    function clearDiagLog() { try { GM_setValue(DIAG_LOG_KEY, ''); } catch (e) {} }

    // One-time cleanup: delete the old chat-message logs (pt_log_main and
    // pt_log_im_<user>) and the removed pre-wipe chat snapshots — both could be
    // many MB of stored data the current version no longer uses.
    function purgeLegacyChatLogs() {
        try {
            const keys = (typeof GM_listValues === 'function') ? GM_listValues() : [];
            let removed = 0;
            for (const k of keys) {
                if (k === 'pt_log_main' || (typeof k === 'string' && k.indexOf('pt_log_im_') === 0)) {
                    try { GM_deleteValue(k); removed++; } catch (e) {}
                }
            }
            if (removed > 0) ptLog('Init', 'Purged ' + removed + ' legacy chat-log key(s) to free space.');
            // Drop the removed pre-wipe snapshot store, if present.
            try { if (GM_getValue('wipeSnapshots', null) !== null) { GM_deleteValue('wipeSnapshots'); ptLog('Init', 'Removed stored pre-wipe snapshots.'); } } catch (e) {}
        } catch (e) {}
    }
