/**
 * Font-to-JSON : JSTF table
 * Justification Table
 *
 * Container-level parse/write preserving per-script subtables as raw bytes.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const JSTF_HEADER_SIZE = 6;
const JSTF_RECORD_SIZE = 6;

export function parseJSTF(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const scriptCount = reader.uint16();

	const records = [];
	for (let i = 0; i < scriptCount; i++) {
		records.push({
			tag: reader.tag(),
			offset: reader.offset16(),
		});
	}

	const offsets = records.map((r) => r.offset).filter((o) => o > 0);
	const scripts = records.map((record) => ({
		...record,
		table: extractSubtable(rawBytes, record.offset, offsets),
	}));

	return {
		majorVersion,
		minorVersion,
		scripts,
	};
}

export function writeJSTF(jstf) {
	const majorVersion = jstf.majorVersion ?? 1;
	const minorVersion = jstf.minorVersion ?? 0;
	const scripts = jstf.scripts ?? [];

	const scriptBytes = scripts.map((script) => extractRaw(script.table));

	let currentOffset = JSTF_HEADER_SIZE + scripts.length * JSTF_RECORD_SIZE;
	const scriptOffsets = scriptBytes.map((bytes) => {
		if (!bytes.length) {
			return 0;
		}
		const offset = currentOffset;
		currentOffset += bytes.length;
		return offset;
	});

	const w = new DataWriter(currentOffset);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(scripts.length);

	for (let i = 0; i < scripts.length; i++) {
		const script = scripts[i];
		const tag = (script.tag ?? '    ').slice(0, 4).padEnd(4, ' ');
		w.tag(tag);
		w.offset16(scriptOffsets[i]);
	}

	for (const bytes of scriptBytes) {
		w.rawBytes(bytes);
	}

	return w.toArray();
}

function extractSubtable(rawBytes, offset, allOffsets) {
	if (!offset) {
		return null;
	}
	const next = allOffsets.filter((o) => o > offset).sort((a, b) => a - b)[0];
	const end = next ?? rawBytes.length;
	if (end <= offset || offset >= rawBytes.length) {
		return { _raw: [] };
	}
	return { _raw: Array.from(rawBytes.slice(offset, end)) };
}

function extractRaw(value) {
	if (!value) {
		return [];
	}
	if (Array.isArray(value)) {
		return value;
	}
	return value._raw ?? [];
}
