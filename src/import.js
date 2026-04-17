/**
 * Font Flux JS : Import
 * Reads binary font data and converts it to a JSON representation.
 */

import { interpretCharString } from './otf/charstring_interpreter.js';
import { parseCFF } from './otf/table_CFF.js';
import { parseCFF2 } from './otf/table_CFF2.js';
import { parseVORG } from './otf/table_VORG.js';
import { DataReader } from './reader.js';
import { parseAvar } from './sfnt/table_avar.js';
import { parseBASE } from './sfnt/table_BASE.js';
import { parseBdat } from './sfnt/table_bdat.js';
import { parseBloc } from './sfnt/table_bloc.js';
import { parseCBDT } from './sfnt/table_CBDT.js';
import { parseCBLC } from './sfnt/table_CBLC.js';
import { parseCmap } from './sfnt/table_cmap.js';
import { parseCOLR } from './sfnt/table_COLR.js';
import { parseCPAL } from './sfnt/table_CPAL.js';
import { parseDSIG } from './sfnt/table_DSIG.js';
import { parseEBDT } from './sfnt/table_EBDT.js';
import { parseEBLC } from './sfnt/table_EBLC.js';
import { parseEBSC } from './sfnt/table_EBSC.js';
import { parseFvar } from './sfnt/table_fvar.js';
import { parseGDEF } from './sfnt/table_GDEF.js';
import { parseGPOS } from './sfnt/table_GPOS.js';
import { parseGSUB } from './sfnt/table_GSUB.js';
import { parseHdmx } from './sfnt/table_hdmx.js';
import { parseHead } from './sfnt/table_head.js';
import { parseHhea } from './sfnt/table_hhea.js';
import { parseHmtx } from './sfnt/table_hmtx.js';
import { parseHVAR } from './sfnt/table_HVAR.js';
import { parseJSTF } from './sfnt/table_JSTF.js';
import { parseKern } from './sfnt/table_kern.js';
import { parseLtag } from './sfnt/table_ltag.js';
import { parseLTSH } from './sfnt/table_LTSH.js';
import { parseMATH } from './sfnt/table_MATH.js';
import { parseMaxp } from './sfnt/table_maxp.js';
import { parseMERG } from './sfnt/table_MERG.js';
import { parseMeta } from './sfnt/table_meta.js';
import { parseMVAR } from './sfnt/table_MVAR.js';
import { parseName } from './sfnt/table_name.js';
import { parseOS2 } from './sfnt/table_OS-2.js';
import { parsePCLT } from './sfnt/table_PCLT.js';
import { parsePost } from './sfnt/table_post.js';
import { parseSbix } from './sfnt/table_sbix.js';
import { parseSTAT } from './sfnt/table_STAT.js';
import { parseSVG } from './sfnt/table_SVG.js';
import { parseVDMX } from './sfnt/table_VDMX.js';
import { parseVhea } from './sfnt/table_vhea.js';
import { parseVmtx } from './sfnt/table_vmtx.js';
import { parseVVAR } from './sfnt/table_VVAR.js';
import { buildSimplified } from './simplify.js';
import { parseCvar } from './ttf/table_cvar.js';
import { parseCvt } from './ttf/table_cvt.js';
import { parseFpgm } from './ttf/table_fpgm.js';
import { parseGasp } from './ttf/table_gasp.js';
import { parseGlyf } from './ttf/table_glyf.js';
import { parseGvar } from './ttf/table_gvar.js';
import { parseLoca } from './ttf/table_loca.js';
import { parsePrep } from './ttf/table_prep.js';
import { unwrapWOFF1 } from './woff/woff1.js';
import { unwrapWOFF2 } from './woff/woff2.js';

/**
 * Registry of table parsers.
 * Each key is a table tag; the value is a function (number[], tables?) -> object.
 * Tables not listed here are stored as raw bytes.
 * Parsers may accept a second argument: the tables object (for cross-table deps).
 */
export const tableParsers = {
	cmap: parseCmap,
	head: parseHead,
	hhea: parseHhea,
	HVAR: parseHVAR,
	hmtx: parseHmtx,
	maxp: parseMaxp,
	MVAR: parseMVAR,
	name: parseName,
	hdmx: parseHdmx,
	BASE: parseBASE,
	JSTF: parseJSTF,
	MATH: parseMATH,
	MERG: parseMERG,
	meta: parseMeta,
	DSIG: parseDSIG,
	LTSH: parseLTSH,
	CBLC: parseCBLC,
	CBDT: parseCBDT,
	'OS/2': parseOS2,
	kern: parseKern,
	PCLT: parsePCLT,
	VDMX: parseVDMX,
	post: parsePost,
	STAT: parseSTAT,
	'CFF ': parseCFF,
	CFF2: parseCFF2,
	VORG: parseVORG,
	fvar: parseFvar,
	avar: parseAvar,
	loca: parseLoca,
	glyf: parseGlyf,
	gvar: parseGvar,
	GDEF: parseGDEF,
	GPOS: parseGPOS,
	GSUB: parseGSUB,
	'cvt ': parseCvt,
	cvar: parseCvar,
	fpgm: parseFpgm,
	prep: parsePrep,
	gasp: parseGasp,
	vhea: parseVhea,
	VVAR: parseVVAR,
	vmtx: parseVmtx,
	COLR: parseCOLR,
	CPAL: parseCPAL,
	EBLC: parseEBLC,
	EBDT: parseEBDT,
	EBSC: parseEBSC,
	bloc: parseBloc,
	bdat: parseBdat,
	sbix: parseSbix,
	ltag: parseLtag,
	'SVG ': parseSVG,
};

/**
 * Parse order — tables are parsed in this order so that cross-table
 * dependencies are satisfied (e.g. hmtx needs hhea.numberOfHMetrics).
 * Tables not in this list are parsed after those that are.
 */
