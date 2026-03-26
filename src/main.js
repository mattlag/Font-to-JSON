/**
 * Font Flux JS
 * Main entry point - exposes import and export functionality.
 */

import { buildRawFromSimplified } from './expand.js';
import { exportFont } from './export.js';
import { importFont, importFontTables } from './import.js';
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
	buildRawFromSimplified,
	buildSimplified,
	contoursToSVGPath,
	disassembleCharString,
	exportFont,
	importFont,
	importFontTables,
	initWoff2,
	interpretCharString,
	svgPathToContours,
	validateJSON,
};
