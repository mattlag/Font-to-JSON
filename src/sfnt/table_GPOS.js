/**
 * Font-to-JSON : GPOS — Glyph Positioning Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gpos
 *
 * Lookup types:
 *   1 — Single adjustment (formats 1 & 2)
 *   2 — Pair adjustment (formats 1 & 2)
 *   3 — Cursive attachment (format 1)
 *   4 — MarkBase attachment (format 1)
 *   5 — MarkLig attachment (format 1)
 *   6 — MarkMark attachment (format 1)
 *   7 — Context positioning (formats 1, 2, 3 — shared SequenceContext)
 *   8 — Chained context positioning (formats 1, 2, 3 — shared ChainedSequenceContext)
 *   9 — Extension positioning (format 1)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseChainedSequenceContext,
	parseClassDef,
	parseCoverage,
	parseDevice,
	parseFeatureList,
	parseFeatureVariations,
	parseLookupList,
	parseScriptList,
	parseSequenceContext,
	writeChainedSequenceContext,
	writeClassDef,
	writeCoverage,
	writeDevice,
	writeFeatureList,
	writeFeatureVariations,
	writeLookupList,
	writeScriptList,
	writeSequenceContext,
} from './opentype_layout_common.js';

// ═══════════════════════════════════════════════════════════════════════════
//  SHARED GPOS HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Count of bits set in a 16-bit valueFormat bitmask.
 * Each bit adds one int16 field to a ValueRecord.
 */
function valueFormatSize(fmt) {
	let n = 0;
	let v = fmt;
	while (v) {
		n += v & 1;
		v >>>= 1;
	}
	return n * 2; // each field is int16 (2 bytes)
}

/**
 * Parse a ValueRecord according to valueFormat bitmask.
 * Bits 0x0001–0x0008  → int16 positioning values
 * Bits 0x0010–0x0080  → Offset16 to Device tables (relative to `subtableOffset`)
 */
function parseValueRecord(reader, valueFormat, subtableOffset) {
	if (valueFormat === 0) return null;
	const valueRecordStart = reader.position;
	const vr = {};
	if (valueFormat & 0x0001) vr.xPlacement = reader.int16();
	if (valueFormat & 0x0002) vr.yPlacement = reader.int16();
	if (valueFormat & 0x0004) vr.xAdvance = reader.int16();
	if (valueFormat & 0x0008) vr.yAdvance = reader.int16();

	const xPlaDevOff = valueFormat & 0x0010 ? reader.uint16() : 0;
	const yPlaDevOff = valueFormat & 0x0020 ? reader.uint16() : 0;
	const xAdvDevOff = valueFormat & 0x0040 ? reader.uint16() : 0;
	const yAdvDevOff = valueFormat & 0x0080 ? reader.uint16() : 0;
	const returnPos = reader.position;

	const parseDeviceWithContext = (deviceOffset, fieldName) => {
		const primaryOffset = subtableOffset + deviceOffset;
		const fallbackOffset = valueRecordStart + deviceOffset;

		try {
			return parseDevice(reader, primaryOffset);
		} catch (primaryError) {
			if (fallbackOffset !== primaryOffset) {
				try {
					return parseDevice(reader, fallbackOffset);
				} catch {
					// fall through to contextual error below
				}
			}

			const msg =
				primaryError instanceof Error
					? primaryError.message
					: String(primaryError);
			throw new Error(
				`${msg}; ValueRecord context: valueFormat=${valueFormat}, subtableOffset=${subtableOffset}, valueRecordStart=${valueRecordStart}, offsets={xPla:${xPlaDevOff},yPla:${yPlaDevOff},xAdv:${xAdvDevOff},yAdv:${yAdvDevOff}}, field=${fieldName}`,
			);
		}
	};

	if (xPlaDevOff) {
		vr.xPlaDevice = parseDeviceWithContext(xPlaDevOff, 'xPlaDevice');
		reader.seek(returnPos);
	}
	if (yPlaDevOff) {
		vr.yPlaDevice = parseDeviceWithContext(yPlaDevOff, 'yPlaDevice');
		reader.seek(returnPos);
	}
	if (xAdvDevOff) {
		vr.xAdvDevice = parseDeviceWithContext(xAdvDevOff, 'xAdvDevice');
		reader.seek(returnPos);
	}
	if (yAdvDevOff) {
		vr.yAdvDevice = parseDeviceWithContext(yAdvDevOff, 'yAdvDevice');
		reader.seek(returnPos);
	}

	return vr;
}

/**
 * Parse an Anchor table (formats 1, 2, 3).
 * @param {DataReader} reader
 * @param {number} offset - absolute offset to anchor table
 * @returns {object|null}
 */
