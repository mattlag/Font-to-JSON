/**
 * Font Flux JS : Export
 * Takes a JSON font object and converts it back to binary font data.
 */

import { buildRawFromSimplified } from './expand.js';
import { writeCFF } from './otf/table_CFF.js';
import { writeCFF2 } from './otf/table_CFF2.js';
import { writeVORG } from './otf/table_VORG.js';
import { writeAvar } from './sfnt/table_avar.js';
import { writeBASE } from './sfnt/table_BASE.js';
import { writeBdat } from './sfnt/table_bdat.js';
import { writeBloc } from './sfnt/table_bloc.js';
import { writeCBDT, writeCBDTComputeOffsets } from './sfnt/table_CBDT.js';
import { writeCBLC } from './sfnt/table_CBLC.js';
import { writeCmap } from './sfnt/table_cmap.js';
import { writeCOLR } from './sfnt/table_COLR.js';
import { writeCPAL } from './sfnt/table_CPAL.js';
import { writeDSIG } from './sfnt/table_DSIG.js';
import { writeEBDT } from './sfnt/table_EBDT.js';
import { writeEBLC } from './sfnt/table_EBLC.js';
import { writeEBSC } from './sfnt/table_EBSC.js';
import { writeFvar } from './sfnt/table_fvar.js';
import { writeGDEF } from './sfnt/table_GDEF.js';
import { writeGPOS } from './sfnt/table_GPOS.js';
import { writeGSUB } from './sfnt/table_GSUB.js';
import { writeHdmx } from './sfnt/table_hdmx.js';
import { writeHead } from './sfnt/table_head.js';
import { writeHhea } from './sfnt/table_hhea.js';
import { writeHmtx } from './sfnt/table_hmtx.js';
import { writeHVAR } from './sfnt/table_HVAR.js';
import { writeJSTF } from './sfnt/table_JSTF.js';
import { writeKern } from './sfnt/table_kern.js';
import { writeLtag } from './sfnt/table_ltag.js';
import { writeLTSH } from './sfnt/table_LTSH.js';
import { writeMATH } from './sfnt/table_MATH.js';
import { writeMaxp } from './sfnt/table_maxp.js';
import { writeMERG } from './sfnt/table_MERG.js';
import { writeMeta } from './sfnt/table_meta.js';
import { writeMVAR } from './sfnt/table_MVAR.js';
import { writeName } from './sfnt/table_name.js';
import { writeOS2 } from './sfnt/table_OS-2.js';
import { writePCLT } from './sfnt/table_PCLT.js';
import { writePost } from './sfnt/table_post.js';
import { writeSbix } from './sfnt/table_sbix.js';
import { writeSTAT } from './sfnt/table_STAT.js';
import { writeSVG } from './sfnt/table_SVG.js';
import { writeVDMX } from './sfnt/table_VDMX.js';
import { writeVhea } from './sfnt/table_vhea.js';
import { writeVmtx } from './sfnt/table_vmtx.js';
import { writeVVAR } from './sfnt/table_VVAR.js';
import { DECOMPOSED_TABLES } from './simplify.js';
import { writeCvar } from './ttf/table_cvar.js';
import { writeCvt } from './ttf/table_cvt.js';
import { writeFpgm } from './ttf/table_fpgm.js';
import { writeGasp } from './ttf/table_gasp.js';
import { writeGlyf, writeGlyfComputeOffsets } from './ttf/table_glyf.js';
import { writeGvar } from './ttf/table_gvar.js';
import { writeLoca } from './ttf/table_loca.js';
import { writePrep } from './ttf/table_prep.js';
import { wrapWOFF1 } from './woff/woff1.js';
import { wrapWOFF2 } from './woff/woff2.js';

/**
 * Registry of table writers.
 * Each key is a table tag; the value is a function (object) -> number[].
 * Tables not listed here must have _raw bytes.
 */
