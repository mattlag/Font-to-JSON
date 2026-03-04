/**
 * Font-to-JSON : OTF name table
 * Naming Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/name
 *
 * Variable-size table. Contains multilingual strings associated with the font:
 * copyright notices, family/subfamily names, version strings, PostScript names, etc.
 *
 * Supports version 0 (platform-specific language IDs only) and
 * version 1 (adds language-tag records for BCP 47 language tags).
 *
 * String encoding varies by platform:
 *   - platformID 0 (Unicode) → UTF-16BE
 *   - platformID 1 (Macintosh), encodingID 0 (Roman) → MacRoman
 *   - platformID 3 (Windows) → UTF-16BE (except encodingIDs 2-5 use code pages)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ═══════════════════════════════════════════════════════════════════════════
//  STRING ENCODING / DECODING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MacRoman to Unicode mapping for the high range (0x80–0xFF).
 * Indices 0x00–0x7F map directly to the same Unicode code points.
 */
const MAC_ROMAN_HIGH = [
	0x00c4, 0x00c5, 0x00c7, 0x00c9, 0x00d1, 0x00d6, 0x00dc, 0x00e1, 0x00e0,
	0x00e2, 0x00e4, 0x00e3, 0x00e5, 0x00e7, 0x00e9, 0x00e8, 0x00ea, 0x00eb,
	0x00ed, 0x00ec, 0x00ee, 0x00ef, 0x00f1, 0x00f3, 0x00f2, 0x00f4, 0x00f6,
	0x00f5, 0x00fa, 0x00f9, 0x00fb, 0x00fc, 0x2020, 0x00b0, 0x00a2, 0x00a3,
	0x00a7, 0x2022, 0x00b6, 0x00df, 0x00ae, 0x00a9, 0x2122, 0x00b4, 0x00a8,
	0x2260, 0x00c6, 0x00d8, 0x221e, 0x00b1, 0x2264, 0x2265, 0x00a5, 0x00b5,
	0x2202, 0x2211, 0x220f, 0x03c0, 0x222b, 0x00aa, 0x00ba, 0x03a9, 0x00e6,
	0x00f8, 0x00bf, 0x00a1, 0x00ac, 0x221a, 0x0192, 0x2248, 0x2206, 0x00ab,
	0x00bb, 0x2026, 0x00a0, 0x00c0, 0x00c3, 0x00d5, 0x0152, 0x0153, 0x2013,
	0x2014, 0x201c, 0x201d, 0x2018, 0x2019, 0x00f7, 0x25ca, 0x00ff, 0x0178,
	0x2044, 0x20ac, 0x2039, 0x203a, 0xfb01, 0xfb02, 0x2021, 0x00b7, 0x201a,
	0x201e, 0x2030, 0x00c2, 0x00ca, 0x00c1, 0x00cb, 0x00c8, 0x00cd, 0x00ce,
	0x00cf, 0x00cc, 0x00d3, 0x00d4, 0xf8ff, 0x00d2, 0x00da, 0x00db, 0x00d9,
	0x0131, 0x02c6, 0x02dc, 0x00af, 0x02d8, 0x02d9, 0x02da, 0x00b8, 0x02dd,
	0x02db, 0x02c7,
];

/**
 * Build a reverse map: Unicode code point → MacRoman byte value.
 */
const UNICODE_TO_MAC_ROMAN = new Map();
for (let i = 0; i < 128; i++) {
	UNICODE_TO_MAC_ROMAN.set(i, i); // 0x00–0x7F identity
}
for (let i = 0; i < MAC_ROMAN_HIGH.length; i++) {
	UNICODE_TO_MAC_ROMAN.set(MAC_ROMAN_HIGH[i], 0x80 + i);
}

/**
 * Decode a byte array into a JS string, based on platformID and encodingID.
 *
 * @param {number[]} stringBytes - raw string bytes
 * @param {number} platformID
 * @param {number} encodingID
 * @returns {string}
 */
