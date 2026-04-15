/**
 * Tests for substitution helpers: createSubstitution, getSubstitutions.
 *
 * Covers all supported input formats and substitution types.
 */

import { describe, expect, it } from 'vitest';
import { createSubstitution, getSubstitutions } from '../src/substitution.js';

// ═══════════════════════════════════════════════════════════════════════════
//  Validation
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: validation', () => {
	it('should throw if no input provided', () => {
		expect(() => createSubstitution()).toThrow('input is required');
	});

	it('should throw if input is null', () => {
		expect(() => createSubstitution(null)).toThrow('input is required');
	});

	it('should throw if type is missing', () => {
		expect(() =>
			createSubstitution({ substitution: { from: 'a', to: 'b' } }),
		).toThrow('must have a "type"');
	});

	it('should throw for unknown type', () => {
		expect(() =>
			createSubstitution({
				type: 'invalid',
				substitution: { from: 'a', to: 'b' },
			}),
		).toThrow('unknown type "invalid"');
	});

	it('should throw if no substitution or substitutions', () => {
		expect(() => createSubstitution({ type: 'single' })).toThrow(
			'must have "substitution" or "substitutions"',
		);
	});

	it('should throw for unknown class reference', () => {
		expect(() =>
			createSubstitution({
				type: 'single',
				substitution: { from: '@missing', to: 'b' },
			}),
		).toThrow('unknown class "@missing"');
	});

	it('should throw if class value is not an array', () => {
		expect(() =>
			createSubstitution({
				type: 'single',
				classes: { bad: 'not-an-array' },
				substitution: { from: 'a', to: 'b' },
			}),
		).toThrow('class "bad" must be an array');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Single substitution
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: single', () => {
	it('should create a single substitution rule', () => {
		const result = createSubstitution({
			type: 'single',
			feature: 'smcp',
			substitution: { from: 'a', to: 'a.smcp' },
		});
		expect(result).toEqual([
			{
				type: 'single',
				feature: 'smcp',
				script: 'DFLT',
				language: null,
				from: 'a',
				to: 'a.smcp',
			},
		]);
	});

	it('should accept multiple substitutions via array', () => {
		const result = createSubstitution({
			type: 'single',
			feature: 'smcp',
			substitutions: [
				{ from: 'a', to: 'a.smcp' },
				{ from: 'b', to: 'b.smcp' },
			],
		});
		expect(result).toHaveLength(2);
		expect(result[0].from).toBe('a');
		expect(result[1].from).toBe('b');
	});

	it('should use custom script and language', () => {
		const result = createSubstitution({
			type: 'single',
			feature: 'smcp',
			script: 'latn',
			language: 'DEU ',
			substitution: { from: 'a', to: 'a.smcp' },
		});
		expect(result[0].script).toBe('latn');
		expect(result[0].language).toBe('DEU ');
	});

	it('should default feature to liga', () => {
		const result = createSubstitution({
			type: 'single',
			substitution: { from: 'a', to: 'b' },
		});
		expect(result[0].feature).toBe('liga');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Multiple substitution
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: multiple', () => {
	it('should create a multiple substitution rule', () => {
		const result = createSubstitution({
			type: 'multiple',
			feature: 'ccmp',
			substitution: { from: 'ffi', to: ['f', 'f', 'i'] },
		});
		expect(result).toEqual([
			{
				type: 'multiple',
				feature: 'ccmp',
				script: 'DFLT',
				language: null,
				from: 'ffi',
				to: ['f', 'f', 'i'],
			},
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Alternate substitution
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: alternate', () => {
	it('should create an alternate substitution rule', () => {
		const result = createSubstitution({
			type: 'alternate',
			feature: 'salt',
			substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2'] },
		});
		expect(result).toEqual([
			{
				type: 'alternate',
				feature: 'salt',
				script: 'DFLT',
				language: null,
				from: 'a',
				alternates: ['a.alt1', 'a.alt2'],
			},
		]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Ligature substitution
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: ligature', () => {
	it('should create a ligature substitution rule', () => {
		const result = createSubstitution({
			type: 'ligature',
			feature: 'liga',
			substitution: { components: ['f', 'i'], ligature: 'fi' },
		});
		expect(result).toEqual([
			{
				type: 'ligature',
				feature: 'liga',
				script: 'DFLT',
				language: null,
				components: ['f', 'i'],
				ligature: 'fi',
			},
		]);
	});

	it('should accept multiple ligatures', () => {
		const result = createSubstitution({
			type: 'ligature',
			feature: 'liga',
			substitutions: [
				{ components: ['f', 'i'], ligature: 'fi' },
				{ components: ['f', 'l'], ligature: 'fl' },
			],
		});
		expect(result).toHaveLength(2);
		expect(result[0].ligature).toBe('fi');
		expect(result[1].ligature).toBe('fl');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Reverse chained single substitution
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: reverse', () => {
	it('should create a reverse substitution rule', () => {
		const result = createSubstitution({
			type: 'reverse',
			feature: 'rclt',
			substitution: {
				from: 'a',
				to: 'a.final',
				backtrack: [['b', 'c']],
				lookahead: [['d', 'e']],
			},
		});
		expect(result).toEqual([
			{
				type: 'reverse',
				feature: 'rclt',
				script: 'DFLT',
				language: null,
				from: 'a',
				to: 'a.final',
				backtrack: [['b', 'c']],
				lookahead: [['d', 'e']],
			},
		]);
	});

	it('should default to empty backtrack and lookahead', () => {
		const result = createSubstitution({
			type: 'reverse',
			feature: 'rclt',
			substitution: { from: 'a', to: 'b' },
		});
		expect(result[0].backtrack).toEqual([]);
		expect(result[0].lookahead).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Class-based expansion
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: class-based', () => {
	it('should expand class references in ligature components', () => {
		const result = createSubstitution({
			type: 'ligature',
			feature: 'liga',
			classes: { vowels: ['a', 'e'] },
			substitution: { components: ['f', '@vowels'], ligature: 'fi' },
		});
		// @vowels expands in-place within the components array
		expect(result[0].components).toEqual(['f', 'a', 'e']);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Mixed array input
// ═══════════════════════════════════════════════════════════════════════════

describe('createSubstitution: mixed array', () => {
	it('should accept an array of different rule types', () => {
		const result = createSubstitution([
			{
				type: 'ligature',
				feature: 'liga',
				substitution: { components: ['f', 'i'], ligature: 'fi' },
			},
			{
				type: 'single',
				feature: 'smcp',
				substitution: { from: 'a', to: 'a.smcp' },
			},
		]);
		expect(result).toHaveLength(2);
		expect(result[0].type).toBe('ligature');
		expect(result[1].type).toBe('single');
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  getSubstitutions
// ═══════════════════════════════════════════════════════════════════════════

describe('getSubstitutions', () => {
	const font = {
		glyphs: [
			{ name: '.notdef', advanceWidth: 500 },
			{ name: 'a', unicode: 97, advanceWidth: 500 },
			{ name: 'b', unicode: 98, advanceWidth: 500 },
			{ name: 'f', unicode: 102, advanceWidth: 300 },
			{ name: 'i', unicode: 105, advanceWidth: 300 },
			{ name: 'fi', advanceWidth: 550 },
			{ name: 'a.smcp', advanceWidth: 480 },
		],
		substitutions: [
			{
				type: 'ligature',
				feature: 'liga',
				script: 'DFLT',
				language: null,
				components: ['f', 'i'],
				ligature: 'fi',
			},
			{
				type: 'single',
				feature: 'smcp',
				script: 'DFLT',
				language: null,
				from: 'a',
				to: 'a.smcp',
			},
		],
	};

	it('should find ligature rules by component glyph name', () => {
		const results = getSubstitutions(font, 'f');
		expect(results).toHaveLength(1);
		expect(results[0].type).toBe('ligature');
	});

	it('should find single subst rules by from glyph name', () => {
		const results = getSubstitutions(font, 'a');
		expect(results).toHaveLength(1);
		expect(results[0].type).toBe('single');
	});

	it('should return empty for unmatched glyph', () => {
		const results = getSubstitutions(font, 'b');
		expect(results).toHaveLength(0);
	});

	it('should filter by type', () => {
		const results = getSubstitutions(font, 'f', { type: 'single' });
		expect(results).toHaveLength(0);
	});

	it('should filter by feature', () => {
		const results = getSubstitutions(font, 'a', { feature: 'liga' });
		expect(results).toHaveLength(0);
	});

	it('should accept unicode codepoint', () => {
		const results = getSubstitutions(font, 97);
		expect(results).toHaveLength(1);
		expect(results[0].from).toBe('a');
	});

	it('should accept hex string', () => {
		const results = getSubstitutions(font, 'U+0061');
		expect(results).toHaveLength(1);
		expect(results[0].from).toBe('a');
	});

	it('should return empty for null font', () => {
		expect(getSubstitutions(null, 'a')).toEqual([]);
	});

	it('should return empty for font without substitutions', () => {
		expect(getSubstitutions({ glyphs: [] }, 'a')).toEqual([]);
	});
});