const tableWriters = {
	cmap: writeCmap,
	head: writeHead,
	hhea: writeHhea,
	HVAR: writeHVAR,
	hmtx: writeHmtx,
	maxp: writeMaxp,
	MVAR: writeMVAR,
	name: writeName,
	hdmx: writeHdmx,
	BASE: writeBASE,
	JSTF: writeJSTF,
	MATH: writeMATH,
	MERG: writeMERG,
	meta: writeMeta,
	DSIG: writeDSIG,
	LTSH: writeLTSH,
	CBLC: writeCBLC,
	CBDT: writeCBDT,
	'OS/2': writeOS2,
	kern: writeKern,
	PCLT: writePCLT,
	VDMX: writeVDMX,
	post: writePost,
	STAT: writeSTAT,
	'CFF ': writeCFF,
	CFF2: writeCFF2,
	VORG: writeVORG,
	fvar: writeFvar,
	avar: writeAvar,
	loca: writeLoca,
	glyf: writeGlyf,
	gvar: writeGvar,
	GDEF: writeGDEF,
	GPOS: writeGPOS,
	GSUB: writeGSUB,
	'cvt ': writeCvt,
	cvar: writeCvar,
	fpgm: writeFpgm,
	prep: writePrep,
	gasp: writeGasp,
	vhea: writeVhea,
	VVAR: writeVVAR,
	vmtx: writeVmtx,
	COLR: writeCOLR,
	CPAL: writeCPAL,
	EBDT: writeEBDT,
	EBLC: writeEBLC,
	EBSC: writeEBSC,
	bloc: writeBloc,
	bdat: writeBdat,
	sbix: writeSbix,
	ltag: writeLtag,
	'SVG ': writeSVG,
};

/** Size of the font file header (Offset Table) in bytes. */
const HEADER_SIZE = 12;

/** Size of a single Table Record in the table directory, in bytes. */
const TABLE_RECORD_SIZE = 16;

/**
 * Compute the OpenType checksum for a table's raw bytes.
 * The checksum is the low 32 bits of the sum of uint32 values,
 * with the last partial word padded with zeroes.
 * @param {Uint8Array} data
 * @returns {number}
 */
function computeTableChecksum(data) {
	let sum = 0;
	const len = data.length;
	const aligned = len & ~3;
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	for (let i = 0; i < aligned; i += 4) {
		sum = (sum + view.getUint32(i)) >>> 0;
	}
	if (len & 3) {
		let last = 0;
		for (let i = aligned; i < len; i++) {
			last |= data[i] << (24 - 8 * (i - aligned));
		}
		sum = (sum + last) >>> 0;
	}
	return sum;
}

const SUPPORTED_FORMATS = new Set(['sfnt', 'woff', 'woff2', 'cff']);

/**
 * Determine the default export format from the font data's origin.
 * If the font was imported from a WOFF container, default to that format;
 * CFF imports default to CFF; otherwise default to raw SFNT.
 */
function defaultFormatFrom(fontData) {
	if (fontData._standalone === 'cff') return 'cff';
	const version = fontData._woff?.version;
	if (version === 2) return 'woff2';
	if (version === 1) return 'woff';
	return 'sfnt';
}

/**
 * Export a font JSON object back to binary data (ArrayBuffer).
 *
 * The output format defaults to the original import format: WOFF imports
 * re-export as WOFF, SFNT imports as SFNT. Override with `options.format`.
 *
 * @param {object} fontData - Font data object (simplified, legacy, or collection).
 * @param {object} [options] - Export options.
 * @param {string} [options.format] - Output format: 'sfnt', 'woff' (or 'woff2'
 *   once supported). Defaults to the original import format.
 * @param {boolean} [options.split] - Collections only: when true, return an
 *   array of individual ArrayBuffers (one per face) instead of a single file.
 * @returns {ArrayBuffer|ArrayBuffer[]} Binary font file bytes.
 */
