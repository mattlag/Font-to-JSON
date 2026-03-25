/**
 * Font Flux JS : sbix table
 * Standard Bitmap Graphics Table
 *
 * Parses per-strike glyph records (originOffsetX/Y, graphicType, imageData).
 * Requires numGlyphs from maxp table.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseSbix(rawBytes, tables) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const flags = reader.uint16();
	const numStrikes = reader.uint32();

	const strikeOffsets = reader.array('uint32', numStrikes);

	// Determine numGlyphs from maxp or from first strike's glyph offset array
	let numGlyphs = tables?.maxp?.numGlyphs;

	const strikes = [];
	for (let i = 0; i < numStrikes; i++) {
		const start = strikeOffsets[i];
		const end = strikeOffsets[i + 1] ?? rawBytes.length;
		if (start >= rawBytes.length || end <= start) {
			strikes.push({ ppem: 0, ppi: 0, glyphs: [] });
			continue;
		}

		reader.seek(start);
		const ppem = reader.uint16();
		const ppi = reader.uint16();

		// Compute numGlyphs from first glyph offset if maxp not available
		if (numGlyphs == null) {
			const firstGlyphDataOffset = reader.uint32();
			numGlyphs = (firstGlyphDataOffset - 4) / 4 - 1;
			reader.seek(start + 4); // rewind to read all offsets
		}

		// Read glyph data offsets: numGlyphs + 1 entries
		const glyphDataOffsets = reader.array('uint32', numGlyphs + 1);

		// Parse per-glyph records
		const glyphs = [];
		for (let g = 0; g < numGlyphs; g++) {
			const glyphStart = start + glyphDataOffsets[g];
			const glyphEnd = start + glyphDataOffsets[g + 1];
			const glyphSize = glyphEnd - glyphStart;

			if (glyphSize <= 0) {
				glyphs.push(null);
				continue;
			}

			reader.seek(glyphStart);
			const originOffsetX = reader.int16();
			const originOffsetY = reader.int16();
			const graphicType = reader.tag();
			const imageData = glyphSize > 8
				? rawBytes.slice(glyphStart + 8, glyphEnd)
				: [];

			glyphs.push({ originOffsetX, originOffsetY, graphicType, imageData });
		}

		strikes.push({ ppem, ppi, glyphs });
	}

	return { version, flags, strikes };
}

export function writeSbix(sbix) {
	const version = sbix.version ?? 1;
	const flags = sbix.flags ?? 0;
	const strikes = sbix.strikes ?? [];

	// Serialize each strike
	const strikeBlobs = strikes.map((s) => {
		if (s._raw) return s._raw;
		return serializeStrike(s);
	});

	// Header: version(2) + flags(2) + numStrikes(4) + strikeOffsets(numStrikes*4)
	const headerSize = 8 + strikes.length * 4;
	let offset = headerSize;
	const strikeOffsets = [];
	for (const blob of strikeBlobs) {
		strikeOffsets.push(offset);
		offset += blob.length;
	}

	const w = new DataWriter(offset);
	w.uint16(version);
	w.uint16(flags);
	w.uint32(strikes.length);
	for (const off of strikeOffsets) {
		w.uint32(off);
	}
	for (const blob of strikeBlobs) {
		w.rawBytes(blob);
	}
	return w.toArray();
}

function serializeStrike(strike) {
	const glyphs = strike.glyphs ?? [];
	const numGlyphs = glyphs.length;

	// Serialize each glyph record
	const glyphBlobs = glyphs.map((g) => {
		if (!g) return [];
		const imageData = g.imageData ?? [];
		const w = new DataWriter(8 + imageData.length);
		w.int16(g.originOffsetX ?? 0);
		w.int16(g.originOffsetY ?? 0);
		w.tag(g.graphicType ?? 'png ');
		w.rawBytes(imageData);
		return w.toArray();
	});

	// Build glyph data offsets: relative to strike start
	// Strike header: ppem(2) + ppi(2) + offsets((numGlyphs+1)*4)
	const offsetArraySize = (numGlyphs + 1) * 4;
	const strikeHeaderSize = 4 + offsetArraySize;

	let glyphOffset = strikeHeaderSize;
	const glyphDataOffsets = [];
	for (const blob of glyphBlobs) {
		glyphDataOffsets.push(glyphOffset);
		glyphOffset += blob.length;
	}
	glyphDataOffsets.push(glyphOffset); // sentinel

	const totalSize = glyphOffset;
	const w = new DataWriter(totalSize);
	w.uint16(strike.ppem ?? 0);
	w.uint16(strike.ppi ?? 0);
	for (const off of glyphDataOffsets) {
		w.uint32(off);
	}
	for (const blob of glyphBlobs) {
		w.rawBytes(blob);
	}
	return w.toArray();
}
