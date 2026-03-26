/**
 * Font Flux JS : WOFF 1.0
 * Unwrap (decompress) and wrap (compress) WOFF 1.0 font containers.
 *
 * WOFF 1.0 is a simple wrapper around SFNT data: each table is individually
 * compressed with zlib (deflate), and the overall file has a 44-byte header
 * plus a 20-byte-per-table directory.
 *
 * Spec: https://www.w3.org/TR/WOFF/
 */

import { inflate, deflate } from 'pako';

// ─── Constants ──────────────────────────────────────────────────────────────

const WOFF1_SIGNATURE = 0x774f4646; // 'wOFF'
const WOFF_HEADER_SIZE = 44;
const WOFF_TABLE_DIR_ENTRY_SIZE = 20;
const SFNT_HEADER_SIZE = 12;
const SFNT_TABLE_RECORD_SIZE = 16;

// ─── Unwrap (WOFF → SFNT) ──────────────────────────────────────────────────

/**
 * Unwrap a WOFF 1.0 file, decompressing each table and reassembling a valid
 * SFNT (TTF/OTF) binary.
 *
 * @param {ArrayBuffer} buffer - Raw WOFF file bytes.
 * @returns {{ sfnt: ArrayBuffer, metadata: Uint8Array|null, privateData: Uint8Array|null }}
 */
export function unwrapWOFF1(buffer) {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	// ── Parse WOFF header (44 bytes) ─────────────────────────────────────
	const signature = view.getUint32(0);
	if (signature !== WOFF1_SIGNATURE) {
		throw new Error('Invalid WOFF1 signature');
	}

	const flavor = view.getUint32(4);
	// const length = view.getUint32(8);
	const numTables = view.getUint16(12);
	// const reserved = view.getUint16(14);
	// const totalSfntSize = view.getUint32(16);
	// const majorVersion = view.getUint16(20);
	// const minorVersion = view.getUint16(22);
	const metaOffset = view.getUint32(24);
	const metaLength = view.getUint32(28);
	// const metaOrigLength = view.getUint32(32);
	const privOffset = view.getUint32(36);
	const privLength = view.getUint32(40);

	// ── Parse WOFF table directory (20 bytes per entry) ──────────────────
	const tables = [];
	let dirOffset = WOFF_HEADER_SIZE;
	for (let i = 0; i < numTables; i++) {
		tables.push({
			tag: String.fromCharCode(
				view.getUint8(dirOffset),
				view.getUint8(dirOffset + 1),
				view.getUint8(dirOffset + 2),
				view.getUint8(dirOffset + 3),
			),
			offset: view.getUint32(dirOffset + 4),
			compLength: view.getUint32(dirOffset + 8),
			origLength: view.getUint32(dirOffset + 12),
			origChecksum: view.getUint32(dirOffset + 16),
		});
		dirOffset += WOFF_TABLE_DIR_ENTRY_SIZE;
	}

	// ── Decompress each table ────────────────────────────────────────────
	const decompressedTables = tables.map((entry) => {
		const compressed = bytes.subarray(
			entry.offset,
			entry.offset + entry.compLength,
		);

		let data;
		if (entry.compLength < entry.origLength) {
			// Table is zlib-compressed
			data = inflate(compressed);
			if (data.length !== entry.origLength) {
				throw new Error(
					`WOFF1 table '${entry.tag}': decompressed size ${data.length} !== expected ${entry.origLength}`,
				);
			}
		} else {
			// Table stored uncompressed (compLength === origLength)
			data = compressed;
		}

		return {
			tag: entry.tag,
			checksum: entry.origChecksum,
			data,
			length: entry.origLength,
			paddedLength: entry.origLength + ((4 - (entry.origLength % 4)) % 4),
		};
	});

	// ── Reassemble SFNT ──────────────────────────────────────────────────
	const sfntDirEnd = SFNT_HEADER_SIZE + numTables * SFNT_TABLE_RECORD_SIZE;
	let dataOffset = sfntDirEnd + ((4 - (sfntDirEnd % 4)) % 4);

	// Compute searchRange / entrySelector / rangeShift for the SFNT header
	const { searchRange, entrySelector, rangeShift } =
		computeBinarySearchParams(numTables);

	// Total size: header + directory + all padded tables
	let totalSize = dataOffset;
	for (const t of decompressedTables) {
		totalSize += t.paddedLength;
	}

	const sfntBuffer = new ArrayBuffer(totalSize);
	const sfntView = new DataView(sfntBuffer);
	const sfntBytes = new Uint8Array(sfntBuffer);

	// Write SFNT header
	sfntView.setUint32(0, flavor);
	sfntView.setUint16(4, numTables);
	sfntView.setUint16(6, searchRange);
	sfntView.setUint16(8, entrySelector);
	sfntView.setUint16(10, rangeShift);

	// Write table directory + data
	// Sort entries by tag for the SFNT directory (spec requires ascending order)
	const sorted = decompressedTables
		.map((t, i) => ({ ...t, originalIndex: i }))
		.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

	for (let i = 0; i < sorted.length; i++) {
		const entry = sorted[i];
		const recordPos = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;

		// Tag
		for (let j = 0; j < 4; j++) {
			sfntView.setUint8(recordPos + j, entry.tag.charCodeAt(j));
		}
		sfntView.setUint32(recordPos + 4, entry.checksum);
		sfntView.setUint32(recordPos + 8, dataOffset);
		sfntView.setUint32(recordPos + 12, entry.length);

		// Copy decompressed table data
		sfntBytes.set(entry.data, dataOffset);
		dataOffset += entry.paddedLength;
	}

	// ── Extract optional metadata and private data ───────────────────────
	let metadata = null;
	if (metaOffset && metaLength) {
		const metaCompressed = bytes.subarray(metaOffset, metaOffset + metaLength);
		metadata = inflate(metaCompressed);
	}

	let privateData = null;
	if (privOffset && privLength) {
		privateData = bytes.slice(privOffset, privOffset + privLength);
	}

	return { sfnt: sfntBuffer, metadata, privateData };
}

