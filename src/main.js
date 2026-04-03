/**
 * Font Flux JS — v2 API
 *
 * The FontFlux class is the sole public API. It wraps the font data and
 * provides methods for reading, editing, and exporting fonts.
 *
 * Standalone utility functions (importFont, exportFont, createGlyph, etc.)
 * are internal implementation details and are NOT re-exported.
 *
 * WOFF2 initialization is exported standalone since it's a one-time global
 * init, not font-scoped.
 */

import { FontFlux } from './font_flux.js';
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

export { FontFlux, initWoff2 };
