/**
 * Font Flux JS : CFF (Compact Font Format) v1 table parser / writer.
 *
 * Spec: Adobe Technical Note #5176 — The Compact Font Format Specification.
 *
 * CFF binary layout (offsets from start of CFF data):
 *   Header            4 bytes (majorVersion, minorVersion, hdrSize, offSize)
 *   Name INDEX        font name(s)
 *   Top DICT INDEX    per-font Top-level dictionaries
 *   String INDEX      user-defined strings (SID ≥ 391)
 *   Global Subr INDEX shared subroutines
 *   — per-font data (offsets stored in Top DICT) —
 *   Charsets           glyph-name assignments
 *   Encodings          character encoding
 *   CharStrings INDEX  glyph outlines (stored as raw bytes)
 *   Private DICT       per-font hinting parameters
 *   Local Subr INDEX   (offset relative to Private DICT start)
 *   FDArray INDEX      (CIDFont only)
 *   FDSelect           (CIDFont only)
 */

import {
	CFF1_PRIVATE_DICT_OPS,
	CFF1_PRIVATE_DICT_OPS_BY_NAME,
	CFF1_TOP_DICT_OPS,
	CFF1_TOP_DICT_OPS_BY_NAME,
	decodeDICT,
	dictEntriesToObject,
	encodeNumber,
	objectToDictEntries,
	parseCharset,
	parseEncoding,
	parseFDSelect,
	parseINDEXv1,
	writeCharset,
	writeFDSelect,
	writeINDEXv1,
} from './cff_common.js';

// -- Operators whose operands contain binary offsets and must use fixed-width
//    (5-byte int32) encoding to keep Top DICT size deterministic. --
const TOP_DICT_OFFSET_OPS = new Set([
	15, // charset
	16, // Encoding
	17, // CharStrings
	18, // Private  (size + offset — both forced)
	0x0c24, // FDArray
	0x0c25, // FDSelect
]);

const PRIVATE_DICT_OFFSET_OPS = new Set([
	19, // Subrs  (relative offset from Private start)
]);

// ===========================================================================
//  Helpers — DICT encoding with forced int32 for offset-bearing operators
// ===========================================================================

/**
 * Encode DICT entries, forcing 5-byte int32 encoding for operators in
 * `offsetOps` so that total byte length is independent of actual offset values.
 */
function encodeDICTForced(entries, offsetOps) {
	const result = [];
	for (const { operator, operands } of entries) {
		const forced = offsetOps.has(operator);
		for (const val of operands) {
			if (forced && Number.isInteger(val)) {
				result.push(
					29,
					(val >>> 24) & 0xff,
					(val >>> 16) & 0xff,
					(val >>> 8) & 0xff,
					val & 0xff,
				);
			} else {
				result.push(...encodeNumber(val));
			}
		}
		if (operator >= 0x0c00) {
			result.push(12, operator & 0xff);
		} else {
			result.push(operator);
		}
	}
	return result;
}

// -- String / byte conversions --------------------------------------------

function stringToBytes(str) {
	const arr = [];
	for (let i = 0; i < str.length; i++) arr.push(str.charCodeAt(i));
	return arr;
}

function bytesToString(bytes) {
	return String.fromCharCode(...bytes);
}

// ===========================================================================
//  PARSE
// ===========================================================================

/**
 * Parse a CFF v1 table.
 *
 * @param {number[]} rawArray — raw table bytes
 * @param {object}   [_tables] — previously-parsed tables (unused)
 * @returns {object}  JSON-friendly CFF structure
 */
