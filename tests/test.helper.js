// requires local modules: keysym, keysymdef, keyboard, vkeys

var assert = chai.assert;
var expect = chai.expect;

describe('Helpers', function () {
    "use strict";

    describe('keysyms.lookup', function () {
        it('should map ASCII characters to keysyms', function () {
            expect(keysyms.lookup('a'.charCodeAt())).to.be.equal(0x61);
            expect(keysyms.lookup('A'.charCodeAt())).to.be.equal(0x41);
        });
        it('should map Latin-1 characters to keysyms', function () {
            expect(keysyms.lookup('ø'.charCodeAt())).to.be.equal(0xf8);

            expect(keysyms.lookup('é'.charCodeAt())).to.be.equal(0xe9);
        });
        it('should map characters that are in Windows-1252 but not in Latin-1 to keysyms', function () {
            expect(keysyms.lookup('Š'.charCodeAt())).to.be.equal(0x01a9);
        });
        it('should map characters which aren\'t in Latin1 *or* Windows-1252 to keysyms', function () {
            expect(keysyms.lookup('ũ'.charCodeAt())).to.be.equal(0x03fd);
        });
        it('should map unknown codepoints to the Unicode range', function () {
            expect(keysyms.lookup('\n'.charCodeAt())).to.be.equal(0x100000a);
            expect(keysyms.lookup('\u262D'.charCodeAt())).to.be.equal(0x100262d);
        });
        // This requires very recent versions of most browsers... skipping for now
        it.skip('should map UCS-4 codepoints to the Unicode range', function () {
            //expect(keysyms.lookup('\u{1F686}'.codePointAt())).to.be.equal(0x101f686);
        });
    });

    describe('getKeycode', function () {
        it('should pass through proper code', function () {
            expect(kbdUtil.getKeycode({code: 'Semicolon'})).to.be.equal('Semicolon');
        });
        it('should map legacy values', function () {
            expect(kbdUtil.getKeycode({code: ''})).to.be.equal('Unidentified');
            expect(kbdUtil.getKeycode({code: 'OSLeft'})).to.be.equal('MetaLeft');
        });
        it('should map keyCode to code when possible', function () {
            expect(kbdUtil.getKeycode({keyCode: 0x14})).to.be.equal('CapsLock');
            expect(kbdUtil.getKeycode({keyCode: 0x5b})).to.be.equal('MetaLeft');
            expect(kbdUtil.getKeycode({keyCode: 0x35})).to.be.equal('Digit5');
            expect(kbdUtil.getKeycode({keyCode: 0x65})).to.be.equal('Numpad5');
        });
        it('should map keyCode left/right side', function () {
            expect(kbdUtil.getKeycode({keyCode: 0x10, location: 1})).to.be.equal('ShiftLeft');
            expect(kbdUtil.getKeycode({keyCode: 0x10, location: 2})).to.be.equal('ShiftRight');
            expect(kbdUtil.getKeycode({keyCode: 0x11, location: 1})).to.be.equal('ControlLeft');
            expect(kbdUtil.getKeycode({keyCode: 0x11, location: 2})).to.be.equal('ControlRight');
        });
        it('should map keyCode on numpad', function () {
            expect(kbdUtil.getKeycode({keyCode: 0x0d, location: 0})).to.be.equal('Enter');
            expect(kbdUtil.getKeycode({keyCode: 0x0d, location: 3})).to.be.equal('NumpadEnter');
            expect(kbdUtil.getKeycode({keyCode: 0x23, location: 0})).to.be.equal('End');
            expect(kbdUtil.getKeycode({keyCode: 0x23, location: 3})).to.be.equal('Numpad1');
        });
        it('should return Unidentified when it cannot map the keyCode', function () {
            expect(kbdUtil.getKeycode({keycode: 0x42})).to.be.equal('Unidentified');
        });

    });

    describe('getKey', function () {
        it('should prefer key', function () {
            if (kbdUtil.isIE() || kbdUtil.isEdge()) this.skip();
            expect(kbdUtil.getKey({key: 'a', charCode: 'Š'.charCodeAt(), keyCode: 0x42, which: 0x43})).to.be.equal('a');
        });
        it('should map legacy values', function () {
            expect(kbdUtil.getKey({key: 'Spacebar'})).to.be.equal(' ');
            expect(kbdUtil.getKey({key: 'Left'})).to.be.equal('ArrowLeft');
            expect(kbdUtil.getKey({key: 'OS'})).to.be.equal('Meta');
            expect(kbdUtil.getKey({key: 'Win'})).to.be.equal('Meta');
            expect(kbdUtil.getKey({key: 'UIKeyInputLeftArrow'})).to.be.equal('ArrowLeft');
        });
        it('should use code if no key', function () {
            expect(kbdUtil.getKey({code: 'NumpadBackspace'})).to.be.equal('Backspace');
        });
        it('should not use code fallback for character keys', function () {
            expect(kbdUtil.getKey({code: 'KeyA'})).to.be.equal('Unidentified');
            expect(kbdUtil.getKey({code: 'Digit1'})).to.be.equal('Unidentified');
            expect(kbdUtil.getKey({code: 'Period'})).to.be.equal('Unidentified');
            expect(kbdUtil.getKey({code: 'Numpad1'})).to.be.equal('Unidentified');
        });
        it('should use charCode if no key', function () {
            expect(kbdUtil.getKey({charCode: 'Š'.charCodeAt(), keyCode: 0x42, which: 0x43})).to.be.equal('Š');
        });
        it('should return Unidentified when it cannot map the key', function () {
            expect(kbdUtil.getKey({keycode: 0x42})).to.be.equal('Unidentified');
        });

    });

    describe('getKeysym', function () {
        describe('Non-character keys', function () {
            it('should recognize the right keys', function () {
                expect(kbdUtil.getKeysym({key: 'Enter'})).to.be.equal(0xFF0D);
                expect(kbdUtil.getKeysym({key: 'Backspace'})).to.be.equal(0xFF08);
                expect(kbdUtil.getKeysym({key: 'Tab'})).to.be.equal(0xFF09);
                expect(kbdUtil.getKeysym({key: 'Shift'})).to.be.equal(0xFFE1);
                expect(kbdUtil.getKeysym({key: 'Control'})).to.be.equal(0xFFE3);
                expect(kbdUtil.getKeysym({key: 'Alt'})).to.be.equal(0xFFE9);
                expect(kbdUtil.getKeysym({key: 'Meta'})).to.be.equal(0xFFEB);
                expect(kbdUtil.getKeysym({key: 'Escape'})).to.be.equal(0xFF1B);
                expect(kbdUtil.getKeysym({key: 'ArrowUp'})).to.be.equal(0xFF52);
            });
            it('should map left/right side', function () {
                expect(kbdUtil.getKeysym({key: 'Shift', location: 1})).to.be.equal(0xFFE1);
                expect(kbdUtil.getKeysym({key: 'Shift', location: 2})).to.be.equal(0xFFE2);
                expect(kbdUtil.getKeysym({key: 'Control', location: 1})).to.be.equal(0xFFE3);
                expect(kbdUtil.getKeysym({key: 'Control', location: 2})).to.be.equal(0xFFE4);
            });
            it('should handle AltGraph', function () {
                expect(kbdUtil.getKeysym({code: 'AltRight', key: 'Alt', location: 2})).to.be.equal(0xFFEA);
                expect(kbdUtil.getKeysym({code: 'AltRight', key: 'AltGraph', location: 2})).to.be.equal(0xFE03);
            });
            it('should return null for unknown keys', function () {
                expect(kbdUtil.getKeysym({key: 'Semicolon'})).to.be.null;
                expect(kbdUtil.getKeysym({key: 'BracketRight'})).to.be.null;
            });
            it('should handle remappings', function () {
                expect(kbdUtil.getKeysym({code: 'ControlLeft', key: 'Tab'})).to.be.equal(0xFF09);
            });
        });

        describe('Numpad', function () {
            it('should handle Numpad numbers', function () {
                if (kbdUtil.isIE() || kbdUtil.isEdge()) this.skip();
                expect(kbdUtil.getKeysym({code: 'Digit5', key: '5', location: 0})).to.be.equal(0x0035);
                expect(kbdUtil.getKeysym({code: 'Numpad5', key: '5', location: 3})).to.be.equal(0xFFB5);
            });
            it('should handle Numpad non-character keys', function () {
                expect(kbdUtil.getKeysym({code: 'Home', key: 'Home', location: 0})).to.be.equal(0xFF50);
                expect(kbdUtil.getKeysym({code: 'Numpad5', key: 'Home', location: 3})).to.be.equal(0xFF95);
                expect(kbdUtil.getKeysym({code: 'Delete', key: 'Delete', location: 0})).to.be.equal(0xFFFF);
                expect(kbdUtil.getKeysym({code: 'NumpadDecimal', key: 'Delete', location: 3})).to.be.equal(0xFF9F);
            });
            it('should handle Numpad Decimal key', function () {
                if (kbdUtil.isIE() || kbdUtil.isEdge()) this.skip();
                expect(kbdUtil.getKeysym({code: 'NumpadDecimal', key: '.', location: 3})).to.be.equal(0xFFAE);
                expect(kbdUtil.getKeysym({code: 'NumpadDecimal', key: ',', location: 3})).to.be.equal(0xFFAC);
            });
        });
    });
});