export function exportFont(fontData, options = {}) {
	if (!fontData || typeof fontData !== 'object') {
		throw new TypeError('exportFont expects a font data object');
	}

	const format = options.format
		? options.format.toLowerCase()
		: defaultFormatFrom(fontData);

	if (!SUPPORTED_FORMATS.has(format)) {
		throw new Error(
			`Unknown export format "${format}". Supported: sfnt, woff, woff2, cff.`,
		);
	}

	if (isCollection(fontData)) {
		if (format === 'cff') {
			throw new Error('CFF export does not support font collections.');
		}
		if (options.split) {
			return exportCollectionSplit(fontData, format);
		}
		const sfnt = exportCollection(fontData);
		if (format === 'woff') {
			return wrapWOFF1(
				sfnt,
				fontData._woff?.metadata,
				fontData._woff?.privateData,
			);
		}
		if (format === 'woff2') {
			return wrapWOFF2(
				sfnt,
				fontData._woff?.metadata,
				fontData._woff?.privateData,
			);
		}
		return sfnt;
	}

	// CFF: extract CFF table bytes directly
	if (format === 'cff') {
		const resolved = resolveExportSource(fontData);
		const cffData = resolved.tables['CFF '];
		if (!cffData) {
			throw new Error(
				'CFF export requires CFF glyph data. This font uses TrueType outlines.',
			);
		}
		const cffBytes = writeCFF(cffData);
		const buf = new ArrayBuffer(cffBytes.length);
		new Uint8Array(buf).set(cffBytes);
		return buf;
	}

	const resolved = resolveExportSource(fontData);
	const sfnt = exportSFNT(resolved, 0);

	if (format === 'woff') {
		const meta = fontData._woff?.metadata ?? null;
		const priv = fontData._woff?.privateData ?? null;
		return wrapWOFF1(sfnt, meta, priv);
	}

	if (format === 'woff2') {
		const meta = fontData._woff?.metadata ?? null;
		const priv = fontData._woff?.privateData ?? null;
		return wrapWOFF2(sfnt, meta, priv);
	}

	return sfnt;
}

/**
 * Export each face of a collection as an individual buffer in the target format.
 * @param {object} collectionData
 * @param {string} format - 'sfnt' or 'woff'
 * @returns {ArrayBuffer[]}
 */
function exportCollectionSplit(collectionData, format) {
	const { fonts } = collectionData;
	if (!Array.isArray(fonts) || fonts.length === 0) {
		throw new Error('Collection split expects a non-empty fonts array');
	}

	return fonts.map((face) => {
		const resolved = resolveExportSource(face);
		const sfnt = exportSFNT(resolved, 0);
		if (format === 'woff') return wrapWOFF1(sfnt);
		if (format === 'woff2') return wrapWOFF2(sfnt);
		return sfnt;
	});
}

function isCollection(fontData) {
	return (
		fontData.collection &&
		fontData.collection.tag === 'ttcf' &&
		Array.isArray(fontData.fonts)
	);
}

/**
 * Resolve the raw { header, tables } data to export from the input fontData.
 *
 * Supported shapes:
 * 1. Legacy: { header, tables } — already the raw format, use as-is.
 * 2. Hybrid (imported + edited): has `_header` + `tables` AND `font` + `glyphs` —
 *    rebuild decomposed tables from simplified fields, preserve non-decomposed
 *    tables from the original import. This ensures edits to simplified fields
 *    (familyName, glyphs, kerning, etc.) are always honoured on export.
 * 3. Hand-authored simplified: has `font` + `glyphs` but no `_header` — expand.
 */
/**
 * Check whether simplified CFF glyph data is unchanged from the original
 * CFF table.  When true, the original CFF table (with subroutines etc.)
 * can safely be preserved for a lossless round-trip.
 *
 * Returns `true` only when every glyph still carries its original charString
 * bytes and the glyph count hasn't changed.
 */