export function parseCFF(rawArray, _tables) {
	const data = new Uint8Array(rawArray);

	// -- 1. Header ------------------------------------------------------
	const majorVersion = data[0];
	const minorVersion = data[1];
	const hdrSize = data[2];
	// data[3] is the header's offSize field — informational only

	// -- 2. Name INDEX --------------------------------------------------
	let pos = hdrSize;
	const nameIdx = parseINDEXv1(data, pos);
	pos += nameIdx.totalBytes;

	const names = nameIdx.items.map(bytesToString);

	// -- 3. Top DICT INDEX ----------------------------------------------
	const topDictIdx = parseINDEXv1(data, pos);
	pos += topDictIdx.totalBytes;

	// -- 4. String INDEX ------------------------------------------------
	const stringIdx = parseINDEXv1(data, pos);
	pos += stringIdx.totalBytes;

	const strings = stringIdx.items.map(bytesToString);

	// -- 5. Global Subr INDEX -------------------------------------------
	const globalSubrIdx = parseINDEXv1(data, pos);

	const globalSubrs = globalSubrIdx.items.map((item) => Array.from(item));

	// -- 6. Per-font data -----------------------------------------------
	const fonts = topDictIdx.items.map((raw) => parseCFFFont(data, raw));

	return {
		majorVersion,
		minorVersion,
		names,
		strings,
		globalSubrs,
		fonts,
	};
}

/**
 * Parse one font's data from the CFF block.
 *
 * @param {Uint8Array} data — full CFF data
 * @param {Uint8Array} topDictRaw — raw bytes of this font's Top DICT
 * @returns {object}
 */
function parseCFFFont(data, topDictRaw) {
	// Decode Top DICT entries -> named key-value object
	const rawEntries = decodeDICT(topDictRaw, 0, topDictRaw.length);
	const topDict = dictEntriesToObject(rawEntries, CFF1_TOP_DICT_OPS);

	// -- Extract offset-based fields (remove from topDict) --------------
	const charStringsOffset = topDict.CharStrings;
	const charsetOffset = topDict.charset ?? 0;
	const encodingOffset = topDict.Encoding ?? 0;
	const privateInfo = topDict.Private; // [size, offset] or undefined

	delete topDict.CharStrings;
	delete topDict.charset;
	delete topDict.Encoding;
	delete topDict.Private;

	// CID-specific offsets
	const fdArrayOffset = topDict.FDArray;
	const fdSelectOffset = topDict.FDSelect;
	delete topDict.FDArray;
	delete topDict.FDSelect;

	// == CharStrings INDEX ==============================================
	let charStrings = [];
	if (charStringsOffset !== undefined) {
		const csIdx = parseINDEXv1(data, charStringsOffset);
		charStrings = csIdx.items.map((item) => Array.from(item));
	}
	const numGlyphs = charStrings.length;

	// == Charset ========================================================
	const charset = parseCharset(data, charsetOffset, numGlyphs);

	// == Encoding =======================================================
	const encoding = parseEncoding(data, encodingOffset);

	// -- Private DICT + Local Subrs -------------------------------------
	let privateDict = {};
	let localSubrs = [];

	if (Array.isArray(privateInfo) && privateInfo.length === 2) {
		const [privSize, privOffset] = privateInfo;
		const privEntries = decodeDICT(data, privOffset, privOffset + privSize);
		privateDict = dictEntriesToObject(privEntries, CFF1_PRIVATE_DICT_OPS);

		if (privateDict.Subrs !== undefined) {
			const lsIdx = parseINDEXv1(data, privOffset + privateDict.Subrs);
			localSubrs = lsIdx.items.map((item) => Array.from(item));
			delete privateDict.Subrs;
		}
	}

	// == CIDFont extras =================================================
	const isCIDFont = topDict.ROS !== undefined;
	let fdArray;
	let fdSelect;

	if (isCIDFont) {
		if (fdArrayOffset !== undefined) {
			const fdIdx = parseINDEXv1(data, fdArrayOffset);
			fdArray = fdIdx.items.map((dictRaw) => {
				const entries = decodeDICT(dictRaw, 0, dictRaw.length);
				const fd = dictEntriesToObject(entries, CFF1_TOP_DICT_OPS);

				// Each Font DICT may reference a Private DICT
				let fdPrivate = {};
				let fdLocalSubrs = [];
				if (Array.isArray(fd.Private) && fd.Private.length === 2) {
					const [ps, po] = fd.Private;
					const pe = decodeDICT(data, po, po + ps);
					fdPrivate = dictEntriesToObject(pe, CFF1_PRIVATE_DICT_OPS);
					if (fdPrivate.Subrs !== undefined) {
						const lsi = parseINDEXv1(data, po + fdPrivate.Subrs);
						fdLocalSubrs = lsi.items.map((item) => Array.from(item));
						delete fdPrivate.Subrs;
					}
					delete fd.Private;
				}

				return {
					fontDict: fd,
					privateDict: fdPrivate,
					localSubrs: fdLocalSubrs,
				};
			});
		}

		if (fdSelectOffset !== undefined) {
			fdSelect = parseFDSelect(data, fdSelectOffset, numGlyphs);
		}
	}

	// == Assemble result ================================================
	const font = {
		topDict,
		charset,
		encoding,
		charStrings,
		privateDict,
		localSubrs,
	};

	if (isCIDFont) {
		font.isCIDFont = true;
		if (fdArray) font.fdArray = fdArray;
		if (fdSelect) font.fdSelect = fdSelect;
	}

	return font;
}

