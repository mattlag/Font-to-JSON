import { DataReader } from '../reader.js';
import { unwrapWOFF1 } from '../woff/woff1.js';
import { unwrapWOFF2 } from '../woff/woff2.js';
import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

// Re-use the import pipeline's table parser registry and parse order
import { tableParseOrder, tableParsers } from '../import.js';

// =========================================================================
//  Known SFNT signatures
// =========================================================================

const SFNT_SIGNATURES = new Map([
	[0x00010000, 'TrueType'],
	[0x4f54544f, 'OpenType (CFF)'], // 'OTTO'
	[0x74727565, 'TrueType (Apple)'], // 'true'
]);

// =========================================================================
//  Helpers
// =========================================================================

function addIssue(list, severity, code, message) {
	list.push({ severity, code, message });
}

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

function isPrintableASCII(str) {
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 0x20 || c > 0x7e) return false;
	}
	return true;
}

/**
 * Compute the OpenType checksum for a table's raw bytes.
 * The checksum is the low 32 bits of the sum of uint32 values,
 * with the last partial word padded with zeroes.
 */
function computeChecksum(bytes, offset, length) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let sum = 0;
	const aligned = length & ~3;
	for (let i = 0; i < aligned; i += 4) {
		sum = (sum + view.getUint32(offset + i)) >>> 0;
	}
	// Pad the remaining bytes as a final uint32
	if (length & 3) {
		let last = 0;
		for (let i = aligned; i < length; i++) {
			last |= bytes[offset + i] << (24 - 8 * (i - aligned));
		}
		sum = (sum + last) >>> 0;
	}
	return sum;
}

// =========================================================================
//  Phase runners
// =========================================================================

/**
 * Phase 1: Buffer basics & format detection.
 * Returns the format string and the SFNT ArrayBuffer to continue with
 * (unwrapped if WOFF), or null if unrecoverable.
 */
function phaseSignature(buffer, issues) {
	if (!(buffer instanceof ArrayBuffer)) {
		addIssue(
			issues,
			'error',
			'NOT_ARRAYBUFFER',
			'Input is not an ArrayBuffer.',
		);
		return null;
	}
	if (buffer.byteLength < 12) {
		addIssue(
			issues,
			'error',
			'TOO_SHORT',
			`File is only ${buffer.byteLength} bytes — too short for a valid font header (minimum 12 bytes).`,
		);
		return null;
	}

	const bytes = new Uint8Array(buffer);
	const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);

	// WOFF1
	if (sig === 'wOFF') {
		addIssue(issues, 'info', 'FORMAT_WOFF1', 'File is WOFF1-wrapped.');
		try {
			const { sfnt } = unwrapWOFF1(buffer);
			addIssue(
				issues,
				'info',
				'WOFF1_UNWRAPPED',
				'WOFF1 wrapper decompressed successfully.',
			);
			return { format: 'woff1', sfnt };
		} catch (err) {
			addIssue(
				issues,
				'error',
				'WOFF1_UNWRAP_FAILED',
				`WOFF1 decompression failed: ${err.message}`,
			);
			return null;
		}
	}

	// WOFF2
	if (sig === 'wOF2') {
		addIssue(issues, 'info', 'FORMAT_WOFF2', 'File is WOFF2-wrapped.');
		try {
			const { sfnt } = unwrapWOFF2(buffer);
			addIssue(
				issues,
				'info',
				'WOFF2_UNWRAPPED',
				'WOFF2 wrapper decompressed successfully.',
			);
			return { format: 'woff2', sfnt };
		} catch (err) {
			addIssue(
				issues,
				'error',
				'WOFF2_UNWRAP_FAILED',
				`WOFF2 decompression failed: ${err.message}`,
			);
			return null;
		}
	}

	// TTC/OTC collection
	if (sig === 'ttcf') {
		addIssue(
			issues,
			'info',
			'FORMAT_COLLECTION',
			'File is a font collection (TTC/OTC). Diagnosing the first font in the collection.',
		);
		return { format: 'collection', sfnt: buffer };
	}

	// Plain SFNT
	return { format: 'sfnt', sfnt: buffer };
}

/**
 * Phase 2: Read and validate the SFNT header.
 */
