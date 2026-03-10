/**
 * Font Flux JS : SVG table
 * SVG (Scalable Vector Graphics) Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/svg
 *
 * Contains SVG documents that provide color glyph descriptions.
 * Each SVG document is associated with a range of glyph IDs.
 * Documents can be plain-text UTF-8 or gzip-encoded.
 *
 * Table tag is 'SVG ' (with trailing space).
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an SVG table from raw bytes.
 *
 * SVG Header (10 bytes):
 *   uint16   version               — Set to 0
 *   Offset32 svgDocumentListOffset — from start of SVG table
 *   uint32   reserved              — Set to 0
 *
 * SVGDocumentList:
 *   uint16   numEntries
 *   SVGDocumentRecord[numEntries]
 *
 * SVGDocumentRecord (12 bytes):
 *   uint16   startGlyphID
 *   uint16   endGlyphID
 *   Offset32 svgDocOffset  — from start of SVGDocumentList
 *   uint32   svgDocLength
 *
 * SVG documents may be plain-text UTF-8 or gzip-encoded (header 0x1F 0x8B 0x08).
 * Plain-text documents are stored as strings; gzip documents as byte arrays.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseSVG(rawBytes) {
	const reader = new DataReader(rawBytes);

	// == SVG Header ======================================================
	const version = reader.uint16();
	const svgDocumentListOffset = reader.uint32();
	const reserved = reader.uint32();

	// == SVGDocumentList =================================================
	reader.seek(svgDocumentListOffset);
	const numEntries = reader.uint16();

	const documentRecords = [];
	for (let i = 0; i < numEntries; i++) {
		documentRecords.push({
			startGlyphID: reader.uint16(),
			endGlyphID: reader.uint16(),
			svgDocOffset: reader.uint32(),
			svgDocLength: reader.uint32(),
		});
	}

	// == Read SVG documents ==============================================
	// Multiple records can point to the same document. We deduplicate
	// by (offset, length) and store unique documents only once.
	const decoder = new TextDecoder('utf-8');
	const docCache = new Map(); // key: "offset:length" -> document index

	const documents = [];

	for (const rec of documentRecords) {
		const key = `${rec.svgDocOffset}:${rec.svgDocLength}`;
		if (!docCache.has(key)) {
			const absOffset = svgDocumentListOffset + rec.svgDocOffset;
			const docBytes = rawBytes.slice(absOffset, absOffset + rec.svgDocLength);

			// Check for gzip magic header: 0x1F 0x8B 0x08
			const isCompressed =
				docBytes.length >= 3 &&
				docBytes[0] === 0x1f &&
				docBytes[1] === 0x8b &&
				docBytes[2] === 0x08;

			const docIndex = documents.length;
			if (isCompressed) {
				documents.push({ compressed: true, data: docBytes });
			} else {
				const text = decoder.decode(new Uint8Array(docBytes));
				documents.push({ compressed: false, text });
			}
			docCache.set(key, docIndex);
		}
	}

	// -- Build entries — reference documents by index ---------------------
	const entries = [];
	for (const rec of documentRecords) {
		const key = `${rec.svgDocOffset}:${rec.svgDocLength}`;
		entries.push({
			startGlyphID: rec.startGlyphID,
			endGlyphID: rec.endGlyphID,
			documentIndex: docCache.get(key),
		});
	}

	return {
		version,
		documents,
		entries,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an SVG JSON object back to raw bytes.
 *
 * @param {object} svg - Parsed SVG table data
 * @returns {number[]} Array of byte values
 */
export function writeSVG(svg) {
	const { version, documents, entries } = svg;
	const encoder = new TextEncoder();

	// == Encode all documents into byte arrays ===========================
	const docByteArrays = documents.map((doc) => {
		if (doc.compressed) {
			return doc.data instanceof Uint8Array ? Array.from(doc.data) : doc.data;
		}
		return Array.from(encoder.encode(doc.text));
	});

	// == Compute layout ==================================================
	// SVG Header: 10 bytes (uint16 + Offset32 + uint32)
	const headerSize = 10;

	// SVGDocumentList starts right after the header
	const svgDocumentListOffset = headerSize;

	// SVGDocumentList header: 2 bytes (numEntries)
	// SVGDocumentRecord: 12 bytes each
	const numEntries = entries.length;
	const docListHeaderSize = 2 + numEntries * 12;

	// SVG document data follows the record array.
	// Documents are referenced by (offset, length) from the SVGDocumentList start.
	// Multiple entries can share the same document.

	// Build a mapping: documentIndex -> (offset relative to docListStart, length)
	let docDataOffset = docListHeaderSize; // first doc data offset from SVGDocumentList
	const docLayout = []; // per unique document: { offset, length }

	for (let i = 0; i < docByteArrays.length; i++) {
		const bytes = docByteArrays[i];
		docLayout.push({ offset: docDataOffset, length: bytes.length });
		docDataOffset += bytes.length;
	}

	const totalSize = svgDocumentListOffset + docDataOffset;
	const w = new DataWriter(totalSize);

	// == Write SVG Header ================================================
	w.uint16(version);
	w.uint32(svgDocumentListOffset);
	w.uint32(0); // reserved

	// == Write SVGDocumentList ===========================================
	w.uint16(numEntries);

	for (const entry of entries) {
		const layout = docLayout[entry.documentIndex];
		w.uint16(entry.startGlyphID);
		w.uint16(entry.endGlyphID);
		w.uint32(layout.offset);
		w.uint32(layout.length);
	}

	// == Write document data =============================================
	for (const bytes of docByteArrays) {
		for (const b of bytes) {
			w.uint8(b);
		}
	}

	return w.toArray();
}
