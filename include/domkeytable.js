/*
 * noVNC: HTML5 VNC client
 * Copyright (C) 2018 The noVNC Authors
 * Licensed under MPL 2.0 or any later version (see LICENSE.txt)
 * Mapping between HTML key values and VNC/X11 keysyms for "special"
 * keys that cannot be handled via their Unicode codepoint.
 *
 * See https://www.w3.org/TR/uievents-key/ for possible values.
 */

var DOMKeyTable = {};

function addStandard(key, standard) {
    if (standard === undefined) throw new Error("Undefined keysym for key \"" + key + "\"");
    if (key in DOMKeyTable) throw new Error("Duplicate entry for key \"" + key + "\"");
    DOMKeyTable[key] = [standard, standard, standard, standard];
}

function addLeftRight(key, left, right) {
    if (left === undefined) throw new Error("Undefined keysym for key \"" + key + "\"");
    if (right === undefined) throw new Error("Undefined keysym for key \"" + key + "\"");
    if (key in DOMKeyTable) throw new Error("Duplicate entry for key \"" + key + "\"");
    DOMKeyTable[key] = [left, left, right, left];
}

function addNumpad(key, standard, numpad) {
    if (standard === undefined) throw new Error("Undefined keysym for key \"" + key + "\"");
    if (numpad === undefined) throw new Error("Undefined keysym for key \"" + key + "\"");
    if (key in DOMKeyTable) throw new Error("Duplicate entry for key \"" + key + "\"");
    DOMKeyTable[key] = [standard, standard, standard, numpad];
}

// 2.2. Modifier Keys

addLeftRight("Alt", XK_Alt_L, XK_Alt_R);
addStandard("AltGraph", XK_ISO_Level3_Shift);
addStandard("CapsLock", XK_Caps_Lock);
addLeftRight("Control", XK_Control_L, XK_Control_R);
// - Fn
// - FnLock
addLeftRight("Hyper", XK_Super_L, XK_Super_R);
addLeftRight("Meta", XK_Super_L, XK_Super_R);
addStandard("NumLock", XK_Num_Lock);
addStandard("ScrollLock", XK_Scroll_Lock);
addLeftRight("Shift", XK_Shift_L, XK_Shift_R);
addLeftRight("Super", XK_Super_L, XK_Super_R);
// - Symbol
// - SymbolLock

// 2.3. Whitespace Keys

addNumpad("Enter", XK_Return, XK_KP_Enter);
addStandard("Tab", XK_Tab);
addNumpad(" ", XK_space, XK_KP_Space);

// 2.4. Navigation Keys

addNumpad("ArrowDown", XK_Down, XK_KP_Down);
addNumpad("ArrowUp", XK_Up, XK_KP_Up);
addNumpad("ArrowLeft", XK_Left, XK_KP_Left);
addNumpad("ArrowRight", XK_Right, XK_KP_Right);
addNumpad("End", XK_End, XK_KP_End);
addNumpad("Home", XK_Home, XK_KP_Home);
addNumpad("PageDown", XK_Next, XK_KP_Next);
addNumpad("PageUp", XK_Prior, XK_KP_Prior);

// 2.5. Editing Keys

addStandard("Backspace", XK_BackSpace);
addNumpad("Clear", XK_Clear, XK_KP_Begin);
// - CrSel
addNumpad("Delete", XK_Delete, XK_KP_Delete);
// - EraseEof
// - ExSel
addNumpad("Insert", XK_Insert, XK_KP_Insert);
addStandard("Redo", XK_Redo);
addStandard("Undo", XK_Undo);

// 2.6. UI Keys

// - Accept
// - Again (could just be XK_Redo)
// - Attn
addStandard("Cancel", XK_Cancel);
addStandard("ContextMenu", XK_Menu);
addStandard("Escape", XK_Escape);
addStandard("Execute", XK_Execute);
addStandard("Find", XK_Find);
addStandard("Help", XK_Help);
addStandard("Pause", XK_Pause);

// 2.9. General-Purpose Function Keys

addStandard("F1", XK_F1);
addStandard("F2", XK_F2);
addStandard("F3", XK_F3);
addStandard("F4", XK_F4);
addStandard("F5", XK_F5);
addStandard("F6", XK_F6);
addStandard("F7", XK_F7);
addStandard("F8", XK_F8);
addStandard("F9", XK_F9);
addStandard("F10", XK_F10);
addStandard("F11", XK_F11);
addStandard("F12", XK_F12);
addStandard("F13", XK_F13);
addStandard("F14", XK_F14);
addStandard("F15", XK_F15);
addStandard("F16", XK_F16);
addStandard("F17", XK_F17);
addStandard("F18", XK_F18);
addStandard("F19", XK_F19);
addStandard("F20", XK_F20);
addStandard("F21", XK_F21);
addStandard("F22", XK_F22);
addStandard("F23", XK_F23);
addStandard("F24", XK_F24);
addStandard("F25", XK_F25);
addStandard("F26", XK_F26);
addStandard("F27", XK_F27);
addStandard("F28", XK_F28);
addStandard("F29", XK_F29);
addStandard("F30", XK_F30);
addStandard("F31", XK_F31);
addStandard("F32", XK_F32);
addStandard("F33", XK_F33);
addStandard("F34", XK_F34);
addStandard("F35", XK_F35);

// Extra: Numpad

addNumpad("=", XK_equal, XK_KP_Equal);
addNumpad("+", XK_plus, XK_KP_Add);
addNumpad("-", XK_minus, XK_KP_Subtract);
addNumpad("*", XK_asterisk, XK_KP_Multiply);
addNumpad("/", XK_slash, XK_KP_Divide);
addNumpad(".", XK_period, XK_KP_Decimal);
addNumpad(",", XK_comma, XK_KP_Separator);
addNumpad("0", XK_0, XK_KP_0);
addNumpad("1", XK_1, XK_KP_1);
addNumpad("2", XK_2, XK_KP_2);
addNumpad("3", XK_3, XK_KP_3);
addNumpad("4", XK_4, XK_KP_4);
addNumpad("5", XK_5, XK_KP_5);
addNumpad("6", XK_6, XK_KP_6);
addNumpad("7", XK_7, XK_KP_7);
addNumpad("8", XK_8, XK_KP_8);
addNumpad("9", XK_9, XK_KP_9);
