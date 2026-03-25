/**
 * Font Flux JS : Import
 * Reads binary font data and converts it to a JSON representation.
 */

import { parseCFF } from './otf/table_CFF.js';
import { parseCFF2 } from './otf/table_CFF2.js';
import { parseVORG } from './otf/table_VORG.js';
import { DataReader } from './reader.js';
import { parseAvar } from './sfnt/table_avar.js';
import { parseBASE } from './sfnt/table_BASE.js';
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

/**
 * Registry of table parsers.
 * Each key is a table tag; the value is a function (number[], tables?) -> object.
 * Tables not listed here are stored as raw bytes.
 * Parsers may accept a second argument: the tables object (for cross-table deps).
 */
const tableParsers = {
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
	sbix: parseSbix,
	'SVG ': parseSVG,
};

/**
 * Parse order — tables are parsed in this order so that cross-table
 * dependencies are satisfied (e.g. hmtx needs hhea.numberOfHMetrics).
 * Tables not in this list are parsed after those that are.
 */
const tableParseOrder = [
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
	'sbix',
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
		if (signature === 'ttcf') {
			return importCollection(buffer);
		}
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

	return tables;
}
