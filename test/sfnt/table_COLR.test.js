/**
 * Tests for the COLR (Color) table parser / writer.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFontTables } from '../../src/main.js';
import { parseCOLR, writeCOLR } from '../../src/sfnt/table_COLR.js';

const SAMPLES = path.resolve('test/sample fonts');

/**
 * Helper: load a font and return the parsed COLR table.
 */
function loadCOLR(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	const font = importFontTables(ab);
	return { font, colr: font.tables['COLR'] };
}

describe('COLR table', () => {
	// == Parsing ========================================================

	it('should parse the COLR table from BungeeTint-Regular.ttf', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		expect(colr).toBeDefined();
		expect(colr.version).toBe(0);
		expect(colr.baseGlyphRecords.length).toBe(1049);
		expect(colr.layerRecords.length).toBe(2098);
	});

	it('should have correct base glyph record structure', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.baseGlyphRecords[0];
		expect(first).toHaveProperty('glyphID');
		expect(first).toHaveProperty('firstLayerIndex');
		expect(first).toHaveProperty('numLayers');
		expect(typeof first.glyphID).toBe('number');

		// BungeeTint uses two layers per base glyph
		for (const rec of colr.baseGlyphRecords) {
			expect(rec.numLayers).toBe(2);
		}
	});

	it('should have correct layer record structure', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.layerRecords[0];
		expect(first).toHaveProperty('glyphID');
		expect(first).toHaveProperty('paletteIndex');
		expect(typeof first.glyphID).toBe('number');
		expect(typeof first.paletteIndex).toBe('number');
	});

	it('should have correct values for the first base glyph', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.baseGlyphRecords[0];
		expect(first.glyphID).toBe(0);
		expect(first.firstLayerIndex).toBe(0);
		expect(first.numLayers).toBe(2);

		// First two layer records belong to base glyph 0
		expect(colr.layerRecords[0].paletteIndex).toBe(0);
		expect(colr.layerRecords[1].paletteIndex).toBe(1);
	});

	it('should not have v1Header for a v0 font', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		expect(colr.v1Header).toBeUndefined();
		expect(colr._v1RawBytes).toBeUndefined();
	});

	it('should not have _raw (fully parsed)', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');
		expect(colr._raw).toBeUndefined();
	});

	// == Round-trip ======================================================

	it('should round-trip COLR from BungeeTint-Regular.ttf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'BungeeTint-Regular.ttf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFontTables(ab);

		const exported = exportFont(font);
		const reimported = importFontTables(exported);
		const orig = font.tables['COLR'];
		const rt = reimported.tables['COLR'];

		expect(rt.version).toBe(orig.version);
		expect(rt.baseGlyphRecords.length).toBe(orig.baseGlyphRecords.length);
		expect(rt.layerRecords.length).toBe(orig.layerRecords.length);

		// Spot-check a few records
		for (let i = 0; i < Math.min(orig.baseGlyphRecords.length, 10); i++) {
			expect(rt.baseGlyphRecords[i]).toEqual(orig.baseGlyphRecords[i]);
		}
		for (let i = 0; i < Math.min(orig.layerRecords.length, 10); i++) {
			expect(rt.layerRecords[i]).toEqual(orig.layerRecords[i]);
		}
	});

	// == Synthetic =======================================================

	it('should handle a synthetic v0 COLR table', () => {
		const original = {
			version: 0,
			baseGlyphRecords: [
				{ glyphID: 5, firstLayerIndex: 0, numLayers: 2 },
				{ glyphID: 10, firstLayerIndex: 2, numLayers: 3 },
			],
			layerRecords: [
				{ glyphID: 5, paletteIndex: 0 },
				{ glyphID: 6, paletteIndex: 1 },
				{ glyphID: 10, paletteIndex: 0 },
				{ glyphID: 11, paletteIndex: 2 },
				{ glyphID: 12, paletteIndex: 1 },
			],
		};

		const bytes = writeCOLR(original);
		const parsed = parseCOLR(bytes);

		expect(parsed.version).toBe(0);
		expect(parsed.baseGlyphRecords.length).toBe(2);
		expect(parsed.layerRecords.length).toBe(5);
		expect(parsed.baseGlyphRecords[0]).toEqual(original.baseGlyphRecords[0]);
		expect(parsed.baseGlyphRecords[1]).toEqual(original.baseGlyphRecords[1]);
		expect(parsed.layerRecords[2]).toEqual(original.layerRecords[2]);
	});
});

