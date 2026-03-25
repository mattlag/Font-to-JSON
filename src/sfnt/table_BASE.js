/**
 * Font Flux JS : BASE table
 * Baseline Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/base
 *
 * This implementation fully parses horizAxis and vertAxis subtables into
 * structured BaseTagList, BaseScriptList, BaseValues, MinMax, and BaseCoord
 * objects. ItemVariationStore (v1.1) is also fully parsed.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from './item_variation_store.js';
import { parseDevice, writeDevice } from './opentype_layout_common.js';

const BASE_HEADER_V10_SIZE = 8;
const BASE_HEADER_V11_SIZE = 12;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a BASE table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseBASE(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const horizAxisOffset = reader.offset16();
	const vertAxisOffset = reader.offset16();
	const itemVarStoreOffset =
		majorVersion > 1 || (majorVersion === 1 && minorVersion >= 1)
			? reader.offset32()
			: 0;

	const offsets = [horizAxisOffset, vertAxisOffset, itemVarStoreOffset].filter(
		(o) => o > 0,
	);

	return {
		majorVersion,
		minorVersion,
		horizAxis: horizAxisOffset
			? parseAxisTable(rawBytes, horizAxisOffset)
			: null,
		vertAxis: vertAxisOffset ? parseAxisTable(rawBytes, vertAxisOffset) : null,
		itemVariationStore: itemVarStoreOffset
			? parseItemVariationStore(
					rawBytes.slice(
						itemVarStoreOffset,
						findSubtableEnd(rawBytes.length, itemVarStoreOffset, offsets),
					),
				)
			: null,
	};
}

function findSubtableEnd(totalLength, startOffset, allOffsets) {
	const next = allOffsets
		.filter((o) => o > startOffset)
		.sort((a, b) => a - b)[0];
	return next ?? totalLength;
}

// ---------------------------------------------------------------------------
//  Axis table  (offsets from start of Axis table)
// ---------------------------------------------------------------------------

function parseAxisTable(rawBytes, axisOffset) {
	if (axisOffset + 4 > rawBytes.length) return null;

	const reader = new DataReader(rawBytes);
	reader.seek(axisOffset);
	const baseTagListOffset = reader.offset16();
	const baseScriptListOffset = reader.offset16();

	const baseTagList = baseTagListOffset
		? parseBaseTagList(reader, axisOffset + baseTagListOffset)
		: null;
	const baseScriptList = baseScriptListOffset
		? parseBaseScriptList(reader, axisOffset + baseScriptListOffset)
		: [];

	return { baseTagList, baseScriptList };
}

function parseBaseTagList(reader, offset) {
	reader.seek(offset);
	const count = reader.uint16();
	const tags = [];
	for (let i = 0; i < count; i++) {
		tags.push(reader.tag());
	}
	return tags;
}

function parseBaseScriptList(reader, offset) {
	reader.seek(offset);
	const count = reader.uint16();
	const records = [];
	for (let i = 0; i < count; i++) {
		records.push({ tag: reader.tag(), off: reader.offset16() });
	}
	return records.map((rec) => ({
		tag: rec.tag,
		...parseBaseScript(reader, offset + rec.off),
	}));
}

function parseBaseScript(reader, start) {
	reader.seek(start);
	const baseValuesOff = reader.offset16();
	const defaultMinMaxOff = reader.offset16();
	const langSysCount = reader.uint16();
	const langRecs = [];
	for (let i = 0; i < langSysCount; i++) {
		langRecs.push({ tag: reader.tag(), off: reader.offset16() });
	}

	return {
		baseValues: baseValuesOff
			? parseBaseValues(reader, start + baseValuesOff)
			: null,
		defaultMinMax: defaultMinMaxOff
			? parseMinMax(reader, start + defaultMinMaxOff)
			: null,
		langSystems: langRecs.map((r) => ({
			tag: r.tag,
			minMax: parseMinMax(reader, start + r.off),
		})),
	};
}

function parseBaseValues(reader, offset) {
	reader.seek(offset);
	const defaultBaselineIndex = reader.uint16();
	const baseCoordCount = reader.uint16();
	const coordOffsets = [];
	for (let i = 0; i < baseCoordCount; i++) {
		coordOffsets.push(reader.offset16());
	}
	return {
		defaultBaselineIndex,
		baseCoords: coordOffsets.map((o) =>
			o ? parseBaseCoord(reader, offset + o) : null,
		),
	};
}

function parseMinMax(reader, offset) {
	reader.seek(offset);
	const minCoordOff = reader.offset16();
	const maxCoordOff = reader.offset16();
	const featCount = reader.uint16();
	const featRecs = [];
	for (let i = 0; i < featCount; i++) {
		featRecs.push({
			tag: reader.tag(),
			minOff: reader.offset16(),
			maxOff: reader.offset16(),
		});
	}
	return {
		minCoord: minCoordOff ? parseBaseCoord(reader, offset + minCoordOff) : null,
		maxCoord: maxCoordOff ? parseBaseCoord(reader, offset + maxCoordOff) : null,
		featMinMax: featRecs.map((r) => ({
			tag: r.tag,
			minCoord: r.minOff ? parseBaseCoord(reader, offset + r.minOff) : null,
			maxCoord: r.maxOff ? parseBaseCoord(reader, offset + r.maxOff) : null,
		})),
	};
}

function parseBaseCoord(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	const coordinate = reader.int16();
	if (format === 1) return { format, coordinate };
	if (format === 2) {
		return {
			format,
			coordinate,
			referenceGlyph: reader.uint16(),
			baseCoordPoint: reader.uint16(),
		};
	}
	if (format === 3) {
		const deviceOff = reader.offset16();
		return {
			format,
			coordinate,
			device: deviceOff ? parseDevice(reader, offset + deviceOff) : null,
		};
	}
	return { format, coordinate };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a BASE JSON object back to raw bytes.
 *
 * @param {object} base - Parsed BASE table data
 * @returns {number[]} Array of byte values
 */