// ===========================================================================
//  WRITE
// ===========================================================================

/**
 * Write a CFF v1 table from a parsed JSON object.
 *
 * @param {object} tableData — CFF JSON structure (as produced by parseCFF)
 * @returns {number[]}
 */
export function writeCFF(tableData) {
	const {
		majorVersion = 1,
		minorVersion = 0,
		names = [],
		strings = [],
		globalSubrs = [],
		fonts = [],
	} = tableData;

	// -- 1. Encode fixed-content sections -------------------------------
	const headerBytes = [majorVersion, minorVersion, 4, 4];

	const nameIndexBytes = writeINDEXv1(names.map(stringToBytes));
	const stringIndexBytes = writeINDEXv1(strings.map(stringToBytes));
	const globalSubrBytes = writeINDEXv1(
		globalSubrs.map((s) => new Uint8Array(s)),
	);

	// -- 2. Pre-compute per-font data sections --------------------------
	//    Each font produces an ordered list of byte sections and tells us
	//    the relative offsets for the Top DICT entries.
	const fontBuilds = fonts.map((font) => buildFontSections(font));

	// -- 3. Build Top DICTs with dummy offsets (to measure INDEX size) --
	const dummyTopDicts = fonts.map((font, i) =>
		buildTopDictBytes(font, fontBuilds[i], /* baseOffset */ 0),
	);
	const dummyTopDictIndexBytes = writeINDEXv1(dummyTopDicts);

	// -- 4. Compute real baseOffset for font data -----------------------
	const fontDataStart =
		headerBytes.length +
		nameIndexBytes.length +
		dummyTopDictIndexBytes.length +
		stringIndexBytes.length +
		globalSubrBytes.length;

	// -- 5. Build real Top DICTs with correct offsets -------------------
	let offset = fontDataStart;
	const realTopDicts = fonts.map((font, i) => {
		const td = buildTopDictBytes(font, fontBuilds[i], offset);
		offset += fontBuilds[i].totalSize;
		return td;
	});
	const topDictIndexBytes = writeINDEXv1(realTopDicts);

	// Verify INDEX size matches (guaranteed by forced int32 encoding)
	if (topDictIndexBytes.length !== dummyTopDictIndexBytes.length) {
		throw new Error(
			'CFF Top DICT INDEX size mismatch — this should not happen with forced int32 offsets',
		);
	}

	// -- 6. Assemble ----------------------------------------------------
	const result = [
		...headerBytes,
		...nameIndexBytes,
		...topDictIndexBytes,
		...stringIndexBytes,
		...globalSubrBytes,
	];

	for (const fb of fontBuilds) {
		for (const section of fb.sections) {
			for (let i = 0; i < section.length; i++) result.push(section[i]);
		}
	}

	return result;
}

// === Font section builder ================================================

