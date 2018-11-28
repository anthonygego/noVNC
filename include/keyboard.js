var kbdUtil = (function() {
    "use strict";

    function substituteCodepoint(cp) {
        // Any Unicode code points which do not have corresponding keysym entries
        // can be swapped out for another code point by adding them to this table
        var substitutions = {
            // {S,s} with comma below -> {S,s} with cedilla
            0x218 : 0x15e,
            0x219 : 0x15f,
            // {T,t} with comma below -> {T,t} with cedilla
            0x21a : 0x162,
            0x21b : 0x163
        };

        var sub = substitutions[cp];
        return sub ? sub : cp;
    }

    function isMac() {
        return navigator && !!(/mac/i).exec(navigator.platform);
    }
    function isWindows() {
        return navigator && !!(/win/i).exec(navigator.platform);
    }
    function isLinux() {
        return navigator && !!(/linux/i).exec(navigator.platform);
    }
    function isIE() {
        return navigator && !!(/trident/i).exec(navigator.userAgent);
    }
    function isEdge() {
        return navigator && !!(/edge/i).exec(navigator.userAgent);
    }

    // Get 'KeyboardEvent.code', handling legacy browsers
    function getKeycode(evt){
        // Are we getting proper key identifiers?
        // (unfortunately Firefox and Chrome are crappy here and gives
        // us an empty string on some platforms, rather than leaving it
        // undefined)
        if (evt.code) {
            // Mozilla isn't fully in sync with the spec yet
            switch (evt.code) {
                case 'OSLeft': return 'MetaLeft';
                case 'OSRight': return 'MetaRight';
            }

            return evt.code;
        }

        // The de-facto standard is to use Windows Virtual-Key codes
        // in the 'keyCode' field for non-printable characters. However
        // Webkit sets it to the same as charCode in 'keypress' events.
        if ((evt.type !== 'keypress') && (evt.keyCode in vkeys)) {
            var code = vkeys[evt.keyCode];

            // macOS has messed up this code for some reason
            if (isMac() && (code === 'ContextMenu')) {
                code = 'MetaRight';
            }

            // The keyCode doesn't distinguish between left and right
            // for the standard modifiers
            if (evt.location === 2) {
                switch (code) {
                    case 'ShiftLeft': return 'ShiftRight';
                    case 'ControlLeft': return 'ControlRight';
                    case 'AltLeft': return 'AltRight';
                }
            }

            // Nor a bunch of the numpad keys
            if (evt.location === 3) {
                switch (code) {
                    case 'Delete': return 'NumpadDecimal';
                    case 'Insert': return 'Numpad0';
                    case 'End': return 'Numpad1';
                    case 'ArrowDown': return 'Numpad2';
                    case 'PageDown': return 'Numpad3';
                    case 'ArrowLeft': return 'Numpad4';
                    case 'ArrowRight': return 'Numpad6';
                    case 'Home': return 'Numpad7';
                    case 'ArrowUp': return 'Numpad8';
                    case 'PageUp': return 'Numpad9';
                    case 'Enter': return 'NumpadEnter';
                }
            }

            return code;
        }

        return 'Unidentified';
    }

    // Get 'KeyboardEvent.key', handling legacy browsers
    function getKey(evt) {
        // Are we getting a proper key value?
        if (evt.key !== undefined) {
            // IE and Edge use some ancient version of the spec
            // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/8860571/
            switch (evt.key) {
                case 'Spacebar': return ' ';
                case 'Esc': return 'Escape';
                case 'Scroll': return 'ScrollLock';
                case 'Win': return 'Meta';
                case 'Apps': return 'ContextMenu';
                case 'Up': return 'ArrowUp';
                case 'Left': return 'ArrowLeft';
                case 'Right': return 'ArrowRight';
                case 'Down': return 'ArrowDown';
                case 'Del': return 'Delete';
                case 'Divide': return '/';
                case 'Multiply': return '*';
                case 'Subtract': return '-';
                case 'Add': return '+';
                case 'Decimal': return evt.char;
            }

            // Mozilla isn't fully in sync with the spec yet
            switch (evt.key) {
                case 'OS': return 'Meta';
            }

            // IE and Edge have broken handling of AltGraph so we cannot
            // trust them for printable characters
            if ((evt.key.length !== 1) || (!isIE() && !isEdge())) {
                return evt.key;
            }
        }

        // Try to deduce it based on the physical key
        var code = getKeycode(evt);
        if (code in fixedkeys) {
            return fixedkeys[code];
        }

        // If that failed, then see if we have a printable character
        if (evt.charCode) {
            return String.fromCharCode(evt.charCode);
        }

        // At this point we have nothing left to go on
        return 'Unidentified';
    }

    // Get the most reliable keysym value we can get from a key event
    function getKeysym(evt){
        var key = getKey(evt);

        if (key === 'Unidentified') {
            return null;
        }

        // First look up special keys
        if (key in DOMKeyTable) {
            var location = evt.location;

            // Safari screws up location for the right cmd key
            if ((key === 'Meta') && (location === 0)) {
                location = 2;
            }

            if ((location === undefined) || (location > 3)) {
                location = 0;
            }

            return DOMKeyTable[key][location];
        }

        // Now we need to look at the Unicode symbol instead

        var codepoint;

        // Special key? (FIXME: Should have been caught earlier)
        if (key.length !== 1) {
            return null;
        }

        codepoint = key.charCodeAt();
        if (codepoint) {
            return keysyms.lookup(codepoint);
        }

        return null;
    }    
    
    return {
        getKey : getKey,
        getKeycode : getKeycode,
        getKeysym : getKeysym,
        isMac: isMac,
        isLinux: isLinux,
        isWindows: isWindows,
        isEdge: isEdge,
        isIE: isIE
    };
})();