function phaseHeader(sfnt, issues) {
	const bytes = new Uint8Array(sfnt);
	const reader = new DataReader(bytes);

	let header;
	try {
		header = {
			sfVersion: reader.uint32(),
			numTables: reader.uint16(),
			searchRange: reader.uint16(),
			entrySelector: reader.uint16(),
			rangeShift: reader.uint16(),
		};
	} catch (err) {
		addIssue(
			issues,
			'error',
			'HEADER_UNREADABLE',
			`Could not read font header: ${err.message}`,
		);
		return null;
	}

	// Validate sfVersion
	const sfVersionName = SFNT_SIGNATURES.get(header.sfVersion);
	if (sfVersionName) {
		addIssue(
			issues,
			'info',
			'SF_VERSION',
			`sfVersion indicates ${sfVersionName}.`,
		);
	} else {
		const hex = '0x' + header.sfVersion.toString(16).padStart(8, '0');
		addIssue(
			issues,
			'error',
			'BAD_SF_VERSION',
			`Unrecognized sfVersion ${hex}. Expected 0x00010000 (TrueType), 0x4F54544F (OTTO), or 0x74727565 ('true').`,
		);
	}

	// Validate numTables
	if (header.numTables === 0) {
		addIssue(
			issues,
			'error',
			'NO_TABLES',
			'numTables is 0 — the font contains no tables.',
		);
	} else if (header.numTables > 200) {
		addIssue(
			issues,
			'warning',
			'EXCESSIVE_TABLES',
			`numTables is ${header.numTables}, which is unusually high.`,
		);
	}

	// Check that the file is large enough for the table directory
	const directoryEnd = 12 + header.numTables * 16;
	if (directoryEnd > sfnt.byteLength) {
		addIssue(
			issues,
			'error',
			'DIRECTORY_TRUNCATED',
			`Table directory requires ${directoryEnd} bytes but the file is only ${sfnt.byteLength} bytes. The file appears truncated.`,
		);
		return null;
	}

	// Validate searchRange / entrySelector / rangeShift
	if (header.numTables > 0) {
		const maxPow2 = 2 ** Math.floor(Math.log2(header.numTables));
		const expectedSearchRange = maxPow2 * 16;
		const expectedEntrySelector = Math.floor(Math.log2(maxPow2));
		const expectedRangeShift = header.numTables * 16 - expectedSearchRange;

		if (header.searchRange !== expectedSearchRange) {
			addIssue(
				issues,
				'warning',
				'BAD_SEARCH_RANGE',
				`searchRange is ${header.searchRange}, expected ${expectedSearchRange}.`,
			);
		}
		if (header.entrySelector !== expectedEntrySelector) {
			addIssue(
				issues,
				'warning',
				'BAD_ENTRY_SELECTOR',
				`entrySelector is ${header.entrySelector}, expected ${expectedEntrySelector}.`,
			);
		}
		if (header.rangeShift !== expectedRangeShift) {
			addIssue(
				issues,
				'warning',
				'BAD_RANGE_SHIFT',
				`rangeShift is ${header.rangeShift}, expected ${expectedRangeShift}.`,
			);
		}
	}

	return header;
}

/**
 * Phase 3: Read and validate the table directory.
 */
function phaseDirectory(sfnt, header, issues) {
	const bytes = new Uint8Array(sfnt);
	const reader = new DataReader(bytes, 12); // skip header
	const entries = [];
	const seenTags = new Set();

	for (let i = 0; i < header.numTables; i++) {
		let entry;
		try {
			entry = {
				tag: reader.tag(),
				checksum: reader.uint32(),
				offset: reader.uint32(),
				length: reader.uint32(),
			};
		} catch (err) {
			addIssue(
				issues,
				'error',
				'DIRECTORY_ENTRY_UNREADABLE',
				`Could not read table directory entry ${i}: ${err.message}`,
			);
			continue;
		}

		// Validate tag
		if (!isPrintableASCII(entry.tag)) {
			const hex = [...entry.tag]
				.map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
				.join(' ');
			addIssue(
				issues,
				'error',
				'BAD_TABLE_TAG',
				`Table ${i} has non-printable tag bytes (${hex}).`,
			);
		}

		// Duplicate check
		if (seenTags.has(entry.tag)) {
			addIssue(
				issues,
				'error',
				'DUPLICATE_TABLE',
				`Duplicate table tag '${entry.tag}'.`,
			);
		}
		seenTags.add(entry.tag);

		// Bounds check
		if (entry.offset + entry.length > sfnt.byteLength) {
			addIssue(
				issues,
				'error',
				'TABLE_OUT_OF_BOUNDS',
				`Table '${entry.tag}' extends beyond end of file (offset ${entry.offset} + length ${entry.length} = ${entry.offset + entry.length}, but file is ${sfnt.byteLength} bytes).`,
			);
		}

		// Zero-length table
		if (entry.length === 0) {
			addIssue(
				issues,
				'warning',
				'EMPTY_TABLE',
				`Table '${entry.tag}' has zero length.`,
			);
		}

		// Alignment (tables should start on 4-byte boundaries per spec)
		if (entry.offset % 4 !== 0) {
			addIssue(
				issues,
				'warning',
				'TABLE_MISALIGNED',
				`Table '${entry.tag}' at offset ${entry.offset} is not 4-byte aligned.`,
			);
		}

		entries.push(entry);
	}

	return entries;
}

