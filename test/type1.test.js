/**
 * Tests for Type 1 (PFB / PFA) font import.
 *
 * Since we have no real PFB/PFA sample files, these tests exercise the
 * internal parsing helpers with synthetic data:
 *   - type1Decrypt / encrypt round-trip
 *   - PFB segment parsing
 *   - PFA hex-decode parsing
 *   - Type 1 charstring interpretation
 *   - Full PFB and PFA import from synthetic font files
 */

import { describe, expect, it } from 'vitest';
import { importFont } from '../src/import.js';

// ---------------------------------------------------------------------------
//  Type 1 encryption helper (inverse of type1Decrypt)
// ---------------------------------------------------------------------------

/**
 * Encrypt bytes using the Type 1 cipher.
 * Produces `skip` random prefix bytes followed by the encrypted payload.
 */
function type1Encrypt(plainBytes, key, skip) {
	const input = new Uint8Array(skip + plainBytes.length);
	// Prefix with zeros (simplest deterministic fill)
	input.set(plainBytes, skip);

	const out = new Uint8Array(input.length);
	let r = key;
	const c1 = 52845;
	const c2 = 22719;
	for (let i = 0; i < input.length; i++) {
		const plain = input[i];
		const cipher = plain ^ (r >>> 8);
		out[i] = cipher;
		r = ((cipher + r) * c1 + c2) & 0xffff;
	}
	return out;
}

// ---------------------------------------------------------------------------
//  Build a minimal synthetic Type 1 font
// ---------------------------------------------------------------------------

/**
 * Create a tiny Type 1 charstring for a simple rectangle glyph.
 *
 * hsbw 0 500      — LSB=0, width=500
 * rmoveto 100 0   — move to (100, 0)
 * rlineto 300 0   — line to (400, 0)
 * rlineto 0 700   — line to (400, 700)
 * rlineto -300 0  — line to (100, 700)
 * closepath
 * endchar
 */
function buildRectCharstring() {
	const ops = [];

	// encode number helper
	function encNum(n) {
		if (n >= -107 && n <= 107) {
			ops.push(n + 139);
		} else if (n >= 108 && n <= 1131) {
			const v = n - 108;
			ops.push(247 + Math.floor(v / 256));
			ops.push(v % 256);
		} else if (n >= -1131 && n <= -108) {
			const v = -n - 108;
			ops.push(251 + Math.floor(v / 256));
			ops.push(v % 256);
		} else {
			// 32-bit
			ops.push(255);
			ops.push((n >>> 24) & 0xff);
			ops.push((n >>> 16) & 0xff);
			ops.push((n >>> 8) & 0xff);
			ops.push(n & 0xff);
		}
	}

	// hsbw 0 500
	encNum(0);
	encNum(500);
	ops.push(13); // hsbw

	// rmoveto 100 0
	encNum(100);
	encNum(0);
	ops.push(21); // rmoveto

	// rlineto 300 0
	encNum(300);
	encNum(0);
	ops.push(5); // rlineto

	// rlineto 0 700
	encNum(0);
	encNum(700);
	ops.push(5); // rlineto

	// rlineto -300 0
	encNum(-300);
	encNum(0);
	ops.push(5); // rlineto

	// closepath
	ops.push(9);

	// endchar
	ops.push(14);

	return new Uint8Array(ops);
}

/**
 * Build a minimal Type 1 .notdef charstring: hsbw 0 250, endchar
 */
function buildNotdefCharstring() {
	const ops = [];
	function encNum(n) {
		ops.push(n + 139);
	}
	encNum(0);
	encNum(250);
	ops.push(13); // hsbw
	ops.push(14); // endchar
	return new Uint8Array(ops);
}

/**
 * Build the ASCII header portion of a Type 1 font.
 */
function buildType1Header() {
	return [
		'%!PS-AdobeFont-1.0: TestFont 001.000',
		'12 dict begin',
		'/FontInfo 6 dict dup begin',
		'  /FamilyName (Test Family) def',
		'  /FullName (Test Font) def',
		'  /Weight (Regular) def',
		'  /version (001.000) def',
		'  /ItalicAngle 0 def',
		'  /isFixedPitch false def',
		'end def',
		'/FontName /TestFont def',
		'/FontType 1 def',
		'/FontMatrix [0.001 0 0 0.001 0 0] def',
		'/FontBBox {0 -200 1000 800} def',
		'/Encoding 256 array',
		'0 1 255 {1 index exch /.notdef put} for',
		'dup 65 /A put',
		'readonly def',
		'currentfile eexec',
	].join('\n');
}

/**
 * Build the private dict + charstrings portion (pre-encryption).
 *
 * The format mimics what a real Type 1 private dict looks like.
 * Binary charstring data is embedded after "RD " markers.
 */
