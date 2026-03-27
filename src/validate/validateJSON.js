import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

// =========================================================================
//  Helpers
// =========================================================================

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUInt32(value) {
	return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function isUInt16(value) {
	return Number.isInteger(value) && value >= 0 && value <= 0xffff;
}

function hasRawTable(tableData) {
	return Array.isArray(tableData?._raw);
}

function addIssue(list, severity, code, message, path) {
	list.push({ severity, code, message, path });
}

// =========================================================================
//  Header helpers — compute correct directory fields for N tables
// =========================================================================

function computeDirectoryFields(numTables) {
	const maxPow2 = numTables > 0 ? 2 ** Math.floor(Math.log2(numTables)) : 0;
	const searchRange = maxPow2 * 16;
	const entrySelector = maxPow2 > 0 ? Math.floor(Math.log2(maxPow2)) : 0;
	const rangeShift = numTables * 16 - searchRange;
	return { searchRange, entrySelector, rangeShift };
}

/**
 * Infer sfVersion from the tables present.
 * CFF/CFF2 → 'OTTO' (0x4F54544F), otherwise TrueType (0x00010000).
 */
function inferSfVersion(tables) {
	if (isPlainObject(tables) && (tables['CFF '] || tables.CFF2)) {
		return 0x4f54544f;
	}
	return 0x00010000;
}

// =========================================================================
//  Report builder
// =========================================================================

function buildReport(issues) {
	const errors = issues.filter((i) => i.severity === 'error');
	const warnings = issues.filter((i) => i.severity === 'warning');
	const infos = issues.filter((i) => i.severity === 'info');
	return {
		valid: errors.length === 0,
		errors,
		warnings,
		infos,
		issues,
		summary: {
			errorCount: errors.length,
			warningCount: warnings.length,
			infoCount: infos.length,
			issueCount: issues.length,
		},
	};
}

// =========================================================================
//  Header validation — with auto-fix
// =========================================================================

function validateHeader(fontData, tableCount, path, issues) {
	let header = fontData.header;

	// --- Resolve missing header ------------------------------------------
	if (!isPlainObject(header)) {
		if (isPlainObject(fontData._header)) {
			// Promoted from _header (e.g. fontFromJSON round-trip)
			fontData.header = { ...fontData._header };
			header = fontData.header;
			addIssue(
				issues,
				'info',
				'HEADER_PROMOTED',
				'No "header" found; promoted "_header" for export compatibility.',
				path,
			);
		} else {
			// Synthesize a header from scratch
			const sfVersion = inferSfVersion(fontData.tables);
			const dir = computeDirectoryFields(tableCount);
			fontData.header = {
				sfVersion,
				numTables: tableCount,
				...dir,
			};
			header = fontData.header;
			addIssue(
				issues,
				'info',
				'HEADER_SYNTHESIZED',
				`No header found; synthesized one (sfVersion=0x${sfVersion.toString(16).toUpperCase().padStart(8, '0')}, ${tableCount} tables).`,
				path,
			);
			return; // fully computed — no further checks needed
		}
	}

	// --- sfVersion -------------------------------------------------------
	if (!isUInt32(header.sfVersion)) {
		const inferred = inferSfVersion(fontData.tables);
		header.sfVersion = inferred;
		addIssue(
			issues,
			'info',
			'HEADER_SFVERSION_INFERRED',
			`header.sfVersion was missing or invalid; set to 0x${inferred.toString(16).toUpperCase().padStart(8, '0')} based on outline tables.`,
			`${path}.sfVersion`,
		);
	}

	// --- numTables -------------------------------------------------------
	if (
		header.numTables !== undefined &&
		(!Number.isInteger(header.numTables) || header.numTables < 0)
	) {
		addIssue(
			issues,
			'error',
			'HEADER_NUMTABLES_INVALID',
			'header.numTables must be a non-negative integer when provided.',
			`${path}.numTables`,
		);
	}

	if (header.numTables !== tableCount) {
		const old = header.numTables;
		header.numTables = tableCount;
		addIssue(
			issues,
			'info',
			'HEADER_NUMTABLES_CORRECTED',
			old === undefined
				? `header.numTables was missing; set to ${tableCount}.`
				: `header.numTables corrected from ${old} to ${tableCount}.`,
			`${path}.numTables`,
		);
	}

	// --- Directory fields (searchRange, entrySelector, rangeShift) -------
	const expected = computeDirectoryFields(tableCount);

	const needsCorrection =
		header.searchRange !== expected.searchRange ||
		header.entrySelector !== expected.entrySelector ||
		header.rangeShift !== expected.rangeShift;

	if (needsCorrection) {
		header.searchRange = expected.searchRange;
		header.entrySelector = expected.entrySelector;
		header.rangeShift = expected.rangeShift;
		addIssue(
			issues,
			'info',
			'HEADER_FIELDS_CORRECTED',
			`Header directory fields auto-corrected for ${tableCount} tables (searchRange=${expected.searchRange}, entrySelector=${expected.entrySelector}, rangeShift=${expected.rangeShift}).`,
			path,
		);
	}
}

// =========================================================================
//  Raw byte validation
// =========================================================================

function validateTableRawBytes(raw, path, issues) {
	if (!Array.isArray(raw)) {
		addIssue(
			issues,
			'error',
			'TABLE_RAW_INVALID_TYPE',
			'_raw must be an array of byte values.',
			path,
		);
		return;
	}

	for (let i = 0; i < raw.length; i++) {
		const value = raw[i];
		if (!Number.isInteger(value) || value < 0 || value > 255) {
			addIssue(
				issues,
				'error',
				'TABLE_RAW_INVALID_BYTE',
				`_raw[${i}] must be an integer byte (0-255).`,
				`${path}[${i}]`,
			);
			break;
		}
	}
}

// =========================================================================
//  Table-level validation
// =========================================================================

function validateTables(tables, path, issues) {
	if (!isPlainObject(tables)) {
		addIssue(
			issues,
			'error',
			'TABLES_MISSING',
			'Font tables are required and must be an object keyed by 4-char table tag.',
			path,
		);
		return [];
	}

	const tags = Object.keys(tables);
	if (tags.length === 0) {
		addIssue(
			issues,
			'error',
			'TABLES_EMPTY',
			'Font tables object is empty; at least core required tables are needed.',
			path,
		);
	}

	for (const tag of tags) {
		if (typeof tag !== 'string' || tag.length !== 4) {
			addIssue(
				issues,
				'error',
				'TABLE_TAG_INVALID',
				`Table tag "${tag}" must be exactly 4 characters.`,
				`${path}.${tag}`,
			);
		}

		const tableData = tables[tag];
		const tablePath = `${path}.${tag}`;

		if (!isPlainObject(tableData)) {
			addIssue(
				issues,
				'error',
				'TABLE_DATA_INVALID',
				`Table "${tag}" must be an object.`,
				tablePath,
			);
			continue;
		}

		if (tableData._checksum !== undefined && !isUInt32(tableData._checksum)) {
			addIssue(
				issues,
				'error',
				'TABLE_CHECKSUM_INVALID',
				`Table "${tag}" _checksum must be uint32 when provided.`,
				`${tablePath}._checksum`,
			);
		}

		if (tableData._raw !== undefined) {
			validateTableRawBytes(tableData._raw, `${tablePath}._raw`, issues);
		}

		const isSupported = ALL_SUPPORTED_TABLES.has(tag);
		const isRaw = hasRawTable(tableData);

		if (!isRaw && !isSupported) {
			// Parsed data for an unrecognized table — will fail at export
			addIssue(
				issues,
				'error',
				'TABLE_WRITER_UNSUPPORTED',
				`Table "${tag}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
				tablePath,
			);
		} else if (isRaw && !isSupported) {
			// Unrecognized table preserved as raw bytes — fine, just noting it
			addIssue(
				issues,
				'info',
				'TABLE_UNRECOGNIZED_RAW',
				`Table "${tag}" is not a recognized OpenType table; preserved via _raw bytes.`,
				tablePath,
			);
		}
	}

	return tags;
}

// =========================================================================
//  Cross-table dependency checks
// =========================================================================

function validateTableDependencies(tables, path, issues) {
	const hasTable = (tag) => tables[tag] !== undefined;
	const isParsed = (tag) => hasTable(tag) && !hasRawTable(tables[tag]);

	const requireForParsed = (tag, deps, messagePrefix = 'requires') => {
		if (!isParsed(tag)) return;
		for (const dep of deps) {
			if (!hasTable(dep)) {
				addIssue(
					issues,
					'error',
					'TABLE_DEPENDENCY_MISSING',
					`Parsed table "${tag}" ${messagePrefix} table "${dep}".`,
					`${path}.${tag}`,
				);
			}
		}
	};

	requireForParsed('hmtx', ['hhea', 'maxp']);
	requireForParsed('loca', ['head', 'maxp']);
	requireForParsed('glyf', ['loca', 'head', 'maxp']);
	requireForParsed('vmtx', ['vhea', 'maxp']);

	if (isParsed('gvar') && !hasTable('fvar')) {
		addIssue(
			issues,
			'warning',
			'VARIABLE_TABLE_DEPENDENCY',
			'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
			`${path}.gvar`,
		);
	}

	if (isParsed('cvar') && !hasTable('fvar')) {
		addIssue(
			issues,
			'warning',
			'VARIABLE_TABLE_DEPENDENCY',
			'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
			`${path}.cvar`,
		);
	}
}

// =========================================================================
//  Outline & required table checks
// =========================================================================

function validateOutlineAndRequiredTables(tables, path, issues) {
	const hasTable = (tag) => tables[tag] !== undefined;

	for (const tag of REQUIRED_CORE_TABLES) {
		if (!hasTable(tag)) {
			addIssue(
				issues,
				'error',
				'REQUIRED_TABLE_MISSING',
				`Required core table "${tag}" is missing.`,
				path,
			);
		}
	}

	if (!hasTable('OS/2')) {
		addIssue(
			issues,
			'warning',
			'RECOMMENDED_TABLE_MISSING',
			'Recommended table "OS/2" is missing.',
			path,
		);
	}

	const hasTrueTypeOutline = hasTable('glyf') || hasTable('loca');
	const hasCffOutline = hasTable('CFF ') || hasTable('CFF2');

	if (!hasTrueTypeOutline && !hasCffOutline) {
		addIssue(
			issues,
			'error',
			'OUTLINE_MISSING',
			'No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.',
			path,
		);
	}

	if (hasTrueTypeOutline) {
		if (!hasTable('glyf')) {
			addIssue(
				issues,
				'error',
				'TRUETYPE_OUTLINE_INCOMPLETE',
				'TrueType outline requires table "glyf".',
				path,
			);
		}
		if (!hasTable('loca')) {
			addIssue(
				issues,
				'error',
				'TRUETYPE_OUTLINE_INCOMPLETE',
				'TrueType outline requires table "loca".',
				path,
			);
		}
	}

	if (hasTrueTypeOutline && hasCffOutline) {
		addIssue(
			issues,
			'warning',
			'MULTIPLE_OUTLINE_TYPES',
			'Both TrueType and CFF outline tables are present; most fonts use one outline model.',
			path,
		);
	}
}

// =========================================================================
//  Single-font validation
// =========================================================================

function validateSingleFont(fontData, path, issues) {
	if (!isPlainObject(fontData)) {
		addIssue(
			issues,
			'error',
			'FONTDATA_INVALID',
			'Font data must be an object.',
			path,
		);
		return;
	}

	const tags = validateTables(fontData.tables, `${path}.tables`, issues);
	validateHeader(fontData, tags.length, `${path}.header`, issues);

	if (isPlainObject(fontData.tables)) {
		validateOutlineAndRequiredTables(fontData.tables, `${path}.tables`, issues);
		validateTableDependencies(fontData.tables, `${path}.tables`, issues);
	}
}

// =========================================================================
//  Collection validation
// =========================================================================

function validateCollection(collectionData, path, issues) {
	const collection = collectionData.collection;
	const fonts = collectionData.fonts;

	if (!isPlainObject(collection)) {
		addIssue(
			issues,
			'error',
			'COLLECTION_META_INVALID',
			'collection must be an object for TTC/OTC inputs.',
			`${path}.collection`,
		);
	}

	if (!Array.isArray(fonts) || fonts.length === 0) {
		addIssue(
			issues,
			'error',
			'COLLECTION_FONTS_INVALID',
			'fonts must be a non-empty array for TTC/OTC inputs.',
			`${path}.fonts`,
		);
		return;
	}

	if (
		isPlainObject(collection) &&
		collection.numFonts !== undefined &&
		collection.numFonts !== fonts.length
	) {
		collection.numFonts = fonts.length;
		addIssue(
			issues,
			'info',
			'COLLECTION_NUMFONTS_CORRECTED',
			`collection.numFonts corrected to ${fonts.length} to match fonts array.`,
			`${path}.collection.numFonts`,
		);
	}

	for (let i = 0; i < fonts.length; i++) {
		validateSingleFont(fonts[i], `${path}.fonts[${i}]`, issues);
	}
}

// =========================================================================
//  Public API
// =========================================================================

/**
 * Validate JSON font data before calling exportFont.
 *
 * This validator checks structure, table tag validity, raw byte sanity,
 * required core tables, and common cross-table dependencies.  Where possible
 * it auto-fixes recoverable issues (missing header, wrong directory fields,
 * mismatched counts) and reports them as "info" level issues.
 *
 * The input object may be **mutated** when auto-fixes are applied — the same
 * object can then be passed directly to `exportFont`.
 *
 * @param {object} fontData
 * @returns {{
 *   valid: boolean,
 *   errors:   Array<{severity:'error',   code:string, message:string, path:string}>,
 *   warnings: Array<{severity:'warning', code:string, message:string, path:string}>,
 *   infos:    Array<{severity:'info',    code:string, message:string, path:string}>,
 *   issues:   Array<{severity:string,    code:string, message:string, path:string}>,
 *   summary: { errorCount:number, warningCount:number, infoCount:number, issueCount:number }
 * }}
 */
export function validateJSON(fontData) {
	const issues = [];

	if (!isPlainObject(fontData)) {
		addIssue(
			issues,
			'error',
			'INPUT_INVALID',
			'validateJSON expects a font JSON object.',
			'$',
		);
		return buildReport(issues);
	}

	const looksLikeCollection =
		fontData.collection !== undefined || fontData.fonts !== undefined;

	if (looksLikeCollection) {
		validateCollection(fontData, '$', issues);
	} else {
		validateSingleFont(fontData, '$', issues);
	}

	return buildReport(issues);
}