export const tableParseOrder = [
	'head',
	'maxp',
	'fvar',
	'avar',
	'cvt ',
	'hhea',
	'cmap',
	'hmtx',
	'HVAR',
	'name',
	'BASE',
	'JSTF',
	'MATH',
	'STAT',
	'MVAR',
	'OS/2',
	'kern',
	'hdmx',
	'LTSH',
	'MERG',
	'meta',
	'DSIG',
	'PCLT',
	'VDMX',
	'post',
	'CFF ',
	'CFF2',
	'VORG',
	'loca',
	'glyf',
	'gvar',
	'cvar',
	'vhea',
	'vmtx',
	'VVAR',
	'CBLC',
	'CBDT',
	'EBLC',
	'EBDT',
	'EBSC',
	'bloc',
	'bdat',
	'sbix',
	'ltag',
];

/**
 * Import a font from binary data (ArrayBuffer) and return a simplified
 * JSON-friendly object.  This is the primary public API — it returns one
 * unified structure that serves as the single source of truth.
 *
 * @param {ArrayBuffer} buffer - Raw font file bytes.
 * @returns {object} Simplified font data.
 */
export function importFont(buffer) {
	if (!(buffer instanceof ArrayBuffer)) {
		throw new TypeError('importFont expects an ArrayBuffer');
	}

	const bytes = new Uint8Array(buffer);
	if (bytes.length >= 4) {
		const signature = String.fromCharCode(
			bytes[0],
			bytes[1],
			bytes[2],
			bytes[3],
		);
		if (signature === 'wOFF') {
			const { sfnt, metadata, privateData } = unwrapWOFF1(buffer);
			const result = importFont(sfnt);
			result._woff = { version: 1 };
			if (metadata) result._woff.metadata = metadata;
			if (privateData) result._woff.privateData = privateData;
			return result;
		}
		if (signature === 'wOF2') {
			const { sfnt, metadata, privateData } = unwrapWOFF2(buffer);
			const result = importFont(sfnt);
			result._woff = { version: 2 };
			if (metadata) result._woff.metadata = metadata;
			if (privateData) result._woff.privateData = privateData;
			return result;
		}
		if (signature === 'ttcf') {
			return importCollection(buffer);
		}
	}

	// CFF: majorVersion=1, minorVersion=0, hdrSize typically 4,
	// offSize 1-4.  Must check AFTER SFNT signatures (which start with
	// 0x00010000 or 'OTTO'/'wOFF'/'wOF2'/'ttcf').
	if (
		bytes.length >= 4 &&
		bytes[0] === 1 &&
		bytes[1] === 0 &&
		bytes[3] >= 1 &&
		bytes[3] <= 4
	) {
		return importCFF(buffer);
	}

	// PFB: binary PostScript Type 1 — starts with 0x80 segment marker
	if (
		bytes.length >= 6 &&
		bytes[0] === 0x80 &&
		(bytes[1] === 1 || bytes[1] === 2)
	) {
		return importPFB(buffer);
	}

	// PFA: ASCII PostScript Type 1 — starts with %!
	if (bytes.length >= 2 && bytes[0] === 0x25 && bytes[1] === 0x21) {
		return importPFA(buffer);
	}

	const raw = importFontTables(buffer);
	return buildSimplified(raw);
}

/**
 * Import a font from binary data and return the internal table-level
 * representation: `{ header, tables }`.
 *
 * This is NOT the public API — it exists for table-level unit tests and
 * internal use by the export pipeline.
 *
 * @param {ArrayBuffer} buffer - Raw font file bytes.
 * @returns {{ header: object, tables: object }}
 */
export function importFontTables(buffer) {
	if (!(buffer instanceof ArrayBuffer)) {
		throw new TypeError('importFontTables expects an ArrayBuffer');
	}

	const reader = new DataReader(new Uint8Array(buffer));
	const header = readFontHeader(reader);
	const tableDirectory = readTableDirectory(reader, header.numTables);
	const tables = extractTableData(buffer, tableDirectory);

	return { header, tables };
}

function importCollection(buffer) {
	const reader = new DataReader(new Uint8Array(buffer));
	const tag = reader.tag();
	if (tag !== 'ttcf') {
		throw new Error('Invalid TTC/OTC collection signature');
	}

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const numFonts = reader.uint32();
	const offsetTable = reader.array('uint32', numFonts);

	let dsigTag;
	let dsigLength;
	let dsigOffset;
	if (majorVersion >= 2) {
		dsigTag = reader.uint32();
		dsigLength = reader.uint32();
		dsigOffset = reader.uint32();
	}

	const fonts = offsetTable.map((sfntOffset) => {
		const sfntReader = new DataReader(new Uint8Array(buffer), sfntOffset);
		const header = readFontHeader(sfntReader);
		const tableDirectory = readTableDirectory(sfntReader, header.numTables);
		const normalizedTableDirectory = normalizeTtcTableDirectoryOffsets(
			buffer,
			tableDirectory,
			sfntOffset,
		);
		const tables = extractTableData(buffer, normalizedTableDirectory);
		const raw = { header, tables };
		return buildSimplified(raw);
	});

	const collection = {
		tag,
		majorVersion,
		minorVersion,
		numFonts,
	};
	if (majorVersion >= 2) {
		collection.dsigTag = dsigTag;
		collection.dsigLength = dsigLength;
		collection.dsigOffset = dsigOffset;
	}

	return { collection, fonts };
}

function normalizeTtcTableDirectoryOffsets(buffer, tableDirectory, sfntOffset) {
	const headEntry = tableDirectory.find((entry) => entry.tag === 'head');
	if (!headEntry) {
		return tableDirectory;
	}

	const absStart = headEntry.offset;
	const relStart = sfntOffset + headEntry.offset;
	const absInBounds = absStart + headEntry.length <= buffer.byteLength;
	const relInBounds = relStart + headEntry.length <= buffer.byteLength;

	if (!absInBounds && relInBounds) {
		return tableDirectory.map((entry) => ({
			...entry,
			offset: sfntOffset + entry.offset,
		}));
	}

	if (absInBounds && !relInBounds) {
		return tableDirectory;
	}

	if (!absInBounds && !relInBounds) {
		return tableDirectory;
	}

	const absHead = parseHead(
		Array.from(new Uint8Array(buffer, absStart, headEntry.length)),
	);
	const relHead = parseHead(
		Array.from(new Uint8Array(buffer, relStart, headEntry.length)),
	);

	const absLooksValid = absHead.magicNumber === 0x5f0f3cf5;
	const relLooksValid = relHead.magicNumber === 0x5f0f3cf5;

	if (relLooksValid && !absLooksValid) {
		return tableDirectory.map((entry) => ({
			...entry,
			offset: sfntOffset + entry.offset,
		}));
	}

	return tableDirectory;
}

