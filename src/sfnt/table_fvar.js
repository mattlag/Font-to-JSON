/**
 * Font Flux JS : fvar table
 * Font Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/fvar
 *
 * Defines variation axes and named instances for variable fonts.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const FVAR_HEADER_SIZE = 16;
const AXIS_RECORD_SIZE = 20;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an fvar table from raw bytes.
 *
 * Header:
 *   uint16   majorVersion
 *   uint16   minorVersion
 *   Offset16 axesArrayOffset
 *   uint16   reserved (set to 2)
 *   uint16   axisCount
 *   uint16   axisSize (must be 20 for current format)
 *   uint16   instanceCount
 *   uint16   instanceSize
 *
 * AxisRecord (axisSize = 20):
 *   Tag      axisTag
 *   Fixed    minValue
 *   Fixed    defaultValue
 *   Fixed    maxValue
 *   uint16   flags
 *   uint16   axisNameID
 *
 * InstanceRecord:
 *   uint16   subfamilyNameID
 *   uint16   flags
 *   Fixed    coordinates[axisCount]
 *   uint16   postScriptNameID (optional)
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseFvar(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const axesArrayOffset = reader.offset16();
	const reserved = reader.uint16();
	const axisCount = reader.uint16();
	const axisSize = reader.uint16();
	const instanceCount = reader.uint16();
	const instanceSize = reader.uint16();

	const axes = [];
	for (let i = 0; i < axisCount; i++) {
		reader.seek(axesArrayOffset + i * axisSize);
		axes.push({
			axisTag: reader.tag(),
			minValue: reader.fixed(),
			defaultValue: reader.fixed(),
			maxValue: reader.fixed(),
			flags: reader.uint16(),
			axisNameID: reader.uint16(),
		});
	}

	const instances = [];
	const instancesStart = axesArrayOffset + axisCount * axisSize;
	const baseInstanceSize = 4 + axisCount * 4;
	const hasPostScriptNameID = instanceSize >= baseInstanceSize + 2;

	for (let i = 0; i < instanceCount; i++) {
		reader.seek(instancesStart + i * instanceSize);

		const instance = {
			subfamilyNameID: reader.uint16(),
			flags: reader.uint16(),
			coordinates: [],
		};

		for (let a = 0; a < axisCount; a++) {
			instance.coordinates.push(reader.fixed());
		}

		if (hasPostScriptNameID) {
			instance.postScriptNameID = reader.uint16();
		}

		instances.push(instance);
	}

	return {
		majorVersion,
		minorVersion,
		reserved,
		axisSize,
		instanceSize,
		axes,
		instances,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an fvar JSON object back to raw bytes.
 *
 * @param {object} fvar - Parsed fvar table data
 * @returns {number[]} Array of byte values
 */
export function writeFvar(fvar) {
	const majorVersion = fvar.majorVersion ?? 1;
	const minorVersion = fvar.minorVersion ?? 0;
	const reserved = fvar.reserved ?? 2;
	const axes = fvar.axes ?? [];
	const instances = fvar.instances ?? [];
	const axisCount = axes.length;
	const axisSize = AXIS_RECORD_SIZE;

	const baseInstanceSize = 4 + axisCount * 4;
	const hasPostScriptNameID = instances.some(
		(instance) => instance.postScriptNameID !== undefined,
	);
	const instanceSize = hasPostScriptNameID
		? baseInstanceSize + 2
		: baseInstanceSize;
	const instanceCount = instances.length;
	const axesArrayOffset = FVAR_HEADER_SIZE;
	const totalSize =
		FVAR_HEADER_SIZE + axisCount * axisSize + instanceCount * instanceSize;

	const w = new DataWriter(totalSize);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.offset16(axesArrayOffset);
	w.uint16(reserved);
	w.uint16(axisCount);
	w.uint16(axisSize);
	w.uint16(instanceCount);
	w.uint16(instanceSize);

	for (const axis of axes) {
		w.tag(axis.axisTag);
		w.fixed(axis.minValue);
		w.fixed(axis.defaultValue);
		w.fixed(axis.maxValue);
		w.uint16(axis.flags ?? 0);
		w.uint16(axis.axisNameID ?? 0);
	}

	for (const instance of instances) {
		w.uint16(instance.subfamilyNameID ?? 0);
		w.uint16(instance.flags ?? 0);
		for (let i = 0; i < axisCount; i++) {
			w.fixed(instance.coordinates?.[i] ?? 0);
		}
		if (hasPostScriptNameID) {
			w.uint16(instance.postScriptNameID ?? 0xffff);
		}
	}

	return w.toArray();
}
