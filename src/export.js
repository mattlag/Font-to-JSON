/**
 * Font-to-JSON : Export
 * Takes a JSON font object and converts it back to binary font data.
 */

import { writeCmap } from './otf/table_cmap.js';
import { writeHead } from './otf/table_head.js';
import { writeHhea } from './otf/table_hhea.js';
import { writeHmtx } from './otf/table_hmtx.js';
import { writeMaxp } from './otf/table_maxp.js';
import { writeName } from './otf/table_name.js';

/**
 * Registry of table writers.
 * Each key is a table tag; the value is a function (object) → number[].
 * Tables not listed here must have _raw bytes.
 */
const tableWriters = {
	cmap: writeCmap,
	head: writeHead,
	hhea: writeHhea,
	hmtx: writeHmtx,
	maxp: writeMaxp,
	name: writeName,
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

	// --- Build per-table byte arrays and compute padded sizes ----------------
	const tableEntries = tableNames.map((tag) => {
		const tableData = tables[tag];
		let rawArray;

		if (tableData._raw) {
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