/**
 * Read the top-level font file header (Offset Table).
 * Shared by OTF and TTF — both use the same header structure.
 *
 * Layout (12 bytes):
 *   uint32  sfVersion      — 0x00010000 (TrueType) or 0x4F54544F ('OTTO')
 *   uint16  numTables
 *   uint16  searchRange
 *   uint16  entrySelector
 *   uint16  rangeShift
 *
 * @param {DataReader} reader
 * @returns {object}
 */
function readFontHeader(reader) {
	return {
		sfVersion: reader.uint32(),
		numTables: reader.uint16(),
		searchRange: reader.uint16(),
		entrySelector: reader.uint16(),
		rangeShift: reader.uint16(),
	};
}

/**
 * Read the Table Directory — an array of Table Records that immediately
 * follows the font header.
 *
 * Each Table Record (16 bytes):
 *   Tag      tableTag   — 4-byte ASCII identifier
 *   uint32   checksum
 *   Offset32 offset     — from beginning of the font file
 *   uint32   length
 *
 * @param {DataReader} reader
 * @param {number}   numTables
 * @returns {Array<{tag: string, checksum: number, offset: number, length: number}>}
 */
function readTableDirectory(reader, numTables) {
	const entries = [];

	for (let i = 0; i < numTables; i++) {
		entries.push({
			tag: reader.tag(),
			checksum: reader.uint32(),
			offset: reader.offset32(),
			length: reader.uint32(),
		});
	}

	return entries;
}

/**
 * Extract raw table data for every entry in the table directory.
 *
 * Tables are processed in a dependency-safe order defined by tableParseOrder.
 * Each table is stored as an object keyed by its tag name.  The value contains:
 *   - _raw:      Array of byte values (for unparsed tables)
 *   - _checksum: The checksum recorded in the table directory
 *
 * Parsed tables receive structured, human-readable JSON data instead of _raw.
 * Parsers may receive the already-parsed tables object as a second argument
 * so they can reference values from other tables (cross-table dependencies).
 *
 * @param {ArrayBuffer} buffer
 * @param {Array}       tableDirectory
 * @returns {object}
 */
function extractTableData(buffer, tableDirectory) {
	const tables = {};

	// Build a lookup from tag -> directory entry
	const entryByTag = new Map(tableDirectory.map((e) => [e.tag, e]));

	// Sort tags: ordered tags first (in parse order), then remaining tags
	const orderedTags = tableParseOrder.filter((tag) => entryByTag.has(tag));
	const remainingTags = tableDirectory
		.map((e) => e.tag)
		.filter((tag) => !orderedTags.includes(tag));
	const sortedTags = [...orderedTags, ...remainingTags];

	for (const tag of sortedTags) {
		const entry = entryByTag.get(tag);
		const tableOffset = entry.offset;
		const raw = new Uint8Array(buffer, tableOffset, entry.length);
		const rawArray = Array.from(raw);
		const parser = tableParsers[tag];

		if (parser) {
			tables[tag] = {
				...parser(rawArray, tables),
				_checksum: entry.checksum,
			};
		} else {
			tables[tag] = {
				_raw: rawArray,
				_checksum: entry.checksum,
			};
		}
	}

	// loca offsets are a binary-layout artifact — they describe byte positions
	// inside a specific glyf encoding and are fully derived from glyf during
	// export.  Keeping them in JSON would break round-trip equality whenever
	// the glyf writer produces a more compact (or differently packed) binary.
	if (tables.loca && tables.glyf && !tables.glyf._raw) {
		delete tables.loca.offsets;
	}

	// CBLC binary-layout offsets (imageDataOffset, sbitOffsets, glyphArray)
	// are artifacts that describe positions inside the CBDT binary encoding.
	// After CBDT has been fully parsed into bitmapData, these offsets are
	// stale and would break round-trip equality.
	if (tables.CBLC && tables.CBDT?.bitmapData) {
		for (const size of tables.CBLC.sizes) {
			for (const sub of size.indexSubTables ?? []) {
				delete sub.imageDataOffset;
				delete sub.sbitOffsets;
				// Format 4: extract glyph IDs, remove offset-bearing array
				if (sub.glyphArray) {
					sub.glyphIdArray = sub.glyphArray.slice(0, -1).map((g) => g.glyphID);
					delete sub.glyphArray;
				}
			}
		}
	}
	// Same cleanup for EBLC/EBDT (identical structures)
	if (tables.EBLC && tables.EBDT?.bitmapData) {
		for (const size of tables.EBLC.sizes) {
			for (const sub of size.indexSubTables ?? []) {
				delete sub.imageDataOffset;
				delete sub.sbitOffsets;
				if (sub.glyphArray) {
					sub.glyphIdArray = sub.glyphArray.slice(0, -1).map((g) => g.glyphID);
					delete sub.glyphArray;
				}
			}
		}
	}
	// Same cleanup for bloc/bdat (Apple bitmap tables, identical structures)
	if (tables.bloc && tables.bdat?.bitmapData) {
		for (const size of tables.bloc.sizes) {
			for (const sub of size.indexSubTables ?? []) {
				delete sub.imageDataOffset;
				delete sub.sbitOffsets;
				if (sub.glyphArray) {
					sub.glyphIdArray = sub.glyphArray.slice(0, -1).map((g) => g.glyphID);
					delete sub.glyphArray;
				}
			}
		}
	}

	return tables;
}

// ===========================================================================
//  CFF IMPORT
// ===========================================================================

/**
 * Import a CFF file (bare CFF data without an SFNT wrapper).
 * Reuses the existing CFF parser, then synthesizes minimal table
 * infrastructure so `buildSimplified()` can produce the standard output.
 *
 * @param {ArrayBuffer} buffer
 * @returns {object} Simplified font data.
 */
