/**
 * Font Flux JS : ltag table
 * Apple Language Tag Table — maps numeric codes to IETF BCP 47 language tags.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseLtag(rawBytes) {
	const r = new DataReader(rawBytes);
	const version = r.uint32();
	const flags = r.uint32();
	const numTags = r.uint32();

	const tags = [];
	const ranges = [];
	for (let i = 0; i < numTags; i++) {
		ranges.push({ offset: r.uint16(), length: r.uint16() });
	}
	for (const range of ranges) {
		const bytes = rawBytes.slice(range.offset, range.offset + range.length);
		tags.push(new TextDecoder('utf-8').decode(new Uint8Array(bytes)));
	}

	return { version, flags, tags };
}

export function writeLtag(ltag) {
	const { version, flags, tags } = ltag;
	const encoder = new TextEncoder();

	// Encode tag strings
	const encoded = tags.map((t) => encoder.encode(t));

	// Header is 12 bytes + 4 bytes per tag range
	const headerSize = 12 + tags.length * 4;
	const totalSize = headerSize + encoded.reduce((s, e) => s + e.length, 0);

	const w = new DataWriter(totalSize);
	w.uint32(version);
	w.uint32(flags);
	w.uint32(tags.length);

	// Write tag ranges — offsets are from start of table
	let offset = headerSize;
	for (const enc of encoded) {
		w.uint16(offset);
		w.uint16(enc.length);
		offset += enc.length;
	}

	// Write tag strings
	for (const enc of encoded) {
		w.rawBytes(enc);
	}

	return w.toArray();
}