// ─── Wrap (SFNT → WOFF) ────────────────────────────────────────────────────

/**
 * Wrap an SFNT (TTF/OTF) binary into a WOFF 1.0 file, compressing each table
 * with zlib deflate.
 *
 * @param {ArrayBuffer} sfntBuffer - Raw SFNT font bytes.
 * @param {Uint8Array|null} [metadata] - Optional extended metadata (raw XML bytes, will be zlib-compressed).
 * @param {Uint8Array|null} [privateData] - Optional private data block (stored as-is).
 * @returns {ArrayBuffer} WOFF 1.0 file bytes.
 */
export function wrapWOFF1(sfntBuffer, metadata = null, privateData = null) {
	const sfntView = new DataView(sfntBuffer);
	const sfntBytes = new Uint8Array(sfntBuffer);

	// ── Read SFNT header ─────────────────────────────────────────────────
	const flavor = sfntView.getUint32(0);
	const numTables = sfntView.getUint16(4);

	// ── Read SFNT table directory ────────────────────────────────────────
	const sfntTables = [];
	for (let i = 0; i < numTables; i++) {
		const pos = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;
		sfntTables.push({
			tag: String.fromCharCode(
				sfntView.getUint8(pos),
				sfntView.getUint8(pos + 1),
				sfntView.getUint8(pos + 2),
				sfntView.getUint8(pos + 3),
			),
			checksum: sfntView.getUint32(pos + 4),
			offset: sfntView.getUint32(pos + 8),
			length: sfntView.getUint32(pos + 12),
		});
	}

	// ── Compress each table ──────────────────────────────────────────────
	const compressedTables = sfntTables.map((entry) => {
		const raw = sfntBytes.subarray(entry.offset, entry.offset + entry.length);
		const compressed = deflate(raw);

		// Per spec: if compressed >= original, store uncompressed
		const useCompressed = compressed.length < entry.length;
		return {
			tag: entry.tag,
			origChecksum: entry.checksum,
			origLength: entry.length,
			data: useCompressed ? compressed : raw,
			compLength: useCompressed ? compressed.length : entry.length,
		};
	});

	// ── Compress metadata if present ─────────────────────────────────────
	let metaCompressed = null;
	let metaOrigLength = 0;
	if (metadata && metadata.length > 0) {
		metaOrigLength = metadata.length;
		metaCompressed = deflate(metadata);
	}

	// ── Compute WOFF layout ──────────────────────────────────────────────
	const woffDirSize = WOFF_HEADER_SIZE + numTables * WOFF_TABLE_DIR_ENTRY_SIZE;
	let woffDataOffset = woffDirSize;
	// 4-byte align the start of table data
	woffDataOffset += (4 - (woffDataOffset % 4)) % 4;

	// Assign offsets to compressed table data
	for (const ct of compressedTables) {
		ct.woffOffset = woffDataOffset;
		woffDataOffset += ct.compLength;
		// Pad to 4-byte boundary
		woffDataOffset += (4 - (woffDataOffset % 4)) % 4;
	}

	// Metadata block
	let metaOffset = 0;
	let metaLength = 0;
	if (metaCompressed) {
		// Must start on 4-byte boundary (already aligned from last table padding)
		metaOffset = woffDataOffset;
		metaLength = metaCompressed.length;
		woffDataOffset += metaLength;
		// Pad for private data alignment
		woffDataOffset += (4 - (woffDataOffset % 4)) % 4;
	}

	// Private data block
	let privOffset = 0;
	let privLength = 0;
	if (privateData && privateData.length > 0) {
		privOffset = woffDataOffset;
		privLength = privateData.length;
		woffDataOffset += privLength;
	}

	const totalWoffLength = woffDataOffset;

	// Compute totalSfntSize (the size the decoded SFNT would be)
	let totalSfntSize =
		SFNT_HEADER_SIZE + numTables * SFNT_TABLE_RECORD_SIZE;
	for (const ct of compressedTables) {
		totalSfntSize += ct.origLength + ((4 - (ct.origLength % 4)) % 4);
	}

	// ── Write WOFF file ──────────────────────────────────────────────────
	const woffBuffer = new ArrayBuffer(totalWoffLength);
	const woffView = new DataView(woffBuffer);
	const woffBytes = new Uint8Array(woffBuffer);

	// Header (44 bytes)
	woffView.setUint32(0, WOFF1_SIGNATURE);
	woffView.setUint32(4, flavor);
	woffView.setUint32(8, totalWoffLength);
	woffView.setUint16(12, numTables);
	woffView.setUint16(14, 0); // reserved
	woffView.setUint32(16, totalSfntSize);
	woffView.setUint16(20, 0); // majorVersion
	woffView.setUint16(22, 0); // minorVersion
	woffView.setUint32(24, metaOffset);
	woffView.setUint32(28, metaLength);
	woffView.setUint32(32, metaOrigLength);
	woffView.setUint32(36, privOffset);
	woffView.setUint32(40, privLength);

	// Table directory (20 bytes per entry)
	for (let i = 0; i < compressedTables.length; i++) {
		const ct = compressedTables[i];
		const pos = WOFF_HEADER_SIZE + i * WOFF_TABLE_DIR_ENTRY_SIZE;

		for (let j = 0; j < 4; j++) {
			woffView.setUint8(pos + j, ct.tag.charCodeAt(j));
		}
		woffView.setUint32(pos + 4, ct.woffOffset);
		woffView.setUint32(pos + 8, ct.compLength);
		woffView.setUint32(pos + 12, ct.origLength);
		woffView.setUint32(pos + 16, ct.origChecksum);
	}

	// Table data
	for (const ct of compressedTables) {
		woffBytes.set(ct.data, ct.woffOffset);
	}

	// Metadata
	if (metaCompressed) {
		woffBytes.set(metaCompressed, metaOffset);
	}

	// Private data
	if (privateData && privateData.length > 0) {
		woffBytes.set(privateData, privOffset);
	}

	return woffBuffer;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the SFNT binary-search helper fields from numTables.
 */
function computeBinarySearchParams(numTables) {
	let searchRange = 1;
	let entrySelector = 0;
	while (searchRange * 2 <= numTables) {
		searchRange *= 2;
		entrySelector++;
	}
	searchRange *= 16;
	const rangeShift = numTables * 16 - searchRange;
	return { searchRange, entrySelector, rangeShift };
}