function importCFF(buffer) {
	const rawArray = Array.from(new Uint8Array(buffer));
	const cffTable = parseCFF(rawArray);

	const font = cffTable.fonts[0];
	const topDict = font?.topDict || {};
	const charStrings = font?.charStrings || [];
	const numGlyphs = charStrings.length;

	// Extract metrics from CFF Top DICT
	const bbox = topDict.FontBBox || [0, 0, 1000, 1000];
	const unitsPerEm = bbox[3] - bbox[1] || 1000;
	const fontName = (cffTable.names && cffTable.names[0]) || 'CFFFont';

	// Build synthetic tables that buildSimplified() expects
	const tables = {
		'CFF ': cffTable,
	};

	// Synthetic head
	tables.head = {
		majorVersion: 1,
		minorVersion: 0,
		magicNumber: 0x5f0f3cf5,
		unitsPerEm,
		created: 0n,
		modified: 0n,
		xMin: bbox[0],
		yMin: bbox[1],
		xMax: bbox[2],
		yMax: bbox[3],
		flags: 0x000b,
		macStyle: 0,
		lowestRecPPEM: 8,
		fontDirectionHint: 2,
		indexToLocFormat: 0,
		glyphDataFormat: 0,
	};

	// Synthetic maxp (CFF profile)
	tables.maxp = {
		version: 0x00005000,
		numGlyphs,
	};

	// Synthetic hhea — ascender/descender from bbox
	const ascender = bbox[3];
	const descender = bbox[1];
	tables.hhea = {
		majorVersion: 1,
		minorVersion: 0,
		ascender,
		descender,
		lineGap: 0,
		advanceWidthMax: 0,
		minLeftSideBearing: 0,
		minRightSideBearing: 0,
		xMaxExtent: bbox[2],
		caretSlopeRise: 1,
		caretSlopeRun: 0,
		caretOffset: 0,
		reserved0: 0,
		reserved1: 0,
		reserved2: 0,
		reserved3: 0,
		metricDataFormat: 0,
		numberOfHMetrics: numGlyphs,
	};

	// Synthetic hmtx — derive advance widths from charstring interpretation
	const defaultWidth = font?.privateDict?.defaultWidthX ?? 0;
	const nominalWidth = font?.privateDict?.nominalWidthX ?? 0;
	const hMetrics = [];
	for (let i = 0; i < numGlyphs; i++) {
		let width = defaultWidth;
		if (charStrings[i] && charStrings[i].length > 0) {
			const globalSubrs = cffTable.globalSubrs || [];
			const localSubrs = font.localSubrs || [];
			try {
				const result = interpretCharString(
					charStrings[i],
					globalSubrs,
					localSubrs,
				);
				if (result.width !== undefined) {
					width = result.width + nominalWidth;
				}
			} catch {
				// Fall back to default width
			}
		}
		hMetrics.push({ advanceWidth: width, lsb: 0 });
	}
	tables.hmtx = { hMetrics };

	// Synthetic name table
	tables.name = {
		format: 0,
		names: [
			{
				nameID: 1,
				platformID: 3,
				encodingID: 1,
				languageID: 0x0409,
				value: fontName,
			},
			{
				nameID: 2,
				platformID: 3,
				encodingID: 1,
				languageID: 0x0409,
				value: 'Regular',
			},
			{
				nameID: 4,
				platformID: 3,
				encodingID: 1,
				languageID: 0x0409,
				value: fontName,
			},
			{
				nameID: 6,
				platformID: 3,
				encodingID: 1,
				languageID: 0x0409,
				value: fontName,
			},
		],
	};

	// Synthetic post
	tables.post = {
		version: 0x00030000,
		italicAngle: topDict.ItalicAngle || 0,
		underlinePosition: topDict.UnderlinePosition || -100,
		underlineThickness: topDict.UnderlineThickness || 50,
		isFixedPitch: topDict.isFixedPitch || 0,
	};

	// Build unicode map from CFF encoding
	if (font?.encoding && typeof font.encoding !== 'string') {
		const codes = font.encoding.codes || [];
		// Build a synthetic cmap from the CFF encoding
		const glyphIdArray = new Array(256).fill(0);
		for (let i = 0; i < codes.length && i < 256; i++) {
			// codes[i] is the character code for glyph index (i+1)
			const charCode = codes[i];
			if (charCode >= 0 && charCode < 256) {
				glyphIdArray[charCode] = i + 1;
			}
		}
		tables.cmap = {
			version: 0,
			subtables: [
				{
					platformID: 1,
					encodingID: 0,
					format: 0,
					glyphIdArray,
				},
			],
		};
	}

	// Synthetic OS/2
	tables['OS/2'] = {
		version: 4,
		xAvgCharWidth: 0,
		usWeightClass: 400,
		usWidthClass: 5,
		fsType: 0,
		ySubscriptXSize: Math.round(unitsPerEm * 0.65),
		ySubscriptYSize: Math.round(unitsPerEm * 0.6),
		ySubscriptXOffset: 0,
		ySubscriptYOffset: Math.round(unitsPerEm * 0.075),
		ySuperscriptXSize: Math.round(unitsPerEm * 0.65),
		ySuperscriptYSize: Math.round(unitsPerEm * 0.6),
		ySuperscriptXOffset: 0,
		ySuperscriptYOffset: Math.round(unitsPerEm * 0.35),
		yStrikeoutSize: Math.round(unitsPerEm * 0.05),
		yStrikeoutPosition: Math.round(unitsPerEm * 0.3),
		sFamilyClass: 0,
		panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ulUnicodeRange1: 0,
		ulUnicodeRange2: 0,
		ulUnicodeRange3: 0,
		ulUnicodeRange4: 0,
		achVendID: '    ',
		fsSelection: 0x0040,
		usFirstCharIndex: 0,
		usLastCharIndex: 0xffff,
		sTypoAscender: ascender,
		sTypoDescender: descender,
		sTypoLineGap: 0,
		usWinAscent: Math.abs(ascender),
		usWinDescent: Math.abs(descender),
		ulCodePageRange1: 0,
		ulCodePageRange2: 0,
		sxHeight: Math.round(unitsPerEm * 0.5),
		sCapHeight: Math.round(unitsPerEm * 0.7),
		usDefaultChar: 0,
		usBreakChar: 32,
		usMaxContext: 0,
	};

	const header = { sfVersion: 0x4f54544f };
	const result = buildSimplified({ header, tables });
	result._standalone = 'cff';
	return result;
}