/**
 * Build all per-font data sections and compute relative offsets.
 *
 * Returns:
 *   sections   — ordered array of byte arrays (concatenated in the output)
 *   totalSize  — sum of all section byte lengths
 *   offsets    — { charStrings, charset, encoding, privateOffset, privateSize,
 *                  fdArray, fdSelect }  all relative to baseOffset
 */
function buildFontSections(font) {
	const sections = [];
	const offsets = {};
	let cursor = 0;

	// == CharStrings INDEX ==============================================
	const csItems = (font.charStrings || []).map((s) => new Uint8Array(s));
	const csBytes = writeINDEXv1(csItems);
	offsets.charStrings = cursor;
	sections.push(csBytes);
	cursor += csBytes.length;

	// == Charset ========================================================
	const charsetVal = font.charset;
	if (typeof charsetVal === 'string') {
		// Predefined charset — offset stored directly in Top DICT
		offsets.charset =
			charsetVal === 'ISOAdobe' ? 0 : charsetVal === 'Expert' ? 1 : 2;
		offsets.charsetIsPredefined = true;
	} else {
		const csData = writeCharset(charsetVal || []);
		offsets.charset = cursor;
		offsets.charsetIsPredefined = false;
		sections.push(csData);
		cursor += csData.length;
	}

	// == Encoding =======================================================
	const encVal = font.encoding;
	if (typeof encVal === 'string') {
		offsets.encoding = encVal === 'Standard' ? 0 : 1;
		offsets.encodingIsPredefined = true;
	} else if (encVal && typeof encVal === 'object') {
		const encData = writeEncodingData(encVal);
		offsets.encoding = cursor;
		offsets.encodingIsPredefined = false;
		sections.push(encData);
		cursor += encData.length;
	} else {
		offsets.encoding = 0;
		offsets.encodingIsPredefined = true;
	}

	// -- Private DICT + Local Subrs -------------------------------------
	const privEntries = objectToDictEntries(
		font.privateDict || {},
		CFF1_PRIVATE_DICT_OPS_BY_NAME,
	);

	// Local Subrs go immediately after Private DICT
	let localSubrBytes = null;
	if (font.localSubrs && font.localSubrs.length > 0) {
		localSubrBytes = writeINDEXv1(
			font.localSubrs.map((s) => new Uint8Array(s)),
		);
	}

	// If there are local subrs, add Subrs entry to Private DICT
	// The Subrs offset is Private DICT size (relative to Private start)
	if (localSubrBytes) {
		// Compute size of Private DICT first (without Subrs) to know the offset
		const privWithoutSubrs = encodeDICTForced(
			privEntries,
			PRIVATE_DICT_OFFSET_OPS,
		);
		// Subrs offset = size of Private DICT (they follow immediately)
		const subsOffset = privWithoutSubrs.length + 6; // +6 = 5-byte int32 + 1-byte operator
		privEntries.push({
			operator: CFF1_PRIVATE_DICT_OPS_BY_NAME.Subrs,
			operands: [subsOffset],
		});
	}

	const privDictBytes = encodeDICTForced(privEntries, PRIVATE_DICT_OFFSET_OPS);

	offsets.privateOffset = cursor;
	offsets.privateSize = privDictBytes.length;
	sections.push(privDictBytes);
	cursor += privDictBytes.length;

	if (localSubrBytes) {
		sections.push(localSubrBytes);
		cursor += localSubrBytes.length;
	}

	// -- CIDFont: FDArray + FDSelect ------------------------------------
	if (font.isCIDFont) {
		if (font.fdSelect) {
			const fdSelBytes = writeFDSelect(font.fdSelect);
			offsets.fdSelect = cursor;
			sections.push(fdSelBytes);
			cursor += fdSelBytes.length;
		}
		if (font.fdArray) {
			const fdDicts = font.fdArray.map((fd) => {
				const entries = objectToDictEntries(
					fd.fontDict || {},
					CFF1_TOP_DICT_OPS_BY_NAME,
				);
				// Add Private entry for this Font DICT
				// Private DICT goes inline after FDArray (this is a simplification)
				// For now, encode without Private reference — full CIDFont writing
				// is complex and can be expanded later.
				return encodeDICTForced(entries, TOP_DICT_OFFSET_OPS);
			});
			const fdArrayBytes = writeINDEXv1(fdDicts);
			offsets.fdArray = cursor;
			sections.push(fdArrayBytes);
			cursor += fdArrayBytes.length;
		}
	}

	return { sections, totalSize: cursor, offsets };
}

