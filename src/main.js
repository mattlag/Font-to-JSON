/**
 * Font Flux JS
 * Main entry point - exposes import and export functionality.
 */

import { buildRawFromSimplified } from './expand.js';
import { exportFont } from './export.js';
import { importFont } from './import.js';
import { buildSimplified } from './simplify.js';
import { validateJSON } from './validate/index.js';

export {
	buildRawFromSimplified,
	buildSimplified,
	exportFont,
	importFont,
	validateJSON,
};