// ===========================================================================
//  PFB IMPORT (PostScript Type 1 Binary)
// ===========================================================================

/**
 * Import a PFB (PostScript Type 1 Binary) font file.
 *
 * PFB structure: sequence of segments, each with:
 *   byte    0x80           — segment marker
 *   byte    type           — 1=ASCII, 2=binary, 3=EOF
 *   uint32  length         — little-endian byte count
 *   byte[]  data
 *
 * @param {ArrayBuffer} buffer
 * @returns {object} Simplified font data.
 */
function importPFB(buffer) {
	const bytes = new Uint8Array(buffer);
	const asciiParts = [];
	const binaryParts = [];
	let offset = 0;

	while (offset < bytes.length) {
		if (bytes[offset] !== 0x80) break;
		const segType = bytes[offset + 1];
		if (segType === 3) break; // EOF segment

		const segLength =
			bytes[offset + 2] |
			(bytes[offset + 3] << 8) |
			(bytes[offset + 4] << 16) |
			(bytes[offset + 5] << 24);
		offset += 6;

		const segData = bytes.slice(offset, offset + segLength);
		offset += segLength;

		if (segType === 1) {
			asciiParts.push(segData);
		} else if (segType === 2) {
			binaryParts.push(segData);
		}
	}

	// Concatenate parts
	const asciiBytes = concatUint8Arrays(asciiParts);
	const binaryBytes = concatUint8Arrays(binaryParts);

	const asciiText = new TextDecoder('latin1').decode(asciiBytes);
	return importType1(asciiText, binaryBytes);
}

// ===========================================================================
//  PFA IMPORT (PostScript Type 1 ASCII)
// ===========================================================================

/**
 * Import a PFA (PostScript Type 1 ASCII) font file.
 *
 * PFA files are plain ASCII. The encrypted portion follows the
 * `currentfile eexec` line and is hex-encoded.
 *
 * @param {ArrayBuffer} buffer
 * @returns {object} Simplified font data.
 */
function importPFA(buffer) {
	const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));
	const eexecMarker = 'currentfile eexec';
	const eexecIndex = text.indexOf(eexecMarker);

	if (eexecIndex === -1) {
		throw new Error('PFA: could not find "currentfile eexec" marker');
	}

	const asciiText = text.slice(0, eexecIndex + eexecMarker.length);
	const hexPortion = text.slice(eexecIndex + eexecMarker.length);

	// Decode hex string to binary bytes — skip whitespace
	const hexClean = hexPortion.replace(/\s/g, '');
	// Trim trailing zeros (cleartomark padding)
	const zeroRun = hexClean.search(/0{64,}$/);
	const hexData = zeroRun > 0 ? hexClean.slice(0, zeroRun) : hexClean;
	const binaryBytes = new Uint8Array(hexData.length / 2);
	for (let i = 0; i < binaryBytes.length; i++) {
		binaryBytes[i] = parseInt(hexData.slice(i * 2, i * 2 + 2), 16);
	}

	return importType1(asciiText, binaryBytes);
}

// ===========================================================================
//  TYPE 1 CORE
// ===========================================================================

/**
 * Adobe Type 1 decryption cipher.
 * Used for both eexec and charstring decryption with different keys.
 * @param {Uint8Array} cipherBytes
 * @param {number} key - Initial key (55665 for eexec, 4330 for charstrings)
 * @param {number} skip - Bytes to discard (4 for eexec, lenIV for charstrings)
 * @returns {Uint8Array} Decrypted bytes.
 */
function type1Decrypt(cipherBytes, key, skip) {
	const out = new Uint8Array(cipherBytes.length);
	let r = key;
	const c1 = 52845;
	const c2 = 22719;
	for (let i = 0; i < cipherBytes.length; i++) {
		const cipher = cipherBytes[i];
		out[i] = cipher ^ (r >>> 8);
		r = ((cipher + r) * c1 + c2) & 0xffff;
	}
	return out.slice(skip);
}

/**
 * Interpret a Type 1 charstring into contours.
 *
 * Type 1 charstrings differ from Type 2 (CFF):
 *  - `hsbw` (13): sidebearing + width (2 operands)
 *  - `sbw` (12,7): 4-operand sidebearing + width
 *  - `seac` (12,6): composite accented character
 *  - `closepath` (9): explicit path close
 *  - `callothersubr` (12,16) + `pop` (12,17): flex mechanism
 *  - `setcurrentpoint` (12,33): set point after OtherSubrs
 *  - Number encoding: 32-246 → val-139, etc. (different ranges from Type 2)
 *
 * @param {Uint8Array} bytes - Decrypted charstring bytes
 * @param {Uint8Array[]} subrs - Local subroutines (decrypted)
 * @returns {{ contours: Array, width: number }}
 */
