/**
 * Font Flux JS : Substitution Creation Helper
 *
 * High-level helper for creating GSUB substitution rules from hand-authored data.
 * Accepts substitution data in a simplified format and produces the normalised
 * array expected by the pipeline.
 *
 * Glyph references accept: glyph name string, numeric Unicode code point,
 * or hex string ('U+0041', '0x41'). Class references use '@className'.
 */

import { resolveGlyphId } from './glyph.js';

/**
 * Supported substitution types and their shapes:
 *
 *   Single — one glyph replaced by one glyph
 *     { type: 'single', feature: 'smcp', substitution: { from: 'a', to: 'a.smcp' } }
 *     { type: 'single', feature: 'smcp', substitutions: [{ from: 'a', to: 'a.smcp' }, ...] }
 *
 *   Multiple — one glyph replaced by a sequence
 *     { type: 'multiple', feature: 'ccmp', substitution: { from: 'ffi', to: ['f', 'f', 'i'] } }
 *
 *   Alternate — one glyph has alternate forms
 *     { type: 'alternate', feature: 'salt', substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2'] } }
 *
 *   Ligature — a sequence replaced by one glyph
 *     { type: 'ligature', feature: 'liga', substitution: { components: ['f', 'i'], ligature: 'fi' } }
 *     { type: 'ligature', feature: 'liga', substitutions: [{ components: ['f', 'i'], ligature: 'fi' }, ...] }
 *
 *   Reverse — reverse chaining single substitution
 *     { type: 'reverse', feature: 'rclt', substitution: { from: 'a', to: 'a.final',
 *       backtrack: [['x', 'y']], lookahead: [['z']] } }
 *
 * All types accept optional `script` (default: 'DFLT') and `language` (default: null = defaultLangSys).
 *
 * Class-based shorthand (applies to any glyph ref):
 *     { ..., classes: { lowercase: ['a', 'b', 'c', ...] },
 *       substitution: { from: '@lowercase', to: '@lowercaseSmcp' } }
 */

/**
 * Create a normalised substitution rule array from flexible hand-authored input.
 *
 * @param {object|object[]} input - Substitution data in any supported format.
 * @returns {Array<object>} Normalised substitution rules.
 */
export function createSubstitution(input) {
	if (!input || typeof input !== 'object') {
		throw new Error('createSubstitution: input is required (object or array)');
	}

	const items = Array.isArray(input) ? input : [input];
	const classes = {};
	const result = [];

	// First pass: collect class definitions
	for (const item of items) {
		if (item.classes) {
			for (const [name, glyphs] of Object.entries(item.classes)) {
				if (!Array.isArray(glyphs)) {
					throw new Error(
						`createSubstitution: class "${name}" must be an array of glyph names`,
					);
				}
				classes[name] = glyphs;
			}
		}
	}

	// Second pass: normalise each rule
	for (const item of items) {
		const type = item.type;
		if (!type) {
			throw new Error(
				'createSubstitution: each rule must have a "type" (single, multiple, alternate, ligature, reverse)',
			);
		}

		const feature = item.feature || 'liga';
		const script = item.script || 'DFLT';
		const language = item.language || null;

		const subs = item.substitutions
			? item.substitutions
			: item.substitution
				? [item.substitution]
				: [];

		if (subs.length === 0) {
			throw new Error(
				`createSubstitution: rule of type "${type}" must have "substitution" or "substitutions"`,
			);
		}

		for (const sub of subs) {
			const base = { type, feature, script, language };

			switch (type) {
				case 'single':
					result.push({
						...base,
						from: resolveRef(sub.from, classes),
						to: resolveRef(sub.to, classes),
					});
					break;

				case 'multiple':
					result.push({
						...base,
						from: resolveRef(sub.from, classes),
						to: resolveRefArray(sub.to, classes),
					});
					break;

				case 'alternate':
					result.push({
						...base,
						from: resolveRef(sub.from, classes),
						alternates: resolveRefArray(sub.alternates, classes),
					});
					break;

				case 'ligature':
					result.push({
						...base,
						components: resolveRefArray(sub.components, classes),
						ligature: resolveRef(sub.ligature, classes),
					});
					break;

				case 'reverse':
					result.push({
						...base,
						from: resolveRef(sub.from, classes),
						to: resolveRef(sub.to, classes),
						backtrack: (sub.backtrack || []).map((arr) =>
							resolveRefArray(arr, classes),
						),
						lookahead: (sub.lookahead || []).map((arr) =>
							resolveRefArray(arr, classes),
						),
					});
					break;

				default:
					throw new Error(
						`createSubstitution: unknown type "${type}". Valid: single, multiple, alternate, ligature, reverse`,
					);
			}
		}
	}

	return result;
}

/**
 * Look up substitution rules matching a given glyph (as input).
 *
 * @param {object} font - A Font Flux simplified font (with `.substitutions` and `.glyphs`)
 * @param {string|number} glyphId - Glyph name, code point number, or hex string
 * @param {object} [options] - { type?, feature? } filters
 * @returns {Array<object>} Matching substitution rules
 */
export function getSubstitutions(font, glyphId, options = {}) {
	const subs = font?.substitutions;
	if (!subs || !Array.isArray(subs) || subs.length === 0) return [];

	const glyphs = font.glyphs;
	const name = resolveGlyphId(glyphs, glyphId);
	if (name === undefined) return [];

	return subs.filter((rule) => {
		if (options.type && rule.type !== options.type) return false;
		if (options.feature && rule.feature !== options.feature) return false;

		switch (rule.type) {
			case 'single':
			case 'multiple':
			case 'alternate':
			case 'reverse':
				return rule.from === name;
			case 'ligature':
				return rule.components && rule.components.includes(name);
			default:
				return false;
		}
	});
}

// ============================================================================
//  INTERNAL HELPERS
// ============================================================================

/**
 * Resolve a single glyph reference. If it's a @class ref, expand to array
 * and return single-element substitution rules for each. For single refs,
 * returns the string as-is.
 */
function resolveRef(ref, classes) {
	if (typeof ref === 'string' && ref.startsWith('@')) {
		const className = ref.slice(1);
		const members = classes[className];
		if (!members) {
			throw new Error(`createSubstitution: unknown class "@${className}"`);
		}
		// For single refs, class expansion happens at a higher level
		// Here we just return the array — the caller handles expansion
		return members;
	}
	return ref;
}

/**
 * Resolve an array of glyph references, expanding @class refs.
 */
function resolveRefArray(arr, classes) {
	if (!Array.isArray(arr)) {
		throw new Error(
			'createSubstitution: expected an array of glyph references',
		);
	}
	const result = [];
	for (const ref of arr) {
		if (typeof ref === 'string' && ref.startsWith('@')) {
			const className = ref.slice(1);
			const members = classes[className];
			if (!members) {
				throw new Error(`createSubstitution: unknown class "@${className}"`);
			}
			result.push(...members);
		} else {
			result.push(ref);
		}
	}
	return result;
}