function decodeString(stringBytes, platformID, encodingID) {
	// Platform 0 (Unicode) and 3 (Windows) use UTF-16BE
	// (Windows encodingIDs 2-5 use code pages, but practically all modern
	//  fonts use encodingID 1 for BMP or 10 for full repertoire — both UTF-16BE)
	if (platformID === 0 || platformID === 3) {
		return decodeUtf16BE(stringBytes);
	}

	// Platform 1 (Macintosh), encodingID 0 (Roman)
	if (platformID === 1 && encodingID === 0) {
		return decodeMacRoman(stringBytes);
	}

	// Fallback: try UTF-16BE if length is even, else return hex representation
	if (stringBytes.length % 2 === 0) {
		return decodeUtf16BE(stringBytes);
	}

	// Last resort — store as hex string prefixed with "0x:" so it round-trips
	return (
		'0x:' + stringBytes.map((b) => b.toString(16).padStart(2, '0')).join('')
	);
}

/**
 * Encode a JS string into bytes based on platformID and encodingID.
 *
 * @param {string} str
 * @param {number} platformID
 * @param {number} encodingID
 * @returns {number[]}
 */
function encodeString(str, platformID, encodingID) {
	// Hex-escape round-trip
	if (str.startsWith('0x:')) {
		const hex = str.slice(3);
		const bytes = [];
		for (let i = 0; i < hex.length; i += 2) {
			bytes.push(parseInt(hex.slice(i, i + 2), 16));
		}
		return bytes;
	}

	if (platformID === 0 || platformID === 3) {
		return encodeUtf16BE(str);
	}

	if (platformID === 1 && encodingID === 0) {
		return encodeMacRoman(str);
	}

	// Fallback: UTF-16BE
	return encodeUtf16BE(str);
}

/**
 * Decode UTF-16BE bytes to a JS string.
 * Handles surrogate pairs for characters outside the BMP.
 */
function decodeUtf16BE(bytes) {
	const chars = [];
	for (let i = 0; i + 1 < bytes.length; i += 2) {
		const code = (bytes[i] << 8) | bytes[i + 1];
		chars.push(code);
	}
	return String.fromCharCode(...chars);
}

/**
 * Encode a JS string to UTF-16BE bytes.
 */
function encodeUtf16BE(str) {
	const bytes = [];
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		bytes.push((code >> 8) & 0xff, code & 0xff);
	}
	return bytes;
}

/**
 * Decode MacRoman bytes to a JS string.
 */
function decodeMacRoman(bytes) {
	return bytes
		.map((b) => {
			if (b < 0x80) return String.fromCharCode(b);
			return String.fromCharCode(MAC_ROMAN_HIGH[b - 0x80]);
		})
		.join('');
}

/**
 * Encode a JS string to MacRoman bytes.
 * Characters not in MacRoman are replaced with '?'.
 */