function interpretType1CharString(bytes, subrs) {
	const stack = [];
	const psStack = []; // PostScript argument stack for callothersubr/pop
	const contours = [];
	let currentContour = null;
	let x = 0;
	let y = 0;
	let width = 0;
	let lsb = 0;
	let flexPoints = [];
	let inFlex = false;

	function moveTo(mx, my) {
		if (currentContour && currentContour.length > 0) {
			contours.push(currentContour);
		}
		currentContour = [{ type: 'M', x: mx, y: my }];
	}

	function lineTo(lx, ly) {
		if (currentContour) {
			currentContour.push({ type: 'L', x: lx, y: ly });
		}
	}

	function curveTo(x1, y1, x2, y2, x3, y3) {
		if (currentContour) {
			currentContour.push({ type: 'C', x1, y1, x2, y2, x: x3, y: y3 });
		}
	}

	function execute(data, depth) {
		if (depth > 10) return;
		let i = 0;
		while (i < data.length) {
			const b0 = data[i];

			// Number encoding (Type 1 spec §2)
			if (b0 >= 32 && b0 <= 246) {
				stack.push(b0 - 139);
				i++;
				continue;
			}
			if (b0 >= 247 && b0 <= 250) {
				stack.push((b0 - 247) * 256 + data[i + 1] + 108);
				i += 2;
				continue;
			}
			if (b0 >= 251 && b0 <= 254) {
				stack.push(-(b0 - 251) * 256 - data[i + 1] - 108);
				i += 2;
				continue;
			}
			if (b0 === 255) {
				// 32-bit signed integer
				const val =
					((data[i + 1] << 24) |
						(data[i + 2] << 16) |
						(data[i + 3] << 8) |
						data[i + 4]) >>
					0;
				stack.push(val);
				i += 5;
				continue;
			}

			// Operators
			if (b0 === 12) {
				// Two-byte operator
				const b1 = data[i + 1];
				i += 2;
				switch (b1) {
					case 0: // dotsection (deprecated, ignore)
						stack.length = 0;
						break;
					case 6: {
						// seac: asb adx ady bchar achar
						// Composite accented character — store for later decomposition
						// For now, just record the accent displacement
						stack.length = 0;
						break;
					}
					case 7: {
						// sbw: sbx sby wx wy
						lsb = stack[stack.length - 4] || 0;
						width = stack[stack.length - 2] || 0;
						x = lsb;
						y = stack[stack.length - 3] || 0;
						stack.length = 0;
						break;
					}
					case 12: {
						// div
						const b = stack.pop();
						const a = stack.pop();
						stack.push(b !== 0 ? a / b : 0);
						break;
					}
					case 16: {
						// callothersubr: args... n othersubr#
						const otherSubrNum = stack.pop();
						const numArgs = stack.pop();
						const args = stack.splice(stack.length - numArgs, numArgs);

						if (otherSubrNum === 0) {
							// End flex: collect the 7 flex points
							inFlex = false;
							// args = [finalY, finalX, joinX-joinY-epsilon]
							// Flex: two curves from flexPoints
							if (flexPoints.length >= 7) {
								const fp = flexPoints;
								curveTo(fp[1].x, fp[1].y, fp[2].x, fp[2].y, fp[3].x, fp[3].y);
								curveTo(fp[4].x, fp[4].y, fp[5].x, fp[5].y, fp[6].x, fp[6].y);
								x = fp[6].x;
								y = fp[6].y;
							}
							flexPoints = [];
							psStack.push(args[1]); // x
							psStack.push(args[0]); // y
						} else if (otherSubrNum === 1) {
							// Start flex
							inFlex = true;
							flexPoints = [{ x, y }];
							psStack.push(...args);
						} else if (otherSubrNum === 2) {
							// Flex point
							psStack.push(...args);
						} else if (otherSubrNum === 3) {
							// hint replacement — change hints, push 3 to PS stack
							psStack.push(3);
						} else {
							// Unknown other subr — push args to PS stack
							psStack.push(...args);
						}
						break;
					}
					case 17: {
						// pop — transfer from PS stack to Type 1 stack
						if (psStack.length > 0) {
							stack.push(psStack.pop());
						} else {
							stack.push(0);
						}
						break;
					}
					case 33: // setcurrentpoint
						x = stack[stack.length - 2] || 0;
						y = stack[stack.length - 1] || 0;
						stack.length = 0;
						break;
					default:
						// Unknown 2-byte operator — clear stack
						stack.length = 0;
						break;
				}
				continue;
			}

			// Single-byte operators
			i++;
			switch (b0) {
				case 1: // hstem
				case 3: // vstem
					stack.length = 0;
					break;
				case 4: {
					// vmoveto
					const dy = stack.pop() || 0;
					if (inFlex) {
						y += dy;
						flexPoints.push({ x, y });
					} else {
						y += dy;
						moveTo(x, y);
					}
					stack.length = 0;
					break;
				}
				case 5: {
					// rlineto
					const dy = stack.pop() || 0;
					const dx = stack.pop() || 0;
					x += dx;
					y += dy;
					lineTo(x, y);
					stack.length = 0;
					break;
				}
				case 6: {
					// hlineto
					const dx = stack.pop() || 0;
					x += dx;
					lineTo(x, y);
					stack.length = 0;
					break;
				}
				case 7: {
					// vlineto
					const dy = stack.pop() || 0;
					y += dy;
					lineTo(x, y);
					stack.length = 0;
					break;
				}
				case 8: {
					// rrcurveto
					const dy3 = stack.pop() || 0;
					const dx3 = stack.pop() || 0;
					const dy2 = stack.pop() || 0;
					const dx2 = stack.pop() || 0;
					const dy1 = stack.pop() || 0;
					const dx1 = stack.pop() || 0;
					const x1 = x + dx1;
					const y1 = y + dy1;
					const x2 = x1 + dx2;
					const y2 = y1 + dy2;
					x = x2 + dx3;
					y = y2 + dy3;
					curveTo(x1, y1, x2, y2, x, y);
					stack.length = 0;
					break;
				}
				case 9: {
					// closepath
					if (currentContour && currentContour.length > 0) {
						contours.push(currentContour);
						currentContour = null;
					}
					stack.length = 0;
					break;
				}
				case 10: {
					// callsubr
					const subrIndex = stack.pop();
					if (subrIndex >= 0 && subrIndex < subrs.length && subrs[subrIndex]) {
						execute(subrs[subrIndex], depth + 1);
					}
					break;
				}
				case 11: // return
					return;
				case 13: {
					// hsbw: sbx wx
					width = stack.pop() || 0;
					lsb = stack.pop() || 0;
					x = lsb;
					stack.length = 0;
					break;
				}
				case 14: {
					// endchar
					if (currentContour && currentContour.length > 0) {
						contours.push(currentContour);
						currentContour = null;
					}
					return;
				}
				case 21: {
					// rmoveto
					const dy = stack.pop() || 0;
					const dx = stack.pop() || 0;
					if (inFlex) {
						x += dx;
						y += dy;
						flexPoints.push({ x, y });
					} else {
						x += dx;
						y += dy;
						moveTo(x, y);
					}
					stack.length = 0;
					break;
				}
				case 22: {
					// hmoveto
					const dx = stack.pop() || 0;
					if (inFlex) {
						x += dx;
						flexPoints.push({ x, y });
					} else {
						x += dx;
						moveTo(x, y);
					}
					stack.length = 0;
					break;
				}
				case 30: {
					// vhcurveto
					const dx3 = stack.pop() || 0;
					const dy2 = stack.pop() || 0;
					const dx2 = stack.pop() || 0;
					const dy1 = stack.pop() || 0;
					const x1 = x;
					const y1 = y + dy1;
					const x2 = x1 + dx2;
					const y2 = y1 + dy2;
					x = x2 + dx3;
					y = y2;
					curveTo(x1, y1, x2, y2, x, y);
					stack.length = 0;
					break;
				}
				case 31: {
					// hvcurveto
					const dy3 = stack.pop() || 0;
					const dy2 = stack.pop() || 0;
					const dx2 = stack.pop() || 0;
					const dx1 = stack.pop() || 0;
					const x1 = x + dx1;
					const y1 = y;
					const x2 = x1 + dx2;
					const y2 = y1 + dy2;
					x = x2;
					y = y2 + dy3;
					curveTo(x1, y1, x2, y2, x, y);
					stack.length = 0;
					break;
				}
				default:
					// Unknown operator — clear stack
					stack.length = 0;
					break;
			}
		}
	}

	execute(bytes, 0);

	if (currentContour && currentContour.length > 0) {
		contours.push(currentContour);
	}

	return { contours, width };
}

