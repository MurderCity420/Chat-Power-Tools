    // ============================================================
    // SMILEY CATEGORIES — used by the modern picker
    // ============================================================
    // Smileys not in any category fall into "Other" automatically.
    // Emoji icon for each category — used as the tab label so they fit on one row
    const SMILEY_CATEGORY_ICONS = {
        'Faces': '😀',
        'Girl': '👧',
        'Actions': '😲',
        'Hello & Goodbye': '👋',
        'Music': '💃',
        'Love & Kisses': '❤️',
        'Naughty': '🍌',
        'Animals': '🐷',
        'Food & Drink': '🍕',
        'Holidays': '🎂',
        'Other': '❓'
    };

    // Note: a smiley can only appear in ONE category (the first one that lists
    // it wins, since categorizeSmileys uses a "seen" set). Order matters.
    // The Girl tab specifically holds smileys with female-coded characters.
    // Anything smoking/weed-related goes in Other per user request.
    const SMILEY_CATEGORIES = {
        'Faces': [
            'angel','blush','blink','boohoo','bored','chuckle','confused','cool','cry',
            'curious','devil','dizzy','dream','drool','envy','evil','evilgrin',
            'eyeroll','facepalm','geek','grin','haha','hehe','lmfao',
            'mmm','nerd','no','ok','omg','phew','rofl','sad',
            'sarcasm','shy','shydevil','sir','smirk','smile','sneaky','sob','sorry','speechless',
            'surprise','sweat','tired','wink','yes'
        ],
        'Girl': [
            'cheer','crush','cutie','giggle','girlblush','girlscared','girlsmitten','girlwink',
            'happy','higirl','hotgirl','hugs','knitting','ohmy','sexytoast'
        ],
        'Hello & Goodbye': [
            'bow','brb','bye','dontgo','fistbump','hey','heyhey','hi','hi5',
            'highfive','hithere','howdy','kowtow','peace','salute','wave'
        ],
        'Love & Kisses': [
            'blowkiss','cuddle','cupid','flower','flowers','frenchkiss','gift',
            'giveheart','glitter','grouphug','heart','heart4u','heartbeat','heartbeatpink','hearteyes',
            'heartpink','hearts','hearts4u','hug','ily','inlove','kiss','kisshand','kisses',
            'lips','love','lovedreams','lucky','mmmuah','muah','prideheart','smitten',
            'smooch','sneaky','snuggle','takemyhand','xoxo'
        ],
        'Actions': [
            'awesome','bravo','cheers','chillin','clap','dancing','ecstatic','gaze',
            'headspin','hide','hot','hurray','idk','innocent','jig','jump',
            'livid','loco','lol','ohno','party','pray',
            'proud','run','scared','scooter',
            'shades','shop','shower','shrug','soccer','sweating','thumbsup','thumbup',
            'unibrow','wacko','whisper','worship','woohoo','yesmaster','yoyo'
        ],
        'Music': [
            'banana','bananalick','bananajam','dance','dancer','drummer','getdown','gogogirl',
            'imcool','joy','maid','music','oohyeah','rockin','rocker','rockon','serenade','spin','swag','violin'
        ],
        'Naughty': [
            '69','ass','asskiss','assshake','blowjob','boobdance','boobshake','boobs',
            'bounce','butt','buttshake','climax','cumming','cumshot','devilwhip','doggy',
            'erection','facial','flash','flasher','flashslow','flashtongue','getiton',
            'godown','handcuffs','hitit','hump','jackoff','juggs','kinkycat','kissass',
            'lick','lickboob','load','moon','naughty','ohyeah',
            'paddle','pinch','play','rideme','sex','sexyass','sexy','sexywink',
            'showboobs','suckshoe','swallow','spank','spanking','stroke',
            'threesome','tickle','tits','tongue','topoff','vibrator','wank',
            'whip',
        ],
        'Animals': [
            'bear','bee','cat','chicken','cock','dancingbear','dog','doglick','fetch',
            'fish','goodkitty','kitten','kitty','meow','pug','spider'
        ],
        'Food & Drink': [
            'bacon','beer','blowcandle','cake','champagne','drink','drunk','girltoast',
            'icecream','pizza','popcorn','prost','toast','yum','yummy'
        ],
        'Holidays': [
            'bday','birthday','christmas','crown','happybday','holloween','pride','spooky',
            'witch'
        ],
        'Other': [
            'boom','cig','cigar','cowboy','diamond','fire','imsorry','jewel',
            'lucifer','makeitrain','money','muscle','ohya','oz','rain','raindrop',
            'smoke','star','thanks','tip','yay'
        ]
    };

    function categorizeSmileys(allCodes) {
        // Build map: code -> category. Process all named categories first
        // (except Other, which we save for last).
        const out = {};
        const seen = new Set();
        const orderedCats = Object.keys(SMILEY_CATEGORIES).filter((c) => c !== 'Other');

        for (const cat of orderedCats) {
            out[cat] = [];
            for (const code of SMILEY_CATEGORIES[cat]) {
                if (allCodes.has(code) && !seen.has(code)) {
                    out[cat].push(code);
                    seen.add(code);
                }
            }
        }

        // Other = anything left over PLUS anything explicitly listed in Other.
        // This guarantees no smiley is dropped.
        out['Other'] = [];
        // First the explicit Other list
        if (SMILEY_CATEGORIES['Other']) {
            for (const code of SMILEY_CATEGORIES['Other']) {
                if (allCodes.has(code) && !seen.has(code)) {
                    out['Other'].push(code);
                    seen.add(code);
                }
            }
        }
        // Then everything else that wasn't categorized at all
        for (const code of allCodes) {
            if (!seen.has(code)) {
                out['Other'].push(code);
                seen.add(code);
            }
        }

        // Sort each category alphabetically
        for (const k of Object.keys(out)) out[k].sort();
        // Drop empty categories (keep Other even if empty so the tab order is stable)
        for (const k of Object.keys(out)) {
            if (out[k].length === 0 && k !== 'Other') delete out[k];
        }
        // Drop Other only if truly empty
        if (out['Other'].length === 0) delete out['Other'];

        return out;
    }

    function extractSmileyCodes() {
        // Pull all smiley codes from Chat._EMOTES_POPPED if available.
        // The string contains <img src='...{name}.gif'> tokens per line.
        const set = new Set();
        try {
            const src = W.Chat._EMOTES_POPPED || '';
            const re = /\{([^}]+)\}/g;
            let m;
            while ((m = re.exec(src)) !== null) {
                set.add(m[1]);
            }
        } catch (e) {}
        // Fallback: scan the existing #c_smileys_img DOM
        if (set.size === 0) {
            const imgs = document.querySelectorAll('#c_smileys_img img');
            imgs.forEach((img) => {
                const t = img.getAttribute('title') || img.getAttribute('alt') || '';
                const m = t.match(/\{([^}]+)\}/);
                if (m) set.add(m[1]);
            });
        }
        return set;
    }

    function ensureSmileyDataLoaded() {
        // The site loads smileys lazily — only when you click the smiley btn
        // for the first time. To preempt this, fetch them ourselves via the
        // same AJAX endpoint the site uses. We can see in 'run' that it does
        // $.ajax({url: ...}) and stores the result in Chat._EMOTES_POPPED.
        // Easiest workaround: programmatically click the smiley button once
        // immediately so the site triggers its own load. We then hide it.
        if (W.Chat._EMOTES_POPPED && W.Chat._EMOTES_POPPED.length > 0) return;
        const sBtn = document.getElementById('smiley_btn');
        if (!sBtn) return;
        // Trigger a real click (jQuery delegated handlers will see this)
        try {
            sBtn.click();
            // Immediately hide the native picker again
            setTimeout(() => {
                const nat = document.getElementById('c_smileys');
                if (nat) nat.style.display = 'none';
            }, 50);
        } catch (e) {}
    }

