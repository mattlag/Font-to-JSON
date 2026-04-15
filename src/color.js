/**
 * Font Flux JS : Color Font Helper
 *
 * High-level helpers for creating color glyph data and managing palettes.
 * Works with COLR/CPAL tables through the simplified representation.
 *
 * Color values use standard hex strings (#RRGGBB or #RRGGBBAA).
 * The CPAL table's native BGRA byte order is handled internally.
 */

// ===========================================================================
//  HEX ↔ BGRA CONVERSION
// ===========================================================================

/**
 * Convert a hex color string to a CPAL BGRA object.
 *
 * Accepts:
 *   '#RGB'       → expands to '#RRGGBB', alpha 255
 *   '#RGBA'      → expands to '#RRGGBBAA'
 *   '#RRGGBB'    → alpha 255
 *   '#RRGGBBAA'  → explicit alpha
 *
 * @param {string} hex
 * @returns {{ blue: number, green: number, red: number, alpha: number }}
 */
export function hexToBGRA(hex) {
	if (typeof hex !== 'string' || hex[0] !== '#') {
		throw new Error(`Invalid hex color: ${hex}`);
	}

	let r, g, b, a;
	const h = hex.slice(1);

	if (h.length === 3) {
		r = parseInt(h[0] + h[0], 16);
		g = parseInt(h[1] + h[1], 16);
		b = parseInt(h[2] + h[2], 16);
		a = 255;
	} else if (h.length === 4) {
		r = parseInt(h[0] + h[0], 16);
		g = parseInt(h[1] + h[1], 16);
		b = parseInt(h[2] + h[2], 16);
		a = parseInt(h[3] + h[3], 16);
	} else if (h.length === 6) {
		r = parseInt(h.slice(0, 2), 16);
		g = parseInt(h.slice(2, 4), 16);
		b = parseInt(h.slice(4, 6), 16);
		a = 255;
	} else if (h.length === 8) {
		r = parseInt(h.slice(0, 2), 16);
		g = parseInt(h.slice(2, 4), 16);
		b = parseInt(h.slice(4, 6), 16);
		a = parseInt(h.slice(6, 8), 16);
	} else {
		throw new Error(`Invalid hex color length: ${hex}`);
	}

	if ([r, g, b, a].some((v) => isNaN(v))) {
		throw new Error(`Invalid hex color: ${hex}`);
	}

	return { blue: b, green: g, red: r, alpha: a };
}

/**
 * Convert a CPAL BGRA object to a hex color string.
 *
 * Returns '#RRGGBB' when alpha is 255, '#RRGGBBAA' otherwise.
 *
 * @param {{ blue: number, green: number, red: number, alpha: number }} bgra
 * @returns {string}
 */
export function bgraToHex(bgra) {
	const r = (bgra.red & 0xff).toString(16).padStart(2, '0');
	const g = (bgra.green & 0xff).toString(16).padStart(2, '0');
	const b = (bgra.blue & 0xff).toString(16).padStart(2, '0');

	if (bgra.alpha === 255 || bgra.alpha === undefined) {
		return `#${r}${g}${b}`;
	}

	const a = (bgra.alpha & 0xff).toString(16).padStart(2, '0');
	return `#${r}${g}${b}${a}`;
}

// ===========================================================================
//  PALETTE HELPERS
// ===========================================================================

/**
 * Normalise a palette input to an array of hex strings.
 *
 * Accepts:
 *   - Array of hex strings: ['#FF0000', '#00FF00']
 *   - Array of BGRA objects: [{ red: 255, green: 0, blue: 0, alpha: 255 }]
 *
 * @param {Array} palette
 * @returns {string[]} Array of hex strings.
 */
export function normalizePalette(palette) {
	if (!Array.isArray(palette)) {
		throw new Error('Palette must be an array of colors');
	}
	return palette.map((color) => {
		if (typeof color === 'string') {
			hexToBGRA(color); // validate
			return normalizeHex(color);
		}
		if (color && typeof color === 'object' && 'red' in color) {
			return bgraToHex(color);
		}
		throw new Error(`Invalid palette color: ${color}`);
	});
}

/**
 * Normalise a hex string to canonical '#rrggbb' or '#rrggbbaa' form (lowercase).
 * @param {string} hex
 * @returns {string}
 */
