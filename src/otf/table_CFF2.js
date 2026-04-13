/**
 * Font Flux JS : CFF2 (Compact Font Format version 2) table parser / writer.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cff2
 *
 * CFF2 binary layout (offsets from start of CFF2 data):
 *   Header           5 bytes (majorVersion, minorVersion, headerSize, topDictLength)
 *   Top DICT         inline (not in an INDEX; size = topDictLength)
 *   Global Subr INDEX
 *   — offset-based sections (referenced by Top DICT) —
 *   CharStrings INDEX
 *   Font DICT INDEX
 *   FDSelect           (optional)
 *   VariationStore     (optional)
 *   Private DICT(s)    (one per Font DICT)
 *   Local Subr INDEX(es)
 *
 * Key differences from CFF v1:
 *   • No Name INDEX — font name comes from the 'name' table
 *   • No String INDEX — no SID-based strings
 *   • No Encoding — character mapping comes from the 'cmap' table
 *   • INDEX uses uint32 count (not uint16)
 *   • Top DICT has only 5 possible operators
 *   • Header is 5 bytes (topDictLength replaces offSize)
 */

import {
	parseItemVariationStore,
	writeItemVariationStore,
} from '../sfnt/item_variation_store.js';
import {
	CFF2_FONT_DICT_OPS,
	CFF2_PRIVATE_DICT_OPS,
	CFF2_TOP_DICT_OPS,
	CFF2_TOP_DICT_OPS_BY_NAME,
	decodeDICT,
	dictEntriesToObject,
	encodeNumber,
	objectToDictEntries,
	parseFDSelect,
	parseINDEXv2,
	writeFDSelect,
	writeINDEXv2,
} from './cff_common.js';

// -- CFF2 VariationStore helpers ------------------------------------------

/**
 * Wrap an ItemVariationStore in the CFF2 length-prefixed format.
 * CFF2 VariationStore = uint16 size (of following IVS body) + IVS bytes.
 */
function buildCFF2VariationStoreBytes(ivs) {
	const ivsBytes = writeItemVariationStore(ivs);
	const bodyLen = ivsBytes.length;
	const result = new Uint8Array(2 + bodyLen);
	result[0] = (bodyLen >> 8) & 0xff;
	result[1] = bodyLen & 0xff;
	result.set(new Uint8Array(ivsBytes), 2);
	return result;
}

// -- Reverse lookup tables ------------------------------------------------

const CFF2_FONT_DICT_OPS_BY_NAME = Object.fromEntries(
	Object.entries(CFF2_FONT_DICT_OPS).map(([k, v]) => [v, Number(k)]),
);

const CFF2_PRIVATE_DICT_OPS_BY_NAME = Object.fromEntries(
	Object.entries(CFF2_PRIVATE_DICT_OPS).map(([k, v]) => [v, Number(k)]),
);

// -- Operators with offset operands (forced to 5-byte int32) --------------

const TOP_DICT_OFFSET_OPS = new Set([
	17, // CharStrings
	24, // VariationStore
	0x0c24, // FDArray
	0x0c25, // FDSelect
]);

const FONT_DICT_OFFSET_OPS = new Set([
	18, // Private  (size + offset)
]);

const PRIVATE_DICT_OFFSET_OPS = new Set([
	19, // Subrs  (relative offset)
]);

// ===========================================================================
//  Helpers — DICT encoding with forced int32 for offset-bearing operators
// ===========================================================================

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

// ===========================================================================
//  PARSE
// ===========================================================================

/**
 * Parse a CFF2 table.
 *
 * @param {number[]} rawArray — raw table bytes
 * @param {object}   [_tables] — previously-parsed tables (unused)
 * @returns {object}  JSON-friendly CFF2 structure
 */