function parseAnchor(reader, offset) {
	if (offset === 0) return null;
	reader.seek(offset);
	const format = reader.uint16();
	const xCoordinate = reader.int16();
	const yCoordinate = reader.int16();
	const anchor = { format, xCoordinate, yCoordinate };

	if (format === 2) {
		anchor.anchorPoint = reader.uint16();
	} else if (format === 3) {
		const xDevOff = reader.uint16();
		const yDevOff = reader.uint16();
		if (xDevOff) anchor.xDevice = parseDevice(reader, offset + xDevOff);
		if (yDevOff) anchor.yDevice = parseDevice(reader, offset + yDevOff);
	}
	return anchor;
}

/**
 * Parse a MarkArray table.
 */
function parseMarkArray(reader, offset) {
	reader.seek(offset);
	const markCount = reader.uint16();
	const records = [];
	for (let i = 0; i < markCount; i++) {
		const markClass = reader.uint16();
		const anchorOffset = reader.uint16();
		records.push({ markClass, anchorOffset });
	}
	// Now parse anchors (offsets relative to markArray start)
	return records.map((r) => ({
		markClass: r.markClass,
		markAnchor: parseAnchor(reader, offset + r.anchorOffset),
	}));
}

// ═══════════════════════════════════════════════════════════════════════════
//  PARSING  (binary → JSON)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a GPOS table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseGPOS(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const scriptListOffset = reader.uint16();
	const featureListOffset = reader.uint16();
	const lookupListOffset = reader.uint16();

	let featureVariationsOffset = 0;
	if (minorVersion >= 1) {
		featureVariationsOffset = reader.uint32();
	}

	const result = {
		majorVersion,
		minorVersion,
		scriptList: parseScriptList(reader, scriptListOffset),
		featureList: parseFeatureList(reader, featureListOffset),
		lookupList: parseLookupList(reader, lookupListOffset, parseGPOSSubtable, 9),
	};

	if (featureVariationsOffset !== 0) {
		result.featureVariations = parseFeatureVariations(
			reader,
			featureVariationsOffset,
		);
	}

	return result;
}

// ─── GPOS Lookup subtable dispatcher ────────────────────────────────────────

function parseGPOSSubtable(reader, offset, lookupType) {
	switch (lookupType) {
		case 1:
			return parseSinglePos(reader, offset);
		case 2:
			return parsePairPos(reader, offset);
		case 3:
			return parseCursivePos(reader, offset);
		case 4:
			return parseMarkBasePos(reader, offset);
		case 5:
			return parseMarkLigPos(reader, offset);
		case 6:
			return parseMarkMarkPos(reader, offset);
		case 7:
			return parseSequenceContext(reader, offset);
		case 8:
			return parseChainedSequenceContext(reader, offset);
		case 9:
			return parseExtensionPos(reader, offset);
		default:
			throw new Error(`Unknown GPOS lookup type: ${lookupType}`);
	}
}

// ─── Type 1: Single adjustment ──────────────────────────────────────────────

function parseSinglePos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();

	if (format === 1) {
		const coverageOffset = reader.uint16();
		const valueFormat = reader.uint16();
		const valueRecord = parseValueRecord(reader, valueFormat, offset);
		const coverage = parseCoverage(reader, offset + coverageOffset);
		return { format, coverage, valueFormat, valueRecord };
	}
	if (format === 2) {
		const coverageOffset = reader.uint16();
		const valueFormat = reader.uint16();
		const valueCount = reader.uint16();
		const valueRecords = [];
		for (let i = 0; i < valueCount; i++) {
			valueRecords.push(parseValueRecord(reader, valueFormat, offset));
		}
		const coverage = parseCoverage(reader, offset + coverageOffset);
		return { format, coverage, valueFormat, valueCount, valueRecords };
	}
	throw new Error(`Unknown SinglePos format: ${format}`);
}

// ─── Type 2: Pair adjustment ────────────────────────────────────────────────

