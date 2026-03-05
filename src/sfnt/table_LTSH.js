/**
 * Font-to-JSON : LTSH table
 * Linear Threshold Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseLTSH(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const numGlyphs = reader.uint16();
	const yPels = reader.bytes(numGlyphs);

	return {
		version,
		numGlyphs,
		yPels,
	};
}

export function writeLTSH(ltsh) {
	const version = ltsh.version ?? 0;
	const yPels = ltsh.yPels ?? [];
	const numGlyphs = ltsh.numGlyphs ?? yPels.length;
	const safeYPels = yPels.slice(0, numGlyphs);
	while (safeYPels.length < numGlyphs) {
		safeYPels.push(0);
	}

	const w = new DataWriter(4 + numGlyphs);
	w.uint16(version);
	w.uint16(numGlyphs);
	w.rawBytes(safeYPels);

	return w.toArray();
}