function normalizeHex(hex) {
	return bgraToHex(hexToBGRA(hex));
}

// ===========================================================================
//  COLOR GLYPH CREATION
// ===========================================================================

/**
 * Normalise a color glyph input into the simplified form.
 *
 * Accepts:
 *   - COLRv0-style layers:
 *     { name: 'A', layers: [{ glyph: 'A.layer0', paletteIndex: 0 }, ...] }
 *
 *   - COLRv1-style paint tree:
 *     { name: 'A', paint: { format: 10, ... } }
 *
 * @param {object} input
 * @returns {object} Normalised color glyph object.
 */
export function createColorGlyph(input) {
	if (!input || typeof input !== 'object') {
		throw new Error('createColorGlyph: input object is required');
	}

	if (!input.name) {
		throw new Error('createColorGlyph: name is required');
	}

	if (!input.layers && !input.paint) {
		throw new Error(
			'createColorGlyph: either layers (v0) or paint (v1) is required',
		);
	}

	const result = { name: input.name };

	if (input.layers) {
		if (!Array.isArray(input.layers) || input.layers.length === 0) {
			throw new Error('createColorGlyph: layers must be a non-empty array');
		}
		result.layers = input.layers.map((layer) => {
			if (!layer.glyph) {
				throw new Error('createColorGlyph: each layer needs a glyph name');
			}
			if (layer.paletteIndex == null) {
				throw new Error('createColorGlyph: each layer needs a paletteIndex');
			}
			return { glyph: layer.glyph, paletteIndex: layer.paletteIndex };
		});
	} else {
		result.paint = input.paint;
	}

	return result;
}

// ===========================================================================
//  GLYPH INDEX ↔ NAME RESOLUTION (for simplify/expand)
// ===========================================================================

/**
 * Build a glyphID → name map from the glyphs array.
 * @param {object[]} glyphs
 * @returns {Map<number, string>}
 */
export function buildGlyphIdToNameMap(glyphs) {
	const map = new Map();
	for (let i = 0; i < glyphs.length; i++) {
		map.set(i, glyphs[i].name);
	}
	return map;
}

/**
 * Build a name → glyphID (index) map from the glyphs array.
 * @param {object[]} glyphs
 * @returns {Map<string, number>}
 */
export function buildNameToGlyphIdMap(glyphs) {
	const map = new Map();
	for (let i = 0; i < glyphs.length; i++) {
		if (glyphs[i].name) {
			map.set(glyphs[i].name, i);
		}
	}
	return map;
}

/**
 * Resolve glyphIDs to names in a v1 paint tree (recursive, in-place).
 * @param {object} paint
 * @param {Map<number, string>} idToName
 */
export function resolvePaintGlyphIds(paint, idToName) {
	if (!paint || typeof paint !== 'object') return;

	// PaintGlyph (10) and PaintColrGlyph (11) have glyphID
	if (paint.glyphID !== undefined && typeof paint.glyphID === 'number') {
		paint.glyphID = idToName.get(paint.glyphID) ?? paint.glyphID;
	}

	// Recurse into child paint nodes
	if (paint.paint) resolvePaintGlyphIds(paint.paint, idToName);
	if (paint.sourcePaint) resolvePaintGlyphIds(paint.sourcePaint, idToName);
	if (paint.backdropPaint) resolvePaintGlyphIds(paint.backdropPaint, idToName);
}

/**
 * Resolve glyph names to IDs in a v1 paint tree (recursive, in-place).
 * @param {object} paint
 * @param {Map<string, number>} nameToId
 */
export function resolvePaintGlyphNames(paint, nameToId) {
	if (!paint || typeof paint !== 'object') return;

	// PaintGlyph (10) and PaintColrGlyph (11) have glyphID
	if (paint.glyphID !== undefined && typeof paint.glyphID === 'string') {
		const id = nameToId.get(paint.glyphID);
		if (id !== undefined) paint.glyphID = id;
	}

	// Recurse into child paint nodes
	if (paint.paint) resolvePaintGlyphNames(paint.paint, nameToId);
	if (paint.sourcePaint) resolvePaintGlyphNames(paint.sourcePaint, nameToId);
	if (paint.backdropPaint)
		resolvePaintGlyphNames(paint.backdropPaint, nameToId);
}