/**
 * Build Top DICT bytes for one font, inserting the correct offsets.
 *
 * @param {object} font — the font JSON object
 * @param {object} build — from buildFontSections()
 * @param {number} baseOffset — absolute offset of this font's data start
 * @returns {number[]}
 */
function buildTopDictBytes(font, build, baseOffset) {
	const o = build.offsets;

	// Start with the non-offset Top DICT entries
	const entries = objectToDictEntries(
		font.topDict || {},
		CFF1_TOP_DICT_OPS_BY_NAME,
	);

	// Add offset-based entries
	entries.push({
		operator: CFF1_TOP_DICT_OPS_BY_NAME.CharStrings,
		operands: [baseOffset + o.charStrings],
	});

	if (o.charsetIsPredefined) {
		// Predefined charset: store the predefined offset value (0, 1, or 2)
		if (o.charset !== 0) {
			// 0 is the default — no need to emit
			entries.push({
				operator: CFF1_TOP_DICT_OPS_BY_NAME.charset,
				operands: [o.charset],
			});
		}
	} else {
		entries.push({
			operator: CFF1_TOP_DICT_OPS_BY_NAME.charset,
			operands: [baseOffset + o.charset],
		});
	}

	if (o.encodingIsPredefined) {
		if (o.encoding !== 0) {
			entries.push({
				operator: CFF1_TOP_DICT_OPS_BY_NAME.Encoding,
				operands: [o.encoding],
			});
		}
	} else {
		entries.push({
			operator: CFF1_TOP_DICT_OPS_BY_NAME.Encoding,
			operands: [baseOffset + o.encoding],
		});
	}

	entries.push({
		operator: CFF1_TOP_DICT_OPS_BY_NAME.Private,
		operands: [o.privateSize, baseOffset + o.privateOffset],
	});

	if (font.isCIDFont) {
		if (o.fdArray !== undefined) {
			entries.push({
				operator: CFF1_TOP_DICT_OPS_BY_NAME.FDArray,
				operands: [baseOffset + o.fdArray],
			});
		}
		if (o.fdSelect !== undefined) {
			entries.push({
				operator: CFF1_TOP_DICT_OPS_BY_NAME.FDSelect,
				operands: [baseOffset + o.fdSelect],
			});
		}
	}

	return encodeDICTForced(entries, TOP_DICT_OFFSET_OPS);
}

// == Encoding writer ======================================================

/**
 * Write an Encoding data block from a parsed encoding object.
 * @param {{ format: number, codes: number[], hasSupplement: boolean }} enc
 * @returns {number[]}
 */
function writeEncodingData(enc) {
	const { format = 0, codes = [], hasSupplement = false } = enc;
	const result = [];

	const formatByte = format | (hasSupplement ? 0x80 : 0);

	if (format === 0) {
		result.push(formatByte);
		result.push(codes.length);
		for (const code of codes) result.push(code);
	} else if (format === 1) {
		// Build ranges
		const ranges = [];
		if (codes.length > 0) {
			let first = codes[0];
			let count = 0;
			for (let i = 1; i < codes.length; i++) {
				if (codes[i] === first + count + 1) {
					count++;
				} else {
					ranges.push([first, count]);
					first = codes[i];
					count = 0;
				}
			}
			ranges.push([first, count]);
		}
		result.push(formatByte);
		result.push(ranges.length);
		for (const [first, nLeft] of ranges) {
			result.push(first, nLeft);
		}
	}

	return result;
}
