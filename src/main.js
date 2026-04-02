/**
 * Font Flux JS
 * Main entry point - exposes import and export functionality.
 */

import { buildRawFromSimplified } from './expand.js';
import { exportFont } from './export.js';
import { createGlyph, getGlyph } from './glyph.js';
import { importFont, importFontTables } from './import.js';
import { fontFromJSON, fontToJSON } from './json.js';
import { createKerning, getKerningValue } from './kerning.js';
import {
	assembleCharString,
	compileCharString,
} from './otf/charstring_compiler.js';
import {
	disassembleCharString,
	interpretCharString,
} from './otf/charstring_interpreter.js';
import { buildSimplified } from './simplify.js';
import { contoursToSVGPath, svgPathToContours } from './svg_path.js';
import { validateJSON } from './validate/index.js';
import { initBrotli } from './woff/woff2.js';

/**
 * Initialize WOFF2 support by loading the Brotli WASM module.
 * Must be called (and awaited) once before importing or exporting WOFF2 files.
 * WOFF1 and SFNT operations do not require this.
 *
 * @returns {Promise<void>}
 */
async function initWoff2() {
	return initBrotli();
}

export {
	assembleCharString,
	buildRawFromSimplified,
	buildSimplified,
	compileCharString,
	contoursToSVGPath,
	createGlyph,
	createKerning,
	disassembleCharString,
	exportFont,
	fontFromJSON,
	fontToJSON,
	getGlyph,
	getKerningValue,
	importFont,
	importFontTables,
	initWoff2,
	interpretCharString,
	svgPathToContours,
	validateJSON,
};
