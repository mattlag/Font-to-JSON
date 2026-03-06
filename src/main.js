/**
 * Font Flux JS
 * Main entry point - exposes import and export functionality.
 */

import { exportFont } from './export.js';
import { importFont } from './import.js';
import { validateJSON } from './validate/index.js';

export { exportFont, importFont, validateJSON };
