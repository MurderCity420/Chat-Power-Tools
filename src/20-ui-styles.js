    // ============================================================
    // UI: STYLES
    // ============================================================
    function injectStyles() {
        const css = `
            .pt-hidden { transition: opacity 0.15s; }
            .pt-mode-invisible { display: none !important; }
            .pt-mode-collapsed { padding: 2px 6px; }
            .pt-placeholder {
                color: #888 !important;
                font-style: italic;
                font-size: 0.9em;
            }
            .pt-mode-blurred {
                filter: blur(6px);
                opacity: 0.4;
                transition: filter 0.2s, opacity 0.2s;
            }
            .pt-mode-blurred:hover { filter: blur(0); opacity: 1; }

            /* Favorite users — four styles, applied via classes.
             * Color is provided via the --pt-fav-color CSS variable, set on
             * the message node when it's rendered. Falls back to gold defaults
             * so the styles still work even if the variable isn't set. */
            /* Subtle: faint left border + gradient background. Username color
             * is intentionally NOT overridden — the user's chosen text color
             * (and our smart contrast correction, if enabled) decide that. */
            .pt-favorite.pt-fav-subtle {
                background: linear-gradient(90deg, var(--pt-fav-color-grad, rgba(255, 215, 50, 0.12)), transparent 70%);
                border-left: 3px solid var(--pt-fav-color, gold);
                padding-left: 4px !important;
            }
            .pt-favorite.pt-fav-highlight {
                background: var(--pt-fav-color-bg, rgba(255, 235, 50, 0.25)) !important;
                padding-left: 4px !important;
                padding-right: 4px !important;
            }
            /* Bold: bold the username/message text. Username color is overridden
             * to the chosen color so the name stands out. */
            .pt-favorite.pt-fav-bold {
                font-weight: bold !important;
            }
            .pt-favorite.pt-fav-bold .username,
            .pt-favorite.pt-fav-bold strong {
                font-weight: 900 !important;
                color: var(--pt-fav-color, gold) !important;
            }
            .pt-favorite.pt-fav-box {
                border: 2px solid var(--pt-fav-color, #f44) !important;
                border-radius: 4px !important;
                padding: 2px 4px !important;
                margin: 2px 0 !important;
            }

            /* Mention highlighting — same 4 styles as favorites.
             * Applied via .pt-mention-{style} on top of the base .pt-mention.
             * Color is provided via the --pt-mention-color CSS variable. */
            .pt-mention.pt-mention-subtle {
                background: linear-gradient(90deg, var(--pt-mention-color-grad, rgba(255, 80, 80, 0.12)), transparent 70%) !important;
                border-left: 3px solid var(--pt-mention-color, #ff5050) !important;
                padding-left: 4px !important;
            }
            .pt-mention.pt-mention-highlight {
                background: var(--pt-mention-color-bg, rgba(255, 80, 80, 0.25)) !important;
                padding-left: 4px !important;
                padding-right: 4px !important;
                border-left: none !important;
            }
            .pt-mention.pt-mention-bold {
                font-weight: bold !important;
                background: transparent !important;
                border-left: none !important;
            }
            .pt-mention.pt-mention-bold .username,
            .pt-mention.pt-mention-bold strong {
                font-weight: 900 !important;
                color: var(--pt-mention-color, #ff5050) !important;
            }
            .pt-mention.pt-mention-box {
                border: 2px solid var(--pt-mention-color, #ff5050) !important;
                border-left-width: 2px !important;
                border-radius: 4px !important;
                padding: 2px 4px !important;
                margin: 2px 0 !important;
                background: transparent !important;
            }
            /* Legacy .pt-mention base style — kept as a fallback only if no
             * style variant is applied. Variants above all override these. */
            .pt-mention {
                background: rgba(255, 80, 80, 0.18);
                border-left: 3px solid #ff5050;
                padding-left: 4px;
            }

            /* Nav-bar gear button — sits next to existing nav items */
            /* Holiday easter-egg badge — sits to the LEFT of the green shield */
            #nav_chatTop li#pt-holiday-nav {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                position: relative;
                top: 3px;
                right: 10px;
                margin-right: 4px;
            }
            #nav_chatTop li#pt-holiday-nav > span {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                user-select: none;
                font-size: 22px;
                line-height: 1;
            }
            /* Disabled state: greyed out */
            #nav_chatTop li#pt-holiday-nav.pt-holiday-disabled > span {
                opacity: 0.55;
                filter: grayscale(0.6);
                transition: opacity 0.2s, filter 0.2s;
            }
            #nav_chatTop li#pt-holiday-nav.pt-holiday-disabled > span:hover {
                opacity: 0.75;
            }
            /* Tooltip for holiday badge */
            #pt-holiday-tip {
                position: fixed;
                z-index: 9999999;
                background: #1e1e1e;
                border: 1px solid #555;
                border-radius: 8px;
                padding: 12px 14px;
                max-width: 340px;
                font-size: 13px;
                color: #ddd;
                box-shadow: 0 4px 16px rgba(0,0,0,0.6);
                display: none;
                pointer-events: auto;
            }
            #pt-holiday-tip.pt-htip-visible { display: block; }
            .pt-htip-title {
                font-weight: bold;
                font-size: 15px;
                line-height: 1.4;
                margin-bottom: 8px;
                color: #eee;
            }
            .pt-htip-desc {
                line-height: 1.5;
                margin-bottom: 10px;
                color: #bbb;
            }
            .pt-htip-footer {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 10px;
            }
            .pt-htip-wiki {
                color: #8af;
                text-decoration: none;
                font-size: 13px;
            }
            .pt-htip-wiki:hover { text-decoration: underline; }
            #pt-holiday-tip button {
                background: #333;
                border: 1px solid #555;
                color: #aaa;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
            }
            #pt-holiday-tip button:hover { background: #444; color: #eee; }
            #nav_chatTop li#pt-gear-nav {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            #nav_chatTop li#pt-gear-nav > span {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                user-select: none;
                color: #7fff7f !important;
            }
            /* Shield ~4px taller than the site's nav icons. !important beats Font
               Awesome's own .fa font-size; aspect ratio is intrinsic to the glyph. */
            #nav_chatTop li#pt-gear-nav .fa { font-size: 22px !important; }
            #nav_chatTop li#pt-gear-nav > span:hover {
                color: #aaffaa !important;
            }
            #nav_chatTop li#pt-gear-nav .fa {
                color: #7fff7f !important;
            }
            #nav_chatTop li#pt-gear-nav:hover .fa {
                color: #aaffaa !important;
            }
            /* Floating fallback gear, in case the nav bar is missing */
            #pt-gear-floating {
                position: fixed;
                bottom: 10px;
                right: 10px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #333;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 999999;
                font-size: 18px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                user-select: none;
            }
            #pt-gear-floating:hover { background: #555; }
            #pt-panel {
                position: fixed;
                top: 5%;
                right: calc(5% + 115px);
                width: 500px;
                max-height: 90vh;
                background: #1e1e1e;
                color: #ddd;
                border: 1px solid #444;
                border-radius: 6px;
                z-index: 999998;
                display: none;
                flex-direction: column;
                font-family: system-ui, sans-serif;
                font-size: 13px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            }
            #pt-panel.open { display: flex; }
            #pt-panel header {
                padding: 8px 12px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #pt-panel header .pt-close {
                cursor: pointer;
                color: #aaa;
                font-size: 18px;
                padding: 0 6px;
            }
            #pt-panel header .pt-close:hover { color: white; }
            /* "Set up backup" reminder chip in the header, right of the title.
               margin-right:auto pushes the close button to the far right. */
            #pt-backup-warn {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-left: 10px;
                font-weight: normal;
                font-size: 11px;
                background: rgba(255, 170, 40, 0.16);
                border: 1px solid rgba(255, 170, 40, 0.5);
                border-radius: 4px;
                padding: 2px 6px;
                animation: pt-backup-pulse 2s ease-in-out infinite;
            }
            #pt-backup-warn a {
                color: #ffce6b;
                text-decoration: none;
                cursor: pointer;
            }
            #pt-backup-warn a:hover { text-decoration: underline; color: #ffe0a0; }
            #pt-backup-done {
                cursor: pointer;
                color: #9f9;
                font-weight: bold;
                white-space: nowrap;
                padding-left: 6px;
                border-left: 1px solid rgba(255, 170, 40, 0.4);
            }
            #pt-backup-done:hover { color: #cfc; }
            @keyframes pt-backup-pulse {
                0%, 100% { border-color: rgba(255, 170, 40, 0.5); }
                50% { border-color: rgba(255, 170, 40, 0.95); }
            }
            /* Docs button shown in the header once backup is set up.
               margin-right:auto pushes the close button to the far right. */
            #pt-docs-link {
                margin-left: 10px;
                font-weight: normal;
                font-size: 11px;
                color: #8fd0ff;
                text-decoration: none;
                background: rgba(90, 160, 255, 0.14);
                border: 1px solid rgba(90, 160, 255, 0.4);
                border-radius: 4px;
                padding: 2px 8px;
                cursor: pointer;
            }
            #pt-docs-link:hover {
                color: #bfe3ff;
                border-color: rgba(90, 160, 255, 0.8);
                text-decoration: none;
            }
            #pt-version {
                margin-left: 8px;
                margin-right: auto;
                font-weight: normal;
                font-size: 11px;
                color: #888;
            }
            .pt-tabrow { display: flex; align-items: stretch; background: #252525; border-bottom: 1px solid #444; flex-shrink: 0; }
            .pt-tabscroll-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #252525;
                border: none;
                color: #888;
                padding: 0 7px;
                font-size: 18px;
                cursor: pointer;
                flex-shrink: 0;
                user-select: none;
                transition: color 0.15s, background 0.15s;
            }
            .pt-tabscroll-btn:hover { color: white; background: #333; }
            #pt-tabs { display: flex; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
            #pt-tabs::-webkit-scrollbar { display: none; }
            #pt-tabs button {
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                height: 40px;
                background: none;
                border: none;
                color: #aaa;
                padding: 0 8px;
                cursor: pointer;
                font-size: 12px;
                border-bottom: 2px solid transparent;
                white-space: nowrap;
            }
            #pt-tabs button.active { color: white; border-bottom-color: #5af; background: #2e2e2e; }
            #pt-tabs button:hover { color: white; }
            #pt-body { overflow-y: auto; overflow-x: hidden; padding: 12px; flex: 1; }
            .pt-section { margin-bottom: 14px; }
            .pt-section h3 {
                margin: 0 0 6px 0;
                font-size: 12px;
                text-transform: uppercase;
                color: #8af;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            /* Checkbox placed inside an h3 (header-checkbox pattern) */
            .pt-header-checkbox {
                transform: scale(1.1);
                margin: 0;
                flex-shrink: 0;
                cursor: pointer;
            }
            /* Label inside h3 inherits heading style but is clickable */
            .pt-section h3 label {
                cursor: pointer;
                font-size: inherit;
                color: inherit;
                letter-spacing: inherit;
                text-transform: inherit;
                margin: 0;
            }
            /* Sub-item heading inside a grouped section — smaller, white, no caps */
            .pt-subheading {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 600;
                color: #ddd;
                text-transform: none;
                letter-spacing: 0;
                margin: 8px 0 2px 0;
                padding-left: 2px;
            }
            .pt-subheading label {
                cursor: pointer;
                font-size: inherit;
                color: inherit;
                font-weight: inherit;
                margin: 0;
            }
            .pt-subheading:first-child { margin-top: 2px; }
            .pt-row { display: flex; gap: 6px; margin-bottom: 6px; }
            .pt-row input[type=text], .pt-row select {
                flex: 1;
                background: #111;
                color: #eee;
                border: 1px solid #444;
                padding: 4px 6px;
                border-radius: 3px;
            }
            .pt-row button {
                background: #444;
                color: #fff;
                border: 1px solid #555;
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            .pt-row button:hover { background: #5a5a5a; }
            /* Firebase credential fields: label pinned left, equal-width input
               pinned to the right edge, with breathing room between rows. */
            .pt-fb-field {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 12px;
            }
            .pt-fb-field label {
                color: #ccc;
                white-space: nowrap;
                flex: 0 0 auto;
            }
            .pt-fb-field input {
                flex: 1;
                min-width: 0;
                box-sizing: border-box;
                background: #111;
                color: #eee;
                border: 1px solid #444;
                padding: 5px 8px;
                border-radius: 3px;
            }
            .pt-list {
                list-style: none;
                padding: 0;
                margin: 0;
                max-height: 180px;
                overflow-y: auto;
                background: #161616;
                border: 1px solid #333;
                border-radius: 3px;
            }
            .pt-list li {
                padding: 4px 8px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #222;
                gap: 6px;
            }
            .pt-list li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
            .pt-list li:last-child { border-bottom: none; }
            .pt-list li .pt-btn-group { display: flex; gap: 4px; flex-shrink: 0; }
            .pt-list li button {
                background: #722;
                color: #fff;
                border: none;
                padding: 1px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
            }
            .pt-list li button:hover { background: #c33; }
            .pt-empty { color: #666; font-style: italic; padding: 8px; }

            /* Fan Mail */
            .pt-btn-primary {
                background: #2c5aa0;
                color: #fff;
                border: 1px solid #4a78c0;
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            .pt-btn-primary:hover { background: #3870c0; }
            .pt-fm-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            /* Tier table on the Ignored tab (Name | Alerts | Ignored | Blocked | Remove) */
            .pt-tier-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            .pt-tier-table th {
                background: #222;
                color: #aaa;
                padding: 4px 6px;
                border-bottom: 1px solid #333;
                font-weight: 600;
                font-size: 11px;
                text-align: center;
                white-space: nowrap;
            }
            .pt-tier-table td {
                padding: 3px 6px;
                border-bottom: 1px solid #1e1e1e;
                vertical-align: middle;
            }
            .pt-tier-table tbody tr:hover { background: #1a1a1a; }
            .pt-tier-table input[type="checkbox"] { transform: scale(1.1); }
            .pt-tier-table button {
                background: #722;
                color: #fff;
                border: none;
                padding: 2px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                white-space: nowrap;
            }
            .pt-tier-table button:hover { background: #c33; }
            .pt-tier-table .pt-empty {
                color: #666;
                font-style: italic;
                text-align: center;
                padding: 8px;
            }
            .pt-fm-table th {
                background: #222;
                color: #aaa;
                padding: 4px 6px;
                border-bottom: 1px solid #333;
                font-weight: normal;
            }
            .pt-fm-table tbody tr { border-bottom: 1px solid #222; }
            .pt-fm-table tbody tr:hover { background: #1a1a1a; }
            .pt-fm-table button {
                background: #444;
                color: #fff;
                border: 1px solid #555;
                width: 24px;
                height: 22px;
                padding: 0;
                margin-left: 2px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                line-height: 1;
            }
            .pt-fm-table button:hover:not([disabled]) { background: #666; }
            .pt-fm-table button[disabled] { opacity: 0.3; cursor: not-allowed; }

            /* Modal */
            .pt-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pt-modal {
                background: #1a1a1a;
                border: 1px solid #444;
                border-radius: 6px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6);
                max-width: 90vw;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
            }
            .pt-modal-header {
                background: #2c5aa0;
                color: #fff;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 6px 6px 0 0;
                font-weight: bold;
            }
            .pt-modal-header button {
                background: transparent;
                color: #fff;
                border: none;
                font-size: 20px;
                cursor: pointer;
                line-height: 1;
                padding: 0 4px;
            }
            .pt-modal-body {
                padding: 16px;
                overflow-y: auto;
                color: #ddd;
            }
            .pt-modal-body input[type="text"], .pt-modal-body textarea, .pt-modal-body select {
                background: #111;
                color: #eee;
                border: 1px solid #444;
                padding: 4px 6px;
                border-radius: 3px;
                font-size: 12px;
                font-family: inherit;
            }
            .pt-modal-footer {
                padding: 8px 12px;
                background: #111;
                border-top: 1px solid #333;
                text-align: right;
                border-radius: 0 0 6px 6px;
            }
            .pt-modal-footer button {
                background: #444;
                color: #fff;
                border: 1px solid #555;
                padding: 6px 14px;
                border-radius: 3px;
                cursor: pointer;
                margin-left: 6px;
            }
            .pt-modal-footer button:hover { background: #666; }
            .pt-modal-footer button.pt-btn-primary:hover { background: #3870c0; }

            .pt-toggle { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
            .pt-toggle input { transform: scale(1.1); }
            .pt-tabpane { display: none; position: relative; }
            .pt-tabpane.active { display: block; }
            /* Two-pane Blocks layout — only takes effect when the pane is BOTH
               .pt-pane-flex AND .active, so it won't bleed into other tabs. */
            .pt-tabpane.pt-pane-flex.active {
                display: flex !important;
                flex-direction: column;
                height: 100%;
            }
            #pt-blockedyou-list {
                max-height: 300px;
                overflow-y: auto;
                background: #161616;
                border: 1px solid #333;
                border-radius: 3px;
                padding: 8px;
                font-family: monospace;
                font-size: 12px;
                white-space: pre-wrap;
            }
            /* Membership badge shown before a username in the Blocks lists.
               Self-contained pill — does not depend on the site's badge images. */
            /* Membership badge — the site's own icon images (guest / registered / mod). */
            .pt-member-badge {
                width: 16px;
                height: 16px;
                object-fit: contain;
                vertical-align: middle;
                margin-right: 5px;
                flex-shrink: 0;
            }
            /* Clickable username → opens the profile in a new tab. */
            .pt-name-link { color: inherit; text-decoration: none; cursor: pointer; }
            .pt-name-link:hover { text-decoration: underline; }
            /* Allow highlighting + Ctrl+C of names in the lists/tables. The host
               site sets user-select:none on containers we inherit from, and <a>
               elements drag by default — both block selection. Force text
               selection on the list/table content and stop links from dragging. */
            .pt-list, .pt-list li, .pt-list li span, .pt-name-link,
            .pt-tier-table, .pt-tier-table td {
                -webkit-user-select: text;
                -moz-user-select: text;
                user-select: text;
            }
            .pt-name-link { -webkit-user-drag: none; }
            /* Clickable filter headers / legend items */
            .pt-igfilter:hover, .pt-favfilter:hover { filter: brightness(1.25); }

            /* Modern smiley picker */
            #pt-smileypicker {
                position: fixed;
                bottom: 30px;
                right: 200px;
                width: 330px;
                height: 350px;
                background: #1e1e1e;
                border: 1px solid #444;
                border-radius: 6px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                display: none;
                flex-direction: column;
                z-index: 999998;
                color: #ddd;
                font-family: system-ui, sans-serif;
                overflow: hidden;
            }
            #pt-smileypicker.open { display: flex; }
            #pt-sp-header {
                display: flex;
                align-items: center;
                padding: 6px 10px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
                border-radius: 6px 6px 0 0;
                gap: 8px;
                flex-shrink: 0;
            }
            #pt-sp-header input {
                flex: 1;
                min-width: 0;
                background: #111;
                color: #eee;
                border: 1px solid #444;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
            }
            #pt-sp-close {
                cursor: pointer;
                color: #aaa;
                font-size: 18px;
                padding: 0 6px;
                flex-shrink: 0;
            }
            #pt-sp-close:hover { color: white; }
            #pt-sp-tabs {
                display: flex;
                flex-wrap: nowrap;
                overflow-x: auto;
                scrollbar-width: none;
                flex: 1;
                min-width: 0;
                padding: 2px;
            }
            #pt-sp-tabs::-webkit-scrollbar { display: none; }
            .pt-sp-tab {
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 35px;
                height: 35px;
                background: none;
                border: none;
                color: #aaa;
                padding: 0;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
                border-radius: 3px;
                margin: 1px;
                white-space: nowrap;
                filter: grayscale(0.3) opacity(0.7);
                transition: filter 0.15s, background 0.15s;
            }
            .pt-sp-tab.active {
                background: #444;
                filter: grayscale(0) opacity(1);
            }
            .pt-sp-tab:hover {
                background: #3a3a3a;
                filter: grayscale(0) opacity(1);
            }
            #pt-sp-grid {
                padding: 8px;
                overflow-y: auto;
                overflow-x: hidden;
                flex: 1;
                min-height: 0;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                align-content: start;
                align-items: flex-start;
                background: #161616;
                border-radius: 0 0 6px 6px;
            }
            #pt-sp-grid img {
                width: auto;
                height: auto;
                cursor: pointer;
                border-radius: 3px;
                padding: 2px;
                background: transparent;
            }
            #pt-sp-grid img:hover {
                background: #333;
                outline: 1px solid #5af;
            }

            /* Info icon with hover tooltip */
            .pt-info {
                display: inline-block;
                width: 14px;
                height: 14px;
                line-height: 14px;
                text-align: center;
                font-size: 10px;
                font-weight: bold;
                background: #555;
                color: #fff;
                border-radius: 50%;
                margin-left: 6px;
                cursor: help;
                position: relative;
                vertical-align: middle;
                font-family: serif;
            }
            .pt-info:hover { background: #5af; }
            .pt-info::after {
                content: attr(data-tip);
                position: absolute;
                bottom: 100%;
                left: 0;
                transform: translateX(-50%);
                margin-left: 7px;
                margin-bottom: 6px;
                background: #000;
                color: #fff;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 11px;
                font-family: system-ui, sans-serif;
                font-weight: normal;
                line-height: 1.4;
                white-space: normal;
                width: 240px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.6);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s;
                z-index: 1000000;
                text-align: left;
            }
            .pt-info:hover::after { opacity: 1; }
            a.pt-info { text-decoration: none; cursor: pointer; }
            a.pt-tab-doc-link {
                position: absolute;
                top: 4px;
                right: 8px;
                font-size: 16px;
                text-decoration: none;
                opacity: 0.4;
                line-height: 1;
                z-index: 10;
            }
            a.pt-tab-doc-link:hover { opacity: 1; }

            /* Mark ignored users in the user list with an orange strikethrough */
            .c_nickname.pt-ignored .nick {
                text-decoration: line-through;
                text-decoration-color: #ff8800;
                text-decoration-thickness: 2px;
                color: #ff8800 !important;
                opacity: 0.7;
            }

            /* When an ignored user is hovered in the user list, suppress the
             * webcam pop-out buttons (1/2/3/4) that the site auto-inserts.
             * The row that contains them lives at the row level keyed by
             * username, so we hide any .c_webcamButtons whose row contains
             * a .c_nickname.pt-ignored child. CSS :has() handles this cleanly
             * in modern browsers; for safety we also have a JS fallback that
             * runs from the user-list MutationObserver. */
            [username]:has(.c_nickname.pt-ignored) .c_webcamButtons,
            [username]:has(.c_nickname.pt-ignored) .smallWebcamBtn {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
            }

            /* Disabled items inside an ignored user's menu — grayed,
             * strikethrough, no hover highlight. Click handlers are also
             * blocked in JS via capture-phase listeners. */
            .c_userMenu li.pt-menu-disabled,
            .c_userMenu .pt-menu-disabled {
                color: #666 !important;
                opacity: 0.4 !important;
                text-decoration: line-through !important;
                pointer-events: none !important; /* belt + braces in case the JS swallow somehow misses */
                cursor: not-allowed !important;
                filter: grayscale(1);
            }
            .c_userMenu li.pt-menu-disabled:hover,
            .c_userMenu .pt-menu-disabled:hover {
                background: transparent !important;
            }

            /* Ignore/Unignore menu items injected into the user menu.
             * No padding override — we inherit from the site's own .c_userMenu li
             * styles so spacing matches the rest of the menu (BLOCK, REPORT, etc.). */
            .c_userMenu .pt-ignore-item,
            .c_userMenu .pt-unignore-item {
                cursor: pointer;
                color: #ff8800 !important;
            }
            .c_userMenu .pt-ignore-item:hover,
            .c_userMenu .pt-unignore-item:hover {
                background: rgba(255, 136, 0, 0.2);
            }
            /* Favorite/Unfavorite menu items — same as above */
            .c_userMenu .pt-favorite-item,
            .c_userMenu .pt-unfavorite-item {
                cursor: pointer;
                color: gold !important;
            }
            .c_userMenu .pt-favorite-item:hover,
            .c_userMenu .pt-unfavorite-item:hover {
                background: rgba(255, 215, 0, 0.2);
            }

            /* Character counter — sits just left of the smiley button, looks like a small badge */
            .pt-charcount {
                position: absolute;
                color: #aaa;
                font-size: 11px;
                font-family: monospace;
                font-weight: bold;
                pointer-events: none;
                background: rgba(0, 0, 0, 0.35);
                padding: 2px 6px;
                border-radius: 3px;
                z-index: 100;
                line-height: 18px;
                min-width: 26px;
                text-align: center;
            }
            .pt-charcount.warn { color: #fa3; background: rgba(80, 50, 0, 0.5); }
            .pt-charcount.danger { color: #fff; background: #c33; }

            /* Floating "new messages" button when scrolled away from bottom under scroll lock */
            .pt-newmsg-btn {
                position: absolute;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #5af;
                color: white;
                display: none;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                animation: pt-newmsg-pulse 1.5s ease-in-out infinite;
                font-size: 16px;
                user-select: none;
            }
            .pt-newmsg-btn.show { display: flex; }
            .pt-newmsg-btn:hover {
                background: #3af;
                animation: none;
            }
            @keyframes pt-newmsg-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        const style = document.createElement('style');
        style.id = 'pt-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