// =====================================================================
//  COLR Version 1 tests
// =====================================================================

describe('COLR v1 table', () => {
	// == Parsing ========================================================

	it('should parse COLR v1 from noto-cff2_colr_1-online-test.otf', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		expect(colr).toBeDefined();
		expect(colr.version).toBe(1);
		expect(colr.baseGlyphPaintRecords).toBeDefined();
		expect(colr.baseGlyphPaintRecords.length).toBe(3688);
		expect(colr.layerPaints).toBeDefined();
		expect(colr.layerPaints.length).toBe(67330);
	});

	it('should not have _v1RawBytes (fully parsed)', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');
		expect(colr._v1RawBytes).toBeUndefined();
	});

	it('should parse ClipList', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		expect(colr.clipList).toBeDefined();
		expect(colr.clipList.format).toBe(1);
		expect(colr.clipList.clips.length).toBe(1854);

		const firstClip = colr.clipList.clips[0];
		expect(firstClip).toHaveProperty('startGlyphID');
		expect(firstClip).toHaveProperty('endGlyphID');
		expect(firstClip).toHaveProperty('clipBox');
		expect(firstClip.clipBox).toHaveProperty('format');
		expect(firstClip.clipBox).toHaveProperty('xMin');
		expect(firstClip.clipBox).toHaveProperty('yMin');
		expect(firstClip.clipBox).toHaveProperty('xMax');
		expect(firstClip.clipBox).toHaveProperty('yMax');
	});

	it('should parse Paint trees with correct formats', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		// First base glyph uses PaintGlyph (format 10)
		const first = colr.baseGlyphPaintRecords[0];
		expect(first.glyphID).toBe(13);
		expect(first.paint.format).toBe(10); // PaintGlyph
		expect(first.paint).toHaveProperty('glyphID');
		expect(first.paint).toHaveProperty('paint'); // child paint
	});

	it('should parse BaseGlyphPaintRecords with nested paint structures', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		// Find a PaintColrLayers (format 1) root — common for multi-layer glyphs
		const colrLayersRoot = colr.baseGlyphPaintRecords.find(
			(r) => r.paint.format === 1,
		);
		expect(colrLayersRoot).toBeDefined();
		expect(colrLayersRoot.paint).toHaveProperty('numLayers');
		expect(colrLayersRoot.paint).toHaveProperty('firstLayerIndex');
		expect(colrLayersRoot.paint.numLayers).toBeGreaterThan(0);
	});

	it('should parse PaintSolid (format 2) leaf nodes', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		// Walk a PaintGlyph -> child should eventually reach a PaintSolid
		function findFormat(paint, targetFormat) {
			if (!paint) return null;
			if (paint.format === targetFormat) return paint;
			if (paint.paint) return findFormat(paint.paint, targetFormat);
			if (paint.sourcePaint) return findFormat(paint.sourcePaint, targetFormat);
			if (paint.backdropPaint)
				return findFormat(paint.backdropPaint, targetFormat);
			return null;
		}

		let solid = null;
		for (const rec of colr.baseGlyphPaintRecords) {
			solid = findFormat(rec.paint, 2);
			if (solid) break;
		}
		expect(solid).toBeDefined();
		expect(solid.format).toBe(2);
		expect(solid).toHaveProperty('paletteIndex');
		expect(solid).toHaveProperty('alpha');
		expect(typeof solid.paletteIndex).toBe('number');
		expect(typeof solid.alpha).toBe('number');
	});

	it('should parse gradient paint nodes with colorLine', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		// Find a gradient (format 4=linear, 6=radial)
		function findFormat(paint, targets) {
			if (!paint) return null;
			if (targets.includes(paint.format)) return paint;
			if (paint.paint) return findFormat(paint.paint, targets);
			if (paint.sourcePaint) return findFormat(paint.sourcePaint, targets);
			if (paint.backdropPaint) return findFormat(paint.backdropPaint, targets);
			return null;
		}

		let gradient = null;
		for (const rec of colr.baseGlyphPaintRecords) {
			gradient = findFormat(rec.paint, [4, 5, 6, 7, 8, 9]);
			if (gradient) break;
		}
		expect(gradient).toBeDefined();
		expect(gradient).toHaveProperty('colorLine');
		expect(gradient.colorLine).toHaveProperty('extend');
		expect(gradient.colorLine).toHaveProperty('colorStops');
		expect(gradient.colorLine.colorStops.length).toBeGreaterThan(0);

		const stop = gradient.colorLine.colorStops[0];
		expect(stop).toHaveProperty('stopOffset');
		expect(stop).toHaveProperty('paletteIndex');
		expect(stop).toHaveProperty('alpha');
	});

	it('should parse PaintTransform (format 12) with Affine2x3', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		function findFormat(paint, target) {
			if (!paint) return null;
			if (paint.format === target) return paint;
			if (paint.paint) return findFormat(paint.paint, target);
			if (paint.sourcePaint) return findFormat(paint.sourcePaint, target);
			if (paint.backdropPaint) return findFormat(paint.backdropPaint, target);
			return null;
		}

		let transform = null;
		for (const rec of colr.baseGlyphPaintRecords) {
			transform = findFormat(rec.paint, 12);
			if (transform) break;
		}
		expect(transform).toBeDefined();
		expect(transform.format).toBe(12);
		expect(transform).toHaveProperty('paint'); // child
		expect(transform).toHaveProperty('transform');
		expect(transform.transform).toHaveProperty('xx');
		expect(transform.transform).toHaveProperty('yx');
		expect(transform.transform).toHaveProperty('xy');
		expect(transform.transform).toHaveProperty('yy');
		expect(transform.transform).toHaveProperty('dx');
		expect(transform.transform).toHaveProperty('dy');
	});

	it('should have no _raw on v1 COLR (fully parsed)', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');
		expect(colr._raw).toBeUndefined();
	});

	// == Round-trip ======================================================

	it('should round-trip COLR v1 from noto-cff2_colr_1-online-test.otf', () => {
		const buf = fs.readFileSync(
			path.join(SAMPLES, 'noto-cff2_colr_1-online-test.otf'),
		);
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFontTables(ab);
		const exported = exportFont(font);
		const reimported = importFontTables(exported);

		const orig = font.tables['COLR'];
		const rt = reimported.tables['COLR'];

		expect(rt.version).toBe(1);
		expect(rt.baseGlyphPaintRecords.length).toBe(
			orig.baseGlyphPaintRecords.length,
		);
		expect(rt.layerPaints.length).toBe(orig.layerPaints.length);
		expect(rt.clipList.clips.length).toBe(orig.clipList.clips.length);

		// Verify paint tree structure matches for first 20 base glyph records
		for (let i = 0; i < Math.min(20, orig.baseGlyphPaintRecords.length); i++) {
			const origRec = orig.baseGlyphPaintRecords[i];
			const rtRec = rt.baseGlyphPaintRecords[i];
			expect(rtRec.glyphID).toBe(origRec.glyphID);
			expect(rtRec.paint.format).toBe(origRec.paint.format);
		}

		// Verify clip boxes match
		for (let i = 0; i < Math.min(10, orig.clipList.clips.length); i++) {
			expect(rt.clipList.clips[i].startGlyphID).toBe(
				orig.clipList.clips[i].startGlyphID,
			);
			expect(rt.clipList.clips[i].endGlyphID).toBe(
				orig.clipList.clips[i].endGlyphID,
			);
			expect(rt.clipList.clips[i].clipBox.xMin).toBe(
				orig.clipList.clips[i].clipBox.xMin,
			);
		}
	});

	it('should round-trip a deeply nested paint tree', () => {
		const { colr } = loadCOLR('noto-cff2_colr_1-online-test.otf');

		// Find a record with PaintColrLayers → verify it round-trips
		const colrLayersRec = colr.baseGlyphPaintRecords.find(
			(r) => r.paint.format === 1,
		);
		expect(colrLayersRec).toBeDefined();

		const origJSON = JSON.stringify(colrLayersRec);

		// Write and re-parse the table
		const bytes = writeCOLR(colr);
		const reparsed = parseCOLR(bytes);

		const rtRec = reparsed.baseGlyphPaintRecords.find(
			(r) => r.glyphID === colrLayersRec.glyphID,
		);
		expect(rtRec).toBeDefined();
		expect(JSON.stringify(rtRec)).toBe(origJSON);
	});
});
