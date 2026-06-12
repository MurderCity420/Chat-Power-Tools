    // ============================================================
    // KEYBOARD
    // ============================================================
    function installKeyboard() {
        // Alt+1..9 for quick replies (works even from inside the input)
        document.addEventListener('keydown', (e) => {
            if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
            const n = parseInt(e.key, 10);
            if (isNaN(n) || n < 1 || n > 9) return;
            const idx = n - 1;
            if (settings.quickReplies[idx]) {
                e.preventDefault();
                sendChatMessage(settings.quickReplies[idx]);
            }
        });
    }