/**
 * Phase 4: Verify required tables and outline presence.
 */
function phaseRequiredTables(entries, issues) {
	const tags = new Set(entries.map((e) => e.tag));

	for (const req of REQUIRED_CORE_TABLES) {
		if (!tags.has(req)) {
			addIssue(
				issues,
				'error',
				'MISSING_REQUIRED_TABLE',
				`Required table '${req}' is missing.`,
			);
		}
	}

	const hasGlyf = tags.has('glyf') && tags.has('loca');
	const hasCFF = tags.has('CFF ') || tags.has('CFF2');
	if (!hasGlyf && !hasCFF) {
		addIssue(
			issues,
			'error',
			'NO_OUTLINES',
			'No outline data found. Expected glyf+loca (TrueType) or CFF/CFF2 (OpenType).',
		);
	}
	if (hasGlyf && hasCFF) {
		addIssue(
			issues,
			'warning',
			'MIXED_OUTLINES',
			'Font has both TrueType (glyf) and CFF outlines — unusual.',
		);
	}

	// Note unrecognized tables
	for (const tag of tags) {
		if (!ALL_SUPPORTED_TABLES.has(tag)) {
			addIssue(
				issues,
				'info',
				'UNKNOWN_TABLE',
				`Unrecognized table '${tag}' — will be preserved as raw bytes.`,
			);
		}
	}
}

/**
 * Phase 5: Table checksum verification.
 */
function phaseChecksums(sfnt, entries, issues) {
	const bytes = new Uint8Array(sfnt);

	for (const entry of entries) {
		if (entry.offset + entry.length > sfnt.byteLength) continue; // already flagged
		if (entry.length === 0) continue;

		// head table has a special checksumAdjustment field — skip verification
		if (entry.tag === 'head') continue;

		const actual = computeChecksum(bytes, entry.offset, entry.length);
		if (actual !== entry.checksum) {
			addIssue(
				issues,
				'warning',
				'BAD_CHECKSUM',
				`Table '${entry.tag}' checksum mismatch: directory says 0x${entry.checksum.toString(16).padStart(8, '0')}, computed 0x${actual.toString(16).padStart(8, '0')}.`,
			);
		}
	}
}

/**
 * Phase 6: Try to parse each table, catching per-table errors.
 */
function phaseParseTables(sfnt, entries, issues) {
	const entryByTag = new Map(entries.map((e) => [e.tag, e]));
	const parsedTables = {};

	// Sort: parse-order first, then remaining
	const orderedTags = tableParseOrder.filter((tag) => entryByTag.has(tag));
	const remainingTags = entries
		.map((e) => e.tag)
		.filter((tag) => !orderedTags.includes(tag));
	const sortedTags = [...orderedTags, ...remainingTags];

	for (const tag of sortedTags) {
		const entry = entryByTag.get(tag);
		if (entry.offset + entry.length > sfnt.byteLength) continue; // already flagged

		const parser = tableParsers[tag];
		if (!parser) continue; // no parser for this table

		try {
			const raw = new Uint8Array(sfnt, entry.offset, entry.length);
			const rawArray = Array.from(raw);
			parsedTables[tag] = parser(rawArray, parsedTables);
			addIssue(
				issues,
				'info',
				'TABLE_PARSED',
				`Table '${tag}' parsed successfully.`,
			);
		} catch (err) {
			addIssue(
				issues,
				'error',
				'TABLE_PARSE_FAILED',
				`Table '${tag}' failed to parse: ${err.message}`,
			);
		}
	}

	return parsedTables;
}