function cffGlyphsUnmodified(originalCFF, simplifiedGlyphs) {
	if (!originalCFF?.fonts?.[0]) return false;
	const origCS = originalCFF.fonts[0].charStrings;
	if (!origCS || origCS.length !== simplifiedGlyphs.length) return false;

	for (let i = 0; i < simplifiedGlyphs.length; i++) {
		const glyph = simplifiedGlyphs[i];
		const orig = origCS[i];

		// Glyph no longer has a charString (user cleared it to provide contours)
		if (!glyph.charString) {
			if (orig && orig.length > 0) return false;
			continue;
		}

		// Length mismatch
		if (!orig || glyph.charString.length !== orig.length) return false;

		// Byte-level comparison
		for (let j = 0; j < orig.length; j++) {
			if (glyph.charString[j] !== orig[j]) return false;
		}
	}
	return true;
}

function resolveExportSource(fontData) {
	// Legacy shape: { header, tables } — already the raw format
	if (fontData.header && fontData.tables) {
		return fontData;
	}

	// Hybrid: imported font with simplified fields present.
	// Rebuild decomposed tables from simplified (honouring user edits),
	// then merge in non-decomposed tables from the original import.
	if (fontData._header && fontData.tables && fontData.font && fontData.glyphs) {
		const rebuilt = buildRawFromSimplified(fontData);
		// Carry forward non-decomposed tables that the rebuild cannot produce
		for (const [tag, data] of Object.entries(fontData.tables)) {
			if (!DECOMPOSED_TABLES.has(tag) && !rebuilt.tables[tag]) {
				rebuilt.tables[tag] = data;
			}
		}
		// Preserve original CFF/CFF2 only when glyph outline data is unchanged.
		// The original table retains subroutines and internal structures that
		// the rebuilt shell cannot reproduce.  When glyphs HAVE been modified
		// (added, removed, or charStrings changed), the rebuilt table — which
		// compiles charStrings from simplified glyphs — must be used instead.
		if (fontData.tables['CFF '] && rebuilt.tables['CFF ']) {
			if (cffGlyphsUnmodified(fontData.tables['CFF '], fontData.glyphs)) {
				rebuilt.tables['CFF '] = fontData.tables['CFF '];
			}
		}
		if (fontData.tables.CFF2 && rebuilt.tables.CFF2) {
			if (cffGlyphsUnmodified(fontData.tables.CFF2, fontData.glyphs)) {
				rebuilt.tables.CFF2 = fontData.tables.CFF2;
			}
		}
		return rebuilt;
	}

	// Pure lossless passthrough: _header + tables but no simplified fields
	// (e.g. constructed manually via importFontTables)
	if (fontData._header && fontData.tables) {
		return { header: fontData._header, tables: fontData.tables };
	}

	// Hand-authored simplified — has font + glyphs but no _header
	if (fontData.font && fontData.glyphs) {
		return buildRawFromSimplified(fontData);
	}

	throw new Error(
		'exportFont: input must have { header, tables } or { font, glyphs }',
	);
}

