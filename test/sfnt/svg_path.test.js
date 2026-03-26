/**
 * Tests for SVG path conversion — contoursToSVGPath and svgPathToContours.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	contoursToSVGPath,
	importFont,
	svgPathToContours,
} from '../../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ═══════════════════════════════════════════════════════════════════════════
//  contoursToSVGPath
// ═══════════════════════════════════════════════════════════════════════════

describe('contoursToSVGPath', () => {
	it('should return empty string for null/empty contours', () => {
		expect(contoursToSVGPath(null)).toBe('');
		expect(contoursToSVGPath([])).toBe('');
	});

	it('should convert CFF contours (cubic) to SVG with M/L/C/Z', () => {
		const contours = [
			[
				{ type: 'M', x: 100, y: 200 },
				{ type: 'L', x: 300, y: 200 },
				{ type: 'C', x1: 300, y1: 400, x2: 100, y2: 400, x: 100, y: 200 },
			],
		];
		const svg = contoursToSVGPath(contours);
		expect(svg).toContain('M100 200');
		expect(svg).toContain('L300 200');
		expect(svg).toContain('C300 400 100 400 100 200');
		expect(svg).toContain('Z');
	});

	it('should convert TrueType contours (quadratic) to SVG with M/L/Q/Z', () => {
		const contours = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 100, y: 200, onCurve: false },
				{ x: 200, y: 0, onCurve: true },
			],
		];
		const svg = contoursToSVGPath(contours);
		expect(svg).toContain('M0 0');
		expect(svg).toContain('Q100 200 200 0');
		expect(svg).toContain('Z');
	});

	it('should handle implied on-curve points between consecutive off-curve TrueType points', () => {
		const contours = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 50, y: 100, onCurve: false },
				{ x: 100, y: 100, onCurve: false },
				{ x: 150, y: 0, onCurve: true },
			],
		];
		const svg = contoursToSVGPath(contours);
		expect(svg).toContain('M0 0');
		// First Q uses implied midpoint (75, 100)
		expect(svg).toContain('Q50 100 75 100');
		// Second Q goes to the on-curve endpoint
		expect(svg).toContain('Q100 100 150 0');
	});

	it('should handle multiple contours', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 100, y: 0 },
			],
			[
				{ type: 'M', x: 50, y: 50 },
				{ type: 'L', x: 150, y: 50 },
			],
		];
		const svg = contoursToSVGPath(contours);
		// Should have two M commands and two Z
		expect(svg.match(/M/g)).toHaveLength(2);
		expect(svg.match(/Z/g)).toHaveLength(2);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  svgPathToContours
// ═══════════════════════════════════════════════════════════════════════════

describe('svgPathToContours', () => {
	it('should parse simple SVG path into CFF contours', () => {
		const contours = svgPathToContours(
			'M100 200 L300 200 C300 400 100 400 100 200 Z',
			'cff',
		);
		expect(contours).toHaveLength(1);
		expect(contours[0][0]).toEqual({ type: 'M', x: 100, y: 200 });
		expect(contours[0][1]).toEqual({ type: 'L', x: 300, y: 200 });
		expect(contours[0][2]).toEqual({
			type: 'C',
			x1: 300,
			y1: 400,
			x2: 100,
			y2: 400,
			x: 100,
			y: 200,
		});
	});

	it('should parse SVG path into TrueType contours', () => {
		const contours = svgPathToContours(
			'M0 0 L100 0 Q150 100 200 0 Z',
			'truetype',
		);
		expect(contours).toHaveLength(1);
		expect(contours[0][0]).toEqual({ x: 0, y: 0, onCurve: true });
		expect(contours[0][1]).toEqual({ x: 100, y: 0, onCurve: true });
		// Q → off-curve control + on-curve endpoint
		expect(contours[0][2]).toEqual({ x: 150, y: 100, onCurve: false });
		expect(contours[0][3]).toEqual({ x: 200, y: 0, onCurve: true });
	});

	it('should handle relative commands (lowercase)', () => {
		const contours = svgPathToContours('M100 200 l50 0 l0 50 Z', 'cff');
		expect(contours).toHaveLength(1);
		expect(contours[0][1]).toEqual({ type: 'L', x: 150, y: 200 });
		expect(contours[0][2]).toEqual({ type: 'L', x: 150, y: 250 });
	});

	it('should handle H and V commands', () => {
		const contours = svgPathToContours('M0 0 H100 V200 Z', 'cff');
		expect(contours[0][1]).toEqual({ type: 'L', x: 100, y: 0 });
		expect(contours[0][2]).toEqual({ type: 'L', x: 100, y: 200 });
	});

	it('should handle S (smooth cubic) command', () => {
		const contours = svgPathToContours(
			'M0 0 C10 20 30 40 50 50 S70 80 90 90 Z',
			'cff',
		);
		expect(contours[0]).toHaveLength(3); // M, C, C (S becomes C)
		expect(contours[0][2].type).toBe('C');
		// S reflects previous CP2 (30,40) around current (50,50) → (70,60)
		expect(contours[0][2].x1).toBe(70);
		expect(contours[0][2].y1).toBe(60);
	});

	it('should handle T (smooth quadratic) command', () => {
		const contours = svgPathToContours('M0 0 Q50 100 100 0 T200 0 Z', 'cff');
		expect(contours[0]).toHaveLength(3); // M, C (Q→C), C (T→Q→C)
		// T reflects previous QCP (50,100) around current (100,0) → (150,-100)
	});

	it('should promote Q to C when target is CFF', () => {
		const contours = svgPathToContours('M0 0 Q50 100 100 0 Z', 'cff');
		expect(contours[0][1].type).toBe('C'); // promoted from Q
	});

	it('should split multiple M commands into separate contours', () => {
		const contours = svgPathToContours('M0 0 L100 0 Z M50 50 L150 50 Z', 'cff');
		expect(contours).toHaveLength(2);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  ROUND-TRIP TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('SVG path round-trip — CFF', () => {
	it('should round-trip CFF contours through SVG losslessly', () => {
		const original = [
			[
				{ type: 'M', x: 100, y: 200 },
				{ type: 'L', x: 300, y: 200 },
				{ type: 'C', x1: 300, y1: 400, x2: 100, y2: 400, x: 100, y: 200 },
			],
		];
		const svg = contoursToSVGPath(original);
		const restored = svgPathToContours(svg, 'cff');

		expect(restored).toHaveLength(1);
		expect(restored[0]).toHaveLength(3);
		expect(restored[0][0]).toEqual({ type: 'M', x: 100, y: 200 });
		expect(restored[0][1]).toEqual({ type: 'L', x: 300, y: 200 });
		expect(restored[0][2]).toEqual({
			type: 'C',
			x1: 300,
			y1: 400,
			x2: 100,
			y2: 400,
			x: 100,
			y: 200,
		});
	});
});

describe('SVG path round-trip — TrueType', () => {
	it('should round-trip TrueType contours (lines only) losslessly', () => {
		const original = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 500, y: 0, onCurve: true },
				{ x: 500, y: 700, onCurve: true },
				{ x: 0, y: 700, onCurve: true },
			],
		];
		const svg = contoursToSVGPath(original);
		const restored = svgPathToContours(svg, 'truetype');

		expect(restored).toHaveLength(1);
		expect(restored[0]).toHaveLength(4);
		for (let i = 0; i < 4; i++) {
			expect(restored[0][i].x).toBe(original[0][i].x);
			expect(restored[0][i].y).toBe(original[0][i].y);
			expect(restored[0][i].onCurve).toBe(true);
		}
	});

	it('should round-trip TrueType contours with quadratic curves losslessly', () => {
		const original = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 100, y: 200, onCurve: false },
				{ x: 200, y: 0, onCurve: true },
			],
		];
		const svg = contoursToSVGPath(original);
		const restored = svgPathToContours(svg, 'truetype');

		expect(restored).toHaveLength(1);
		expect(restored[0]).toHaveLength(3);
		expect(restored[0][0]).toEqual({ x: 0, y: 0, onCurve: true });
		expect(restored[0][1]).toEqual({ x: 100, y: 200, onCurve: false });
		expect(restored[0][2]).toEqual({ x: 200, y: 0, onCurve: true });
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  REAL FONT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

describe('SVG path with real fonts', () => {
	it('should convert TTF glyph contours to SVG and back', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fontData = importFont(buffer);
		const glyph = fontData.glyphs.find(
			(g) => g.contours && g.contours.length > 0 && g.unicode,
		);

		const svg = contoursToSVGPath(glyph.contours);
		expect(svg.length).toBeGreaterThan(0);
		expect(svg).toMatch(/^M/);
		expect(svg).toContain('Z');

		// Round-trip back to TrueType
		const restored = svgPathToContours(svg, 'truetype');
		expect(restored.length).toBe(glyph.contours.length);
	});

	it('should convert CFF glyph contours to SVG and back', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);
		const glyph = fontData.glyphs.find(
			(g) => g.contours && g.contours.length > 0 && g.unicode,
		);

		const svg = contoursToSVGPath(glyph.contours);
		expect(svg.length).toBeGreaterThan(0);
		expect(svg).toMatch(/^M/);
		expect(svg).toContain('Z');

		// Round-trip back to CFF
		const restored = svgPathToContours(svg, 'cff');
		expect(restored.length).toBe(glyph.contours.length);

		// Verify structure: each contour starts with M
		for (const contour of restored) {
			expect(contour[0].type).toBe('M');
		}
	});

	it('should produce valid SVG that can render CFF glyphs with C commands', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);
		const glyph = fontData.glyphs.find(
			(g) => g.contours && g.contours.length > 0 && g.charString,
		);

		const svg = contoursToSVGPath(glyph.contours);
		// CFF fonts should produce cubic C commands
		expect(svg).toContain('C');
		// Should not contain Q (CFF is cubic, not quadratic)
		expect(svg).not.toMatch(/Q\d/);
	});
});
