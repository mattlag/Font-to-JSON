/**
 * Font Flux JS : JSON Serialization
 * Convert font data objects to/from JSON strings, handling BigInt values.
 */

// Top-level keys that are transient and should not be serialized.
// _header is preserved because exportFont needs it for lossless re-export.
// Table-level _raw and _checksum are part of the data model and must be preserved.
const SKIP_KEYS = new Set([
	'_dirty',
	'_fileName',
	'_originalBuffer',
	'_collection',
	'_collectionFonts',
	'_woff',
]);

/**
 * Serialize a font data object to a JSON string.
 * BigInt values (used for LONGDATETIME fields) are converted to numbers.
 * Transient top-level properties (e.g. _header, _fileName) are omitted.
 * Table-level _raw and _checksum are preserved for lossless round-trip.
 *
 * @param {object} fontData - The font data object from importFont.
 * @param {number} [indent=2] - Number of spaces for indentation (0 for compact).
 * @returns {string} JSON string.
 */
export function fontToJSON(fontData, indent = 2) {
	return JSON.stringify(
		fontData,
		function (key, value) {
			// Only strip known transient keys at the top level
			if (this === fontData && SKIP_KEYS.has(key)) return undefined;
			if (typeof value === 'bigint') return Number(value);
			// TypedArrays (e.g. Uint8Array _raw) serialize as objects — convert to arrays
			if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
				return Array.from(value);
			}
			return value;
		},
		indent,
	);
}

/**
 * Deserialize a JSON string back into a font data object.
 * The resulting object can be passed directly to exportFont.
 *
 * @param {string} jsonString - JSON string produced by fontToJSON (or equivalent).
 * @returns {object} Font data object.
 */
export function fontFromJSON(jsonString) {
	return JSON.parse(jsonString);
}
