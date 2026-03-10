/**
 * Font Flux JS : OTF post table
 * PostScript Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/post
 *
 * Contains PostScript information: italic angle, underline metrics,
 * fixed-pitch flag, memory hints, and (for v1.0/v2.0) glyph names.
 *
 * Versions:
 *   1.0 (0x00010000) — header only; uses standard 258 Macintosh glyph names
 *   2.0 (0x00020000) — header + numGlyphs + glyphNameIndex[] + Pascal strings
 *   2.5 (0x00025000) — deprecated; header + numGlyphs + int8 offset[]
 *   3.0 (0x00030000) — header only; no glyph names provided
 *
 * CFF v1 fonts must use version 3.0.
 * TrueType / CFF v2 fonts may use any version.
 *
 * Header is always 32 bytes.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/** Header size shared by all versions (32 bytes). */
const HEADER_SIZE = 32;

// ===========================================================================
//  STANDARD MACINTOSH GLYPH NAMES (258 entries)
// ===========================================================================

/**
 * The 258 standard Macintosh glyph names used by post table versions 1.0
 * and 2.0. Index in this array = standard glyph name index.
 */
/* prettier-ignore */
const MAC_GLYPH_NAMES = [
	'.notdef', '.null', 'nonmarkingreturn', 'space', 'exclam', 'quotedbl',
	'numbersign', 'dollar', 'percent', 'ampersand', 'quotesingle', 'parenleft',
	'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
	'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
	'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question', 'at',
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
	'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
	'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
	'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
	'braceleft', 'bar', 'braceright', 'asciitilde', 'Adieresis', 'Aring',
	'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute',
	'agrave', 'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla',
	'eacute', 'egrave', 'ecircumflex', 'edieresis', 'iacute', 'igrave',
	'icircumflex', 'idieresis', 'ntilde', 'oacute', 'ograve', 'ocircumflex',
	'odieresis', 'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis',
	'dagger', 'degree', 'cent', 'sterling', 'section', 'bullet', 'paragraph',
	'germandbls', 'registered', 'copyright', 'trademark', 'acute', 'dieresis',
	'notequal', 'AE', 'Oslash', 'infinity', 'plusminus', 'lessequal',
	'greaterequal', 'yen', 'mu', 'partialdiff', 'summation', 'product', 'pi',
	'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash',
	'questiondown', 'exclamdown', 'logicalnot', 'radical', 'florin',
	'approxequal', 'Delta', 'guillemotleft', 'guillemotright', 'ellipsis',
	'nonbreakingspace', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe', 'endash',
	'emdash', 'quotedblleft', 'quotedblright', 'quoteleft', 'quoteright',
	'divide', 'lozenge', 'ydieresis', 'Ydieresis', 'fraction', 'currency',
	'guilsinglleft', 'guilsinglright', 'fi', 'fl', 'daggerdbl', 'periodcentered',
	'quotesinglbase', 'quotedblbase', 'perthousand', 'Acircumflex',
	'Ecircumflex', 'Aacute', 'Edieresis', 'Egrave', 'Iacute', 'Icircumflex',
	'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex', 'apple', 'Ograve',
	'Uacute', 'Ucircumflex', 'Ugrave', 'dotlessi', 'circumflex', 'tilde',
	'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut',
	'ogonek', 'caron', 'Lslash', 'lslash', 'Scaron', 'scaron', 'Zcaron',
	'zcaron', 'brokenbar', 'Eth', 'eth', 'Yacute', 'yacute', 'Thorn',
	'thorn', 'minus', 'multiply', 'onesuperior', 'twosuperior', 'threesuperior',
	'onehalf', 'onequarter', 'threequarters', 'franc', 'Gbreve', 'gbreve',
	'Idotaccent', 'Scedilla', 'scedilla', 'Cacute', 'cacute', 'Ccaron',
	'ccaron', 'dcroat',
];

/**
 * Reverse lookup: standard glyph name -> index (0–257).
 */
