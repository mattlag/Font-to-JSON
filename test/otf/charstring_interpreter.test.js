/**
 * Tests for the CFF Type 2 CharString interpreter and disassembler.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	disassembleCharString,
	importFont,
	interpretCharString,
} from '../../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ═══════════════════════════════════════════════════════════════════════════
//  Interpreter — synthetic charstrings
// ═══════════════════════════════════════════════════════════════════════════

describe('interpretCharString', () => {
	it('should decode a simple rmoveto + rlineto + endchar', () => {
		// Charstring: 100 200 rmoveto 50 -30 rlineto endchar
		// 100 → byte 239 (100 + 139)
		// 200 → encoded as 247 + (200-108)/256 → 247, 92  (value = (247-247)*256 + 92 + 108 = 200)
		// rmoveto = 21
		// 50 → byte 189 (50 + 139)
		// -30 → byte 109 (-30 + 139)
		// rlineto = 5
		// endchar = 14
		const cs = [239, 247, 92, 21, 189, 109, 5, 14];
		const result = interpretCharString(cs);

		expect(result.contours).toHaveLength(1);
		expect(result.contours[0]).toHaveLength(2);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 200 });
		expect(result.contours[0][1]).toEqual({ type: 'L', x: 150, y: 170 });
	});

	it('should decode hmoveto and vmoveto', () => {
		// hmoveto 100 → 239 22, vmoveto 50 → 189 4, endchar → 14
		const cs = [239, 22, 189, 4, 14];
		const result = interpretCharString(cs);

		expect(result.contours).toHaveLength(2);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
		expect(result.contours[1][0]).toEqual({ type: 'M', x: 100, y: 50 });
	});

	it('should handle rrcurveto (cubic Bézier)', () => {
		// 0 0 rmoveto, 10 20 30 40 50 60 rrcurveto, endchar
		// 0 = byte 139, rmoveto = 21, rrcurveto = 8, endchar = 14
		const cs = [139, 139, 21, 149, 159, 169, 179, 189, 199, 8, 14];
		const result = interpretCharString(cs);

		expect(result.contours).toHaveLength(1);
		const cmds = result.contours[0];
		expect(cmds[0]).toEqual({ type: 'M', x: 0, y: 0 });
		expect(cmds[1].type).toBe('C');
		expect(cmds[1].x1).toBe(10); // 0 + dx1(10)
		expect(cmds[1].y1).toBe(20); // 0 + dy1(20)
		expect(cmds[1].x2).toBe(40); // 10 + dx2(30)
		expect(cmds[1].y2).toBe(60); // 20 + dy2(40)
		expect(cmds[1].x).toBe(90); // 40 + dx3(50)
		expect(cmds[1].y).toBe(120); // 60 + dy3(60)
	});

	it('should detect width from odd argument count', () => {
		// width(500) 100 rmoveto endchar
		// 500 → 28-prefix int16: 28, 0x01, 0xF4
		// hmoveto to keep it simple — 1 arg + width = 2
		const cs = [28, 1, 0xf4, 239, 22, 14];
		const result = interpretCharString(cs);

		expect(result.width).toBe(500);
		expect(result.contours[0][0]).toEqual({ type: 'M', x: 100, y: 0 });
	});

	it('should handle hlineto and vlineto alternation', () => {
		// 0 0 rmoveto → 139 139 21
		// 10 20 hlineto (h, v) → 149 159 6
		// endchar → 14
		const cs = [139, 139, 21, 149, 159, 6, 14];
		const result = interpretCharString(cs);

		const cmds = result.contours[0];
		expect(cmds[1]).toEqual({ type: 'L', x: 10, y: 0 }); // h+10
		expect(cmds[2]).toEqual({ type: 'L', x: 10, y: 20 }); // v+20
	});

	it('should handle subroutine calls', () => {
		// Local subr: 10 20 rlineto return
		const localSubr = [149, 159, 5, 11];

		// Main: 0 0 rmoveto callsubr(-107) endchar
		// With bias 107 for subrs.length < 1240: index = -107 + 107 = 0
		// -107 = byte 32 (= -107 + 139)
		const cs = [139, 139, 21, 32, 10, 14];
		const result = interpretCharString(cs, [], [localSubr]);

		const cmds = result.contours[0];
		expect(cmds).toHaveLength(2);
		expect(cmds[1]).toEqual({ type: 'L', x: 10, y: 20 });
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Disassembler
// ═══════════════════════════════════════════════════════════════════════════

describe('disassembleCharString', () => {
	it('should produce readable text from bytecode', () => {
		// 100 200 rmoveto, 50 -30 rlineto, endchar
		const cs = [239, 247, 92, 21, 189, 109, 5, 14];
		const text = disassembleCharString(cs);

		expect(text).toContain('rmoveto');
		expect(text).toContain('rlineto');
		expect(text).toContain('endchar');
		// Check that operands appear
		expect(text).toContain('100 200 rmoveto');
		expect(text).toContain('50 -30 rlineto');
	});

	it('should show stem operators', () => {
		// 10 20 hstem, endchar
		const cs = [149, 159, 1, 14];
		const text = disassembleCharString(cs);

		expect(text).toContain('10 20 hstem');
		expect(text).toContain('endchar');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Integration — real CFF font
// ═══════════════════════════════════════════════════════════════════════════

describe('CharString interpreter on real fonts', () => {
	it('should produce contours for oblegg.otf (CFF1)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		// Should have glyphs with contours
		const withContours = fontData.glyphs.filter(
			(g) => g.contours && g.contours.length > 0,
		);
		expect(withContours.length).toBeGreaterThan(0);

		// Each glyph should also still have its charString
		const withCharString = fontData.glyphs.filter((g) => g.charString);
		expect(withCharString.length).toBeGreaterThan(0);

		// Glyphs with contours should also have charStringDisassembly
		const withDisasm = fontData.glyphs.filter((g) => g.charStringDisassembly);
		expect(withDisasm.length).toBeGreaterThan(0);

		// Check that contours have valid command structure
		const glyph = withContours[0];
		for (const contour of glyph.contours) {
			expect(contour[0].type).toBe('M'); // first command is always moveTo
			for (const cmd of contour) {
				expect(['M', 'L', 'C']).toContain(cmd.type);
				expect(typeof cmd.x).toBe('number');
				expect(typeof cmd.y).toBe('number');
			}
		}
	});

	it('should produce disassembly that includes endchar', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		const glyph = fontData.glyphs.find((g) => g.charStringDisassembly);
		expect(glyph.charStringDisassembly).toContain('endchar');
	});
});