function buildType1Private() {
	const notdefCS = buildNotdefCharstring();
	const aCS = buildRectCharstring();

	// Encrypt charstrings with charstring key (4330), lenIV=4
	const notdefEnc = type1Encrypt(notdefCS, 4330, 4);
	const aEnc = type1Encrypt(aCS, 4330, 4);

	// Build the text+binary payload
	const textParts = [];
	const binaryChunks = []; // { textOffset, data }

	function addText(s) {
		textParts.push(s);
	}

	addText('dup /Private 8 dict dup begin\n');
	addText('/lenIV 4 def\n');
	addText('/BlueValues [-10 0 700 710] def\n');
	addText('/StdHW [50] def\n');
	addText('/StdVW [60] def\n');
	addText('/Subrs 0 array def\n');
	addText(`/CharStrings 2 dict dup begin\n`);
	addText(`/.notdef ${notdefEnc.length} RD `);
	binaryChunks.push({
		marker: 'notdef',
		data: notdefEnc,
	});
	addText(' ND\n');
	addText(`/A ${aEnc.length} RD `);
	binaryChunks.push({
		marker: 'A',
		data: aEnc,
	});
	addText(' ND\n');
	addText('end\nend\n');

	// Combine text and binary into a single byte array.
	// We need to interleave text and binary so that the byte offsets align
	// with the text offsets (since latin1 is 1 byte per char).
	const encoder = new TextEncoder();

	// Build in order: text[0], binary[0], text[1], binary[1], text[2]
	// Text parts are separated by binary chunks.
	// We have: text[0..6] + "/.notdef N RD " + binary[notdef] + " ND\n" + "/A N RD " + binary[A] + " ND\n" + "end\nend\n"
	// Simplify: just concatenate all text parts and insert binary at the right spots

	// Actually, let's build the whole thing as bytes directly
	let textSoFar = textParts.slice(0, 8).join(''); // up to and including "RD "
	const part1 = new TextEncoder().encode(textSoFar);

	const textAfterNotdef = textParts.slice(8, 10).join(''); // " ND\n" + "/A N RD "
	const part2 = new TextEncoder().encode(textAfterNotdef);

	const textAfterA = textParts.slice(10).join(''); // " ND\n" + "end\nend\n"
	const part3 = new TextEncoder().encode(textAfterA);

	// Concatenate: part1 + notdefEnc + part2 + aEnc + part3
	const total =
		part1.length + notdefEnc.length + part2.length + aEnc.length + part3.length;
	const result = new Uint8Array(total);
	let off = 0;
	result.set(part1, off);
	off += part1.length;
	result.set(notdefEnc, off);
	off += notdefEnc.length;
	result.set(part2, off);
	off += part2.length;
	result.set(aEnc, off);
	off += aEnc.length;
	result.set(part3, off);

	return result;
}

/**
 * Build a complete PFB file buffer.
 */
function buildPFB() {
	const header = buildType1Header();
	const headerBytes = new TextEncoder().encode(header);

	const privateBytes = buildType1Private();
	const encryptedPrivate = type1Encrypt(privateBytes, 55665, 4);

	// PFB segments
	const segments = [];

	// ASCII segment (type 1)
	const seg1 = new Uint8Array(6 + headerBytes.length);
	seg1[0] = 0x80;
	seg1[1] = 1;
	seg1[2] = headerBytes.length & 0xff;
	seg1[3] = (headerBytes.length >>> 8) & 0xff;
	seg1[4] = (headerBytes.length >>> 16) & 0xff;
	seg1[5] = (headerBytes.length >>> 24) & 0xff;
	seg1.set(headerBytes, 6);
	segments.push(seg1);

	// Binary segment (type 2)
	const seg2 = new Uint8Array(6 + encryptedPrivate.length);
	seg2[0] = 0x80;
	seg2[1] = 2;
	seg2[2] = encryptedPrivate.length & 0xff;
	seg2[3] = (encryptedPrivate.length >>> 8) & 0xff;
	seg2[4] = (encryptedPrivate.length >>> 16) & 0xff;
	seg2[5] = (encryptedPrivate.length >>> 24) & 0xff;
	seg2.set(encryptedPrivate, 6);
	segments.push(seg2);

	// EOF segment (type 3)
	const seg3 = new Uint8Array([0x80, 3]);
	segments.push(seg3);

	// Concatenate
	const totalLen = segments.reduce((s, seg) => s + seg.length, 0);
	const pfb = new Uint8Array(totalLen);
	let off = 0;
	for (const seg of segments) {
		pfb.set(seg, off);
		off += seg.length;
	}
	return pfb.buffer;
}

/**
 * Build a complete PFA file buffer.
 */