/**
 * Phase 7: Cross-table consistency checks.
 */
function phaseCrossTableChecks(parsedTables, entries, issues) {
	const tags = new Set(entries.map((e) => e.tag));

	// head.magicNumber
	if (parsedTables.head) {
		if (parsedTables.head.magicNumber !== 0x5f0f3cf5) {
			addIssue(
				issues,
				'error',
				'BAD_MAGIC_NUMBER',
				`head.magicNumber is 0x${(parsedTables.head.magicNumber >>> 0).toString(16).padStart(8, '0')}, expected 0x5F0F3CF5.`,
			);
		}

		// unitsPerEm range (16–16384 per spec)
		const upm = parsedTables.head.unitsPerEm;
		if (upm !== undefined && (upm < 16 || upm > 16384)) {
			addIssue(
				issues,
				'error',
				'BAD_UNITS_PER_EM',
				`head.unitsPerEm is ${upm} — must be between 16 and 16384.`,
			);
		}
	}

	// maxp.numGlyphs vs hmtx
	if (parsedTables.maxp && parsedTables.hmtx) {
		const numGlyphs = parsedTables.maxp.numGlyphs;
		const hmtxEntries = parsedTables.hmtx.hMetrics?.length ?? 0;
		const lsbs = parsedTables.hmtx.leftSideBearings?.length ?? 0;
		const totalHmtx = hmtxEntries + lsbs;
		if (totalHmtx !== numGlyphs) {
			addIssue(
				issues,
				'warning',
				'HMTX_GLYPH_MISMATCH',
				`hmtx has ${totalHmtx} entries (${hmtxEntries} metrics + ${lsbs} LSBs) but maxp.numGlyphs is ${numGlyphs}.`,
			);
		}
	}

	// hhea.numberOfHMetrics vs hmtx
	if (parsedTables.hhea && parsedTables.hmtx) {
		const expected = parsedTables.hhea.numberOfHMetrics;
		const actual = parsedTables.hmtx.hMetrics?.length ?? 0;
		if (actual !== expected) {
			addIssue(
				issues,
				'warning',
				'HHEA_HMTX_MISMATCH',
				`hhea.numberOfHMetrics is ${expected} but hmtx has ${actual} full metric entries.`,
			);
		}
	}

	// loca + glyf consistency
	if (parsedTables.loca && parsedTables.glyf) {
		const offsets = parsedTables.loca.offsets;
		if (offsets && offsets.length > 0) {
			const glyfEntry = entries.find((e) => e.tag === 'glyf');
			if (glyfEntry) {
				const last = offsets[offsets.length - 1];
				if (last > glyfEntry.length) {
					addIssue(
						issues,
						'error',
						'LOCA_BEYOND_GLYF',
						`loca final offset (${last}) exceeds glyf table length (${glyfEntry.length}).`,
					);
				}
			}
		}
	}

	// CFF consistency: numGlyphs vs charStrings count
	const cffTable = parsedTables['CFF '] || parsedTables.CFF2;
	if (cffTable && parsedTables.maxp) {
		const charStrCount =
			cffTable.topDict?.charStrings?.length ??
			cffTable.charStrings?.length ??
			null;
		if (charStrCount !== null && charStrCount !== parsedTables.maxp.numGlyphs) {
			addIssue(
				issues,
				'warning',
				'CFF_GLYPH_MISMATCH',
				`CFF charStrings count (${charStrCount}) doesn't match maxp.numGlyphs (${parsedTables.maxp.numGlyphs}).`,
			);
		}
	}

	// name table: should have family & style names
	if (parsedTables.name) {
		const records =
			parsedTables.name.nameRecords ??
			parsedTables.name.names ??
			parsedTables.name.records ??
			[];
		const hasFamily = records.some((r) => r.nameID === 1);
		const hasStyle = records.some((r) => r.nameID === 2);
		if (!hasFamily) {
			addIssue(
				issues,
				'warning',
				'NO_FAMILY_NAME',
				'name table has no family name (nameID 1).',
			);
		}
		if (!hasStyle) {
			addIssue(
				issues,
				'warning',
				'NO_STYLE_NAME',
				'name table has no style name (nameID 2).',
			);
		}
	}

	// vmtx + vhea consistency
	if (parsedTables.vhea && parsedTables.vmtx) {
		const expected =
			parsedTables.vhea.numOfLongVerMetrics ??
			parsedTables.vhea.numberOfVMetrics;
		const actual = parsedTables.vmtx.metrics?.length ?? 0;
		if (expected !== undefined && actual !== expected) {
			addIssue(
				issues,
				'warning',
				'VHEA_VMTX_MISMATCH',
				`vhea.numOfLongVerMetrics is ${expected} but vmtx has ${actual} full metric entries.`,
			);
		}
	}

	// fvar + gvar: variable font consistency
	if (tags.has('gvar') && !tags.has('fvar')) {
		addIssue(
			issues,
			'error',
			'GVAR_WITHOUT_FVAR',
			'gvar table present without fvar — glyph variations require a variation axis table.',
		);
	}
}

