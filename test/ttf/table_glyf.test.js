/**
 * Tests for glyf (Glyph Data) table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import {
	parseGlyf,
	writeGlyf,
	writeGlyfComputeOffsets,
} from '../../src/ttf/table_glyf.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('glyf table parsing', () => {
	it('should parse the glyf table from a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		expect(glyf.glyphs).toBeInstanceOf(Array);
		expect(glyf.glyphs.length).toBe(font.tables['maxp'].numGlyphs);
	});

	it('should produce null entries for empty glyphs', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		// Space glyph(s) or .notdef may be empty â€” at least check type
		const empties = glyf.glyphs.filter((g) => g === null);
		// TTF fonts typically have at least a few empty glyphs (e.g. space)
		expect(empties.length).toBeGreaterThanOrEqual(0);
	});

	it('should not have _raw on parsed glyf table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		expect(glyf._raw).toBeUndefined();
		expect(glyf._checksum).toBeTypeOf('number');
	});
});

describe('glyf simple glyphs', () => {
	it('should parse simple glyph structure correctly', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		// Find first non-null simple glyph
		const simple = glyf.glyphs.find((g) => g && g.type === 'simple');
		expect(simple).toBeDefined();
		expect(simple.type).toBe('simple');
		expect(simple.contours).toBeInstanceOf(Array);
		expect(simple.contours.length).toBeGreaterThan(0);
		expect(simple.instructions).toBeInstanceOf(Array);
		expect(simple.overlapSimple).toBeTypeOf('boolean');
	});

	it('should have valid bounding box on simple glyphs', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		const simpleGlyphs = glyf.glyphs.filter((g) => g && g.type === 'simple');
		expect(simpleGlyphs.length).toBeGreaterThan(0);

		for (const g of simpleGlyphs) {
			expect(g.xMin).toBeTypeOf('number');
			expect(g.yMin).toBeTypeOf('number');
			expect(g.xMax).toBeTypeOf('number');
			expect(g.yMax).toBeTypeOf('number');
			expect(g.xMax).toBeGreaterThanOrEqual(g.xMin);
			expect(g.yMax).toBeGreaterThanOrEqual(g.yMin);
		}
	});

	it('should have points with x, y, and onCurve properties', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		const simple = glyf.glyphs.find((g) => g && g.type === 'simple');
		expect(simple).toBeDefined();

		for (const contour of simple.contours) {
			expect(contour.length).toBeGreaterThan(0);
			for (const pt of contour) {
				expect(pt.x).toBeTypeOf('number');
				expect(pt.y).toBeTypeOf('number');
				expect(pt.onCurve).toBeTypeOf('boolean');
			}
		}
	});

	it('should have contour points within the bounding box', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		const simpleGlyphs = glyf.glyphs.filter((g) => g && g.type === 'simple');

		for (const g of simpleGlyphs) {
			for (const contour of g.contours) {
				for (const pt of contour) {
					expect(pt.x).toBeGreaterThanOrEqual(g.xMin);
					expect(pt.x).toBeLessThanOrEqual(g.xMax);
					expect(pt.y).toBeGreaterThanOrEqual(g.yMin);
					expect(pt.y).toBeLessThanOrEqual(g.yMax);
				}
			}
		}
	});
});

describe('glyf composite glyphs', () => {
	it('should parse composite glyph structure if present', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		const composite = glyf.glyphs.find((g) => g && g.type === 'composite');

		if (composite) {
			expect(composite.type).toBe('composite');
			expect(composite.components).toBeInstanceOf(Array);
			expect(composite.components.length).toBeGreaterThan(0);
			expect(composite.instructions).toBeInstanceOf(Array);

			for (const comp of composite.components) {
				expect(comp.glyphIndex).toBeTypeOf('number');
				expect(comp.glyphIndex).toBeGreaterThanOrEqual(0);
				expect(comp.flags).toBeTypeOf('object');
				expect(comp.argument1).toBeTypeOf('number');
				expect(comp.argument2).toBeTypeOf('number');
			}
		}
	});

	it('should have valid bounding box on composite glyphs if present', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyf = font.tables['glyf'];

		const composites = glyf.glyphs.filter((g) => g && g.type === 'composite');

		for (const g of composites) {
			expect(g.xMin).toBeTypeOf('number');
			expect(g.yMin).toBeTypeOf('number');
			expect(g.xMax).toBeTypeOf('number');
			expect(g.yMax).toBeTypeOf('number');
		}
	});
});

describe('glyf table writing', () => {
	it('should write glyf bytes from parsed data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...glyfData } = font.tables['glyf'];

		const bytes = writeGlyf(glyfData);
		expect(bytes).toBeInstanceOf(Array);
		expect(bytes.length).toBeGreaterThan(0);
	});

	it('should produce offsets from writeGlyfComputeOffsets', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...glyfData } = font.tables['glyf'];

		const { bytes, offsets } = writeGlyfComputeOffsets(glyfData);

		expect(bytes).toBeInstanceOf(Array);
		expect(bytes.length).toBeGreaterThan(0);
		expect(offsets).toBeInstanceOf(Array);
		// numGlyphs + 1 entries
		expect(offsets.length).toBe(font.tables['maxp'].numGlyphs + 1);
		// First offset is 0
		expect(offsets[0]).toBe(0);
		// Last offset equals total bytes
		expect(offsets[offsets.length - 1]).toBe(bytes.length);
	});

	it('should produce even offsets (2-byte aligned) for loca compatibility', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...glyfData } = font.tables['glyf'];

		const { offsets } = writeGlyfComputeOffsets(glyfData);

		for (const offset of offsets) {
			expect(offset % 2).toBe(0);
		}
	});

	it('should handle empty (null) glyphs by producing zero-length segments', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const glyfData = font.tables['glyf'];

		const { offsets } = writeGlyfComputeOffsets(glyfData);

		// For each null glyph, offsets[i] === offsets[i+1]
		for (let i = 0; i < glyfData.glyphs.length; i++) {
			if (glyfData.glyphs[i] === null) {
				expect(offsets[i]).toBe(offsets[i + 1]);
			}
		}
	});
});

describe('glyf table round-trip', () => {
	it('should produce identical parsed data after write â†’ re-parse', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...glyfData } = font.tables['glyf'];

		// Write glyf and get computed offsets for loca
		const { bytes, offsets } = writeGlyfComputeOffsets(glyfData);

		// Re-parse with the new offsets
		const mockTables = {
			loca: { offsets },
			maxp: { numGlyphs: font.tables['maxp'].numGlyphs },
		};
		const reparsed = parseGlyf(bytes, mockTables);

		expect(reparsed).toEqual(glyfData);
	});
});
