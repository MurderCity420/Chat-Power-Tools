    // ============================================================
    // MENTION ALERTS
    // ============================================================
    let mentionAudio = null;
    function ensureMentionAudio() {
        if (mentionAudio) return mentionAudio;
        // Two-note chime via WebAudio. The two notes are E6 and B6 — a perfect
        // fifth — with the second note starting slightly after the first so
        // they ring together briefly. Soft attack and slow exponential decay
        // give it a friendly bell-like quality instead of a flat alert tone.
        try {
            const Ctx = W.AudioContext || W.webkitAudioContext;
            if (!Ctx) return null;
            const ctx = new Ctx();
            // Play one note with an envelope. `delay` is when to start (seconds
            // from now). `freq` is the pitch. `dur` is the total length.
            const playNote = (freq, delay, dur, peakGain) => {
                const now = ctx.currentTime + delay;
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = freq;
                // ADSR-ish: quick attack ramp, exponential decay to near-silence.
                g.gain.setValueAtTime(0.0001, now);
                g.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
                g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
                o.connect(g);
                g.connect(ctx.destination);
                o.start(now);
                o.stop(now + dur + 0.02);
            };
            mentionAudio = () => {
                // Resume context if it was suspended (browsers do this until
                // user interacts with the page; should be fine since the user
                // clicked Preview or actually chatted).
                if (ctx.state === 'suspended') ctx.resume();
                playNote(1318.51, 0,    0.55, 0.14); // E6
                playNote(1975.53, 0.13, 0.55, 0.10); // B6 — starts a bit after for shimmer
            };
            return mentionAudio;
        } catch (e) {
            return null;
        }
    }

    let titleFlashTimer = null;
    const originalTitle = document.title;
    function flashTitle() {
        if (titleFlashTimer) return;
        let on = false;
        const flashLabel = ((W.PT_ICONS && W.PT_ICONS.mentionFlash) || '🔔 Mention!');
        titleFlashTimer = setInterval(() => {
            document.title = on ? originalTitle : flashLabel;
            on = !on;
        }, 1000);
        const stop = () => {
            clearInterval(titleFlashTimer);
            titleFlashTimer = null;
            document.title = originalTitle;
            window.removeEventListener('focus', stop);
            document.removeEventListener('mousemove', stop);
        };
        window.addEventListener('focus', stop, { once: true });
        document.addEventListener('mousemove', stop, { once: true });
    }

    // Fire the same chime + tab flash used for mentions, but standalone
    // (no DOM node to decorate). Used by alertOnRating.
    function fireMentionAlert() {
        if (settings.mentionAlertSound) {
            const play = ensureMentionAudio();
            if (play) try { play(); } catch (e) {}
        }
        if (settings.mentionAlertFlashTitle && document.hidden) {
            flashTitle();
        }
    }

    function handleMention(node, fromUser, text) {
        // Apply the selected mention highlight style (same 4 options as
        // favorites). The base .pt-mention class still applies so any legacy
        // styling continues to work; style classes are layered on top.
        node.classList.add('pt-mention');
        const style = settings.mentionStyle || 'subtle';
        node.classList.add('pt-mention-' + style);

        // Resolve mention color from selected source.
        let mColor = '#ff5050'; // default red
        const src = settings.mentionColorSource || 'custom';
        if (src === 'username') {
            const userSpan = node.querySelector('.username, strong .username, .nick');
            if (userSpan) {
                const inline = userSpan.style && userSpan.style.color;
                const computed = inline || getComputedStyle(userSpan).color;
                if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
                    mColor = computed;
                }
            }
        } else if (src === 'custom') {
            mColor = getSafeColor(settings.mentionCustomColor || '#ff5050');
        }
        node.style.setProperty('--pt-mention-color', mColor);
        node.style.setProperty('--pt-mention-color-bg', toRgbaString(mColor, 0.18));
        node.style.setProperty('--pt-mention-color-grad', toRgbaString(mColor, 0.12));

        fireMentionAlert();
    }