function parsePairPos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();

	if (format === 1) {
		const coverageOffset = reader.uint16();
		const valueFormat1 = reader.uint16();
		const valueFormat2 = reader.uint16();
		const pairSetCount = reader.uint16();
		const pairSetOffsets = reader.array('uint16', pairSetCount);

		const pairSets = pairSetOffsets.map((pso) => {
			const pairSetOffset = offset + pso;
			reader.seek(pairSetOffset);
			const pvCount = reader.uint16();
			const pvRecords = [];
			for (let i = 0; i < pvCount; i++) {
				const secondGlyph = reader.uint16();
				const value1 = parseValueRecord(reader, valueFormat1, pairSetOffset);
				const value2 = parseValueRecord(reader, valueFormat2, pairSetOffset);
				pvRecords.push({ secondGlyph, value1, value2 });
			}
			return pvRecords;
		});

		const coverage = parseCoverage(reader, offset + coverageOffset);
		return {
			format,
			coverage,
			valueFormat1,
			valueFormat2,
			pairSets,
		};
	}
	if (format === 2) {
		const coverageOffset = reader.uint16();
		const valueFormat1 = reader.uint16();
		const valueFormat2 = reader.uint16();
		const classDef1Offset = reader.uint16();
		const classDef2Offset = reader.uint16();
		const class1Count = reader.uint16();
		const class2Count = reader.uint16();

		const class1Records = [];
		for (let i = 0; i < class1Count; i++) {
			const class2Records = [];
			for (let j = 0; j < class2Count; j++) {
				const value1 = parseValueRecord(reader, valueFormat1, offset);
				const value2 = parseValueRecord(reader, valueFormat2, offset);
				class2Records.push({ value1, value2 });
			}
			class1Records.push(class2Records);
		}

		const coverage = parseCoverage(reader, offset + coverageOffset);

		const classDef1 = parseClassDef(reader, offset + classDef1Offset);
		const classDef2 = parseClassDef(reader, offset + classDef2Offset);

		return {
			format,
			coverage,
			valueFormat1,
			valueFormat2,
			classDef1,
			classDef2,
			class1Count,
			class2Count,
			class1Records,
		};
	}
	throw new Error(`Unknown PairPos format: ${format}`);
}

// ─── Type 3: Cursive attachment ─────────────────────────────────────────────

function parseCursivePos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown CursivePos format: ${format}`);

	const coverageOffset = reader.uint16();
	const entryExitCount = reader.uint16();
	const records = [];
	for (let i = 0; i < entryExitCount; i++) {
		const entryAnchorOff = reader.uint16();
		const exitAnchorOff = reader.uint16();
		records.push({ entryAnchorOff, exitAnchorOff });
	}

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const entryExitRecords = records.map((r) => ({
		entryAnchor: r.entryAnchorOff
			? parseAnchor(reader, offset + r.entryAnchorOff)
			: null,
		exitAnchor: r.exitAnchorOff
			? parseAnchor(reader, offset + r.exitAnchorOff)
			: null,
	}));

	return { format, coverage, entryExitRecords };
}

// ─── Type 4: MarkBase attachment ────────────────────────────────────────────

function parseMarkBasePos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown MarkBasePos format: ${format}`);

	const markCoverageOff = reader.uint16();
	const baseCoverageOff = reader.uint16();
	const markClassCount = reader.uint16();
	const markArrayOff = reader.uint16();
	const baseArrayOff = reader.uint16();

	const markCoverage = parseCoverage(reader, offset + markCoverageOff);
	const baseCoverage = parseCoverage(reader, offset + baseCoverageOff);
	const markArray = parseMarkArray(reader, offset + markArrayOff);

	// Parse BaseArray
	reader.seek(offset + baseArrayOff);
	const baseCount = reader.uint16();
	const baseRecords = [];
	for (let i = 0; i < baseCount; i++) {
		const anchorOffsets = reader.array('uint16', markClassCount);
		baseRecords.push(anchorOffsets);
	}
	const baseArray = baseRecords.map((offsets) =>
		offsets.map((ao) =>
			ao ? parseAnchor(reader, offset + baseArrayOff + ao) : null,
		),
	);

	return {
		format,
		markCoverage,
		baseCoverage,
		markClassCount,
		markArray,
		baseArray,
	};
}

// ─── Type 5: MarkLig attachment ─────────────────────────────────────────────