export function parseCFF2(rawArray, _tables) {
	const data = new Uint8Array(rawArray);

	// -- 1. Header (5 bytes) --------------------------------------------
	const majorVersion = data[0]; // 2
	const minorVersion = data[1]; // 0
	const headerSize = data[2]; // typically 5
	const topDictLength = (data[3] << 8) | data[4];

	// -- 2. Top DICT (inline, not in an INDEX) --------------------------
	const topDictStart = headerSize;
	const topDictEnd = topDictStart + topDictLength;
	const rawEntries = decodeDICT(data, topDictStart, topDictEnd);
	const topDict = dictEntriesToObject(rawEntries, CFF2_TOP_DICT_OPS);

	// Extract offset-based entries
	const charStringsOffset = topDict.CharStrings;
	const variationStoreOffset = topDict.VariationStore;
	const fdArrayOffset = topDict.FDArray;
	const fdSelectOffset = topDict.FDSelect;

	delete topDict.CharStrings;
	delete topDict.VariationStore;
	delete topDict.FDArray;
	delete topDict.FDSelect;

	// -- 3. Global Subr INDEX -------------------------------------------
	const globalSubrIdx = parseINDEXv2(data, topDictEnd);
	const globalSubrs = globalSubrIdx.items.map((item) => Array.from(item));

	// -- 4. CharStrings INDEX -------------------------------------------
	let charStrings = [];
	if (charStringsOffset !== undefined) {
		const csIdx = parseINDEXv2(data, charStringsOffset);
		charStrings = csIdx.items.map((item) => Array.from(item));
	}
	const numGlyphs = charStrings.length;

	// -- 5. Font DICT INDEX ---------------------------------------------
	let fontDicts = [];
	if (fdArrayOffset !== undefined) {
		const fdIdx = parseINDEXv2(data, fdArrayOffset);
		fontDicts = fdIdx.items.map((dictRaw) => {
			const entries = decodeDICT(dictRaw, 0, dictRaw.length);
			const fd = dictEntriesToObject(entries, {
				...CFF2_FONT_DICT_OPS,
				...CFF2_TOP_DICT_OPS, // Font DICTs can also have FontMatrix
			});

			// Resolve Private DICT
			let privateDict = {};
			let localSubrs = [];
			if (Array.isArray(fd.Private) && fd.Private.length === 2) {
				const [privSize, privOffset] = fd.Private;
				const pe = decodeDICT(data, privOffset, privOffset + privSize);
				privateDict = dictEntriesToObject(pe, CFF2_PRIVATE_DICT_OPS);

				if (privateDict.Subrs !== undefined) {
					const lsIdx = parseINDEXv2(data, privOffset + privateDict.Subrs);
					localSubrs = lsIdx.items.map((item) => Array.from(item));
					delete privateDict.Subrs;
				}
				delete fd.Private;
			}

			return {
				fontDict: fd,
				privateDict,
				localSubrs,
			};
		});
	}

	// -- 6. FDSelect ----------------------------------------------------
	let fdSelect = null;
	if (fdSelectOffset !== undefined && numGlyphs > 0) {
		fdSelect = parseFDSelect(data, fdSelectOffset, numGlyphs);
	}

	// -- 7. VariationStore (CFF2 wraps IVS with a uint16 length prefix) --
	let variationStore = null;
	if (variationStoreOffset !== undefined) {
		// CFF2 VariationStore: uint16 size (of following data), then IVS body
		const vsBodyLength =
			(data[variationStoreOffset] << 8) | data[variationStoreOffset + 1];
		variationStore = parseItemVariationStore(
			Array.from(
				data.slice(
					variationStoreOffset + 2,
					variationStoreOffset + 2 + vsBodyLength,
				),
			),
		);
	}

	return {
		majorVersion,
		minorVersion,
		topDict,
		globalSubrs,
		charStrings,
		fontDicts,
		fdSelect,
		variationStore,
	};
}

// ===========================================================================
//  WRITE
// ===========================================================================

/**
 * Write a CFF2 table from a parsed JSON object.
 *
 * @param {object} tableData — CFF2 JSON structure (as produced by parseCFF2)
 * @returns {number[]}
 */