function exportSFNT(fontData, directoryOffsetBase) {
	const { header, tables } = fontData;
	const tableNames = Object.keys(tables);
	const numTables = tableNames.length;

	// --- Coordinate cross-table write dependencies ---------------------------
	// glyf <-> loca: writing glyf may produce a different binary layout than the
	// original, so loca offsets must be recomputed from the new glyf bytes.
	// Additionally, head.indexToLocFormat must match the loca format actually
	// used.  We pre-compute these tables here so the main loop can use cached
	// bytes instead of the (now-stale) parsed data.
	const precomputed = coordinateTableWrites(tables);

	// --- Build per-table byte arrays and compute padded sizes ----------------
	const tableEntries = tableNames.map((tag) => {
		const tableData = tables[tag];
		let rawArray;

		if (precomputed.has(tag)) {
			// Use pre-computed bytes from cross-table coordination
			rawArray = precomputed.get(tag);
		} else if (tableData._raw) {
			// Unparsed table — use stored bytes directly
			rawArray = tableData._raw;
		} else {
			// Parsed table — use the registered writer to regenerate bytes
			const writer = tableWriters[tag];
			if (!writer) {
				throw new Error(`No writer registered for parsed table: ${tag}`);
			}
			rawArray = writer(tableData);
		}

		const raw = new Uint8Array(rawArray);
		return {
			tag,
			data: raw,
			length: raw.length,
			paddedLength: raw.length + ((4 - (raw.length % 4)) % 4),
			checksum: computeTableChecksum(raw),
		};
	});

	// --- Compute offsets -----------------------------------------------------
	const directoryEnd = HEADER_SIZE + numTables * TABLE_RECORD_SIZE;
	// First table data starts at next 4-byte boundary after the directory.
	let currentOffset = directoryEnd + ((4 - (directoryEnd % 4)) % 4);

	for (const entry of tableEntries) {
		entry.offset = currentOffset;
		currentOffset += entry.paddedLength;
	}

	const totalSize = currentOffset;

	// --- Allocate output buffer and write ------------------------------------
	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	// Recompute header directory fields from the actual table count so that
	// stale or incorrect values from the original file are corrected.
	const maxPow2 = numTables > 0 ? 2 ** Math.floor(Math.log2(numTables)) : 0;
	const searchRange = maxPow2 * 16;
	const entrySelector = maxPow2 > 0 ? Math.floor(Math.log2(maxPow2)) : 0;
	const rangeShift = numTables * 16 - searchRange;

	// Write the font file header (Offset Table)
	view.setUint32(0, header.sfVersion);
	view.setUint16(4, numTables);
	view.setUint16(6, searchRange);
	view.setUint16(8, entrySelector);
	view.setUint16(10, rangeShift);

	// Write the Table Directory
	for (let i = 0; i < tableEntries.length; i++) {
		const entry = tableEntries[i];
		const pos = HEADER_SIZE + i * TABLE_RECORD_SIZE;

		// Tag — 4 ASCII bytes
		for (let j = 0; j < 4; j++) {
			view.setUint8(pos + j, entry.tag.charCodeAt(j));
		}
		view.setUint32(pos + 4, entry.checksum);
		view.setUint32(pos + 8, entry.offset + directoryOffsetBase);
		view.setUint32(pos + 12, entry.length);
	}

	// Write table data (padding between tables is already zeroed)
	for (const entry of tableEntries) {
		bytes.set(entry.data, entry.offset);
	}

	return buffer;
}

function exportCollection(collectionData) {
	const { collection, fonts } = collectionData;
	if (!Array.isArray(fonts) || fonts.length === 0) {
		throw new Error('TTC/OTC export expects a non-empty fonts array');
	}

	// Each font in the collection is a simplified object
	const resolvedFonts = fonts.map((f) => resolveExportSource(f));

	const majorVersion = collection.majorVersion ?? 2;
	const minorVersion = collection.minorVersion ?? 0;
	const numFonts = resolvedFonts.length;
	const hasDsigFields = majorVersion >= 2;

	const headerSize = 12 + numFonts * 4 + (hasDsigFields ? 12 : 0);
	let currentOffset = headerSize + ((4 - (headerSize % 4)) % 4);

	const firstPass = resolvedFonts.map(
		(font) => new Uint8Array(exportSFNT(font, 0)),
	);
	const faceOffsets = firstPass.map((faceBytes) => {
		const off = currentOffset;
		currentOffset += faceBytes.length;
		currentOffset += (4 - (currentOffset % 4)) % 4;
		return off;
	});

	const secondPass = resolvedFonts.map(
		(font, i) => new Uint8Array(exportSFNT(font, faceOffsets[i])),
	);

	const totalSize = currentOffset;
	const buffer = new ArrayBuffer(totalSize);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	view.setUint8(0, 't'.charCodeAt(0));
	view.setUint8(1, 't'.charCodeAt(0));
	view.setUint8(2, 'c'.charCodeAt(0));
	view.setUint8(3, 'f'.charCodeAt(0));
	view.setUint16(4, majorVersion);
	view.setUint16(6, minorVersion);
	view.setUint32(8, numFonts);

	for (let i = 0; i < numFonts; i++) {
		view.setUint32(12 + i * 4, faceOffsets[i]);
	}

	if (hasDsigFields) {
		const dsigBase = 12 + numFonts * 4;
		view.setUint32(dsigBase + 0, collection.dsigTag ?? 0);
		view.setUint32(dsigBase + 4, collection.dsigLength ?? 0);
		view.setUint32(dsigBase + 8, collection.dsigOffset ?? 0);
	}

	for (let i = 0; i < numFonts; i++) {
		bytes.set(secondPass[i], faceOffsets[i]);
	}

	return buffer;
}

