    // ============================================================
    // POST-RENDER DOM WORK
    // ============================================================
    function getLastMessageNode() {
        const container = document.querySelector('#chatText');
        if (!container) return null;
        return container.lastElementChild;
    }

    function markLastMessageHidden(user, reason) {
        const node = getLastMessageNode();
        if (!node) return;
        node.classList.add('pt-hidden');
        node.dataset.ptHiddenReason = reason;
        node.dataset.ptHiddenUser = user || '';
        applyDisplayMode(node);
    }

    function applyDisplayMode(node) {
        node.classList.remove('pt-mode-invisible', 'pt-mode-collapsed', 'pt-mode-blurred');

        if (settings.displayMode === 'invisible') {
            node.classList.add('pt-mode-invisible');
            // Restore original content in case it was previously collapsed
            if (node.dataset.ptOriginalHtml) {
                node.innerHTML = node.dataset.ptOriginalHtml;
                delete node.dataset.ptOriginalHtml;
            }
        } else if (settings.displayMode === 'collapsed') {
            node.classList.add('pt-mode-collapsed');
            // Save the original HTML so we can restore it on reveal
            if (!node.dataset.ptOriginalHtml) {
                node.dataset.ptOriginalHtml = node.innerHTML;
            }
            // Replace the entire content with a placeholder
            const user = node.dataset.ptHiddenUser || 'someone';
            const reason = node.dataset.ptHiddenReason || 'hidden';
            node.innerHTML = '';
            const ph = document.createElement('span');
            ph.className = 'pt-placeholder';
            ph.textContent = `[${reason} from ${user} — click to reveal]`;
            ph.style.cursor = 'pointer';
            ph.addEventListener('click', () => {
                // Restore original content, but keep the message marked so
                // toggling mode later still works.
                if (node.dataset.ptOriginalHtml) {
                    node.innerHTML = node.dataset.ptOriginalHtml;
                    delete node.dataset.ptOriginalHtml;
                }
                node.classList.remove('pt-mode-collapsed');
                node.classList.add('pt-revealed');
            });
            node.appendChild(ph);
        } else if (settings.displayMode === 'blurred') {
            node.classList.add('pt-mode-blurred');
            // Restore original content in case it was previously collapsed
            if (node.dataset.ptOriginalHtml) {
                node.innerHTML = node.dataset.ptOriginalHtml;
                delete node.dataset.ptOriginalHtml;
            }
        }
    }

    function reapplyModeToAllHidden() {
        document.querySelectorAll('#chatText > .pt-hidden').forEach((n) => {
            // If we'd previously collapsed and replaced content, restore first
            // so applyDisplayMode starts from a clean state.
            if (n.dataset.ptOriginalHtml) {
                n.innerHTML = n.dataset.ptOriginalHtml;
                delete n.dataset.ptOriginalHtml;
            }
            n.classList.remove('pt-revealed');
            applyDisplayMode(n);
        });
    }

    function decorateLastMessage(msg) {
        const node = getLastMessageNode();
        if (!node) return;
        const user = lc((msg && (msg.username || msg.userA)) || '');
        if (!user) return;

        // Favorites highlighting
        if (inFavorites(user)) {
            node.classList.add('pt-favorite');
            const style = settings.favoriteStyle || 'subtle';
            node.classList.add('pt-fav-' + style);

            // Color source: 'username' (sender's name color) or 'custom'
            // (user-picked color). We expose the chosen color via
            // a CSS custom property so the existing style classes can use it
            // for borders, backgrounds, and text without separate CSS per source.
            let favColor = '#ffd700'; // default gold
            const src = settings.favoriteColorSource || 'custom';
            if (src === 'username') {
                // Pull the sender's color off the rendered username span.
                // Site puts the color as an inline style on .username or strong > .username.
                const userSpan = node.querySelector('.username, strong .username, .nick');
                if (userSpan) {
                    const inline = userSpan.style && userSpan.style.color;
                    const computed = inline || getComputedStyle(userSpan).color;
                    if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
                        favColor = computed;
                    }
                }
                // As a fallback, the msg.color field is what the site originally used.
                if (favColor === '#ffd700' && msg && typeof msg.color === 'string' && msg.color) {
                    favColor = msg.color;
                }
            } else if (src === 'custom') {
                favColor = getSafeColor(settings.favoriteCustomColor || '#ffd700');
            }
            // Set the CSS variable on the node so style classes pick it up
            node.style.setProperty('--pt-fav-color', favColor);
            // Also compute a translucent version for backgrounds (rgba @ 0.18)
            node.style.setProperty('--pt-fav-color-bg', toRgbaString(favColor, 0.18));
            node.style.setProperty('--pt-fav-color-grad', toRgbaString(favColor, 0.12));
        }

        // Color override and alias from unified user record
        const userRec = getUser(user);
        if (userRec.color) node.style.color = userRec.color;
        if (userRec.alias) {
            const usernameSpan = node.querySelector('.username');
            if (usernameSpan) usernameSpan.textContent = userRec.alias;
        }

        // Mention detection — checks auto-detected username, @username,
        // and any custom mention keywords (nicknames, variations of your name)
        if (msg && typeof msg.message === 'string') {
            const lower = msg.message.toLowerCase();
            const me = detectMyUsername();
            let mentioned = false;
            // Whole-word match: the term must be surrounded by non-alphanumeric
            // chars (or string start/end). This prevents short nicknames like
            // "ag" from matching "agree", "agent", "again", etc.
            // We use a regex with word-boundary anchors (\b) which correctly
            // handles alphanumeric usernames in most cases. For usernames/keywords
            // that end in a digit we add a lookahead as well.
            function matchesWholeWord(text, term) {
                if (!term) return false;
                try {
                    // Escape regex special chars in the term
                    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Require a non-word char (or start) before, and a non-word
                    // char (or end) after. Using (?<!\w) and (?!\w) covers both
                    // alphanumeric and underscore boundaries consistently.
                    const re = new RegExp('(?<![\\w])' + escaped + '(?![\\w])', 'i');
                    return re.test(text);
                } catch (e) {
                    // Fallback to substring if regex fails (shouldn't happen)
                    return text.toLowerCase().includes(term.toLowerCase());
                }
            }
            if (me && user !== me) {
                // @username is always exact, plain username uses whole-word match
                if (lower.includes('@' + me) || matchesWholeWord(lower, me)) {
                    mentioned = true;
                }
            }
            if (!mentioned && settings.mentionKeywords && settings.mentionKeywords.length) {
                for (const kw of settings.mentionKeywords) {
                    if (kw && user !== me && matchesWholeWord(lower, kw)) {
                        mentioned = true;
                        break;
                    }
                }
            }
            if (mentioned && !inAlertsOnly(user)) handleMention(node, user, msg.message);
        }
    }
