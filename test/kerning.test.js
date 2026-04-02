/**
 * Tests for kerning helpers: createKerning, getKerningValue, getGlyph.
 *
 * Covers all supported input formats: flat pairs, arrays, grouped-by-left,
 * grouped maps, class-based, mixed arrays, deduplication, and lookups.
 */

import { describe, expect, it } from 'vitest';
import { createKerning, getGlyph, getKerningValue } from '../src/main.js';

// ═══════════════════════════════════════════════════════════════════════════
//  Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: validation', () => {
	it('should throw if no input provided', () => {
		expect(() => createKerning()).toThrow('input is required');
	});

	it('should throw if input is null', () => {
		expect(() => createKerning(null)).toThrow('input is required');
	});

	it('should throw for unknown class reference', () => {
		expect(() =>
			createKerning({ left: '@missing', right: 'V', value: -80 }),
		).toThrow('unknown class "@missing"');
	});

	it('should throw if class value is not an array', () => {
		expect(() =>
			createKerning({
				classes: { bad: 'not-an-array' },
				pairs: [{ left: '@bad', right: 'V', value: -10 }],
			}),
		).toThrow('class "bad" must be an array');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Format 1: Flat pair
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: flat pair', () => {
	it('should accept a single flat pair object', () => {
		const result = createKerning({ left: 'A', right: 'V', value: -80 });
		expect(result).toEqual([{ left: 'A', right: 'V', value: -80 }]);
	});

	it('should accept an array of flat pairs', () => {
		const result = createKerning([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'T', right: 'o', value: -40 },
		]);
		expect(result).toEqual([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'T', right: 'o', value: -40 },
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Format 3: Grouped by left glyph
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: grouped by left', () => {
	it('should expand left-grouped pairs', () => {
		const result = createKerning({
			left: 'A',
			pairs: { V: -80, W: -60, T: -50 },
		});
		expect(result).toEqual([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'A', right: 'W', value: -60 },
			{ left: 'A', right: 'T', value: -50 },
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Format 4: Grouped map
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: grouped map', () => {
	it('should expand groups map', () => {
		const result = createKerning({
			groups: {
				A: { V: -80, W: -60 },
				T: { o: -40 },
			},
		});
		expect(result).toEqual([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'A', right: 'W', value: -60 },
			{ left: 'T', right: 'o', value: -40 },
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Format 5: Class-based
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: class-based', () => {
	it('should expand class references in pairs', () => {
		const result = createKerning({
			classes: {
				round: ['O', 'C', 'G'],
				straight: ['H', 'I'],
			},
			pairs: [{ left: '@round', right: '@straight', value: -20 }],
		});
		expect(result).toHaveLength(6);
		expect(result).toContainEqual({ left: 'O', right: 'H', value: -20 });
		expect(result).toContainEqual({ left: 'O', right: 'I', value: -20 });
		expect(result).toContainEqual({ left: 'C', right: 'H', value: -20 });
		expect(result).toContainEqual({ left: 'C', right: 'I', value: -20 });
		expect(result).toContainEqual({ left: 'G', right: 'H', value: -20 });
		expect(result).toContainEqual({ left: 'G', right: 'I', value: -20 });
	});

	it('should allow mixing class refs and plain glyph names', () => {
		const result = createKerning({
			classes: { caps: ['A', 'B'] },
			pairs: [
				{ left: '@caps', right: 'V', value: -80 },
				{ left: 'T', right: 'o', value: -40 },
			],
		});
		expect(result).toHaveLength(3);
		expect(result).toContainEqual({ left: 'A', right: 'V', value: -80 });
		expect(result).toContainEqual({ left: 'B', right: 'V', value: -80 });
		expect(result).toContainEqual({ left: 'T', right: 'o', value: -40 });
	});

	it('should support class refs in grouped-by-left format', () => {
		const result = createKerning([
			{ classes: { diag: ['V', 'W'] } },
			{ left: 'A', pairs: { '@diag': -80 } },
		]);
		expect(result).toEqual([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'A', right: 'W', value: -80 },
		]);
	});

	it('should support class refs in grouped map format', () => {
		const result = createKerning([
			{ classes: { round: ['O', 'C'] } },
			{ groups: { '@round': { V: -30 } } },
		]);
		expect(result).toEqual([
			{ left: 'O', right: 'V', value: -30 },
			{ left: 'C', right: 'V', value: -30 },
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Mixed formats
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: mixed formats', () => {
	it('should accept mixed format array', () => {
		const result = createKerning([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'T', pairs: { o: -40, a: -35 } },
			{ groups: { L: { quoteright: -120 } } },
		]);
		expect(result).toHaveLength(4);
		expect(result).toContainEqual({ left: 'A', right: 'V', value: -80 });
		expect(result).toContainEqual({ left: 'T', right: 'o', value: -40 });
		expect(result).toContainEqual({ left: 'T', right: 'a', value: -35 });
		expect(result).toContainEqual({
			left: 'L',
			right: 'quoteright',
			value: -120,
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Deduplication
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: deduplication', () => {
	it('should deduplicate — last definition wins', () => {
		const result = createKerning([
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'A', right: 'V', value: -50 },
		]);
		expect(result).toEqual([{ left: 'A', right: 'V', value: -50 }]);
	});

	it('should deduplicate across formats', () => {
		const result = createKerning([
			{ groups: { A: { V: -80 } } },
			{ left: 'A', pairs: { V: -60 } },
		]);
		expect(result).toEqual([{ left: 'A', right: 'V', value: -60 }]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Empty / edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('createKerning: edge cases', () => {
	it('should return empty array for empty input array', () => {
		expect(createKerning([])).toEqual([]);
	});

	it('should return empty array for groups with no pairs', () => {
		expect(createKerning({ groups: {} })).toEqual([]);
	});

	it('should handle zero kerning value', () => {
		const result = createKerning({ left: 'A', right: 'V', value: 0 });
		expect(result).toEqual([{ left: 'A', right: 'V', value: 0 }]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  getKerningValue
// ═══════════════════════════════════════════════════════════════════════════

describe('getKerningValue', () => {
	const font = {
		glyphs: [
			{ name: '.notdef', unicode: null },
			{ name: 'A', unicode: 65 },
			{ name: 'V', unicode: 86 },
			{ name: 'T', unicode: 84 },
			{ name: 'o', unicode: 111 },
		],
		kerning: [
			{ left: 'A', right: 'V', value: -80 },
			{ left: 'A', right: 'T', value: -50 },
			{ left: 'T', right: 'o', value: -40 },
		],
	};

	it('should look up by glyph name', () => {
		expect(getKerningValue(font, 'A', 'V')).toBe(-80);
		expect(getKerningValue(font, 'A', 'T')).toBe(-50);
		expect(getKerningValue(font, 'T', 'o')).toBe(-40);
	});

	it('should return undefined for non-existent pair', () => {
		expect(getKerningValue(font, 'A', 'o')).toBeUndefined();
		expect(getKerningValue(font, 'V', 'A')).toBeUndefined();
	});

	it('should look up by numeric code point', () => {
		expect(getKerningValue(font, 65, 86)).toBe(-80);
		expect(getKerningValue(font, 84, 111)).toBe(-40);
	});

	it('should look up by U+ hex string', () => {
		expect(getKerningValue(font, 'U+0041', 'U+0056')).toBe(-80);
	});

	it('should look up by 0x hex string', () => {
		expect(getKerningValue(font, '0x41', '0x56')).toBe(-80);
	});

	it('should mix name and code point', () => {
		expect(getKerningValue(font, 'A', 86)).toBe(-80);
		expect(getKerningValue(font, 65, 'V')).toBe(-80);
	});

	it('should return undefined if code point not found in glyphs', () => {
		expect(getKerningValue(font, 9999, 86)).toBeUndefined();
	});

	it('should return undefined for null/empty font', () => {
		expect(getKerningValue(null, 'A', 'V')).toBeUndefined();
		expect(getKerningValue({}, 'A', 'V')).toBeUndefined();
		expect(getKerningValue({ kerning: [] }, 'A', 'V')).toBeUndefined();
	});

	it('should return last value when duplicates exist', () => {
		const dupeFont = {
			glyphs: font.glyphs,
			kerning: [
				{ left: 'A', right: 'V', value: -80 },
				{ left: 'A', right: 'V', value: -50 },
			],
		};
		expect(getKerningValue(dupeFont, 'A', 'V')).toBe(-50);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  getGlyph
// ═══════════════════════════════════════════════════════════════════════════

describe('getGlyph', () => {
	const font = {
		glyphs: [
			{ name: '.notdef', unicode: null, advanceWidth: 0 },
			{ name: 'A', unicode: 65, advanceWidth: 600 },
			{ name: 'V', unicode: 86, advanceWidth: 600 },
			{ name: 'space', unicode: 32, advanceWidth: 250 },
			{ name: 'multi', unicodes: [0xfb01, 0xfb02], advanceWidth: 700 },
		],
	};

	it('should look up by glyph name', () => {
		expect(getGlyph(font, 'A')).toBe(font.glyphs[1]);
		expect(getGlyph(font, '.notdef')).toBe(font.glyphs[0]);
		expect(getGlyph(font, 'space')).toBe(font.glyphs[3]);
	});

	it('should look up by numeric code point', () => {
		expect(getGlyph(font, 65)).toBe(font.glyphs[1]);
		expect(getGlyph(font, 0x20)).toBe(font.glyphs[3]);
	});

	it('should look up by U+ hex string', () => {
		expect(getGlyph(font, 'U+0041')).toBe(font.glyphs[1]);
		expect(getGlyph(font, 'U+0056')).toBe(font.glyphs[2]);
	});

	it('should look up by 0x hex string', () => {
		expect(getGlyph(font, '0x41')).toBe(font.glyphs[1]);
	});

	it('should find glyph via unicodes array', () => {
		expect(getGlyph(font, 0xfb01)).toBe(font.glyphs[4]);
		expect(getGlyph(font, 0xfb02)).toBe(font.glyphs[4]);
	});

	it('should return undefined for non-existent glyph', () => {
		expect(getGlyph(font, 'missing')).toBeUndefined();
		expect(getGlyph(font, 9999)).toBeUndefined();
	});

	it('should return undefined for null/empty font', () => {
		expect(getGlyph(null, 'A')).toBeUndefined();
		expect(getGlyph({}, 'A')).toBeUndefined();
	});
});
