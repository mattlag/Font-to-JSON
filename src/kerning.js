/**
 * Font Flux JS : Kerning Creation Helper
 *
 * High-level helper for creating kerning pair arrays from hand-authored data.
 * Accepts kerning data in multiple flexible formats and produces the
 * normalised `{ left, right, value }` array expected by the pipeline.
 */

import { resolveGlyphId } from './glyph.js';

/**
 * Input formats:
 *
 *   1. Flat pair — `{ left, right, value }`
 *      createKerning({ left: 'A', right: 'V', value: -80 })
 *
 *   2. Array of flat pairs
 *      createKerning([
 *        { left: 'A', right: 'V', value: -80 },
 *        { left: 'T', right: 'o', value: -40 },
 *      ])
 *
 *   3. Grouped by left glyph — `{ left, pairs: { right: value, ... } }`
 *      createKerning({ left: 'A', pairs: { V: -80, W: -60, T: -50 } })
 *
 *   4. Grouped map — `{ groups: { left: { right: value } } }`
 *      createKerning({ groups: {
 *        A: { V: -80, W: -60 },
 *        T: { o: -40, a: -35 },
 *      }})
 *
 *   5. Class-based — `{ classes: { name: [...glyphs] }, pairs: [...] }`
 *      createKerning({
 *        classes: {
 *          roundLeft:  ['O', 'C', 'G', 'Q'],
 *          straightRight: ['H', 'I', 'M', 'N'],
 *        },
 *        pairs: [
 *          { left: '@roundLeft', right: '@straightRight', value: -20 },
 *          { left: 'A', right: 'V', value: -80 },
 *        ],
 *      })
 *
 *   All formats can be mixed via array input:
 *      createKerning([
 *        { left: 'A', pairs: { V: -80, W: -60 } },
 *        { left: 'T', right: 'o', value: -40 },
 *        { groups: { L: { quoteright: -120 } } },
 *      ])
 */

/**
 * Create a normalised kerning pair array from flexible hand-authored input.
 *
 * @param {object|object[]} input - Kerning data in any supported format
 * @returns {Array<{left: string, right: string, value: number}>}
 */
export function createKerning(input) {
	if (!input || typeof input !== 'object') {
		throw new Error('createKerning: input is required (object or array)');
	}

	const items = Array.isArray(input) ? input : [input];
	const classes = {};
	const pairs = [];

	// First pass: collect any class definitions
	for (const item of items) {
		if (item.classes) {
			for (const [name, glyphs] of Object.entries(item.classes)) {
				if (!Array.isArray(glyphs)) {
					throw new Error(
						`createKerning: class "${name}" must be an array of glyph names`,
					);
				}
				classes[name] = glyphs;
			}
		}
	}

	// Second pass: resolve all pair formats
	for (const item of items) {
		if (
			item.left !== undefined &&
			item.right !== undefined &&
			item.value !== undefined
		) {
			// Format 1: flat pair (possibly with class references)
			expandPair(item.left, item.right, item.value, classes, pairs);
		} else if (item.left !== undefined && item.pairs) {
			// Format 3: grouped by left glyph
			const lefts = resolveGlyphRef(item.left, classes);
			for (const [right, value] of Object.entries(item.pairs)) {
				const rights = resolveGlyphRef(right, classes);
				for (const l of lefts) {
					for (const r of rights) {
						pairs.push({ left: l, right: r, value });
					}
				}
			}
		} else if (item.groups) {
			// Format 4: grouped map
			for (const [left, rightMap] of Object.entries(item.groups)) {
				const lefts = resolveGlyphRef(left, classes);
				for (const [right, value] of Object.entries(rightMap)) {
					const rights = resolveGlyphRef(right, classes);
					for (const l of lefts) {
						for (const r of rights) {
							pairs.push({ left: l, right: r, value });
						}
					}
				}
			}
		} else if (item.classes && item.pairs) {
			// Format 5: class-based with explicit pairs array
			for (const pair of item.pairs) {
				expandPair(pair.left, pair.right, pair.value, classes, pairs);
			}
		}
	}

	// Deduplicate: last definition wins (matches GPOS merge behaviour)
	const seen = new Map();
	for (const pair of pairs) {
		seen.set(`${pair.left}\0${pair.right}`, pair);
	}
	return [...seen.values()];
}

/**
 * Expand a single pair entry, resolving class references.
 */
function expandPair(left, right, value, classes, out) {
	const lefts = resolveGlyphRef(left, classes);
	const rights = resolveGlyphRef(right, classes);
	for (const l of lefts) {
		for (const r of rights) {
			out.push({ left: l, right: r, value });
		}
	}
}

/**
 * Look up the kerning value for a pair of glyphs.
 *
 * Accepts glyph names (e.g. 'A') or Unicode code points (number or
 * 'U+0041' / '0x41' hex string). When code points are given, the
 * font's glyphs array is used to resolve them to names.
 *
 * @param {object} font   - A Font Flux simplified font (with `.kerning` and `.glyphs`)
 * @param {string|number} left  - Glyph name, code point number, or hex string
 * @param {string|number} right - Glyph name, code point number, or hex string
 * @returns {number|undefined} The kerning value, or undefined if no pair exists
 */
export function getKerningValue(font, left, right) {
	const kerning = font?.kerning;
	if (!kerning || !Array.isArray(kerning) || kerning.length === 0)
		return undefined;

	const glyphs = font.glyphs;
	const leftName = resolveGlyphId(glyphs, left);
	const rightName = resolveGlyphId(glyphs, right);
	if (leftName === undefined || rightName === undefined) return undefined;

	for (let i = kerning.length - 1; i >= 0; i--) {
		const p = kerning[i];
		if (p.left === leftName && p.right === rightName) return p.value;
	}
	return undefined;
}

/**
 * Resolve a glyph reference — either a plain glyph name or a @class reference.
 * Returns an array of glyph name strings.
 */
function resolveGlyphRef(ref, classes) {
	if (typeof ref === 'string' && ref.startsWith('@')) {
		const className = ref.slice(1);
		const members = classes[className];
		if (!members) {
			throw new Error(`createKerning: unknown class "@${className}"`);
		}
		return members;
	}
	return [ref];
}