// Takes a DOM keyboard event and:
// - determines which keysym it represents
// - determines a keyId  identifying the key that was pressed (corresponding to the key/keyCode properties on the DOM event)
// - synthesizes events to synchronize modifier key state between which modifiers are actually down, and which we thought were down
// - marks each event with an 'escape' property if a modifier was down which should be "escaped"
// - generates a "stall" event in cases where it might be necessary to wait and see if a keypress event follows a keydown
// This information is collected into an object which is passed to the next() function. (one call per event)
function KeyEventDecoder(modifierState, next) {
    "use strict";
    function sendAll(evts) {
        for (var i = 0; i < evts.length; ++i) {
            next(evts[i]);
        }
    }
    function process(evt, type) {
        var result = {type: type};
        var keyId = kbdUtil.getKey(evt);
        if (keyId) {
            result.keyId = keyId;
        }

        var keysym = kbdUtil.getKeysym(evt);

        var hasModifier = modifierState.hasShortcutModifier() || !!modifierState.activeCharModifier();
        // Is this a case where we have to decide on the keysym right away, rather than waiting for the keypress?
        // "special" keys like enter, tab or backspace don't send keypress events,
        // and some browsers don't send keypresses at all if a modifier is down
        if (keysym && (type !== 'keydown' || kbdUtil.nonCharacterKey(evt) || hasModifier)) {
            result.keysym = keysym;
        }

        var isShift = evt.keyCode === 0x10 || evt.key === 'Shift';

        // Should we prevent the browser from handling the event?
        // Doing so on a keydown (in most browsers) prevents keypress from being generated
        // so only do that if we have to.
        var suppress = !isShift && (type !== 'keydown' || modifierState.hasShortcutModifier() || !!kbdUtil.nonCharacterKey(evt));

        // If a char modifier is down on a keydown, we need to insert a stall,
        // so VerifyCharModifier knows to wait and see if a keypress is comnig
        var stall = type === 'keydown' && modifierState.activeCharModifier() && !kbdUtil.nonCharacterKey(evt);

        // if a char modifier is pressed, get the keys it consists of (on Windows, AltGr is equivalent to Ctrl+Alt)
        var active = modifierState.activeCharModifier();

        // If we have a char modifier down, and we're able to determine a keysym reliably
        // then (a) we know to treat the modifier as a char modifier,
        // and (b) we'll have to "escape" the modifier to undo the modifier when sending the char.
        if (active && keysym) {
            var isCharModifier = false;
            for (var i  = 0; i < active.length; ++i) {
                if (active[i] === keysym.keysym) {
                    isCharModifier = true;
                }
            }
            if (type === 'keypress' && !isCharModifier) {
                result.escape = modifierState.activeCharModifier();
            }
        }

        if (stall) {
            // insert a fake "stall" event
            next({type: 'stall'});
        }
        next(result);

        return suppress;
    }

    return {
        keydown: function(evt) {
            sendAll(modifierState.keydown(evt));
            return process(evt, 'keydown');
        },
        keypress: function(evt) {
            return process(evt, 'keypress');
        },
        keyup: function(evt) {
            sendAll(modifierState.keyup(evt));
            return process(evt, 'keyup');
        },
        syncModifiers: function(evt) {
            sendAll(modifierState.syncAny(evt));
        },
        releaseAll: function() { next({type: 'releaseall'}); }
    };
}

