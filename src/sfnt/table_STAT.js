/**
 * Font Flux JS : STAT table
 * Style Attributes Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/stat
 *
 * Supports STAT v1.0/v1.1/v1.2 header and axis value formats 1/2/3/4.
 * Unknown axis value formats are preserved as raw bytes for round-trip safety.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const STAT_HEADER_SIZE_V10 = 18;
const STAT_HEADER_SIZE_V11_PLUS = 20;
const AXIS_RECORD_BASE_SIZE = 8;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a STAT table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseSTAT(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const designAxisSize = reader.uint16();
	const designAxisCount = reader.uint16();
	const designAxesOffset = reader.offset32();
	const axisValueCount = reader.uint16();
	const offsetToAxisValueOffsets = reader.offset32();

	let elidedFallbackNameID;
	if (minorVersion >= 1 && rawBytes.length >= STAT_HEADER_SIZE_V11_PLUS) {
		elidedFallbackNameID = reader.uint16();
	}

	const designAxes = [];
	if (designAxisCount > 0 && designAxesOffset > 0) {
		for (let i = 0; i < designAxisCount; i++) {
			reader.seek(designAxesOffset + i * designAxisSize);
			const axis = {
				axisTag: reader.tag(),
				axisNameID: reader.uint16(),
				axisOrdering: reader.uint16(),
			};

			if (designAxisSize > AXIS_RECORD_BASE_SIZE) {
				axis._extra = reader.bytes(designAxisSize - AXIS_RECORD_BASE_SIZE);
			}

			designAxes.push(axis);
		}
	}

	const axisValueOffsets = [];
	if (axisValueCount > 0 && offsetToAxisValueOffsets > 0) {
		reader.seek(offsetToAxisValueOffsets);
		for (let i = 0; i < axisValueCount; i++) {
			axisValueOffsets.push(reader.offset16());
		}
	}

	const axisValues = [];
	for (let i = 0; i < axisValueOffsets.length; i++) {
		const relativeOffset = axisValueOffsets[i];
		const start = offsetToAxisValueOffsets + relativeOffset;
		const end =
			i < axisValueOffsets.length - 1
				? offsetToAxisValueOffsets + axisValueOffsets[i + 1]
				: rawBytes.length;

		if (start >= rawBytes.length || end < start) {
			axisValues.push({ format: 0, _raw: [] });
			continue;
		}

		axisValues.push(parseAxisValueTable(rawBytes, start, end));
	}

	const stat = {
		majorVersion,
		minorVersion,
		designAxisSize,
		designAxes,
		axisValues,
	};

	if (elidedFallbackNameID !== undefined) {
		stat.elidedFallbackNameID = elidedFallbackNameID;
	}

	return stat;
}

function parseAxisValueTable(rawBytes, start, end) {
	const reader = new DataReader(rawBytes);
	reader.seek(start);
	const format = reader.uint16();

	switch (format) {
		case 1:
			return {
				format,
				axisIndex: reader.uint16(),
				flags: reader.uint16(),
				valueNameID: reader.uint16(),
				value: reader.fixed(),
			};

		case 2:
			return {
				format,
				axisIndex: reader.uint16(),
				flags: reader.uint16(),
				valueNameID: reader.uint16(),
				nominalValue: reader.fixed(),
				rangeMinValue: reader.fixed(),
				rangeMaxValue: reader.fixed(),
			};

		case 3:
			return {
				format,
				axisIndex: reader.uint16(),
				flags: reader.uint16(),
				valueNameID: reader.uint16(),
				value: reader.fixed(),
				linkedValue: reader.fixed(),
			};

		case 4: {
			const axisCount = reader.uint16();
			const flags = reader.uint16();
			const valueNameID = reader.uint16();
			const axisValues = [];
			for (let i = 0; i < axisCount; i++) {
				axisValues.push({
					axisIndex: reader.uint16(),
					value: reader.fixed(),
				});
			}

			return {
				format,
				axisCount,
				flags,
				valueNameID,
				axisValues,
			};
		}

		default:
			return {
				format,
				_raw: Array.from(rawBytes.slice(start, end)),
			};
	}
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a STAT JSON object back to raw bytes.
 *
 * @param {object} stat - Parsed STAT table data
 * @returns {number[]} Array of byte values
 */