export function writeCFF2(tableData) {
	const {
		majorVersion = 2,
		minorVersion = 0,
		topDict = {},
		globalSubrs = [],
		charStrings = [],
		fontDicts = [],
		fdSelect = null,
		variationStore = null,
	} = tableData;

	// -- 1. Encode sections that don't depend on offsets -----------------
	const globalSubrBytes = writeINDEXv2(
		globalSubrs.map((s) => new Uint8Array(s)),
	);

	const csBytes = writeINDEXv2(charStrings.map((s) => new Uint8Array(s)));

	// -- 2. Encode Font DICTs and their Private DICTs --------------------
	//    We need the Private DICT bytes and offsets before building
	//    the Font DICT INDEX, because Font DICTs reference them.
	//    We'll allocate Private DICTs after all other sections.

	// Build FDSelect bytes (if present)
	const fdSelectBytes = fdSelect ? writeFDSelect(fdSelect) : null;

	// Build VariationStore bytes (uint16 length prefix + IVS)
	const variationStoreBytes = variationStore
		? buildCFF2VariationStoreBytes(variationStore)
		: null;

	// -- 3. Compute layout -----------------------------------------------
	//    Header (5 bytes) + TopDICT + GlobalSubrINDEX + data sections
	//
	//    Because TopDICT size must be known for the header and everything
	//    after it depends on TopDICT, we use forced int32 offsets to make
	//    TopDICT size deterministic.

	// Build dummy TopDICT to measure its size
	const dummyTopDictBytes = buildCFF2TopDict(topDict, {
		charStrings: 0,
		fdArray: fontDicts.length > 0 ? 0 : undefined,
		fdSelect: fdSelect ? 0 : undefined,
		variationStore: variationStore ? 0 : undefined,
	});
	const topDictLength = dummyTopDictBytes.length;

	// Offsets of sections after GlobalSubrINDEX
	const headerSize = 5;
	const afterGlobalSubrs = headerSize + topDictLength + globalSubrBytes.length;

	// Layout of data sections (order):
	//   CharStrings INDEX
	//   FDSelect (if present)
	//   VariationStore (if present)
	//   Private DICTs + Local Subrs (one block per Font DICT)
	//   Font DICT INDEX (references above Private DICTs)

	let cursor = afterGlobalSubrs;

	const csOffset = cursor;
	cursor += csBytes.length;

	let fdSelectOffset;
	if (fdSelectBytes) {
		fdSelectOffset = cursor;
		cursor += fdSelectBytes.length;
	}

	let variationStoreOffset;
	if (variationStoreBytes) {
		variationStoreOffset = cursor;
		cursor += variationStoreBytes.length;
	}

	// Build Private DICTs + Local Subrs and record their offsets/sizes
	const privBlocks = fontDicts.map((fd) => {
		const privEntries = objectToDictEntries(
			fd.privateDict || {},
			CFF2_PRIVATE_DICT_OPS_BY_NAME,
		);

		let localSubrBytes = null;
		if (fd.localSubrs && fd.localSubrs.length > 0) {
			localSubrBytes = writeINDEXv2(
				fd.localSubrs.map((s) => new Uint8Array(s)),
			);
		}

		if (localSubrBytes) {
			const privWithout = encodeDICTForced(
				privEntries,
				PRIVATE_DICT_OFFSET_OPS,
			);
			const subsOffset = privWithout.length + 6; // 5-byte int32 + 1-byte operator
			privEntries.push({
				operator: 19, // Subrs
				operands: [subsOffset],
			});
		}

		const privBytes = encodeDICTForced(privEntries, PRIVATE_DICT_OFFSET_OPS);

		return {
			privBytes,
			localSubrBytes,
			totalSize:
				privBytes.length + (localSubrBytes ? localSubrBytes.length : 0),
		};
	});

	// Assign absolute offsets to Private DICTs
	const privOffsets = [];
	for (const pb of privBlocks) {
		privOffsets.push({ offset: cursor, size: pb.privBytes.length });
		cursor += pb.totalSize;
	}

	// Build Font DICT INDEX with correct Private references
	let fdArrayBytes = null;
	let fdArrayOffset;
	if (fontDicts.length > 0) {
		const fdDictItems = fontDicts.map((fd, i) => {
			// Start with non-Private entries from fontDict
			const entries = objectToDictEntries(fd.fontDict || {}, {
				...CFF2_FONT_DICT_OPS_BY_NAME,
				...CFF2_TOP_DICT_OPS_BY_NAME,
			});

			// Add Private entry
			entries.push({
				operator: 18, // Private
				operands: [privOffsets[i].size, privOffsets[i].offset],
			});

			return encodeDICTForced(entries, FONT_DICT_OFFSET_OPS);
		});

		fdArrayBytes = writeINDEXv2(fdDictItems);
		fdArrayOffset = cursor;
		cursor += fdArrayBytes.length;
	}

	// -- 4. Build real TopDICT with correct offsets ----------------------
	const realTopDictBytes = buildCFF2TopDict(topDict, {
		charStrings: csOffset,
		fdArray: fdArrayOffset,
		fdSelect: fdSelectOffset,
		variationStore: variationStoreOffset,
	});

	// Verify size matches
	if (realTopDictBytes.length !== topDictLength) {
		throw new Error(
			'CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets',
		);
	}

	// -- 5. Write header ------------------------------------------------
	const header = [
		majorVersion,
		minorVersion,
		headerSize,
		(topDictLength >> 8) & 0xff,
		topDictLength & 0xff,
	];

	// -- 6. Assemble ----------------------------------------------------
	const result = [
		...header,
		...realTopDictBytes,
		...globalSubrBytes,
		...csBytes,
	];

	if (fdSelectBytes) {
		for (let i = 0; i < fdSelectBytes.length; i++)
			result.push(fdSelectBytes[i]);
	}

	if (variationStoreBytes) {
		for (let i = 0; i < variationStoreBytes.length; i++)
			result.push(variationStoreBytes[i]);
	}

	for (const pb of privBlocks) {
		for (let i = 0; i < pb.privBytes.length; i++) result.push(pb.privBytes[i]);
		if (pb.localSubrBytes) {
			for (let i = 0; i < pb.localSubrBytes.length; i++)
				result.push(pb.localSubrBytes[i]);
		}
	}

	if (fdArrayBytes) {
		for (let i = 0; i < fdArrayBytes.length; i++) result.push(fdArrayBytes[i]);
	}

	return result;
}

// --- TopDICT builder -----------------------------------------------------

/**
 * Build CFF2 TopDICT bytes with the given offset values.
 */
function buildCFF2TopDict(topDict, offsets) {
	const entries = objectToDictEntries(topDict, CFF2_TOP_DICT_OPS_BY_NAME);

	// Add offset entries
	if (offsets.charStrings !== undefined) {
		entries.push({
			operator: CFF2_TOP_DICT_OPS_BY_NAME.CharStrings,
			operands: [offsets.charStrings],
		});
	}

	if (offsets.fdArray !== undefined) {
		entries.push({
			operator: CFF2_TOP_DICT_OPS_BY_NAME.FDArray,
			operands: [offsets.fdArray],
		});
	}

	if (offsets.fdSelect !== undefined) {
		entries.push({
			operator: CFF2_TOP_DICT_OPS_BY_NAME.FDSelect,
			operands: [offsets.fdSelect],
		});
	}

	if (offsets.variationStore !== undefined) {
		entries.push({
			operator: CFF2_TOP_DICT_OPS_BY_NAME.VariationStore,
			operands: [offsets.variationStore],
		});
	}

	return encodeDICTForced(entries, TOP_DICT_OFFSET_OPS);
}