export function writeBASE(base) {
	const majorVersion = base.majorVersion ?? 1;
	const minorVersion = base.minorVersion ?? 0;
	const includeItemVariationStore =
		majorVersion > 1 || (majorVersion === 1 && minorVersion >= 1);

	const horizBytes = writeAxisBytes(base.horizAxis);
	const vertBytes = writeAxisBytes(base.vertAxis);
	const itemVarStoreBytes =
		includeItemVariationStore && base.itemVariationStore
			? writeItemVariationStore(base.itemVariationStore)
			: [];

	const headerSize = includeItemVariationStore
		? BASE_HEADER_V11_SIZE
		: BASE_HEADER_V10_SIZE;
	let currentOffset = headerSize;

	const horizAxisOffset = horizBytes.length ? currentOffset : 0;
	currentOffset += horizBytes.length;

	const vertAxisOffset = vertBytes.length ? currentOffset : 0;
	currentOffset += vertBytes.length;

	const itemVarStoreOffset = itemVarStoreBytes.length ? currentOffset : 0;
	currentOffset += itemVarStoreBytes.length;

	const w = new DataWriter(currentOffset);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.offset16(horizAxisOffset);
	w.offset16(vertAxisOffset);
	if (includeItemVariationStore) {
		w.offset32(itemVarStoreOffset);
	}
	w.rawBytes(horizBytes);
	w.rawBytes(vertBytes);
	w.rawBytes(itemVarStoreBytes);
	return w.toArray();
}

// ---------------------------------------------------------------------------
//  Axis table writer
// ---------------------------------------------------------------------------

function writeAxisBytes(axis) {
	if (!axis) return [];
	// Backward compatibility: raw byte blob
	if (axis._raw) return axis._raw;

	const tagListBlob = axis.baseTagList
		? writeBaseTagListBytes(axis.baseTagList)
		: [];
	const scriptListBlob = writeBaseScriptListBytes(axis.baseScriptList ?? []);

	const headerSize = 4;
	let pos = headerSize;
	const tagListOff = tagListBlob.length ? pos : 0;
	pos += tagListBlob.length;
	const scriptListOff = scriptListBlob.length ? pos : 0;
	pos += scriptListBlob.length;

	const w = new DataWriter(pos);
	w.offset16(tagListOff);
	w.offset16(scriptListOff);
	w.rawBytes(tagListBlob);
	w.rawBytes(scriptListBlob);
	return w.toArray();
}

function writeBaseTagListBytes(tags) {
	const size = 2 + 4 * tags.length;
	const w = new DataWriter(size);
	w.uint16(tags.length);
	for (const t of tags) {
		w.tag(t);
	}
	return w.toArray();
}

function writeBaseScriptListBytes(scripts) {
	const headerSize = 2 + 6 * scripts.length;
	const blobs = scripts.map((s) => writeBaseScriptBytes(s));

	let pos = headerSize;
	const offsets = blobs.map((b) => {
		const off = pos;
		pos += b.length;
		return off;
	});

	const w = new DataWriter(pos);
	w.uint16(scripts.length);
	for (let i = 0; i < scripts.length; i++) {
		w.tag(scripts[i].tag);
		w.offset16(offsets[i]);
	}
	for (const b of blobs) {
		w.rawBytes(b);
	}
	return w.toArray();
}