export function writeSTAT(stat) {
	const majorVersion = stat.majorVersion ?? 1;
	let minorVersion = stat.minorVersion ?? 2;
	const designAxes = stat.designAxes ?? [];
	const axisValues = stat.axisValues ?? [];

	const declaredDesignAxisSize = stat.designAxisSize ?? AXIS_RECORD_BASE_SIZE;
	const requiredDesignAxisSize = designAxes.reduce((max, axis) => {
		const extra = axis._extra?.length ?? 0;
		return Math.max(max, AXIS_RECORD_BASE_SIZE + extra);
	}, AXIS_RECORD_BASE_SIZE);
	const designAxisSize = Math.max(
		declaredDesignAxisSize,
		requiredDesignAxisSize,
	);

	const requiresElidedField =
		minorVersion >= 1 || stat.elidedFallbackNameID !== undefined;
	if (requiresElidedField && minorVersion === 0) {
		minorVersion = 1;
	}
	const headerSize = requiresElidedField
		? STAT_HEADER_SIZE_V11_PLUS
		: STAT_HEADER_SIZE_V10;

	const designAxisCount = designAxes.length;
	const axisValueCount = axisValues.length;
	const designAxesOffset = designAxisCount > 0 ? headerSize : 0;
	const designAxesSize = designAxisCount * designAxisSize;
	const axisValueOffsetsArrayOffset =
		axisValueCount > 0 ? headerSize + designAxesSize : 0;
	const axisValueOffsetsArraySize = axisValueCount * 2;

	const axisValueBlobs = axisValues.map((axisValue) =>
		buildAxisValueBlob(axisValue),
	);
	let runningAxisValueOffset = axisValueOffsetsArraySize;
	const axisValueOffsets = axisValueBlobs.map((blob) => {
		const offset = runningAxisValueOffset;
		runningAxisValueOffset += blob.length;
		return offset;
	});

	const axisValueTablesSize = axisValueBlobs.reduce(
		(sum, blob) => sum + blob.length,
		0,
	);
	const totalSize =
		headerSize +
		designAxesSize +
		axisValueOffsetsArraySize +
		axisValueTablesSize;

	const w = new DataWriter(totalSize);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(designAxisSize);
	w.uint16(designAxisCount);
	w.offset32(designAxesOffset);
	w.uint16(axisValueCount);
	w.offset32(axisValueOffsetsArrayOffset);
	if (requiresElidedField) {
		w.uint16(stat.elidedFallbackNameID ?? 2);
	}

	for (const axis of designAxes) {
		w.tag(axis.axisTag);
		w.uint16(axis.axisNameID ?? 0);
		w.uint16(axis.axisOrdering ?? 0);

		const extra = axis._extra ?? [];
		w.rawBytes(extra);
		const padding = designAxisSize - AXIS_RECORD_BASE_SIZE - extra.length;
		if (padding > 0) {
			w.rawBytes(new Array(padding).fill(0));
		}
	}

	for (const offset of axisValueOffsets) {
		w.offset16(offset);
	}
	for (const blob of axisValueBlobs) {
		w.rawBytes(blob);
	}

	return w.toArray();
}

function buildAxisValueBlob(axisValue) {
	if (axisValue._raw) {
		return axisValue._raw;
	}

	switch (axisValue.format) {
		case 1: {
			const w = new DataWriter(12);
			w.uint16(1);
			w.uint16(axisValue.axisIndex ?? 0);
			w.uint16(axisValue.flags ?? 0);
			w.uint16(axisValue.valueNameID ?? 0);
			w.fixed(axisValue.value ?? 0);
			return w.toArray();
		}

		case 2: {
			const w = new DataWriter(20);
			w.uint16(2);
			w.uint16(axisValue.axisIndex ?? 0);
			w.uint16(axisValue.flags ?? 0);
			w.uint16(axisValue.valueNameID ?? 0);
			w.fixed(axisValue.nominalValue ?? 0);
			w.fixed(axisValue.rangeMinValue ?? 0);
			w.fixed(axisValue.rangeMaxValue ?? 0);
			return w.toArray();
		}

		case 3: {
			const w = new DataWriter(16);
			w.uint16(3);
			w.uint16(axisValue.axisIndex ?? 0);
			w.uint16(axisValue.flags ?? 0);
			w.uint16(axisValue.valueNameID ?? 0);
			w.fixed(axisValue.value ?? 0);
			w.fixed(axisValue.linkedValue ?? 0);
			return w.toArray();
		}

		case 4: {
			const axisValues = axisValue.axisValues ?? [];
			const axisCount = axisValue.axisCount ?? axisValues.length;
			const w = new DataWriter(8 + axisCount * 6);
			w.uint16(4);
			w.uint16(axisCount);
			w.uint16(axisValue.flags ?? 0);
			w.uint16(axisValue.valueNameID ?? 0);
			for (let i = 0; i < axisCount; i++) {
				const record = axisValues[i] ?? { axisIndex: 0, value: 0 };
				w.uint16(record.axisIndex ?? 0);
				w.fixed(record.value ?? 0);
			}
			return w.toArray();
		}

		default:
			throw new Error(
				`Unsupported STAT axis value format: ${axisValue.format}`,
			);
	}
}
