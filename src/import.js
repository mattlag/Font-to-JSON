/**
 * Font-to-JSON : Import
 * Reads binary font data and converts it to a JSON representation.
 */

import { parseCmap } from './otf/table_cmap.js';
import { parseHead } from './otf/table_head.js';
import { parseHhea } from './otf/table_hhea.js';
import { parseHmtx } from './otf/table_hmtx.js';
import { parseMaxp } from './otf/table_maxp.js';
import { parseName } from './otf/table_name.js';
import { DataReader } from './reader.js';

/**
 * Registry of table parsers.
 * Each key is a table tag; the value is a function (number[], tables?) → object.
 * Tables not listed here are stored as raw bytes.
 * Parsers may accept a second argument: the tables object (for cross-table deps).
 */
const tableParsers = {
	cmap: parseCmap,
	head: parseHead,
	hhea: parseHhea,
	hmtx: parseHmtx,
	maxp: parseMaxp,
	name: parseName,
};

/**
 * Parse order — tables are parsed in this order so that cross-table
 * dependencies are satisfied (e.g. hmtx needs hhea.numberOfHMetrics).
 * Tables not in this list are parsed after those that are.
 */
const tableParseOrder = [
	'head',
	'maxp',
	'hhea',
	'cmap',
	'hmtx',
	'name',
	'OS/2',
	'post',
];

/**
 * Import a font from binary data (ArrayBuffer) and return a JSON-friendly object.
 * @param {ArrayBuffer} buffer - Raw font file bytes.
 * @returns {object} Parsed font data.
 */
export function importFont(buffer) {
	if (!(buffer instanceof ArrayBuffer)) {
		throw new TypeError('importFont expects an ArrayBuffer');
	}

	const reader = new DataReader(new Uint8Array(buffer));
	const header = readFontHeader(reader);
	const tableDirectory = readTableDirectory(reader, header.numTables);
	const tables = extractTableData(buffer, tableDirectory);

	return {
		header,
		tables,
	};
}

/**
 * Read the top-level font file header (Offset Table).
 * Shared by OTF and TTF — both use the same header structure.
 *
 * Layout (12 bytes):
 *   uint32  sfVersion      — 0x00010000 (TrueType) or 0x4F54544F ('OTTO')
 *   uint16  numTables
 *   uint16  searchRange
 *   uint16  entrySelector
 *   uint16  rangeShift
 *
 * @param {DataReader} reader
 * @returns {object}
 */
function readFontHeader(reader) {
	return {
		sfVersion: reader.uint32(),
		numTables: reader.uint16(),
		searchRange: reader.uint16(),
		entrySelector: reader.uint16(),
		rangeShift: reader.uint16(),
	};
}

/**
 * Read the Table Directory — an array of Table Records that immediately
 * follows the font header.
 *
 * Each Table Record (16 bytes):
 *   Tag      tableTag   — 4-byte ASCII identifier
 *   uint32   checksum
 *   Offset32 offset     — from beginning of the font file
 *   uint32   length
 *
 * @param {DataReader} reader
 * @param {number}   numTables
 * @returns {Array<{tag: string, checksum: number, offset: number, length: number}>}
 */
function readTableDirectory(reader, numTables) {
	const entries = [];

	for (let i = 0; i < numTables; i++) {
		entries.push({
			tag: reader.tag(),
			checksum: reader.uint32(),
			offset: reader.offset32(),
			length: reader.uint32(),
		});
	}

	return entries;
}

/**
 * Extract raw table data for every entry in the table directory.
 *
 * Tables are processed in a dependency-safe order defined by tableParseOrder.
 * Each table is stored as an object keyed by its tag name.  The value contains:
 *   - _raw:      Array of byte values (for unparsed tables)
 *   - _checksum: The checksum recorded in the table directory
 *
 * Parsed tables receive structured, human-readable JSON data instead of _raw.
 * Parsers may receive the already-parsed tables object as a second argument
 * so they can reference values from other tables (cross-table dependencies).
 *
 * @param {ArrayBuffer} buffer
 * @param {Array}       tableDirectory
 * @returns {object}
 */
function extractTableData(buffer, tableDirectory) {
	const tables = {};

	// Build a lookup from tag → directory entry
	const entryByTag = new Map(tableDirectory.map((e) => [e.tag, e]));

	// Sort tags: ordered tags first (in parse order), then remaining tags
	const orderedTags = tableParseOrder.filter((tag) => entryByTag.has(tag));
	const remainingTags = tableDirectory
		.map((e) => e.tag)
		.filter((tag) => !orderedTags.includes(tag));
	const sortedTags = [...orderedTags, ...remainingTags];

	for (const tag of sortedTags) {
		const entry = entryByTag.get(tag);
		const raw = new Uint8Array(buffer, entry.offset, entry.length);
		const rawArray = Array.from(raw);
		const parser = tableParsers[tag];

		if (parser) {
			tables[tag] = {
				...parser(rawArray, tables),
				_checksum: entry.checksum,
			};
		} else {
			tables[tag] = {
				_raw: rawArray,
				_checksum: entry.checksum,
			};
		}
	}

	return tables;
}
