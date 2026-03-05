/**
 * Font-to-JSON : MATH table
 * Mathematical Typesetting Table
 *
 * Container-level parse/write preserving referenced subtables as raw bytes.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const MATH_HEADER_SIZE = 10;

export function parseMATH(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const mathConstantsOffset = reader.offset16();
	const mathGlyphInfoOffset = reader.offset16();
	const mathVariantsOffset = reader.offset16();

	const offsets = [
		mathConstantsOffset,
		mathGlyphInfoOffset,
		mathVariantsOffset,
	].filter((o) => o > 0);

	return {
		version,
		mathConstants: extractSubtable(rawBytes, mathConstantsOffset, offsets),
		mathGlyphInfo: extractSubtable(rawBytes, mathGlyphInfoOffset, offsets),
		mathVariants: extractSubtable(rawBytes, mathVariantsOffset, offsets),
	};
}

export function writeMATH(math) {
	const version = math.version ?? 0x00010000;
	const mathConstantsBytes = extractRaw(math.mathConstants);
	const mathGlyphInfoBytes = extractRaw(math.mathGlyphInfo);
	const mathVariantsBytes = extractRaw(math.mathVariants);

	let currentOffset = MATH_HEADER_SIZE;
	const mathConstantsOffset = mathConstantsBytes.length ? currentOffset : 0;
	currentOffset += mathConstantsBytes.length;

	const mathGlyphInfoOffset = mathGlyphInfoBytes.length ? currentOffset : 0;
	currentOffset += mathGlyphInfoBytes.length;

	const mathVariantsOffset = mathVariantsBytes.length ? currentOffset : 0;
	currentOffset += mathVariantsBytes.length;

	const w = new DataWriter(currentOffset);
	w.uint32(version);
	w.offset16(mathConstantsOffset);
	w.offset16(mathGlyphInfoOffset);
	w.offset16(mathVariantsOffset);
	w.rawBytes(mathConstantsBytes);
	w.rawBytes(mathGlyphInfoBytes);
	w.rawBytes(mathVariantsBytes);

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
