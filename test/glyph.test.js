/**
 * Tests for createGlyph — the high-level glyph creation helper.
 *
 * Covers all three outline input formats (SVG path, CFF contours, TrueType contours),
 * raw charstring input, composite glyphs, and metadata handling.
 */

import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { createGlyph } from '../src/glyph.js';
import { importFont } from '../src/import.js';
import { interpretCharString } from '../src/otf/charstring_interpreter.js';

// ═══════════════════════════════════════════════════════════════════════════
//  Validation & metadata
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: validation', () => {
	it('should throw if no options provided', () => {
		expect(() => createGlyph()).toThrow('options object is required');
	});

	it('should throw if name is missing', () => {
		expect(() => createGlyph({ advanceWidth: 500 })).toThrow(
			'name is required',
		);
	});

	it('should throw if advanceWidth is missing', () => {
		expect(() => createGlyph({ name: 'A' })).toThrow(
			'advanceWidth is required',
		);
	});

	it('should create a minimal glyph (space — no outline)', () => {
		const g = createGlyph({ name: 'space', advanceWidth: 250, unicode: 0x20 });
		expect(g).toEqual({
			name: 'space',
			advanceWidth: 250,
			unicode: 0x20,
		});
	});
});

describe('createGlyph: metadata', () => {
	it('should set a single unicode value', () => {
		const g = createGlyph({ name: 'A', advanceWidth: 500, unicode: 65 });
		expect(g.unicode).toBe(65);
		expect(g.unicodes).toBeUndefined();
	});

	it('should set multiple unicodes', () => {
		const g = createGlyph({
			name: 'A',
			advanceWidth: 500,
			unicodes: [65, 0x391],
		});
		expect(g.unicodes).toEqual([65, 0x391]);
		expect(g.unicode).toBeUndefined();
	});

	it('should prefer unicodes array over single unicode', () => {
		const g = createGlyph({
			name: 'A',
			advanceWidth: 500,
			unicode: 65,
			unicodes: [65, 0x391],
		});
		expect(g.unicodes).toEqual([65, 0x391]);
		expect(g.unicode).toBeUndefined();
	});

	it('should include optional metric overrides', () => {
		const g = createGlyph({
			name: 'A',
			advanceWidth: 500,
			leftSideBearing: 10,
			advanceHeight: 1000,
			topSideBearing: 50,
		});
		expect(g.leftSideBearing).toBe(10);
		expect(g.advanceHeight).toBe(1000);
		expect(g.topSideBearing).toBe(50);
	});

	it('should omit optional metrics when not provided', () => {
		const g = createGlyph({ name: 'A', advanceWidth: 500 });
		expect(g.leftSideBearing).toBeUndefined();
		expect(g.advanceHeight).toBeUndefined();
		expect(g.topSideBearing).toBeUndefined();
	});

	it('should pass through TrueType instructions', () => {
		const instructions = [0x40, 0x01, 0x0a];
		const g = createGlyph({
			name: 'A',
			advanceWidth: 500,
			instructions,
		});
		expect(g.instructions).toEqual([0x40, 0x01, 0x0a]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Outline format 1: SVG path `d` string
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: SVG path input', () => {
	const trianglePath = 'M 100 0 L 500 700 L 300 0 Z';

	it('should convert SVG path to TrueType contours (default format)', () => {
		const g = createGlyph({
			name: 'triangle',
			advanceWidth: 600,
			unicode: 0xe000,
			path: trianglePath,
		});

		expect(g.contours).toBeDefined();
		expect(g.contours.length).toBeGreaterThan(0);
		// TrueType contours have onCurve property (not .type)
		expect(g.contours[0][0].onCurve).toBe(true);
		expect(g.contours[0][0].x).toBe(100);
		expect(g.contours[0][0].y).toBe(0);
		// No charString for TrueType default
		expect(g.charString).toBeUndefined();
	});

	it('should auto-compile charString bytes for CFF path', () => {
		const g = createGlyph({
			name: 'triangle',
			advanceWidth: 600,
			path: trianglePath,
			format: 'cff',
		});

		expect(g.charString).toBeDefined();
		expect(Array.isArray(g.charString)).toBe(true);
		expect(g.charString.length).toBeGreaterThan(0);

		// Verify the charstring decodes back to the same shape
		const result = interpretCharString(g.charString);
		expect(result.contours).toHaveLength(1);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(result.contours[0][1]).toEqual({ type: 'L', x: 500, y: 700 });
		expect(result.contours[0][2]).toEqual({ type: 'L', x: 300, y: 0 });
	});

	it('should convert SVG path to TrueType contours', () => {
		const g = createGlyph({
			name: 'triangle',
			advanceWidth: 600,
			path: trianglePath,
			format: 'truetype',
		});

		expect(g.contours).toBeDefined();
		// TrueType contours have onCurve property
		expect(g.contours[0][0].onCurve).toBe(true);
		expect(g.contours[0][0].x).toBe(100);
		expect(g.contours[0][0].y).toBe(0);
		// No charString for TrueType
		expect(g.charString).toBeUndefined();
	});

	it('should handle SVG path with curves (CFF format)', () => {
		const curvePath = 'M 0 0 C 50 100 150 200 200 0 Z';
		const g = createGlyph({
			name: 'curve',
			advanceWidth: 200,
			path: curvePath,
			format: 'cff',
		});

		expect(g.contours[0][1].type).toBe('C');
		expect(g.charString).toBeDefined();

		const result = interpretCharString(g.charString);
		expect(result.contours[0][1].type).toBe('C');
		expect(result.contours[0][1].x1).toBe(50);
		expect(result.contours[0][1].y1).toBe(100);
	});

	it('should handle SVG path with quadratic curves (TrueType format)', () => {
		const quadPath = 'M 0 0 Q 100 200 200 0 Z';
		const g = createGlyph({
			name: 'quad',
			advanceWidth: 200,
			path: quadPath,
			format: 'truetype',
		});

		// Should have off-curve + on-curve points
		const onCurvePoints = g.contours[0].filter((p) => p.onCurve);
		const offCurvePoints = g.contours[0].filter((p) => !p.onCurve);
		expect(onCurvePoints.length).toBeGreaterThan(0);
		expect(offCurvePoints.length).toBeGreaterThan(0);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Outline format 2: CFF contours (PostScript/cubic)
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: CFF contour input', () => {
	it('should accept CFF contours and auto-compile charString', () => {
		const contours = [
			[
				{ type: 'M', x: 100, y: 0 },
				{ type: 'L', x: 500, y: 700 },
				{ type: 'L', x: 300, y: 0 },
			],
		];
		const g = createGlyph({
			name: 'A',
			advanceWidth: 600,
			unicode: 65,
			contours,
		});

		expect(g.contours).toBe(contours);
		expect(g.charString).toBeDefined();

		// Verify round-trip
		const result = interpretCharString(g.charString);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(result.contours[0][1]).toEqual({ type: 'L', x: 500, y: 700 });
	});

	it('should handle CFF contours with cubic curves', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 50, y1: 100, x2: 150, y2: 200, x: 200, y: 0 },
			],
		];
		const g = createGlyph({
			name: 'curve',
			advanceWidth: 200,
			contours,
		});

		expect(g.charString).toBeDefined();
		const result = interpretCharString(g.charString);
		expect(result.contours[0][1].type).toBe('C');
		expect(result.contours[0][1].x1).toBe(50);
	});

	it('should handle multiple CFF contours (glyph with counter)', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 500, y: 0 },
				{ type: 'L', x: 500, y: 700 },
				{ type: 'L', x: 0, y: 700 },
			],
			[
				{ type: 'M', x: 50, y: 50 },
				{ type: 'L', x: 50, y: 650 },
				{ type: 'L', x: 450, y: 650 },
				{ type: 'L', x: 450, y: 50 },
			],
		];
		const g = createGlyph({
			name: 'box',
			advanceWidth: 500,
			contours,
		});

		const result = interpretCharString(g.charString);
		expect(result.contours).toHaveLength(2);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Outline format 3: TrueType contours (quadratic)
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: TrueType contour input', () => {
	it('should accept TrueType contours without compiling charString', () => {
		const contours = [
			[
				{ x: 100, y: 0, onCurve: true },
				{ x: 500, y: 700, onCurve: true },
				{ x: 300, y: 0, onCurve: true },
			],
		];
		const g = createGlyph({
			name: 'A',
			advanceWidth: 600,
			unicode: 65,
			contours,
		});

		expect(g.contours).toBe(contours);
		// TrueType contours don't have .type, so no charString compilation
		expect(g.charString).toBeUndefined();
	});

	it('should accept TrueType contours with off-curve points', () => {
		const contours = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 100, y: 200, onCurve: false },
				{ x: 200, y: 0, onCurve: true },
			],
		];
		const g = createGlyph({
			name: 'curve',
			advanceWidth: 200,
			contours,
		});

		expect(g.contours).toBe(contours);
		expect(g.charString).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Raw charString input
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: raw charString input', () => {
	it('should accept raw charString bytes directly', () => {
		// 100 0 hmoveto 400 0 rlineto 0 700 rlineto -400 0 rlineto endchar
		const bytes = [
			239, 22, 247, 36, 139, 5, 139, 248, 49, 5, 248, 105, 139, 5, 14,
		];
		const g = createGlyph({
			name: 'box',
			advanceWidth: 500,
			charString: bytes,
		});

		expect(g.charString).toBe(bytes);
		expect(g.contours).toBeUndefined();
	});

	it('should prioritize charString over path and contours', () => {
		const bytes = [139, 139, 21, 14]; // 0 0 rmoveto endchar
		const g = createGlyph({
			name: 'test',
			advanceWidth: 500,
			charString: bytes,
			path: 'M 100 0 L 200 100 Z',
			contours: [[{ type: 'M', x: 300, y: 0 }]],
		});

		expect(g.charString).toBe(bytes);
		expect(g.contours).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Composite glyphs
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: composite glyph input', () => {
	it('should accept component references', () => {
		const components = [
			{ glyphIndex: 1, dx: 0, dy: 0 },
			{ glyphIndex: 2, dx: 500, dy: 0 },
		];
		const g = createGlyph({
			name: 'fi',
			advanceWidth: 1000,
			unicode: 0xfb01,
			components,
		});

		expect(g.components).toBe(components);
		expect(g.contours).toBeUndefined();
		expect(g.charString).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Integration: createGlyph → export → re-import
// ═══════════════════════════════════════════════════════════════════════════

describe('createGlyph: full OTF export', () => {
	it('should create a valid OTF font from SVG path glyphs', () => {
		const notdef = createGlyph({
			name: '.notdef',
			advanceWidth: 500,
			path: 'M 50 0 L 50 700 L 450 700 L 450 0 Z',
			format: 'cff',
		});
		const space = createGlyph({
			name: 'space',
			advanceWidth: 250,
			unicode: 0x20,
		});
		const A = createGlyph({
			name: 'A',
			advanceWidth: 600,
			unicode: 65,
			path: 'M 0 0 L 250 700 L 500 0 Z M 125 250 L 375 250 L 250 500 Z',
			format: 'cff',
		});

		const fontData = {
			font: {
				familyName: 'TestFont',
				subfamilyName: 'Regular',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [notdef, space, A],
		};

		const binary = exportFont(fontData, 'otf');
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		// Re-import and verify glyphs survived
		const reimported = importFont(binary);
		expect(reimported.glyphs.length).toBe(3);
		expect(reimported.glyphs[0].name).toBe('.notdef');
		expect(reimported.glyphs[2].name).toBe('A');
		expect(reimported.glyphs[2].unicode).toBe(65);
	});

	it('should create a valid OTF font from CFF contour glyphs', () => {
		const notdef = createGlyph({
			name: '.notdef',
			advanceWidth: 500,
			contours: [
				[
					{ type: 'M', x: 50, y: 0 },
					{ type: 'L', x: 50, y: 700 },
					{ type: 'L', x: 450, y: 700 },
					{ type: 'L', x: 450, y: 0 },
				],
			],
		});
		const space = createGlyph({
			name: 'space',
			advanceWidth: 250,
			unicode: 0x20,
		});

		const fontData = {
			font: {
				familyName: 'TestCFF',
				subfamilyName: 'Regular',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [notdef, space],
		};

		const binary = exportFont(fontData, 'otf');
		expect(binary).toBeInstanceOf(ArrayBuffer);

		const reimported = importFont(binary);
		expect(reimported.glyphs.length).toBe(2);
		expect(reimported.glyphs[0].name).toBe('.notdef');
	});
});

describe('createGlyph: full TTF export', () => {
	it('should create a valid TTF font from SVG path glyphs', () => {
		const notdef = createGlyph({
			name: '.notdef',
			advanceWidth: 500,
			path: 'M 50 0 L 50 700 L 450 700 L 450 0 Z',
			format: 'truetype',
		});
		const space = createGlyph({
			name: 'space',
			advanceWidth: 250,
			unicode: 0x20,
		});
		const A = createGlyph({
			name: 'A',
			advanceWidth: 600,
			unicode: 65,
			path: 'M 0 0 L 250 700 L 500 0 Z',
			format: 'truetype',
		});

		const fontData = {
			font: {
				familyName: 'TestTTF',
				subfamilyName: 'Regular',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [notdef, space, A],
		};

		const binary = exportFont(fontData, 'ttf');
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		const reimported = importFont(binary);
		expect(reimported.glyphs.length).toBe(3);
		expect(reimported.glyphs[2].name).toBe('A');
		expect(reimported.glyphs[2].unicode).toBe(65);
	});

	it('should create a valid TTF font from TrueType contour glyphs', () => {
		const notdef = createGlyph({
			name: '.notdef',
			advanceWidth: 500,
			contours: [
				[
					{ x: 50, y: 0, onCurve: true },
					{ x: 50, y: 700, onCurve: true },
					{ x: 450, y: 700, onCurve: true },
					{ x: 450, y: 0, onCurve: true },
				],
			],
		});
		const space = createGlyph({
			name: 'space',
			advanceWidth: 250,
			unicode: 0x20,
		});

		const fontData = {
			font: {
				familyName: 'TestTTF2',
				subfamilyName: 'Regular',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [notdef, space],
		};

		const binary = exportFont(fontData, 'ttf');
		expect(binary).toBeInstanceOf(ArrayBuffer);

		const reimported = importFont(binary);
		expect(reimported.glyphs.length).toBe(2);
	});
});