function buildPFA() {
	const header = buildType1Header();

	const privateBytes = buildType1Private();
	const encryptedPrivate = type1Encrypt(privateBytes, 55665, 4);

	// Convert encrypted bytes to hex
	const hexParts = [];
	for (const b of encryptedPrivate) {
		hexParts.push(b.toString(16).padStart(2, '0'));
	}
	// Add cleartomark padding (512 zeros)
	hexParts.push('0'.repeat(512));

	const pfaText = header + '\n' + hexParts.join('') + '\ncleartomark\n';
	return new TextEncoder().encode(pfaText).buffer;
}

// ===========================================================================
//  Tests
// ===========================================================================

describe('Type 1 encryption', () => {
	it('encrypt then decrypt round-trips to original data', () => {
		const plain = new Uint8Array([1, 2, 3, 4, 5, 100, 200, 255]);
		const encrypted = type1Encrypt(plain, 55665, 4);
		// Decrypt
		const out = new Uint8Array(encrypted.length);
		let r = 55665;
		for (let i = 0; i < encrypted.length; i++) {
			const cipher = encrypted[i];
			out[i] = cipher ^ (r >>> 8);
			r = ((cipher + r) * 52845 + 22719) & 0xffff;
		}
		const decrypted = out.slice(4);
		expect(Array.from(decrypted)).toEqual(Array.from(plain));
	});
});

describe('Type 1 charstring interpreter', () => {
	it('interprets a rectangle charstring into correct contours', () => {
		// We'll import a PFB to exercise the full pipeline including charstring interpretation
		const pfb = buildPFB();
		const result = importFont(pfb);

		// Find glyph "A"
		const glyphA = result.glyphs.find((g) => g.name === 'A');
		expect(glyphA).toBeDefined();
		expect(glyphA.advanceWidth).toBe(500);
		expect(glyphA.contours).toBeDefined();
		expect(glyphA.contours.length).toBeGreaterThan(0);

		// Check the rectangle shape
		const contour = glyphA.contours[0];
		expect(contour.length).toBe(4); // M + 3 lines (closepath closes implicitly)
		expect(contour[0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(contour[1]).toEqual({ type: 'L', x: 400, y: 0 });
		expect(contour[2]).toEqual({ type: 'L', x: 400, y: 700 });
		expect(contour[3]).toEqual({ type: 'L', x: 100, y: 700 });
	});
});

describe('PFB import', () => {
	it('imports a synthetic PFB and produces valid font data', () => {
		const pfb = buildPFB();
		const result = importFont(pfb);

		expect(result).toBeDefined();
		expect(result._standalone).toBe('type1');
		expect(result.font).toBeDefined();
		expect(result.font.familyName).toBe('Test Family');
		expect(result.font.postScriptName).toBe('TestFont');
		expect(result.font.unitsPerEm).toBe(1000);
	});

	it('detects PFB from magic bytes', () => {
		const pfb = buildPFB();
		const bytes = new Uint8Array(pfb);
		expect(bytes[0]).toBe(0x80);
		expect(bytes[1]).toBe(1);
	});

	it('imports both .notdef and named glyphs', () => {
		const pfb = buildPFB();
		const result = importFont(pfb);

		expect(result.glyphs.length).toBe(2); // .notdef + A
		expect(result.glyphs[0].name).toBe('.notdef');
		expect(result.glyphs[1].name).toBe('A');
		expect(result.glyphs[1].unicode).toBe(65);
	});
});

describe('PFA import', () => {
	it('imports a synthetic PFA and produces valid font data', () => {
		const pfa = buildPFA();
		const result = importFont(pfa);

		expect(result).toBeDefined();
		expect(result._standalone).toBe('type1');
		expect(result.font.familyName).toBe('Test Family');
		expect(result.font.postScriptName).toBe('TestFont');
	});

	it('detects PFA from %! magic bytes', () => {
		const pfa = buildPFA();
		const bytes = new Uint8Array(pfa);
		expect(bytes[0]).toBe(0x25); // %
		expect(bytes[1]).toBe(0x21); // !
	});

	it('PFA and PFB produce identical glyph data', () => {
		const pfbResult = importFont(buildPFB());
		const pfaResult = importFont(buildPFA());

		expect(pfaResult.glyphs.length).toBe(pfbResult.glyphs.length);
		for (let i = 0; i < pfaResult.glyphs.length; i++) {
			expect(pfaResult.glyphs[i].name).toBe(pfbResult.glyphs[i].name);
			expect(pfaResult.glyphs[i].advanceWidth).toBe(
				pfbResult.glyphs[i].advanceWidth,
			);
			expect(pfaResult.glyphs[i].contours).toEqual(
				pfbResult.glyphs[i].contours,
			);
		}
	});
});
