import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

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

function buildReport(issues) {
	const errors = issues.filter((i) => i.severity === 'error');
	const warnings = issues.filter((i) => i.severity === 'warning');
	return {
		valid: errors.length === 0,
		errors,
		warnings,
		issues,
		summary: {
			errorCount: errors.length,
			warningCount: warnings.length,
			issueCount: issues.length,
		},
	};
}

function validateHeader(header, tableCount, path, issues) {
	if (!isPlainObject(header)) {
		addIssue(
			issues,
			'error',
			'HEADER_MISSING',
			'Font header is required and must be an object.',
			path,
		);
		return;
	}

	if (!isUInt32(header.sfVersion)) {
		addIssue(
			issues,
			'error',
			'HEADER_SFVERSION_INVALID',
			'header.sfVersion must be a uint32 number.',
			`${path}.sfVersion`,
		);
	}

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

	if (Number.isInteger(header.numTables) && header.numTables !== tableCount) {
		addIssue(
			issues,
			'warning',
			'HEADER_NUMTABLES_MISMATCH',
			`header.numTables (${header.numTables}) does not match tables count (${tableCount}).`,
			`${path}.numTables`,
		);
	}

	const hasDirectoryFields =
		header.searchRange !== undefined ||
		header.entrySelector !== undefined ||
		header.rangeShift !== undefined;

	if (hasDirectoryFields) {
		if (!isUInt16(header.searchRange ?? -1)) {
			addIssue(
				issues,
				'error',
				'HEADER_SEARCHRANGE_INVALID',
				'header.searchRange must be a uint16 when provided.',
				`${path}.searchRange`,
			);
		}
		if (!isUInt16(header.entrySelector ?? -1)) {
			addIssue(
				issues,
				'error',
				'HEADER_ENTRYSELECTOR_INVALID',
				'header.entrySelector must be a uint16 when provided.',
				`${path}.entrySelector`,
			);
		}
		if (!isUInt16(header.rangeShift ?? -1)) {
			addIssue(
				issues,
				'error',
				'HEADER_RANGESHIFT_INVALID',
				'header.rangeShift must be a uint16 when provided.',
				`${path}.rangeShift`,
			);
		}

		if (
			isUInt16(header.searchRange) &&
			isUInt16(header.entrySelector) &&
			isUInt16(header.rangeShift)
		) {
			const maxPow2 =
				tableCount > 0 ? 2 ** Math.floor(Math.log2(tableCount)) : 0;
			const expectedSearchRange = maxPow2 * 16;
			const expectedEntrySelector =
				maxPow2 > 0 ? Math.floor(Math.log2(maxPow2)) : 0;
			const expectedRangeShift = tableCount * 16 - expectedSearchRange;

			if (
				header.searchRange !== expectedSearchRange ||
				header.entrySelector !== expectedEntrySelector ||
				header.rangeShift !== expectedRangeShift
			) {
				addIssue(
					issues,
					'warning',
					'HEADER_DIRECTORY_FIELDS_MISMATCH',
					`Header directory fields differ from expected values for ${tableCount} tables (expected searchRange=${expectedSearchRange}, entrySelector=${expectedEntrySelector}, rangeShift=${expectedRangeShift}).`,
					path,
				);
			}
		}
	}
}

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
		if (!hasRawTable(tableData) && !isSupported) {
			addIssue(
				issues,
				'error',
				'TABLE_WRITER_UNSUPPORTED',
				`Table "${tag}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
				tablePath,
			);
		}
	}

	return tags;
}

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
	validateHeader(fontData.header, tags.length, `${path}.header`, issues);

	if (isPlainObject(fontData.tables)) {
		validateOutlineAndRequiredTables(fontData.tables, `${path}.tables`, issues);
		validateTableDependencies(fontData.tables, `${path}.tables`, issues);
	}
}

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
		collection &&
		collection.numFonts !== undefined &&
		collection.numFonts !== fonts.length
	) {
		addIssue(
			issues,
			'warning',
			'COLLECTION_NUMFONTS_MISMATCH',
			`collection.numFonts (${collection.numFonts}) does not match fonts.length (${fonts.length}).`,
			`${path}.collection.numFonts`,
		);
	}

	for (let i = 0; i < fonts.length; i++) {
		validateSingleFont(fonts[i], `${path}.fonts[${i}]`, issues);
	}
}

/**
 * Validate JSON font data before calling exportFont.
 *
 * This validator focuses on practical correctness checks for human-authored
 * JSON: structure, table tag validity, raw byte sanity, required core tables,
 * and common cross-table dependencies.
 *
 * @param {object} fontData
 * @returns {{
 *   valid: boolean,
 *   errors: Array<{severity:'error'|'warning',code:string,message:string,path:string}>,
 *   warnings: Array<{severity:'error'|'warning',code:string,message:string,path:string}>,
 *   issues: Array<{severity:'error'|'warning',code:string,message:string,path:string}>,
 *   summary: { errorCount:number, warningCount:number, issueCount:number }
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
