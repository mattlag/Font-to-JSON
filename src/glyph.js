/**
 * Font Flux JS : Glyph Creation Helper
 *
 * High-level helper for creating glyph objects from hand-authored data.
 * Accepts glyph metadata and outlines in multiple formats (SVG path,
 * CFF contours, TrueType contours), and produces the glyph object
 * expected by the rest of the pipeline.
 */

import { compileCharString } from './otf/charstring_compiler.js';
import { svgPathToContours } from './svg_path.js';

/**
 * Create a glyph object for use in a Font Flux font.
 *
 * Outline data can be supplied in any ONE of these forms:
 *   - `path`       — SVG path `d` attribute string (e.g. "M100 0 L200 700 ...")
 *   - `contours`   — Array of contour arrays (CFF commands or TrueType points)
 *   - `charString` — Raw Type 2 CharString bytecode (CFF only)
 *   - `components` — Composite glyph references (no outlines needed)
 *
 * The `format` option controls whether CFF or TrueType contours are produced
 * when converting from SVG path input. If omitted, it defaults to 'cff'.
 *
 * @param {object} options
 * @param {string} options.name - Glyph name (e.g. 'A', 'space', '.notdef')
 * @param {number} [options.unicode] - Single Unicode code point
 * @param {number[]} [options.unicodes] - Multiple Unicode code points
 * @param {number} options.advanceWidth - Horizontal advance width in font units
 * @param {number} [options.leftSideBearing] - LSB override (defaults to xMin of outline)
 * @param {number} [options.advanceHeight] - Vertical advance height
 * @param {number} [options.topSideBearing] - Vertical top side bearing
 * @param {string} [options.path] - SVG path `d` string for the outline
 * @param {Array} [options.contours] - Contour arrays (CFF or TrueType format)
 * @param {number[]} [options.charString] - Raw CFF charstring bytes
 * @param {Array} [options.components] - Composite glyph components
 * @param {number[]} [options.instructions] - TrueType instructions (bytecode)
 * @param {'cff'|'truetype'} [options.format='cff'] - Contour format for SVG path conversion
 * @returns {object} A glyph object ready for use in font.glyphs[]
 */
export function createGlyph(options) {
	if (!options || typeof options !== 'object') {
		throw new Error('createGlyph: options object is required');
	}

	const {
		name,
		unicode,
		unicodes,
		advanceWidth,
		leftSideBearing,
		advanceHeight,
		topSideBearing,
		path,
		contours,
		charString,
		components,
		instructions,
		format = 'cff',
	} = options;

	if (name === undefined || name === null) {
		throw new Error('createGlyph: name is required');
	}
	if (advanceWidth === undefined || advanceWidth === null) {
		throw new Error('createGlyph: advanceWidth is required');
	}

	const glyph = {
		name,
		advanceWidth,
	};

	// Unicode assignment
	if (unicodes && unicodes.length > 0) {
		glyph.unicodes = unicodes;
	} else if (unicode !== undefined && unicode !== null) {
		glyph.unicode = unicode;
	}

	// Optional metric overrides
	if (leftSideBearing !== undefined) {
		glyph.leftSideBearing = leftSideBearing;
	}
	if (advanceHeight !== undefined) {
		glyph.advanceHeight = advanceHeight;
	}
	if (topSideBearing !== undefined) {
		glyph.topSideBearing = topSideBearing;
	}
	if (instructions) {
		glyph.instructions = instructions;
	}

	// ---- Outline resolution (priority order) ----

	if (charString) {
		// Raw charstring bytes — use directly (CFF)
		glyph.charString = charString;
	} else if (path) {
		// SVG path string — convert to contours
		const converted = svgPathToContours(path, format);
		glyph.contours = converted;
		// For CFF, also compile charstring bytes so expand.js can use them
		if (format === 'cff') {
			glyph.charString = compileCharString(converted);
		}
	} else if (contours) {
		// Direct contour data
		glyph.contours = contours;
		// If these are CFF contours (have .type property), compile charstring
		if (
			contours.length > 0 &&
			contours[0] &&
			contours[0].length > 0 &&
			contours[0][0].type
		) {
			glyph.charString = compileCharString(contours);
		}
	} else if (components) {
		// Composite glyph
		glyph.components = components;
	}

	return glyph;
}