/**
 * Parse the PostScript font dictionary from the ASCII header portion
 * of a Type 1 font. Extracts font metadata and encoding.
 *
 * This is NOT a full PostScript interpreter — it only handles the
 * subset of PostScript used in Type 1 font dictionaries.
 *
 * @param {string} text - ASCII header portion
 * @returns {object} Font metadata
 */
function parseType1Header(text) {
	const info = {};

	// Extract simple /Key (value) or /Key value entries
	const stringKeys = [
		'FontName',
		'FamilyName',
		'FullName',
		'Weight',
		'version',
		'Notice',
	];
	for (const key of stringKeys) {
		const match = text.match(new RegExp(`/${key}\\s*\\(([^)]*)\\)`));
		if (match) {
			info[key] = match[1];
		} else {
			// Try /Key /Name format
			const nameMatch = text.match(new RegExp(`/${key}\\s+/([^\\s]+)`));
			if (nameMatch) {
				info[key] = nameMatch[1];
			}
		}
	}

	const numKeys = [
		'PaintType',
		'FontType',
		'UniqueID',
		'ItalicAngle',
		'isFixedPitch',
		'UnderlinePosition',
		'UnderlineThickness',
	];
	for (const key of numKeys) {
		const match = text.match(new RegExp(`/${key}\\s+(-?[\\d.]+)`));
		if (match) {
			info[key] = parseFloat(match[1]);
		}
	}

	// Boolean isFixedPitch
	const fpMatch = text.match(/\/isFixedPitch\s+(true|false)/);
	if (fpMatch) {
		info.isFixedPitch = fpMatch[1] === 'true' ? 1 : 0;
	}

	// FontBBox — array of 4 numbers
	const bboxMatch = text.match(
		/\/FontBBox\s*\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\}/,
	);
	if (!bboxMatch) {
		const bboxMatch2 = text.match(
			/\/FontBBox\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/,
		);
		if (bboxMatch2) {
			info.FontBBox = bboxMatch2.slice(1, 5).map(Number);
		}
	} else {
		info.FontBBox = bboxMatch.slice(1, 5).map(Number);
	}

	// FontMatrix
	const matrixMatch = text.match(
		/\/FontMatrix\s*\[\s*([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s*\]/,
	);
	if (matrixMatch) {
		info.FontMatrix = matrixMatch.slice(1, 7).map(Number);
	}

	// Encoding — parse basic encoding vector
	info.encoding = parseType1Encoding(text);

	return info;
}

/**
 * Parse the Encoding vector from the Type 1 ASCII header.
 * Returns a map of character code → glyph name.
 *
 * @param {string} text
 * @returns {Map<number, string>}
 */
function parseType1Encoding(text) {
	const map = new Map();

	// Pattern: "dup <code> /<name> put"
	const re = /dup\s+(\d+)\s+\/([^\s]+)\s+put/g;
	let match;
	while ((match = re.exec(text)) !== null) {
		map.set(parseInt(match[1]), match[2]);
	}

	return map;
}

/**
 * Parse the encrypted (Private dict + CharStrings) portion of a Type 1 font.
 *
 * After eexec decryption, the binary contains:
 *   - Private dict values (as PostScript)
 *   - /CharStrings dict with encrypted charstring bytecodes
 *   - /Subrs array with encrypted subroutine bytecodes
 *
 * @param {Uint8Array} decryptedBytes
 * @returns {{ charStrings: Map<string, Uint8Array>, subrs: Uint8Array[], privateDict: object }}
 */
function parseType1Private(decryptedBytes) {
	const text = new TextDecoder('latin1').decode(decryptedBytes);

	// Extract lenIV (default 4)
	const lenIVMatch = text.match(/\/lenIV\s+(\d+)/);
	const lenIV = lenIVMatch ? parseInt(lenIVMatch[1]) : 4;

	// Extract Private dict numeric values
	const privateDict = {};
	const privateDictKeys = [
		'BlueFuzz',
		'BlueScale',
		'BlueShift',
		'ForceBold',
		'StdHW',
		'StdVW',
		'defaultWidthX',
		'nominalWidthX',
	];
	for (const key of privateDictKeys) {
		const pvMatch = text.match(new RegExp(`/${key}\\s+(-?[\\d.]+)`));
		if (pvMatch) {
			privateDict[key] = parseFloat(pvMatch[1]);
		}
	}

	// Extract Blue values arrays
	for (const key of [
		'BlueValues',
		'OtherBlues',
		'FamilyBlues',
		'FamilyOtherBlues',
		'StemSnapH',
		'StemSnapV',
	]) {
		const arrMatch = text.match(new RegExp(`/${key}\\s*\\[([^\\]]+)\\]`));
		if (arrMatch) {
			privateDict[key] = arrMatch[1].trim().split(/\s+/).map(Number);
		}
	}

	// Extract Subrs array
	const subrs = [];
	const subrsMatch = text.match(/\/Subrs\s+(\d+)\s+array/);
	if (subrsMatch) {
		const subrsCount = parseInt(subrsMatch[1]);
		// Find each "dup <index> <length> RD|-| <binary data> NP|noaccess put"
		const subrsRegion = text.slice(subrsMatch.index);
		extractBinaryEntries(
			subrsRegion,
			decryptedBytes.slice(findByteOffset(decryptedBytes, subrsMatch.index)),
			subrsCount,
			lenIV,
			(index, decrypted) => {
				subrs[index] = decrypted;
			},
		);
	}

	// Extract CharStrings
	const charStrings = new Map();
	const csMatch = text.match(/\/CharStrings\s+(\d+)\s+dict/);
	if (csMatch) {
		const csRegion = text.slice(csMatch.index);
		const csBytes = decryptedBytes.slice(
			findByteOffset(decryptedBytes, csMatch.index),
		);
		// Pattern: /<glyphName> <length> RD|-| <binary data> ND||-
		const re = /\/([^\s]+)\s+(\d+)\s+(?:RD|-\|)\s/g;
		let m;
		while ((m = re.exec(csRegion)) !== null) {
			const name = m[1];
			const length = parseInt(m[2]);
			// The binary data starts right after the match in the byte stream
			const textOffset = m.index + m[0].length;
			const byteOffset = findByteOffset(csBytes, textOffset);
			const encrypted = csBytes.slice(byteOffset, byteOffset + length);
			const decrypted = type1Decrypt(encrypted, 4330, lenIV);
			charStrings.set(name, decrypted);
		}
	}

	return { charStrings, subrs, privateDict };
}

/**
 * Extract binary "dup <index> <length> RD <data>" entries from the Subrs array.
 */
function extractBinaryEntries(textRegion, bytesRegion, count, lenIV, callback) {
	const re = /dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g;
	let m;
	while ((m = re.exec(textRegion)) !== null) {
		const index = parseInt(m[1]);
		const length = parseInt(m[2]);
		const textOffset = m.index + m[0].length;
		const byteOffset = findByteOffset(bytesRegion, textOffset);
		const encrypted = bytesRegion.slice(byteOffset, byteOffset + length);
		const decrypted = type1Decrypt(encrypted, 4330, lenIV);
		callback(index, decrypted);
	}
}

/**
 * Find the byte offset in the binary data corresponding to a text position.
 * Since the decrypted bytes and text are the same data (latin1), offsets match.
 */
function findByteOffset(bytes, textOffset) {
	return textOffset;
}

/**
 * Core Type 1 import: takes the parsed ASCII header and decrypted binary
 * data and produces simplified font data.
 *
 * @param {string} asciiText - PostScript header text
 * @param {Uint8Array} encryptedBinary - eexec-encrypted binary data
 * @returns {object} Simplified font data
 */
function importType1(asciiText, encryptedBinary) {
	// Decrypt the eexec-encrypted portion
	const decrypted = type1Decrypt(encryptedBinary, 55665, 4);

	// Parse header for metadata
	const headerInfo = parseType1Header(asciiText);

	// Parse private dict and charstrings
	const { charStrings, subrs, privateDict } = parseType1Private(decrypted);

	// Font metrics
	const bbox = headerInfo.FontBBox || [0, 0, 1000, 1000];
	const fontMatrix = headerInfo.FontMatrix || [0.001, 0, 0, 0.001, 0, 0];
	const unitsPerEm = Math.round(1 / fontMatrix[0]);
	const fontName = headerInfo.FontName || headerInfo.FamilyName || 'Type1Font';
	const ascender = bbox[3];
	const descender = bbox[1];

	// Build glyphs by interpreting each charstring
	const glyphList = [];
	const glyphNames = [];

	// .notdef first
	if (charStrings.has('.notdef')) {
		const result = interpretType1CharString(charStrings.get('.notdef'), subrs);
		glyphList.push({
			name: '.notdef',
			unicode: null,
			advanceWidth: result.width,
			contours: result.contours.length > 0 ? result.contours : undefined,
		});
		glyphNames.push('.notdef');
	} else {
		glyphList.push({ name: '.notdef', unicode: null, advanceWidth: 0 });
		glyphNames.push('.notdef');
	}

	// Build reverse encoding map: glyph name → character code
	const nameToUnicode = new Map();
	for (const [code, name] of headerInfo.encoding) {
		nameToUnicode.set(name, code);
	}

	// All other glyphs
	for (const [name, csBytes] of charStrings) {
		if (name === '.notdef') continue;

		const result = interpretType1CharString(csBytes, subrs);
		const unicode = nameToUnicode.get(name) ?? null;

		glyphList.push({
			name,
			unicode,
			advanceWidth: result.width,
			contours: result.contours.length > 0 ? result.contours : undefined,
		});
		glyphNames.push(name);
	}

	// Build the simplified result directly (no CFF table to go through)
	const result = {
		font: {
			familyName: headerInfo.FamilyName || fontName,
			styleName: 'Regular',
			fullName: headerInfo.FullName || fontName,
			postScriptName: fontName,
			unitsPerEm,
			ascender,
			descender,
			lineGap: 0,
			created: new Date().toISOString().slice(0, 19) + 'Z',
			modified: new Date().toISOString().slice(0, 19) + 'Z',
		},
		glyphs: glyphList,
		tables: {},
		_header: { sfVersion: 0x4f54544f },
		_standalone: 'type1',
	};

	if (headerInfo.Weight) result.font.weight = headerInfo.Weight;
	if (headerInfo.version) result.font.version = headerInfo.version;
	if (headerInfo.Notice) result.font.copyright = headerInfo.Notice;

	return result;
}

/**
 * Concatenate an array of Uint8Arrays into a single Uint8Array.
 */
function concatUint8Arrays(arrays) {
	const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