function parseMarkLigPos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown MarkLigPos format: ${format}`);

	const markCoverageOff = reader.uint16();
	const ligatureCoverageOff = reader.uint16();
	const markClassCount = reader.uint16();
	const markArrayOff = reader.uint16();
	const ligatureArrayOff = reader.uint16();

	const markCoverage = parseCoverage(reader, offset + markCoverageOff);
	const ligatureCoverage = parseCoverage(reader, offset + ligatureCoverageOff);
	const markArray = parseMarkArray(reader, offset + markArrayOff);

	// Parse LigatureArray
	reader.seek(offset + ligatureArrayOff);
	const ligatureCount = reader.uint16();
	const ligatureAttachOffsets = reader.array('uint16', ligatureCount);

	const ligatureArray = ligatureAttachOffsets.map((lao) => {
		const laOffset = offset + ligatureArrayOff + lao;
		reader.seek(laOffset);
		const componentCount = reader.uint16();
		const componentRecords = [];
		for (let i = 0; i < componentCount; i++) {
			const anchorOffsets = reader.array('uint16', markClassCount);
			componentRecords.push(anchorOffsets);
		}
		return componentRecords.map((offsets) =>
			offsets.map((ao) => (ao ? parseAnchor(reader, laOffset + ao) : null)),
		);
	});

	return {
		format,
		markCoverage,
		ligatureCoverage,
		markClassCount,
		markArray,
		ligatureArray,
	};
}

// ─── Type 6: MarkMark attachment ────────────────────────────────────────────

function parseMarkMarkPos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown MarkMarkPos format: ${format}`);

	const mark1CoverageOff = reader.uint16();
	const mark2CoverageOff = reader.uint16();
	const markClassCount = reader.uint16();
	const mark1ArrayOff = reader.uint16();
	const mark2ArrayOff = reader.uint16();

	const mark1Coverage = parseCoverage(reader, offset + mark1CoverageOff);
	const mark2Coverage = parseCoverage(reader, offset + mark2CoverageOff);
	const mark1Array = parseMarkArray(reader, offset + mark1ArrayOff);

	// Parse Mark2Array
	reader.seek(offset + mark2ArrayOff);
	const mark2Count = reader.uint16();
	const mark2Records = [];
	for (let i = 0; i < mark2Count; i++) {
		const anchorOffsets = reader.array('uint16', markClassCount);
		mark2Records.push(anchorOffsets);
	}
	const mark2Array = mark2Records.map((offsets) =>
		offsets.map((ao) =>
			ao ? parseAnchor(reader, offset + mark2ArrayOff + ao) : null,
		),
	);

	return {
		format,
		mark1Coverage,
		mark2Coverage,
		markClassCount,
		mark1Array,
		mark2Array,
	};
}

// ─── Type 9: Extension positioning ──────────────────────────────────────────

