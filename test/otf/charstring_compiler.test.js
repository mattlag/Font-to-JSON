/**
 * Tests for the CFF Type 2 CharString compiler and assembler.
 */

import { describe, expect, it } from 'vitest';
import {
	assembleCharString,
	compileCharString,
	disassembleCharString,
	interpretCharString,
} from '../../src/main.js';

// ═══════════════════════════════════════════════════════════════════════════
//  compileCharString — contours → bytecode
// ═══════════════════════════════════════════════════════════════════════════

describe('compileCharString', () => {
	it('should compile empty contours to a minimal charstring', () => {
		const bytes = compileCharString([]);
		// Must contain at least rmoveto + endchar
		expect(bytes.length).toBeGreaterThan(0);
		expect(bytes[bytes.length - 1]).toBe(14); // endchar
	});

	it('should compile a simple moveto + lineto triangle', () => {
		const contours = [
			[
				{ type: 'M', x: 100, y: 0 },
				{ type: 'L', x: 500, y: 700 },
				{ type: 'L', x: 300, y: 0 },
			],
		];
		const bytes = compileCharString(contours);
		expect(bytes[bytes.length - 1]).toBe(14); // endchar

		// Round-trip: decode and check contours match
		const result = interpretCharString(bytes);
		expect(result.contours).toHaveLength(1);
		expect(result.contours[0]).toHaveLength(3);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(result.contours[0][1]).toEqual({ type: 'L', x: 500, y: 700 });
		expect(result.contours[0][2]).toEqual({ type: 'L', x: 300, y: 0 });
	});

	it('should use hmoveto when dy=0', () => {
		const contours = [
			[
				{ type: 'M', x: 200, y: 0 },
				{ type: 'L', x: 400, y: 100 },
			],
		];
		const bytes = compileCharString(contours);
		// hmoveto = 22 should appear (after the encoded 200)
		expect(bytes).toContain(22);
	});

	it('should use vmoveto when dx=0', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 300 },
				{ type: 'L', x: 100, y: 400 },
			],
		];
		const bytes = compileCharString(contours);
		// vmoveto = 4 should appear
		expect(bytes).toContain(4);
	});

	it('should use hlineto for horizontal lines', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 500, y: 0 },
			],
		];
		const bytes = compileCharString(contours);
		// hlineto = 6
		expect(bytes).toContain(6);
	});

	it('should use vlineto for vertical lines', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 0, y: 700 },
			],
		];
		const bytes = compileCharString(contours);
		// vlineto = 7
		expect(bytes).toContain(7);
	});

	it('should compile cubic curves with rrcurveto', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'C', x1: 50, y1: 100, x2: 150, y2: 200, x: 200, y: 0 },
			],
		];
		const bytes = compileCharString(contours);
		expect(bytes).toContain(8); // rrcurveto

		// Round-trip
		const result = interpretCharString(bytes);
		expect(result.contours[0][1]).toEqual({
			type: 'C',
			x1: 50,
			y1: 100,
			x2: 150,
			y2: 200,
			x: 200,
			y: 0,
		});
	});

	it('should handle multiple contours', () => {
		const contours = [
			[
				{ type: 'M', x: 0, y: 0 },
				{ type: 'L', x: 100, y: 100 },
			],
			[
				{ type: 'M', x: 200, y: 200 },
				{ type: 'L', x: 300, y: 300 },
			],
		];
		const bytes = compileCharString(contours);
		const result = interpretCharString(bytes);
		expect(result.contours).toHaveLength(2);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 0, y: 0 });
		expect(result.contours[1][0]).toEqual({ type: 'M', x: 200, y: 200 });
	});

	it('should round-trip a complex glyph shape (letter A)', () => {
		// Outer contour of a stylized "A"
		const contours = [
			[
				{ type: 'M', x: 250, y: 0 },
				{ type: 'L', x: 500, y: 700 },
				{ type: 'L', x: 450, y: 700 },
				{ type: 'L', x: 375, y: 450 },
				{ type: 'L', x: 125, y: 450 },
				{ type: 'L', x: 50, y: 700 },
				{ type: 'L', x: 0, y: 700 },
			],
			// Crossbar counter
			[
				{ type: 'M', x: 150, y: 400 },
				{ type: 'L', x: 350, y: 400 },
				{ type: 'L', x: 250, y: 200 },
			],
		];

		const bytes = compileCharString(contours);
		const result = interpretCharString(bytes);

		expect(result.contours).toHaveLength(2);
		expect(result.contours[0]).toHaveLength(7);
		expect(result.contours[1]).toHaveLength(3);

		// Verify key coordinates
		for (let i = 0; i < contours.length; i++) {
			for (let j = 0; j < contours[i].length; j++) {
				expect(result.contours[i][j].x).toBe(contours[i][j].x);
				expect(result.contours[i][j].y).toBe(contours[i][j].y);
			}
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  assembleCharString — text → bytecode
// ═══════════════════════════════════════════════════════════════════════════

describe('assembleCharString', () => {
	it('should assemble a simple moveto + lineto + endchar', () => {
		const text = '100 200 rmoveto\n50 -30 rlineto\nendchar';
		const bytes = assembleCharString(text);

		// Verify by interpreting the result
		const result = interpretCharString(bytes);
		expect(result.contours).toHaveLength(1);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 200 });
		expect(result.contours[0][1]).toEqual({ type: 'L', x: 150, y: 170 });
	});

	it('should handle hmoveto and vmoveto', () => {
		const text = '100 hmoveto\n50 vmoveto\nendchar';
		const bytes = assembleCharString(text);
		const result = interpretCharString(bytes);

		expect(result.contours).toHaveLength(2);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(result.contours[1][0]).toEqual({ type: 'M', x: 100, y: 50 });
	});

	it('should handle rrcurveto', () => {
		const text = '0 0 rmoveto\n10 20 30 40 50 60 rrcurveto\nendchar';
		const bytes = assembleCharString(text);
		const result = interpretCharString(bytes);

		expect(result.contours[0][1].type).toBe('C');
		expect(result.contours[0][1].x1).toBe(10);
		expect(result.contours[0][1].y1).toBe(20);
		// Deltas cumulate: x = 0+10+30+50 = 90, y = 0+20+40+60 = 120
		expect(result.contours[0][1].x).toBe(90);
		expect(result.contours[0][1].y).toBe(120);
	});

	it('should handle stem hints', () => {
		const text = '100 50 hstem\n200 30 vstem\n0 0 rmoveto\nendchar';
		const bytes = assembleCharString(text);
		// Just verify it doesn't throw and endchar is present
		expect(bytes[bytes.length - 1]).toBe(14); // endchar
	});

	it('should round-trip with disassembleCharString', () => {
		// Start with known bytecode, disassemble, reassemble, compare
		// 100 200 rmoveto 50 -30 rlineto endchar
		const original = [239, 247, 92, 21, 189, 109, 5, 14];

		const text = disassembleCharString(original);
		const reassembled = assembleCharString(text);
		const reDisassembled = disassembleCharString(reassembled);

		// The disassembly text should match (bytes may differ slightly due to encoding choices)
		expect(reDisassembled).toBe(text);
	});

	it('should handle hintmask with binary mask data', () => {
		// 2 stems + hintmask
		const text =
			'100 50 hstem\n200 30 vstem\nhintmask 10100000\n0 0 rmoveto\nendchar';
		const bytes = assembleCharString(text);
		expect(bytes[bytes.length - 1]).toBe(14);
		// hintmask operator (19) should be present
		expect(bytes).toContain(19);
	});
});
