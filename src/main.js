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

export {
	buildRawFromSimplified,
	buildSimplified,
	contoursToSVGPath,
	disassembleCharString,
	exportFont,
	importFont,
	importFontTables,
	interpretCharString,
	svgPathToContours,
	validateJSON,
};