function parseExtensionPos(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown ExtensionPos format: ${format}`);

	const extensionLookupType = reader.uint16();
	const extensionOffset = reader.uint32();

	const subtable = parseGPOSSubtable(
		reader,
		offset + extensionOffset,
		extensionLookupType,
	);

	return { format, extensionLookupType, extensionOffset, subtable };
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize a ValueRecord. Returns byte array.
 * `deviceOffsets` receives { key, bytes } entries for any Device tables
 * that need to be appended later with offsets patched.
 */
function writeValueRecord(vr, valueFormat, deviceCollector) {
	if (!valueFormat) return [];
	const w = new DataWriter(valueFormatSize(valueFormat));
	if (valueFormat & 0x0001) w.int16(vr ? (vr.xPlacement ?? 0) : 0);
	if (valueFormat & 0x0002) w.int16(vr ? (vr.yPlacement ?? 0) : 0);
	if (valueFormat & 0x0004) w.int16(vr ? (vr.xAdvance ?? 0) : 0);
	if (valueFormat & 0x0008) w.int16(vr ? (vr.yAdvance ?? 0) : 0);
	// Device offset fields are placeholders — filled after we know layout
	if (valueFormat & 0x0010) {
		if (vr?.xPlaDevice)
			deviceCollector.push({ field: w.position, device: vr.xPlaDevice });
		w.uint16(0);
	}
	if (valueFormat & 0x0020) {
		if (vr?.yPlaDevice)
			deviceCollector.push({ field: w.position, device: vr.yPlaDevice });
		w.uint16(0);
	}
	if (valueFormat & 0x0040) {
		if (vr?.xAdvDevice)
			deviceCollector.push({ field: w.position, device: vr.xAdvDevice });
		w.uint16(0);
	}
	if (valueFormat & 0x0080) {
		if (vr?.yAdvDevice)
			deviceCollector.push({ field: w.position, device: vr.yAdvDevice });
		w.uint16(0);
	}
	return w.toArray();
}

/**
 * Serialize an Anchor table. Returns byte array.
 */
function writeAnchor(anchor) {
	if (!anchor) return [];
	const { format, xCoordinate, yCoordinate } = anchor;

	if (format === 1) {
		const w = new DataWriter(6);
		w.uint16(1);
		w.int16(xCoordinate);
		w.int16(yCoordinate);
		return w.toArray();
	}
	if (format === 2) {
		const w = new DataWriter(8);
		w.uint16(2);
		w.int16(xCoordinate);
		w.int16(yCoordinate);
		w.uint16(anchor.anchorPoint);
		return w.toArray();
	}
	if (format === 3) {
		const xDevBytes = anchor.xDevice ? writeDevice(anchor.xDevice) : null;
		const yDevBytes = anchor.yDevice ? writeDevice(anchor.yDevice) : null;
		const headerSize = 10; // format(2) + x(2) + y(2) + xDevOff(2) + yDevOff(2)
		let cursor = headerSize;
		const xDevOff = xDevBytes ? cursor : 0;
		if (xDevBytes) cursor += xDevBytes.length;
		const yDevOff = yDevBytes ? cursor : 0;
		if (yDevBytes) cursor += yDevBytes.length;

		const w = new DataWriter(cursor);
		w.uint16(3);
		w.int16(xCoordinate);
		w.int16(yCoordinate);
		w.uint16(xDevOff);
		w.uint16(yDevOff);
		if (xDevBytes) {
			w.seek(xDevOff);
			w.rawBytes(xDevBytes);
		}
		if (yDevBytes) {
			w.seek(yDevOff);
			w.rawBytes(yDevBytes);
		}
		return w.toArray();
	}
	throw new Error(`Unknown Anchor format: ${format}`);
}

/**
 * Serialize a MarkArray table. Returns byte array.
 */
function writeMarkArray(markArray) {
	const anchorBytes = markArray.map((m) => writeAnchor(m.markAnchor));
	const headerSize = 2 + markArray.length * 4; // count(2) + markRecords(4 each: class + off)
	let cursor = headerSize;
	const anchorOffsets = anchorBytes.map((ba) => {
		if (!ba.length) return 0;
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(markArray.length);
	for (let i = 0; i < markArray.length; i++) {
		w.uint16(markArray[i].markClass);
		w.uint16(anchorOffsets[i]);
	}
	for (let i = 0; i < anchorBytes.length; i++) {
		if (anchorBytes[i].length) {
			w.seek(anchorOffsets[i]);
			w.rawBytes(anchorBytes[i]);
		}
	}
	return w.toArray();
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING  (JSON → binary)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize a GPOS table to bytes.
 * @param {object} gpos
 * @returns {number[]}
 */
export function writeGPOS(gpos) {
	const { majorVersion, minorVersion } = gpos;

	const scriptListBytes = writeScriptList(gpos.scriptList);
	const featureListBytes = writeFeatureList(gpos.featureList);
	const lookupListBytes = writeLookupList(
		gpos.lookupList,
		writeGPOSSubtable,
		9,
	);
	const featureVarBytes = gpos.featureVariations
		? writeFeatureVariations(gpos.featureVariations)
		: null;

	let headerSize = 10;
	if (minorVersion >= 1) headerSize += 4;

	let cursor = headerSize;
	const scriptListOff = cursor;
	cursor += scriptListBytes.length;
	const featureListOff = cursor;
	cursor += featureListBytes.length;
	const lookupListOff = cursor;
	cursor += lookupListBytes.length;
	const featureVarOff = featureVarBytes ? cursor : 0;
	if (featureVarBytes) cursor += featureVarBytes.length;

	const w = new DataWriter(cursor);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(scriptListOff);
	w.uint16(featureListOff);
	w.uint16(lookupListOff);
	if (minorVersion >= 1) w.uint32(featureVarOff);

	w.seek(scriptListOff);
	w.rawBytes(scriptListBytes);
	w.seek(featureListOff);
	w.rawBytes(featureListBytes);
	w.seek(lookupListOff);
	w.rawBytes(lookupListBytes);
	if (featureVarBytes) {
		w.seek(featureVarOff);
		w.rawBytes(featureVarBytes);
	}

	return w.toArray();
}

// ─── GPOS subtable writer dispatcher ────────────────────────────────────────

function writeGPOSSubtable(subtable, lookupType) {
	switch (lookupType) {
		case 1:
			return writeSinglePos(subtable);
		case 2:
			return writePairPos(subtable);
		case 3:
			return writeCursivePos(subtable);
		case 4:
			return writeMarkBasePos(subtable);
		case 5:
			return writeMarkLigPos(subtable);
		case 6:
			return writeMarkMarkPos(subtable);
		case 7:
			return writeSequenceContext(subtable);
		case 8:
			return writeChainedSequenceContext(subtable);
		case 9:
			return writeExtensionPos(subtable);
		default:
			throw new Error(`Unknown GPOS lookup type: ${lookupType}`);
	}
}

// ─── Type 1 writer ──────────────────────────────────────────────────────────

function writeSinglePos(st) {
	const covBytes = writeCoverage(st.coverage);
	const deviceCollector = [];

	if (st.format === 1) {
		const vrBytes = writeValueRecord(
			st.valueRecord,
			st.valueFormat,
			deviceCollector,
		);
		// format(2) + covOff(2) + valueFormat(2) + vrBytes
		const headerSize = 6 + vrBytes.length;
		const covOff = headerSize;
		const total = covOff + covBytes.length;
		const w = new DataWriter(total);
		w.uint16(1);
		w.uint16(covOff);
		w.uint16(st.valueFormat);
		w.rawBytes(vrBytes);
		w.seek(covOff);
		w.rawBytes(covBytes);
		return w.toArray();
	}
	if (st.format === 2) {
		const vrSize = valueFormatSize(st.valueFormat);
		const allVrBytes = st.valueRecords.map((vr) =>
			writeValueRecord(vr, st.valueFormat, deviceCollector),
		);
		// format(2) + covOff(2) + valueFormat(2) + count(2) + vrBytes
		const headerSize = 8 + allVrBytes.length * vrSize;
		const covOff = headerSize;
		const total = covOff + covBytes.length;
		const w = new DataWriter(total);
		w.uint16(2);
		w.uint16(covOff);
		w.uint16(st.valueFormat);
		w.uint16(st.valueCount);
		for (const b of allVrBytes) w.rawBytes(b);
		w.seek(covOff);
		w.rawBytes(covBytes);
		return w.toArray();
	}
	throw new Error(`Unknown SinglePos format: ${st.format}`);
}

// ─── Type 2 writer ──────────────────────────────────────────────────────────

function writePairPos(st) {
	const covBytes = writeCoverage(st.coverage);
	const deviceCollector = [];

	if (st.format === 1) {
		// Serialize each PairSet
		const pairSetBytesArr = st.pairSets.map((ps) => {
			const vrSize1 = valueFormatSize(st.valueFormat1);
			const vrSize2 = valueFormatSize(st.valueFormat2);
			const recordSize = 2 + vrSize1 + vrSize2; // secondGlyph(2) + vr1 + vr2
			const w = new DataWriter(2 + ps.length * recordSize);
			w.uint16(ps.length);
			for (const pvr of ps) {
				w.uint16(pvr.secondGlyph);
				w.rawBytes(
					writeValueRecord(pvr.value1, st.valueFormat1, deviceCollector),
				);
				w.rawBytes(
					writeValueRecord(pvr.value2, st.valueFormat2, deviceCollector),
				);
			}
			return w.toArray();
		});

		// Header: format(2) + covOff(2) + vf1(2) + vf2(2) + psCount(2) + psOff(2*n)
		const headerSize = 10 + st.pairSets.length * 2;
		let cursor = headerSize;
		const covOff = cursor;
		cursor += covBytes.length;
		const psOffsets = pairSetBytesArr.map((ba) => {
			const off = cursor;
			cursor += ba.length;
			return off;
		});

		const w = new DataWriter(cursor);
		w.uint16(1);
		w.uint16(covOff);
		w.uint16(st.valueFormat1);
		w.uint16(st.valueFormat2);
		w.uint16(st.pairSets.length);
		w.array('uint16', psOffsets);
		w.seek(covOff);
		w.rawBytes(covBytes);
		for (let i = 0; i < pairSetBytesArr.length; i++) {
			w.seek(psOffsets[i]);
			w.rawBytes(pairSetBytesArr[i]);
		}
		return w.toArray();
	}
	if (st.format === 2) {
		const cd1Bytes = writeClassDef(st.classDef1);
		const cd2Bytes = writeClassDef(st.classDef2);

		const vrSize1 = valueFormatSize(st.valueFormat1);
		const vrSize2 = valueFormatSize(st.valueFormat2);
		const classRecordSize = vrSize1 + vrSize2;

		// Header: format(2) + covOff(2) + vf1(2) + vf2(2) + cd1Off(2) + cd2Off(2)
		//         + c1Count(2) + c2Count(2) + records
		const recordsSize = st.class1Count * st.class2Count * classRecordSize;
		const headerSize = 16 + recordsSize;

		let cursor = headerSize;
		const covOff = cursor;
		cursor += covBytes.length;
		const cd1Off = cursor;
		cursor += cd1Bytes.length;
		const cd2Off = cursor;
		cursor += cd2Bytes.length;

		const w = new DataWriter(cursor);
		w.uint16(2);
		w.uint16(covOff);
		w.uint16(st.valueFormat1);
		w.uint16(st.valueFormat2);
		w.uint16(cd1Off);
		w.uint16(cd2Off);
		w.uint16(st.class1Count);
		w.uint16(st.class2Count);

		for (const c2Arr of st.class1Records) {
			for (const rec of c2Arr) {
				w.rawBytes(
					writeValueRecord(rec.value1, st.valueFormat1, deviceCollector),
				);
				w.rawBytes(
					writeValueRecord(rec.value2, st.valueFormat2, deviceCollector),
				);
			}
		}

		w.seek(covOff);
		w.rawBytes(covBytes);
		w.seek(cd1Off);
		w.rawBytes(cd1Bytes);
		w.seek(cd2Off);
		w.rawBytes(cd2Bytes);

		return w.toArray();
	}
	throw new Error(`Unknown PairPos format: ${st.format}`);
}

// ─── Type 3 writer ──────────────────────────────────────────────────────────

function writeCursivePos(st) {
	const covBytes = writeCoverage(st.coverage);
	const anchorPairs = st.entryExitRecords.map((r) => ({
		entry: r.entryAnchor ? writeAnchor(r.entryAnchor) : null,
		exit: r.exitAnchor ? writeAnchor(r.exitAnchor) : null,
	}));

	// Header: format(2) + covOff(2) + count(2) + entryExitRecords(4*n)
	const headerSize = 6 + st.entryExitRecords.length * 4;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;

	const anchorLayout = anchorPairs.map((pair) => {
		const entryOff = pair.entry ? cursor : 0;
		if (pair.entry) cursor += pair.entry.length;
		const exitOff = pair.exit ? cursor : 0;
		if (pair.exit) cursor += pair.exit.length;
		return { entryOff, exitOff };
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(st.entryExitRecords.length);
	for (const al of anchorLayout) {
		w.uint16(al.entryOff);
		w.uint16(al.exitOff);
	}
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < anchorPairs.length; i++) {
		if (anchorPairs[i].entry) {
			w.seek(anchorLayout[i].entryOff);
			w.rawBytes(anchorPairs[i].entry);
		}
		if (anchorPairs[i].exit) {
			w.seek(anchorLayout[i].exitOff);
			w.rawBytes(anchorPairs[i].exit);
		}
	}
	return w.toArray();
}

// ─── Type 4 writer ──────────────────────────────────────────────────────────

function writeMarkBasePos(st) {
	const markCovBytes = writeCoverage(st.markCoverage);
	const baseCovBytes = writeCoverage(st.baseCoverage);
	const markArrayBytes = writeMarkArray(st.markArray);
	const baseArrayBytes = writeBaseArray(st.baseArray);

	// Header: format(2) + markCovOff(2) + baseCovOff(2) + classCount(2) + markArrayOff(2) + baseArrayOff(2) = 12
	const headerSize = 12;
	let cursor = headerSize;
	const markCovOff = cursor;
	cursor += markCovBytes.length;
	const baseCovOff = cursor;
	cursor += baseCovBytes.length;
	const markArrayOff = cursor;
	cursor += markArrayBytes.length;
	const baseArrayOff = cursor;
	cursor += baseArrayBytes.length;

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(markCovOff);
	w.uint16(baseCovOff);
	w.uint16(st.markClassCount);
	w.uint16(markArrayOff);
	w.uint16(baseArrayOff);
	w.seek(markCovOff);
	w.rawBytes(markCovBytes);
	w.seek(baseCovOff);
	w.rawBytes(baseCovBytes);
	w.seek(markArrayOff);
	w.rawBytes(markArrayBytes);
	w.seek(baseArrayOff);
	w.rawBytes(baseArrayBytes);
	return w.toArray();
}

function writeBaseArray(baseArray) {
	const classCount = baseArray.length > 0 ? baseArray[0].length : 0;
	const allAnchorBytes = baseArray.map((row) => row.map(writeAnchor));

	// baseCount(2) + offsets(2 * baseCount * classCount)
	const headerSize = 2 + baseArray.length * classCount * 2;
	let cursor = headerSize;
	const offsets = allAnchorBytes.map((row) =>
		row.map((ba) => {
			if (!ba.length) return 0;
			const off = cursor;
			cursor += ba.length;
			return off;
		}),
	);

	const w = new DataWriter(cursor);
	w.uint16(baseArray.length);
	for (let i = 0; i < baseArray.length; i++) {
		for (let j = 0; j < classCount; j++) {
			w.uint16(offsets[i][j]);
		}
	}
	for (let i = 0; i < allAnchorBytes.length; i++) {
		for (let j = 0; j < classCount; j++) {
			if (allAnchorBytes[i][j].length) {
				w.seek(offsets[i][j]);
				w.rawBytes(allAnchorBytes[i][j]);
			}
		}
	}
	return w.toArray();
}

// ─── Type 5 writer ──────────────────────────────────────────────────────────

function writeMarkLigPos(st) {
	const markCovBytes = writeCoverage(st.markCoverage);
	const ligCovBytes = writeCoverage(st.ligatureCoverage);
	const markArrayBytes = writeMarkArray(st.markArray);
	const ligArrayBytes = writeLigatureArray(st.ligatureArray, st.markClassCount);

	const headerSize = 12;
	let cursor = headerSize;
	const markCovOff = cursor;
	cursor += markCovBytes.length;
	const ligCovOff = cursor;
	cursor += ligCovBytes.length;
	const markArrayOff = cursor;
	cursor += markArrayBytes.length;
	const ligArrayOff = cursor;
	cursor += ligArrayBytes.length;

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(markCovOff);
	w.uint16(ligCovOff);
	w.uint16(st.markClassCount);
	w.uint16(markArrayOff);
	w.uint16(ligArrayOff);
	w.seek(markCovOff);
	w.rawBytes(markCovBytes);
	w.seek(ligCovOff);
	w.rawBytes(ligCovBytes);
	w.seek(markArrayOff);
	w.rawBytes(markArrayBytes);
	w.seek(ligArrayOff);
	w.rawBytes(ligArrayBytes);
	return w.toArray();
}

function writeLigatureArray(ligatureArray, markClassCount) {
	// Build each LigatureAttach sub-table
	const ligAttachBytes = ligatureArray.map((components) => {
		const allAnchorBytes = components.map((row) => row.map(writeAnchor));
		const headerSize = 2 + components.length * markClassCount * 2;
		let cursor = headerSize;
		const offsets = allAnchorBytes.map((row) =>
			row.map((ba) => {
				if (!ba.length) return 0;
				const off = cursor;
				cursor += ba.length;
				return off;
			}),
		);

		const w = new DataWriter(cursor);
		w.uint16(components.length);
		for (let c = 0; c < components.length; c++) {
			for (let m = 0; m < markClassCount; m++) {
				w.uint16(offsets[c][m]);
			}
		}
		for (let c = 0; c < allAnchorBytes.length; c++) {
			for (let m = 0; m < markClassCount; m++) {
				if (allAnchorBytes[c][m].length) {
					w.seek(offsets[c][m]);
					w.rawBytes(allAnchorBytes[c][m]);
				}
			}
		}
		return w.toArray();
	});

	// LigatureArray header: count(2) + offsets(2*n)
	const headerSize = 2 + ligatureArray.length * 2;
	let cursor = headerSize;
	const laOffsets = ligAttachBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(ligatureArray.length);
	w.array('uint16', laOffsets);
	for (let i = 0; i < ligAttachBytes.length; i++) {
		w.seek(laOffsets[i]);
		w.rawBytes(ligAttachBytes[i]);
	}
	return w.toArray();
}

// ─── Type 6 writer ──────────────────────────────────────────────────────────

function writeMarkMarkPos(st) {
	const m1CovBytes = writeCoverage(st.mark1Coverage);
	const m2CovBytes = writeCoverage(st.mark2Coverage);
	const m1ArrayBytes = writeMarkArray(st.mark1Array);
	const m2ArrayBytes = writeBaseArray(st.mark2Array); // same structure as BaseArray

	const headerSize = 12;
	let cursor = headerSize;
	const m1CovOff = cursor;
	cursor += m1CovBytes.length;
	const m2CovOff = cursor;
	cursor += m2CovBytes.length;
	const m1ArrayOff = cursor;
	cursor += m1ArrayBytes.length;
	const m2ArrayOff = cursor;
	cursor += m2ArrayBytes.length;

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(m1CovOff);
	w.uint16(m2CovOff);
	w.uint16(st.markClassCount);
	w.uint16(m1ArrayOff);
	w.uint16(m2ArrayOff);
	w.seek(m1CovOff);
	w.rawBytes(m1CovBytes);
	w.seek(m2CovOff);
	w.rawBytes(m2CovBytes);
	w.seek(m1ArrayOff);
	w.rawBytes(m1ArrayBytes);
	w.seek(m2ArrayOff);
	w.rawBytes(m2ArrayBytes);
	return w.toArray();
}

// ─── Type 9 writer ──────────────────────────────────────────────────────────

function writeExtensionPos(st) {
	const innerBytes = writeGPOSSubtable(st.subtable, st.extensionLookupType);
	const headerSize = 8;
	const w = new DataWriter(headerSize + innerBytes.length);
	w.uint16(1);
	w.uint16(st.extensionLookupType);
	w.uint32(headerSize);
	w.rawBytes(innerBytes);
	return w.toArray();
}