const MAC_GLYPH_NAME_TO_INDEX = new Map(
	MAC_GLYPH_NAMES.map((name, i) => [name, i]),
);

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a post table from raw bytes.
 *
 * Header (32 bytes, all versions):
 *   Version16Dot16  version           — raw uint32
 *   Fixed           italicAngle       — 16.16 signed fixed-point
 *   FWORD           underlinePosition
 *   FWORD           underlineThickness
 *   uint32          isFixedPitch      — 0 = proportional, non-zero = monospaced
 *   uint32          minMemType42
 *   uint32          maxMemType42
 *   uint32          minMemType1
 *   uint32          maxMemType1
 *
 * Version 2.0 appends:
 *   uint16          numGlyphs
 *   uint16[]        glyphNameIndex[numGlyphs]
 *   Pascal strings  (variable)
 *
 * Version 2.5 (deprecated) appends:
 *   uint16          numGlyphs
 *   int8[]          offset[numGlyphs]
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parsePost(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint32();
	const italicAngle = reader.fixed();
	const underlinePosition = reader.fword();
	const underlineThickness = reader.fword();
	const isFixedPitch = reader.uint32();
	const minMemType42 = reader.uint32();
	const maxMemType42 = reader.uint32();
	const minMemType1 = reader.uint32();
	const maxMemType1 = reader.uint32();

	const result = {
		version,
		italicAngle,
		underlinePosition,
		underlineThickness,
		isFixedPitch,
		minMemType42,
		maxMemType42,
		minMemType1,
		maxMemType1,
	};

	// Version 1.0 and 3.0: header only
	if (version === 0x00010000 || version === 0x00030000) {
		return result;
	}

	// Version 2.0: glyph name index + Pascal strings
	if (version === 0x00020000) {
		const numGlyphs = reader.uint16();
		const glyphNameIndex = reader.array('uint16', numGlyphs);

		// Find max index to determine how many custom strings exist
		let maxIndex = -1;
		for (const idx of glyphNameIndex) {
			if (idx > maxIndex) maxIndex = idx;
		}

		// Read Pascal strings (index 258+)
		const numCustomNames = maxIndex >= 258 ? maxIndex - 258 + 1 : 0;
		const customNames = [];
		for (let i = 0; i < numCustomNames; i++) {
			const len = reader.uint8();
			const chars = reader.bytes(len);
			customNames.push(String.fromCharCode(...chars));
		}

		// Resolve glyph names
		const glyphNames = glyphNameIndex.map((idx) => {
			if (idx < 258) return MAC_GLYPH_NAMES[idx];
			return customNames[idx - 258];
		});

		result.glyphNames = glyphNames;
		return result;
	}

	// Version 2.5 (deprecated): offset array
	if (version === 0x00025000) {
		const numGlyphs = reader.uint16();
		const offsets = reader.array('int8', numGlyphs);

		// Resolve glyph names: glyphIndex + offset -> standard Mac name index
		const glyphNames = offsets.map(
			(offset, glyphIndex) => MAC_GLYPH_NAMES[glyphIndex + offset],
		);

		result.glyphNames = glyphNames;
		return result;
	}

	// Unknown version — return header only
	return result;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a post table JSON object back to raw bytes.
 *
 * @param {object} table - parsed post table
 * @returns {number[]}
 */
export function writePost(table) {
	const { version } = table;

	// Version 1.0 and 3.0: header only (32 bytes)
	if (version === 0x00010000 || version === 0x00030000) {
		return writeHeader(table);
	}

	// Version 2.0: header + glyph name data
	if (version === 0x00020000) {
		return writeVersion2(table);
	}

	// Version 2.5 (deprecated): header + offsets
	if (version === 0x00025000) {
		return writeVersion25(table);
	}

	// Unknown version — write header only
	return writeHeader(table);
}

/**
 * Write the 32-byte header shared by all versions.
 */
function writeHeader(table) {
	const writer = new DataWriter(HEADER_SIZE);
	writer
		.uint32(table.version)
		.fixed(table.italicAngle)
		.fword(table.underlinePosition)
		.fword(table.underlineThickness)
		.uint32(table.isFixedPitch)
		.uint32(table.minMemType42)
		.uint32(table.maxMemType42)
		.uint32(table.minMemType1)
		.uint32(table.maxMemType1);
	return writer.toArray();
}

/**
 * Write a version 2.0 post table.
 */
function writeVersion2(table) {
	const { glyphNames } = table;
	const numGlyphs = glyphNames.length;

	// Build glyphNameIndex and custom name list
	const glyphNameIndex = [];
	const customNames = [];
	const customNameMap = new Map(); // name -> index into customNames

	for (const name of glyphNames) {
		const stdIndex = MAC_GLYPH_NAME_TO_INDEX.get(name);
		if (stdIndex !== undefined) {
			glyphNameIndex.push(stdIndex);
		} else {
			if (!customNameMap.has(name)) {
				customNameMap.set(name, customNames.length);
				customNames.push(name);
			}
			glyphNameIndex.push(258 + customNameMap.get(name));
		}
	}

	// Calculate size: header + uint16 numGlyphs + uint16[] indices + Pascal strings
	let stringDataSize = 0;
	for (const name of customNames) {
		stringDataSize += 1 + name.length; // length byte + ASCII chars
	}
	const totalSize = HEADER_SIZE + 2 + numGlyphs * 2 + stringDataSize;

	const writer = new DataWriter(totalSize);

	// Header
	writer
		.uint32(table.version)
		.fixed(table.italicAngle)
		.fword(table.underlinePosition)
		.fword(table.underlineThickness)
		.uint32(table.isFixedPitch)
		.uint32(table.minMemType42)
		.uint32(table.maxMemType42)
		.uint32(table.minMemType1)
		.uint32(table.maxMemType1);

	// numGlyphs
	writer.uint16(numGlyphs);

	// glyphNameIndex array
	for (const idx of glyphNameIndex) {
		writer.uint16(idx);
	}

	// Pascal strings
	for (const name of customNames) {
		writer.uint8(name.length);
		for (let i = 0; i < name.length; i++) {
			writer.uint8(name.charCodeAt(i));
		}
	}

	return writer.toArray();
}

/**
 * Write a version 2.5 (deprecated) post table.
 */
function writeVersion25(table) {
	const { glyphNames } = table;
	const numGlyphs = glyphNames.length;
	const totalSize = HEADER_SIZE + 2 + numGlyphs;

	const writer = new DataWriter(totalSize);

	// Header
	writer
		.uint32(table.version)
		.fixed(table.italicAngle)
		.fword(table.underlinePosition)
		.fword(table.underlineThickness)
		.uint32(table.isFixedPitch)
		.uint32(table.minMemType42)
		.uint32(table.maxMemType42)
		.uint32(table.minMemType1)
		.uint32(table.maxMemType1);

	// numGlyphs
	writer.uint16(numGlyphs);

	// offset array: each offset maps glyphIndex -> standard Mac name index
	for (let glyphIndex = 0; glyphIndex < numGlyphs; glyphIndex++) {
		const name = glyphNames[glyphIndex];
		const stdIndex = MAC_GLYPH_NAME_TO_INDEX.get(name);
		const offset = stdIndex - glyphIndex;
		writer.int8(offset);
	}

	return writer.toArray();
}
