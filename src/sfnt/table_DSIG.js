/**
 * Font-to-JSON : DSIG table
 * Digital Signature Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const DSIG_HEADER_SIZE = 8;
const DSIG_RECORD_SIZE = 12;

export function parseDSIG(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const numSignatures = reader.uint16();
	const flags = reader.uint16();

	const records = [];
	for (let i = 0; i < numSignatures; i++) {
		records.push({
			format: reader.uint32(),
			length: reader.uint32(),
			offset: reader.offset32(),
		});
	}

	const signatures = records.map((record) => {
		const start = record.offset;
		const end = Math.min(rawBytes.length, start + record.length);
		if (start <= 0 || start >= rawBytes.length || end < start) {
			return { ...record, _raw: [] };
		}
		return {
			...record,
			_raw: Array.from(rawBytes.slice(start, end)),
		};
	});

	return {
		version,
		flags,
		signatures,
	};
}

export function writeDSIG(dsig) {
	const version = dsig.version ?? 1;
	const flags = dsig.flags ?? 0;
	const signatures = dsig.signatures ?? [];

	const blocks = signatures.map((sig) => {
		const bytes = extractRaw(sig);
		return {
			format: sig.format ?? 1,
			bytes,
		};
	});

	let currentOffset = DSIG_HEADER_SIZE + blocks.length * DSIG_RECORD_SIZE;
	const records = blocks.map((block) => {
		const record = {
			format: block.format,
			length: block.bytes.length,
			offset: block.bytes.length ? currentOffset : 0,
		};
		currentOffset += block.bytes.length;
		return record;
	});

	const w = new DataWriter(currentOffset);
	w.uint32(version);
	w.uint16(blocks.length);
	w.uint16(flags);

	for (const record of records) {
		w.uint32(record.format);
		w.uint32(record.length);
		w.offset32(record.offset);
	}

	for (const block of blocks) {
		w.rawBytes(block.bytes);
	}

	return w.toArray();
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