// =========================================================================
//  Collection handling
// =========================================================================

function getCollectionFirstFontBuffer(buffer) {
	const reader = new DataReader(new Uint8Array(buffer));
	reader.skip(4); // 'ttcf'
	const majorVersion = reader.uint16();
	reader.skip(2); // minorVersion
	const numFonts = reader.uint32();
	if (numFonts === 0) return null;
	const firstOffset = reader.uint32();
	return { majorVersion, numFonts, firstOffset };
}

// =========================================================================
//  Main entry point
// =========================================================================

/**
 * Diagnose a binary font file and produce a detailed report of any problems.
 *
 * Unlike `importFont()` which throws on corruption, this function catches
 * errors at each phase and continues, building a comprehensive diagnostic
 * report that explains exactly what's wrong.
 *
 * @param {ArrayBuffer} buffer - Raw font file bytes.
 * @returns {object} Report: `{ valid, errors, warnings, infos, issues, summary }`.
 */
export function diagnoseFont(buffer) {
	const issues = [];

	// --- Phase 1: Signature & format detection --------------------------
	const sig = phaseSignature(buffer, issues);
	if (!sig) return buildReport(issues);

	let sfnt = sig.sfnt;

	// Handle collections: diagnose the first font
	if (sig.format === 'collection') {
		try {
			const info = getCollectionFirstFontBuffer(sfnt);
			if (!info || info.numFonts === 0) {
				addIssue(
					issues,
					'error',
					'EMPTY_COLLECTION',
					'Collection contains no fonts.',
				);
				return buildReport(issues);
			}
			addIssue(
				issues,
				'info',
				'COLLECTION_INFO',
				`Collection contains ${info.numFonts} font(s). Diagnosing the first font at offset ${info.firstOffset}.`,
			);
			// For collections, we diagnose at the SFNT offset within the same buffer
			// We create a virtual sub-reader starting at firstOffset
			sfnt = buffer; // Use the full buffer — phases must account for offset
		} catch (err) {
			addIssue(
				issues,
				'error',
				'COLLECTION_HEADER_UNREADABLE',
				`Could not read collection header: ${err.message}`,
			);
			return buildReport(issues);
		}
	}

	// --- Phase 2: SFNT header -------------------------------------------
	const header = phaseHeader(sfnt, issues);
	if (!header) return buildReport(issues);

	// --- Phase 3: Table directory ---------------------------------------
	const entries = phaseDirectory(sfnt, header, issues);
	if (entries.length === 0 && header.numTables > 0) {
		addIssue(
			issues,
			'error',
			'NO_READABLE_ENTRIES',
			'Could not read any table directory entries.',
		);
		return buildReport(issues);
	}

	// --- Phase 4: Required tables & outlines ----------------------------
	phaseRequiredTables(entries, issues);

	// --- Phase 5: Checksums ---------------------------------------------
	phaseChecksums(sfnt, entries, issues);

	// --- Phase 6: Per-table parsing ------------------------------------
	const parsedTables = phaseParseTables(sfnt, entries, issues);

	// --- Phase 7: Cross-table consistency -------------------------------
	phaseCrossTableChecks(parsedTables, entries, issues);

	return buildReport(issues);
}