// Combines keydown and keypress events where necessary to handle char modifiers.
// On some OS'es, a char modifier is sometimes used as a shortcut modifier.
// For example, on Windows, AltGr is synonymous with Ctrl-Alt. On a Danish keyboard layout, AltGr-2 yields a @, but Ctrl-Alt-D does nothing
// so when used with the '2' key, Ctrl-Alt counts as a char modifier (and should be escaped), but when used with 'D', it does not.
// The only way we can distinguish these cases is to wait and see if a keypress event arrives
// When we receive a "stall" event, wait a few ms before processing the next keydown. If a keypress has also arrived, merge the two
function VerifyCharModifier(next) {
    "use strict";
    var queue = [];
    var timer = null;
    function process() {
        if (timer) {
            return;
        }

        var delayProcess = function () {
            clearTimeout(timer);
            timer = null;
            process();
        };

        while (queue.length !== 0) {
            var cur = queue[0];
            queue = queue.splice(1);
            switch (cur.type) {
            case 'stall':
                // insert a delay before processing available events.
                /* jshint loopfunc: true */
                timer = setTimeout(delayProcess, 5);
                /* jshint loopfunc: false */
                return;
            case 'keydown':
                // is the next element a keypress? Then we should merge the two
                if (queue.length !== 0 && queue[0].type === 'keypress') {
                    // Firefox sends keypress even when no char is generated.
                    // so, if keypress keysym is the same as we'd have guessed from keydown,
                    // the modifier didn't have any effect, and should not be escaped
                    if (queue[0].escape && (!cur.keysym || cur.keysym.keysym !== queue[0].keysym.keysym)) {
                        cur.escape = queue[0].escape;
                    }
                    cur.keysym = queue[0].keysym;
                    queue = queue.splice(1);
                }
                break;
            }

            // swallow stall events, and pass all others to the next stage
            if (cur.type !== 'stall') {
                next(cur);
            }
        }
    }
    return function(evt) {
        queue.push(evt);
        process();
    };
}

// Keeps track of which keys we (and the server) believe are down
// When a keyup is received, match it against this list, to determine the corresponding keysym(s)
// in some cases, a single key may produce multiple keysyms, so the corresponding keyup event must release all of these chars
// key repeat events should be merged into a single entry.
// Because we can't always identify which entry a keydown or keyup event corresponds to, we sometimes have to guess
function TrackKeyState(next) {
    "use strict";
    var state = [];

    return function (evt) {
        var last = state.length !== 0 ? state[state.length-1] : null;

        switch (evt.type) {
        case 'keydown':
            // insert a new entry if last seen key was different.
            if (!last || !evt.keyId || last.keyId !== evt.keyId) {
                last = {keyId: evt.keyId, keysyms: {}};
                state.push(last);
            }
            if (evt.keysym) {
                // make sure last event contains this keysym (a single "logical" keyevent
                // can cause multiple key events to be sent to the VNC server)
                last.keysyms[evt.keysym.keysym] = evt.keysym;
                last.ignoreKeyPress = true;
                next(evt);
            }
            break;
        case 'keypress':
            if (!last) {
                last = {keyId: evt.keyId, keysyms: {}};
                state.push(last);
            }
            if (!evt.keysym) {
                console.log('keypress with no keysym:', evt);
            }

            // If we didn't expect a keypress, and already sent a keydown to the VNC server
            // based on the keydown, make sure to skip this event.
            if (evt.keysym && !last.ignoreKeyPress) {
                last.keysyms[evt.keysym.keysym] = evt.keysym;
                evt.type = 'keydown';
                next(evt);
            }
            break;
        case 'keyup':
            if (state.length === 0) {
                return;
            }
            var idx = null;
            // do we have a matching key tracked as being down?
            for (var i = 0; i !== state.length; ++i) {
                if (state[i].keyId === evt.keyId) {
                    idx = i;
                    break;
                }
            }
            // if we couldn't find a match (it happens), assume it was the last key pressed
            if (idx === null) {
                idx = state.length - 1;
            }

            var item = state.splice(idx, 1)[0];
            // for each keysym tracked by this key entry, clone the current event and override the keysym
            var clone = (function(){
                function Clone(){}
                return function (obj) { Clone.prototype=obj; return new Clone(); };
            }());
            for (var key in item.keysyms) {
                var out = clone(evt);
                out.keysym = item.keysyms[key];
                next(out);
            }
            break;
        case 'releaseall':
            /* jshint shadow: true */
            for (var i = 0; i < state.length; ++i) {
                for (var key in state[i].keysyms) {
                    var keysym = state[i].keysyms[key];
                    next({keyId: 0, keysym: keysym, type: 'keyup'});
                }
            }
            /* jshint shadow: false */
            state = [];
        }
    };
}

// Handles "escaping" of modifiers: if a char modifier is used to produce a keysym (such as AltGr-2 to generate an @),
// then the modifier must be "undone" before sending the @, and "redone" afterwards.
function EscapeModifiers(next) {
    "use strict";
    return function(evt) {
        if (evt.type !== 'keydown' || evt.escape === undefined) {
            next(evt);
            return;
        }
        // undo modifiers
        for (var i = 0; i < evt.escape.length; ++i) {
            next({type: 'keyup', keyId: 0, keysym: keysyms.lookup(evt.escape[i])});
        }
        // send the character event
        next(evt);
        // redo modifiers
        /* jshint shadow: true */
        for (var i = 0; i < evt.escape.length; ++i) {
            next({type: 'keydown', keyId: 0, keysym: keysyms.lookup(evt.escape[i])});
        }
        /* jshint shadow: false */
    };
}
