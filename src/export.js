/**
 * Font-to-JSON : Export
 * Takes a JSON font object and converts it back to binary font data.
 */

import { writeCFF } from './otf/table_CFF.js';
import { writeCFF2 } from './otf/table_CFF2.js';
import { writeAvar } from './sfnt/table_avar.js';
import { writeBASE } from './sfnt/table_BASE.js';
import { writeCBDT } from './sfnt/table_CBDT.js';
import { writeCBLC } from './sfnt/table_CBLC.js';
import { writeCmap } from './sfnt/table_cmap.js';
import { writeCOLR } from './sfnt/table_COLR.js';
import { writeCPAL } from './sfnt/table_CPAL.js';
import { writeEBDT } from './sfnt/table_EBDT.js';
import { writeEBLC } from './sfnt/table_EBLC.js';
import { writeEBSC } from './sfnt/table_EBSC.js';
import { writeFvar } from './sfnt/table_fvar.js';
import { writeGDEF } from './sfnt/table_GDEF.js';
import { writeGPOS } from './sfnt/table_GPOS.js';
import { writeGSUB } from './sfnt/table_GSUB.js';
import { writeHead } from './sfnt/table_head.js';
import { writeHhea } from './sfnt/table_hhea.js';
import { writeHmtx } from './sfnt/table_hmtx.js';
import { writeHVAR } from './sfnt/table_HVAR.js';
import { writeJSTF } from './sfnt/table_JSTF.js';
import { writeKern } from './sfnt/table_kern.js';
import { writeMATH } from './sfnt/table_MATH.js';
import { writeMaxp } from './sfnt/table_maxp.js';
import { writeMVAR } from './sfnt/table_MVAR.js';
import { writeName } from './sfnt/table_name.js';
import { writeOS2 } from './sfnt/table_OS-2.js';
import { writePost } from './sfnt/table_post.js';
import { writeSbix } from './sfnt/table_sbix.js';
import { writeSTAT } from './sfnt/table_STAT.js';
import { writeSVG } from './sfnt/table_SVG.js';
import { writeVhea } from './sfnt/table_vhea.js';
import { writeVmtx } from './sfnt/table_vmtx.js';
import { writeVVAR } from './sfnt/table_VVAR.js';
import { writeCvar } from './ttf/table_cvar.js';
import { writeCvt } from './ttf/table_cvt.js';
import { writeFpgm } from './ttf/table_fpgm.js';
import { writeGasp } from './ttf/table_gasp.js';
import { writeGlyf, writeGlyfComputeOffsets } from './ttf/table_glyf.js';
import { writeGvar } from './ttf/table_gvar.js';
import { writeLoca } from './ttf/table_loca.js';
import { writePrep } from './ttf/table_prep.js';

/**
 * Registry of table writers.
 * Each key is a table tag; the value is a function (object) → number[].
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
	BASE: writeBASE,
	JSTF: writeJSTF,
	MATH: writeMATH,
	CBLC: writeCBLC,
	CBDT: writeCBDT,
	'OS/2': writeOS2,
	kern: writeKern,
	post: writePost,
	STAT: writeSTAT,
	'CFF ': writeCFF,
	CFF2: writeCFF2,
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
	sbix: writeSbix,
	'SVG ': writeSVG,
};

/** Size of the font file header (Offset Table) in bytes. */
const HEADER_SIZE = 12;

/** Size of a single Table Record in the table directory, in bytes. */
const TABLE_RECORD_SIZE = 16;

/**
 * Export a font JSON object back to binary data (ArrayBuffer).
 * @param {object} fontData - Parsed font data object (as produced by importFont).
 * @returns {ArrayBuffer} Binary font file bytes.
 */
export function exportFont(fontData) {
	if (!fontData || typeof fontData !== 'object') {
		throw new TypeError('exportFont expects a font data object');
	}

	const { header, tables } = fontData;
	const tableNames = Object.keys(tables);
	const numTables = tableNames.length;

	// --- Coordinate cross-table write dependencies ---------------------------
	// glyf ↔ loca: writing glyf may produce a different binary layout than the
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
			checksum: tableData._checksum,
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

	// Write the font file header (Offset Table)
	view.setUint32(0, header.sfVersion);
	view.setUint16(4, numTables);
	view.setUint16(6, header.searchRange);
	view.setUint16(8, header.entrySelector);
	view.setUint16(10, header.rangeShift);

	// Write the Table Directory
	for (let i = 0; i < tableEntries.length; i++) {
		const entry = tableEntries[i];
		const pos = HEADER_SIZE + i * TABLE_RECORD_SIZE;

		// Tag — 4 ASCII bytes
		for (let j = 0; j < 4; j++) {
			view.setUint8(pos + j, entry.tag.charCodeAt(j));
		}
		view.setUint32(pos + 4, entry.checksum);
		view.setUint32(pos + 8, entry.offset);
		view.setUint32(pos + 12, entry.length);
	}

	// Write table data (padding between tables is already zeroed)
	for (const entry of tableEntries) {
		bytes.set(entry.data, entry.offset);
	}

	return buffer;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Cross-table write coordination
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pre-compute tables that have cross-table write dependencies.
 *
 * Currently handles:
 *   glyf ↔ loca — loca offsets must reflect the actual byte positions of
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

	return precomputed;
}
