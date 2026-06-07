    // ============================================================
    // SMART FONT COLOR CORRECTION
    // ============================================================
    // When enabled, every incoming message's color is checked for contrast
    // against the chat background. Colors with poor contrast are remapped
    // to a safe color that preserves the hue.

    // Parse "#rrggbb" or "#rgb" to {r,g,b} 0-255
    function parseHex(hex) {
        if (!hex) return null;
        let s = String(hex).trim();
        // Handle rgb(r, g, b) format
        const rgbMatch = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
        // Handle hex format
        if (s.startsWith('#')) s = s.slice(1);
        if (s.length === 3) s = s.split('').map(c => c + c).join('');
        if (s.length !== 6) return null;
        const r = parseInt(s.slice(0, 2), 16);
        const g = parseInt(s.slice(2, 4), 16);
        const b = parseInt(s.slice(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
        return { r, g, b };
    }

    function rgbToHex(r, g, b) {
        const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return '#' + h(r) + h(g) + h(b);
    }

    // Convert any color (hex like '#ff8800' or rgb() like 'rgb(255, 136, 0)')
    // to an rgba() string with the given alpha. Returns the original string if
    // we can't parse it (lets CSS just use the color as-is, with no alpha).
    function toRgbaString(color, alpha) {
        if (!color) return color;
        const s = String(color).trim();
        // Try hex first
        const hex = parseHex(s);
        if (hex) return `rgba(${hex.r}, ${hex.g}, ${hex.b}, ${alpha})`;
        // Try rgb(...) / rgba(...) — pull the three numbers out
        const m = s.match(/^rgba?\s*\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/i);
        if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
        return color;
    }

    // Walk every text node inside `root`, and for each text node, replace
    // regex matches with <span class="<className>">match</span>. Skips text
    // inside the username span and other elements we don't want to touch.
    // This preserves smileys (<img>), links, and nested DOM structure.
    function wrapMatchesInTextNodes(root, regex, className) {
        const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'IMG']);
        const SKIP_CLASSES = ['username', 'nick', 'ico_gender', 'pt-kw-hit'];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                // Skip text nodes inside elements we don't want to modify
                let p = node.parentElement;
                while (p && p !== root) {
                    if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
                    if (p.classList) {
                        for (const c of SKIP_CLASSES) {
                            if (p.classList.contains(c)) return NodeFilter.FILTER_REJECT;
                        }
                    }
                    p = p.parentElement;
                }
                return regex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        // Collect first; we'll mutate after to avoid invalidating the walker
        const targets = [];
        let n;
        while ((n = walker.nextNode())) targets.push(n);

        for (const textNode of targets) {
            // Reset regex lastIndex since we used .test() above (sticky/global)
            regex.lastIndex = 0;
            const text = textNode.nodeValue;
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                const span = document.createElement('span');
                span.className = className;
                span.textContent = match[0];
                frag.appendChild(span);
                lastIndex = match.index + match[0].length;
                // Guard: zero-length match means infinite loop
                if (match[0].length === 0) regex.lastIndex++;
            }
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            textNode.parentNode.replaceChild(frag, textNode);
        }
    }

    // Relative luminance per WCAG formula
    function luminance(r, g, b) {
        const norm = (c) => {
            const x = c / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * norm(r) + 0.7152 * norm(g) + 0.0722 * norm(b);
    }

    // Contrast ratio between two luminances per WCAG
    function contrastRatio(L1, L2) {
        const a = Math.max(L1, L2);
        const b = Math.min(L1, L2);
        return (a + 0.05) / (b + 0.05);
    }

    // RGB <-> HSL helpers (so we can adjust lightness while keeping hue)
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s; const l = (max + min) / 2;
        if (max === min) { h = 0; s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    }
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // Detect background luminance of the chat
    let _bgLum = null;
    let _bgIsDark = true;
    let _bgDetectAt = 0;
    function detectChatBackground(force) {
        // Cache for 30 seconds; force re-detect if asked
        const now = Date.now();
        if (!force && _bgLum !== null && (now - _bgDetectAt) < 30000) return;
        const el = document.getElementById('chatText') || document.body;
        if (!el) return;
        // Walk up the tree to find the first non-transparent background
        let cur = el;
        let bgColor = null;
        while (cur && cur !== document.documentElement) {
            const cs = window.getComputedStyle(cur);
            const bg = cs.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                bgColor = bg;
                break;
            }
            cur = cur.parentElement;
        }
        if (!bgColor) return;
        const m = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return;
        const r = +m[1], g = +m[2], b = +m[3];
        _bgLum = luminance(r, g, b);
        _bgIsDark = _bgLum < 0.5;
        _bgDetectAt = now;
    }

    // Given an arbitrary color and the detected background, return a safe color.
    // Keeps the hue and saturation, pushes lightness until contrast >= 5.0.
    function getSafeColor(hexColor) {
        const rgb = parseHex(hexColor);
        if (!rgb) return hexColor;
        detectChatBackground();
        if (_bgLum === null) return hexColor;

        const origLum = luminance(rgb.r, rgb.g, rgb.b);
        const ratio = contrastRatio(origLum, _bgLum);
        if (ratio >= 5.0) return hexColor;

        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        // Grayscale — just flip to a safe neutral
        if (hsl.s < 0.1) {
            return _bgIsDark ? '#e0e0e0' : '#202020';
        }

        let bestColor = hexColor;
        let bestRatio = ratio;

        // Pass 1: march lightness away from background, from current value to 0.95 / 0.05
        const start1 = hsl.l;
        const end1   = _bgIsDark ? 0.95 : 0.05;
        const step1  = _bgIsDark ? 0.02 : -0.02;
        for (let L = start1; _bgIsDark ? L <= end1 : L >= end1; L += step1) {
            const newRgb = hslToRgb(hsl.h, hsl.s, L);
            const newRatio = contrastRatio(luminance(newRgb.r, newRgb.g, newRgb.b), _bgLum);
            if (newRatio > bestRatio) {
                bestRatio = newRatio;
                bestColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
            }
            if (newRatio >= 5.0) return bestColor;
        }

        // Pass 2: try the opposite direction (rare — for cases like medium grey on grey)
        const start2 = hsl.l;
        const end2   = _bgIsDark ? 0.05 : 0.95;
        const step2  = _bgIsDark ? -0.02 : 0.02;
        for (let L = start2; _bgIsDark ? L >= end2 : L <= end2; L += step2) {
            const newRgb = hslToRgb(hsl.h, hsl.s, L);
            const newRatio = contrastRatio(luminance(newRgb.r, newRgb.g, newRgb.b), _bgLum);
            if (newRatio > bestRatio) {
                bestRatio = newRatio;
                bestColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
            }
            if (newRatio >= 5.0) return bestColor;
        }

        return bestColor;
    }
