/**
 * Tests for sbix table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseSbix, writeSbix } from '../../src/sfnt/table_sbix.js';
import { DataWriter } from '../../src/writer.js';

describe('sbix table', () => {
	it('should parse per-glyph records from a strike', () => {
		// Build sbix with 1 strike, 2 glyphs
		const strike = buildStrike(20, 72, [
			{ originOffsetX: 0, originOffsetY: -10, graphicType: 'png ', imageData: [0x89, 0x50] },
			null, // glyph 1 has no data
		]);

		const w = new DataWriter(256);
		w.uint16(1); // version
		w.uint16(1); // flags
		w.uint32(1); // numStrikes
		const strikeOffset = 8 + 4; // header + 1 strikeOffset
		w.uint32(strikeOffset);
		w.rawBytes(strike);

		const tables = { maxp: { numGlyphs: 2 } };
		const parsed = parseSbix(w.toArray(), tables);

		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(1);
		expect(parsed.strikes.length).toBe(1);
		expect(parsed.strikes[0].ppem).toBe(20);
		expect(parsed.strikes[0].ppi).toBe(72);
		expect(parsed.strikes[0].glyphs.length).toBe(2);
		expect(parsed.strikes[0].glyphs[0].originOffsetX).toBe(0);
		expect(parsed.strikes[0].glyphs[0].originOffsetY).toBe(-10);
		expect(parsed.strikes[0].glyphs[0].graphicType).toBe('png ');
		expect(parsed.strikes[0].glyphs[0].imageData).toEqual([0x89, 0x50]);
		expect(parsed.strikes[0].glyphs[1]).toBeNull();
	});

	it('should round-trip structured sbix with glyph records', () => {
		const original = {
			version: 1,
			flags: 1,
			strikes: [
				{
					ppem: 96,
					ppi: 72,
					glyphs: [
						{ originOffsetX: 10, originOffsetY: -5, graphicType: 'png ', imageData: [1, 2, 3, 4] },
						{ originOffsetX: 0, originOffsetY: 0, graphicType: 'jpg ', imageData: [5, 6] },
						null,
					],
				},
			],
		};

		const written = writeSbix(original);
		const tables = { maxp: { numGlyphs: 3 } };
		const parsed = parseSbix(written, tables);

		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(1);
		expect(parsed.strikes.length).toBe(1);
		const strike = parsed.strikes[0];
		expect(strike.ppem).toBe(96);
		expect(strike.ppi).toBe(72);
		expect(strike.glyphs.length).toBe(3);
		expect(strike.glyphs[0].originOffsetX).toBe(10);
		expect(strike.glyphs[0].originOffsetY).toBe(-5);
		expect(strike.glyphs[0].graphicType).toBe('png ');
		expect(strike.glyphs[0].imageData).toEqual([1, 2, 3, 4]);
		expect(strike.glyphs[1].graphicType).toBe('jpg ');
		expect(strike.glyphs[1].imageData).toEqual([5, 6]);
		expect(strike.glyphs[2]).toBeNull();
	});

	it('should handle dupe graphic type', () => {
		// 'dupe' type: imageData contains a uint16 glyph ID (big-endian)
		const original = {
			version: 1,
			flags: 1,
			strikes: [{
				ppem: 48,
				ppi: 96,
				glyphs: [
					{ originOffsetX: 0, originOffsetY: 0, graphicType: 'dupe', imageData: [0x00, 0x05] },
				],
			}],
		};
		const written = writeSbix(original);
		const parsed = parseSbix(written, { maxp: { numGlyphs: 1 } });
		expect(parsed.strikes[0].glyphs[0].graphicType).toBe('dupe');
		expect(parsed.strikes[0].glyphs[0].imageData).toEqual([0x00, 0x05]);
	});

	it('should infer numGlyphs from strike data when maxp not available', () => {
		// Build sbix without providing maxp
		const strike = buildStrike(24, 72, [
			{ originOffsetX: 0, originOffsetY: 0, graphicType: 'png ', imageData: [0xAA] },
		]);

		const w = new DataWriter(256);
		w.uint16(1); w.uint16(1); w.uint32(1);
		w.uint32(12); // strike starts right after header
		w.rawBytes(strike);

		const parsed = parseSbix(w.toArray());
		expect(parsed.strikes[0].glyphs.length).toBe(1);
		expect(parsed.strikes[0].glyphs[0].imageData).toEqual([0xAA]);
	});
});

/** Helper: build raw strike bytes */
function buildStrike(ppem, ppi, glyphs) {
	const numGlyphs = glyphs.length;
	const glyphBlobs = glyphs.map((g) => {
		if (!g) return [];
		const imageData = g.imageData ?? [];
		const gw = new DataWriter(8 + imageData.length);
		gw.int16(g.originOffsetX ?? 0);
		gw.int16(g.originOffsetY ?? 0);
		gw.tag(g.graphicType ?? 'png ');
		gw.rawBytes(imageData);
		return gw.toArray();
	});

	const headerSize = 4 + (numGlyphs + 1) * 4;
	let glyphOffset = headerSize;
	const offsets = [];
	for (const blob of glyphBlobs) {
		offsets.push(glyphOffset);
		glyphOffset += blob.length;
	}
	offsets.push(glyphOffset);

	const sw = new DataWriter(glyphOffset);
	sw.uint16(ppem);
	sw.uint16(ppi);
	for (const off of offsets) sw.uint32(off);
	for (const blob of glyphBlobs) sw.rawBytes(blob);
	return sw.toArray();
}