// ===========================================================================
//  Cross-table write coordination
// ===========================================================================

/**
 * Pre-compute tables that have cross-table write dependencies.
 *
 * Currently handles:
 *   glyf <-> loca — loca offsets must reflect the actual byte positions of
 *                  glyphs inside the written glyf data.
 *   head.indexToLocFormat — must agree with the loca format actually emitted.
 *
 * Returns a Map<tag, number[]> of pre-computed table bytes.  Tables in this
 * map are used verbatim by the main export loop (skipping the normal writer).
 *
 * This function does NOT mutate anything on the input `tables` object.
 */
function coordinateTableWrites(tables) {
	const precomputed = new Map();

	const hasGlyf = tables.glyf && !tables.glyf._raw;
	const hasLoca = tables.loca && !tables.loca._raw;

	if (hasGlyf && hasLoca) {
		// Write glyf and capture the new per-glyph offsets
		const { bytes: glyfBytes, offsets } = writeGlyfComputeOffsets(tables.glyf);
		precomputed.set('glyf', glyfBytes);

		// Build loca from the freshly-computed offsets
		precomputed.set('loca', writeLoca({ offsets }));

		// If the loca format changed, head.indexToLocFormat must match
		if (tables.head && !tables.head._raw) {
			const canUseShort = offsets.every((o) => o % 2 === 0 && o / 2 <= 0xffff);
			const newFormat = canUseShort ? 0 : 1;

			if (tables.head.indexToLocFormat !== newFormat) {
				precomputed.set(
					'head',
					writeHead({ ...tables.head, indexToLocFormat: newFormat }),
				);
			}
		}
	}

	// Coordinate CBLC/CBDT: write CBDT first to get offsets, then CBLC
	const hasCBLC = tables.CBLC && !tables.CBLC._raw && tables.CBLC.sizes;
	const hasCBDT = tables.CBDT && !tables.CBDT._raw && tables.CBDT.bitmapData;
	if (hasCBLC && hasCBDT) {
		const { bytes: cbdtBytes, offsetInfo } = writeCBDTComputeOffsets(
			tables.CBDT,
			tables.CBLC,
		);
		precomputed.set('CBDT', cbdtBytes);
		precomputed.set('CBLC', writeCBLC(tables.CBLC, offsetInfo));
	}

	// Same for EBLC/EBDT (identical structures, same code)
	const hasEBLC = tables.EBLC && !tables.EBLC._raw && tables.EBLC.sizes;
	const hasEBDT = tables.EBDT && !tables.EBDT._raw && tables.EBDT.bitmapData;
	if (hasEBLC && hasEBDT) {
		const { bytes: ebdtBytes, offsetInfo: ebdtOffsetInfo } =
			writeCBDTComputeOffsets(tables.EBDT, tables.EBLC);
		precomputed.set('EBDT', ebdtBytes);
		precomputed.set('EBLC', writeCBLC(tables.EBLC, ebdtOffsetInfo));
	}

	// Same for bloc/bdat (Apple bitmap tables, identical structures)
	const hasBloc = tables.bloc && !tables.bloc._raw && tables.bloc.sizes;
	const hasBdat = tables.bdat && !tables.bdat._raw && tables.bdat.bitmapData;
	if (hasBloc && hasBdat) {
		const { bytes: bdatBytes, offsetInfo: bdatOffsetInfo } =
			writeCBDTComputeOffsets(tables.bdat, tables.bloc);
		precomputed.set('bdat', bdatBytes);
		precomputed.set('bloc', writeCBLC(tables.bloc, bdatOffsetInfo));
	}

	return precomputed;
}