function encodeMacRoman(str) {
	const bytes = [];
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		const mapped = UNICODE_TO_MAC_ROMAN.get(code);
		bytes.push(mapped !== undefined ? mapped : 0x3f); // '?' fallback
	}
	return bytes;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PARSING  (binary → JSON)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a name table from raw bytes.
 *
 * Version 0 layout:
 *   uint16   version         — 0
 *   uint16   count           — number of name records
 *   Offset16 storageOffset   — offset to start of string storage
 *   NameRecord[count]        — 12 bytes each
 *   (string storage)
 *
 * Version 1 adds after the name records:
 *   uint16         langTagCount
 *   LangTagRecord[langTagCount]  — 4 bytes each (uint16 length, Offset16 offset)
 *   (string storage)
 *
 * NameRecord (12 bytes):
 *   uint16   platformID
 *   uint16   encodingID
 *   uint16   languageID
 *   uint16   nameID
 *   uint16   length         — string length in bytes
 *   Offset16 stringOffset   — from start of storage area
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseName(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint16();
	const count = reader.uint16();
	const storageOffset = reader.uint16();

	// Read name records
	const nameRecords = [];
	for (let i = 0; i < count; i++) {
		nameRecords.push({
			platformID: reader.uint16(),
			encodingID: reader.uint16(),
			languageID: reader.uint16(),
			nameID: reader.uint16(),
			length: reader.uint16(),
			stringOffset: reader.uint16(),
		});
	}

	// Version 1: language-tag records
	let langTagRecords = [];
	if (version === 1) {
		const langTagCount = reader.uint16();
		for (let i = 0; i < langTagCount; i++) {
			const length = reader.uint16();
			const langTagOffset = reader.uint16();
			// Language-tag strings are always UTF-16BE
			const strBytes = rawBytes.slice(
				storageOffset + langTagOffset,
				storageOffset + langTagOffset + length,
			);
			langTagRecords.push({
				tag: decodeUtf16BE(strBytes),
			});
		}
	}

	// Decode strings from storage
	const names = nameRecords.map((rec) => {
		const strBytes = rawBytes.slice(
			storageOffset + rec.stringOffset,
			storageOffset + rec.stringOffset + rec.length,
		);
		return {
			platformID: rec.platformID,
			encodingID: rec.encodingID,
			languageID: rec.languageID,
			nameID: rec.nameID,
			value: decodeString(strBytes, rec.platformID, rec.encodingID),
		};
	});

	const result = { version, names };
	if (version === 1 && langTagRecords.length > 0) {
		result.langTagRecords = langTagRecords;
	}
	return result;
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING  (JSON → binary)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Write a name table JSON object back to raw bytes.
 *
 * @param {object} table - parsed name table
 * @returns {number[]}
 */
export function writeName(table) {
	const { version, names, langTagRecords = [] } = table;

	// Encode all name strings
	const encodedNames = names.map((rec) => ({
		platformID: rec.platformID,
		encodingID: rec.encodingID,
		languageID: rec.languageID,
		nameID: rec.nameID,
		bytes: encodeString(rec.value, rec.platformID, rec.encodingID),
	}));

	// Encode language-tag strings (always UTF-16BE)
	const encodedLangTags = langTagRecords.map((lt) => encodeUtf16BE(lt.tag));

	// Compute sizes
	const headerSize = 6; // version(2) + count(2) + storageOffset(2)
	const nameRecordSize = 12;
	const langTagHeaderSize = version === 1 ? 2 : 0; // langTagCount
	const langTagRecordSize = 4; // length(2) + offset(2)
	const langTagRecordsSize =
		version === 1
			? langTagHeaderSize + langTagRecords.length * langTagRecordSize
			: 0;

	const storageOffset =
		headerSize + encodedNames.length * nameRecordSize + langTagRecordsSize;

	// Build string storage — deduplicate identical byte sequences
	const stringPool = [];
	let storageLength = 0;
	const stringOffsetMap = new Map(); // key: stringBytes as comma-separated → offset

	function getStringOffset(bytes) {
		const key = bytes.join(',');
		if (stringOffsetMap.has(key)) {
			return stringOffsetMap.get(key);
		}
		const offset = storageLength;
		stringOffsetMap.set(key, offset);
		stringPool.push(bytes);
		storageLength += bytes.length;
		return offset;
	}

	// Resolve string offsets for name records
	const nameEntries = encodedNames.map((rec) => ({
		...rec,
		stringOffset: getStringOffset(rec.bytes),
		stringLength: rec.bytes.length,
	}));

	// Resolve string offsets for language-tag records
	const langTagEntries = encodedLangTags.map((bytes) => ({
		stringOffset: getStringOffset(bytes),
		stringLength: bytes.length,
	}));

	// Write binary
	const totalSize = storageOffset + storageLength;
	const writer = new DataWriter(totalSize);

	// Header
	writer.uint16(version);
	writer.uint16(encodedNames.length);
	writer.uint16(storageOffset);

	// Name records
	for (const entry of nameEntries) {
		writer
			.uint16(entry.platformID)
			.uint16(entry.encodingID)
			.uint16(entry.languageID)
			.uint16(entry.nameID)
			.uint16(entry.stringLength)
			.uint16(entry.stringOffset);
	}

	// Version 1: language-tag records
	if (version === 1) {
		writer.uint16(langTagEntries.length);
		for (const entry of langTagEntries) {
			writer.uint16(entry.stringLength).uint16(entry.stringOffset);
		}
	}

	// String storage
	for (const bytes of stringPool) {
		writer.rawBytes(bytes);
	}

	return writer.toArray();
}