function writeBaseScriptBytes(bs) {
	const bvBlob = writeBaseValuesBytes(bs.baseValues);
	const defMmBlob = writeMinMaxBytes(bs.defaultMinMax);
	const langs = bs.langSystems ?? [];
	const langBlobs = langs.map((ls) => writeMinMaxBytes(ls.minMax));

	const headerSize = 6 + 6 * langs.length;
	let pos = headerSize;

	const bvOff = bvBlob.length ? pos : 0;
	pos += bvBlob.length;
	const defMmOff = defMmBlob.length ? pos : 0;
	pos += defMmBlob.length;
	const langOffs = langBlobs.map((b) => {
		const off = b.length ? pos : 0;
		pos += b.length;
		return off;
	});

	const w = new DataWriter(pos);
	w.offset16(bvOff);
	w.offset16(defMmOff);
	w.uint16(langs.length);
	for (let i = 0; i < langs.length; i++) {
		w.tag(langs[i].tag);
		w.offset16(langOffs[i]);
	}
	w.rawBytes(bvBlob);
	w.rawBytes(defMmBlob);
	for (const b of langBlobs) {
		w.rawBytes(b);
	}
	return w.toArray();
}

function writeBaseValuesBytes(bv) {
	if (!bv) return [];
	const coords = bv.baseCoords ?? [];
	const headerSize = 4 + 2 * coords.length;
	const coordBlobs = coords.map((c) => writeBaseCoordBytes(c));

	let pos = headerSize;
	const offsets = coordBlobs.map((b) => {
		const off = b.length ? pos : 0;
		pos += b.length;
		return off;
	});

	const w = new DataWriter(pos);
	w.uint16(bv.defaultBaselineIndex ?? 0);
	w.uint16(coords.length);
	for (const o of offsets) {
		w.offset16(o);
	}
	for (const b of coordBlobs) {
		w.rawBytes(b);
	}
	return w.toArray();
}

function writeMinMaxBytes(mm) {
	if (!mm) return [];
	const feats = mm.featMinMax ?? [];
	const headerSize = 6 + 8 * feats.length;

	const minBlob = writeBaseCoordBytes(mm.minCoord);
	const maxBlob = writeBaseCoordBytes(mm.maxCoord);
	const featBlobs = feats.map((f) => ({
		tag: f.tag,
		min: writeBaseCoordBytes(f.minCoord),
		max: writeBaseCoordBytes(f.maxCoord),
	}));

	let pos = headerSize;
	const minOff = minBlob.length ? pos : 0;
	pos += minBlob.length;
	const maxOff = maxBlob.length ? pos : 0;
	pos += maxBlob.length;
	const featOffs = featBlobs.map((f) => {
		const mO = f.min.length ? pos : 0;
		pos += f.min.length;
		const xO = f.max.length ? pos : 0;
		pos += f.max.length;
		return { minOff: mO, maxOff: xO };
	});

	const w = new DataWriter(pos);
	w.offset16(minOff);
	w.offset16(maxOff);
	w.uint16(feats.length);
	for (let i = 0; i < feats.length; i++) {
		w.tag(feats[i].tag);
		w.offset16(featOffs[i].minOff);
		w.offset16(featOffs[i].maxOff);
	}
	w.rawBytes(minBlob);
	w.rawBytes(maxBlob);
	for (const f of featBlobs) {
		w.rawBytes(f.min);
		w.rawBytes(f.max);
	}
	return w.toArray();
}

function writeBaseCoordBytes(bc) {
	if (!bc) return [];
	if (bc.format === 1) {
		const w = new DataWriter(4);
		w.uint16(1);
		w.int16(bc.coordinate);
		return w.toArray();
	}
	if (bc.format === 2) {
		const w = new DataWriter(8);
		w.uint16(2);
		w.int16(bc.coordinate);
		w.uint16(bc.referenceGlyph ?? 0);
		w.uint16(bc.baseCoordPoint ?? 0);
		return w.toArray();
	}
	if (bc.format === 3) {
		const devBytes = bc.device ? writeDevice(bc.device) : [];
		const devOff = devBytes.length ? 6 : 0;
		const w = new DataWriter(6 + devBytes.length);
		w.uint16(3);
		w.int16(bc.coordinate);
		w.offset16(devOff);
		w.rawBytes(devBytes);
		return w.toArray();
	}
	return [];
}
