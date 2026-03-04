/**
 * Font-to-JSON : OpenType Layout Common Table Formats
 *
 * Shared parse/write utilities for structures used by GDEF, GPOS, and GSUB.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/chapter2
 *
 * Structures provided:
 *   - Coverage tables (format 1 & 2)
 *   - ClassDef tables (format 1 & 2)
 *   - Device / VariationIndex tables
 *   - ScriptList → Script → LangSys
 *   - FeatureList → Feature
 *   - LookupList → Lookup (with pluggable subtable callback)
 *   - SequenceLookup record
 *   - SequenceContext (format 1, 2, 3)
 *   - ChainedSequenceContext (format 1, 2, 3)
 *   - FeatureVariations → ConditionSet → FeatureTableSubstitution
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ═══════════════════════════════════════════════════════════════════════════
//  COVERAGE TABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a Coverage table at the given absolute offset.
 * @param {DataReader} reader
 * @param {number} offset - absolute byte offset of the Coverage table
 * @returns {object}
 */
export function parseCoverage(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();

	if (format === 1) {
		const glyphCount = reader.uint16();
		const glyphs = reader.array('uint16', glyphCount);
		return { format, glyphs };
	}
	if (format === 2) {
		const rangeCount = reader.uint16();
		const ranges = [];
		for (let i = 0; i < rangeCount; i++) {
			ranges.push({
				startGlyphID: reader.uint16(),
				endGlyphID: reader.uint16(),
				startCoverageIndex: reader.uint16(),
			});
		}
		return { format, ranges };
	}
	throw new Error(`Unknown Coverage format: ${format}`);
}

/**
 * Serialize a Coverage table to bytes.
 * @param {object} cov
 * @returns {number[]}
 */
export function writeCoverage(cov) {
	if (cov.format === 1) {
		const size = 4 + cov.glyphs.length * 2;
		const w = new DataWriter(size);
		w.uint16(1);
		w.uint16(cov.glyphs.length);
		w.array('uint16', cov.glyphs);
		return w.toArray();
	}
	if (cov.format === 2) {
		const size = 4 + cov.ranges.length * 6;
		const w = new DataWriter(size);
		w.uint16(2);
		w.uint16(cov.ranges.length);
		for (const r of cov.ranges) {
			w.uint16(r.startGlyphID);
			w.uint16(r.endGlyphID);
			w.uint16(r.startCoverageIndex);
		}
		return w.toArray();
	}
	throw new Error(`Unknown Coverage format: ${cov.format}`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  CLASS DEFINITION TABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a ClassDef table at the given absolute offset.
 * @param {DataReader} reader
 * @param {number} offset
 * @returns {object}
 */
export function parseClassDef(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();

	if (format === 1) {
		const startGlyphID = reader.uint16();
		const glyphCount = reader.uint16();
		const classValues = reader.array('uint16', glyphCount);
		return { format, startGlyphID, classValues };
	}
	if (format === 2) {
		const classRangeCount = reader.uint16();
		const ranges = [];
		for (let i = 0; i < classRangeCount; i++) {
			ranges.push({
				startGlyphID: reader.uint16(),
				endGlyphID: reader.uint16(),
				class: reader.uint16(),
			});
		}
		return { format, ranges };
	}
	throw new Error(`Unknown ClassDef format: ${format}`);
}

/**
 * Serialize a ClassDef table to bytes.
 * @param {object} cd
 * @returns {number[]}
 */
export function writeClassDef(cd) {
	if (cd.format === 1) {
		const size = 6 + cd.classValues.length * 2;
		const w = new DataWriter(size);
		w.uint16(1);
		w.uint16(cd.startGlyphID);
		w.uint16(cd.classValues.length);
		w.array('uint16', cd.classValues);
		return w.toArray();
	}
	if (cd.format === 2) {
		const size = 4 + cd.ranges.length * 6;
		const w = new DataWriter(size);
		w.uint16(2);
		w.uint16(cd.ranges.length);
		for (const r of cd.ranges) {
			w.uint16(r.startGlyphID);
			w.uint16(r.endGlyphID);
			w.uint16(r.class);
		}
		return w.toArray();
	}
	throw new Error(`Unknown ClassDef format: ${cd.format}`);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEVICE / VARIATIONINDEX TABLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a Device or VariationIndex table at the given absolute offset.
 * Device formats: 1 (LOCAL_2_BIT_DELTAS), 2 (LOCAL_4_BIT_DELTAS), 3 (LOCAL_8_BIT_DELTAS)
 * VariationIndex format: 0x8000
 *
 * @param {DataReader} reader
 * @param {number} offset
 * @returns {object}
 */
export function parseDevice(reader, offset) {
	reader.seek(offset);
	const first = reader.uint16();
	const second = reader.uint16();
	const third = reader.uint16();

	if (third === 0x8000) {
		// VariationIndex table
		return {
			format: 0x8000,
			deltaSetOuterIndex: first,
			deltaSetInnerIndex: second,
		};
	}

	// Device table: first=startSize, second=endSize, third=deltaFormat
	const startSize = first;
	const endSize = second;
	const deltaFormat = third;

	const count = endSize - startSize + 1;
	let bitsPerDelta, mask, signBit;
	if (deltaFormat === 1) {
		bitsPerDelta = 2;
		mask = 0x3;
		signBit = 2;
	} else if (deltaFormat === 2) {
		bitsPerDelta = 4;
		mask = 0xf;
		signBit = 8;
	} else if (deltaFormat === 3) {
		bitsPerDelta = 8;
		mask = 0xff;
		signBit = 128;
	} else {
		throw new Error(`Unknown Device deltaFormat: ${deltaFormat}`);
	}

	const deltasPerWord = 16 / bitsPerDelta;
	const wordCount = Math.ceil(count / deltasPerWord);
	const deltaValues = [];

	for (let w = 0; w < wordCount; w++) {
		const word = reader.uint16();
		const remain = Math.min(deltasPerWord, count - w * deltasPerWord);
		for (let j = 0; j < remain; j++) {
			const shift = 16 - bitsPerDelta * (j + 1);
			let val = (word >> shift) & mask;
			if (val >= signBit) val -= signBit * 2;
			deltaValues.push(val);
		}
	}

	return { format: deltaFormat, startSize, endSize, deltaValues };
}

/**
 * Serialize a Device or VariationIndex table to bytes.
 * @param {object} dev
 * @returns {number[]}
 */
export function writeDevice(dev) {
	if (dev.format === 0x8000) {
		const w = new DataWriter(6);
		w.uint16(dev.deltaSetOuterIndex);
		w.uint16(dev.deltaSetInnerIndex);
		w.uint16(0x8000);
		return w.toArray();
	}

	const { startSize, endSize, deltaFormat, deltaValues } = dev;
	let bitsPerDelta;
	if (deltaFormat === 1) bitsPerDelta = 2;
	else if (deltaFormat === 2) bitsPerDelta = 4;
	else if (deltaFormat === 3) bitsPerDelta = 8;
	else throw new Error(`Unknown Device deltaFormat: ${deltaFormat}`);

	const deltasPerWord = 16 / bitsPerDelta;
	const wordCount = Math.ceil(deltaValues.length / deltasPerWord);
	const mask = (1 << bitsPerDelta) - 1;

	const size = 6 + wordCount * 2;
	const w = new DataWriter(size);
	w.uint16(startSize);
	w.uint16(endSize);
	w.uint16(deltaFormat);

	for (let wi = 0; wi < wordCount; wi++) {
		let word = 0;
		const remain = Math.min(
			deltasPerWord,
			deltaValues.length - wi * deltasPerWord,
		);
		for (let j = 0; j < remain; j++) {
			const shift = 16 - bitsPerDelta * (j + 1);
			word |= (deltaValues[wi * deltasPerWord + j] & mask) << shift;
		}
		w.uint16(word);
	}

	return w.toArray();
}

/**
 * Compute the byte size of a Device/VariationIndex table.
 */
export function deviceSize(dev) {
	if (dev.format === 0x8000) return 6;
	let bitsPerDelta;
	if (dev.format === 1) bitsPerDelta = 2;
	else if (dev.format === 2) bitsPerDelta = 4;
	else bitsPerDelta = 8;
	const deltasPerWord = 16 / bitsPerDelta;
	const wordCount = Math.ceil(dev.deltaValues.length / deltasPerWord);
	return 6 + wordCount * 2;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRIPTLIST → SCRIPT → LANGSYS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a ScriptList table.
 * @param {DataReader} reader
 * @param {number} offset - absolute offset of the ScriptList
 * @returns {object}
 */
export function parseScriptList(reader, offset) {
	reader.seek(offset);
	const scriptCount = reader.uint16();
	const records = [];
	for (let i = 0; i < scriptCount; i++) {
		records.push({
			scriptTag: reader.tag(),
			scriptOffset: reader.uint16(),
		});
	}

	const scriptRecords = records.map((rec) => ({
		scriptTag: rec.scriptTag,
		script: parseScript(reader, offset + rec.scriptOffset),
	}));

	return { scriptRecords };
}

function parseScript(reader, offset) {
	reader.seek(offset);
	const defaultLangSysOffset = reader.uint16();
	const langSysCount = reader.uint16();

	const langSysRecords = [];
	for (let i = 0; i < langSysCount; i++) {
		langSysRecords.push({
			langSysTag: reader.tag(),
			langSysOffset: reader.uint16(),
		});
	}

	const defaultLangSys =
		defaultLangSysOffset !== 0
			? parseLangSys(reader, offset + defaultLangSysOffset)
			: null;

	const langSystems = langSysRecords.map((rec) => ({
		langSysTag: rec.langSysTag,
		langSys: parseLangSys(reader, offset + rec.langSysOffset),
	}));

	return { defaultLangSys, langSysRecords: langSystems };
}

function parseLangSys(reader, offset) {
	reader.seek(offset);
	const lookupOrderOffset = reader.uint16();
	const requiredFeatureIndex = reader.uint16();
	const featureIndexCount = reader.uint16();
	const featureIndices = reader.array('uint16', featureIndexCount);
	return { lookupOrderOffset, requiredFeatureIndex, featureIndices };
}

/**
 * Serialize a ScriptList table to bytes.
 * @param {object} scriptList
 * @returns {number[]}
 */
export function writeScriptList(scriptList) {
	const { scriptRecords } = scriptList;

	// Serialize each Script table
	const scriptBytes = scriptRecords.map((rec) => writeScript(rec.script));

	// ScriptList header: count(2) + records(6 each)
	const headerSize = 2 + scriptRecords.length * 6;

	// Compute offsets for each Script table
	const offsets = [];
	let cursor = headerSize;
	for (const bytes of scriptBytes) {
		offsets.push(cursor);
		cursor += bytes.length;
	}

	const w = new DataWriter(cursor);
	w.uint16(scriptRecords.length);
	for (let i = 0; i < scriptRecords.length; i++) {
		w.tag(scriptRecords[i].scriptTag);
		w.uint16(offsets[i]);
	}
	for (let i = 0; i < scriptBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(scriptBytes[i]);
	}
	return w.toArray();
}

function writeScript(script) {
	const { defaultLangSys, langSysRecords } = script;

	// Serialize each LangSys
	const langSysBytes = langSysRecords.map((rec) => writeLangSys(rec.langSys));
	const defaultLangSysBytes = defaultLangSys
		? writeLangSys(defaultLangSys)
		: null;

	// Script header: defaultLangSysOffset(2) + langSysCount(2) + records(6 each)
	const headerSize = 4 + langSysRecords.length * 6;

	// Place defaultLangSys (if present) then individual LangSys tables
	let cursor = headerSize;
	const defaultOff = defaultLangSysBytes ? cursor : 0;
	if (defaultLangSysBytes) cursor += defaultLangSysBytes.length;

	const langOffsets = [];
	for (const bytes of langSysBytes) {
		langOffsets.push(cursor);
		cursor += bytes.length;
	}

	const w = new DataWriter(cursor);
	w.uint16(defaultOff);
	w.uint16(langSysRecords.length);
	for (let i = 0; i < langSysRecords.length; i++) {
		w.tag(langSysRecords[i].langSysTag);
		w.uint16(langOffsets[i]);
	}
	if (defaultLangSysBytes) {
		w.seek(defaultOff);
		w.rawBytes(defaultLangSysBytes);
	}
	for (let i = 0; i < langSysBytes.length; i++) {
		w.seek(langOffsets[i]);
		w.rawBytes(langSysBytes[i]);
	}
	return w.toArray();
}

function writeLangSys(langSys) {
	const size = 6 + langSys.featureIndices.length * 2;
	const w = new DataWriter(size);
	w.uint16(langSys.lookupOrderOffset);
	w.uint16(langSys.requiredFeatureIndex);
	w.uint16(langSys.featureIndices.length);
	w.array('uint16', langSys.featureIndices);
	return w.toArray();
}

// ═══════════════════════════════════════════════════════════════════════════
//  FEATURELIST → FEATURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a FeatureList table.
 * @param {DataReader} reader
 * @param {number} offset
 * @returns {object}
 */
export function parseFeatureList(reader, offset) {
	reader.seek(offset);
	const featureCount = reader.uint16();
	const records = [];
	for (let i = 0; i < featureCount; i++) {
		records.push({
			featureTag: reader.tag(),
			featureOffset: reader.uint16(),
		});
	}

	const featureRecords = records.map((rec) => ({
		featureTag: rec.featureTag,
		feature: parseFeature(reader, offset + rec.featureOffset),
	}));

	return { featureRecords };
}

function parseFeature(reader, offset) {
	reader.seek(offset);
	const featureParamsOffset = reader.uint16();
	const lookupIndexCount = reader.uint16();
	const lookupListIndices = reader.array('uint16', lookupIndexCount);
	return { featureParamsOffset, lookupListIndices };
}

/**
 * Serialize a FeatureList table to bytes.
 * @param {object} featureList
 * @returns {number[]}
 */
export function writeFeatureList(featureList) {
	const { featureRecords } = featureList;

	const featureBytes = featureRecords.map((rec) => writeFeature(rec.feature));

	// Header: count(2) + records(6 each)
	const headerSize = 2 + featureRecords.length * 6;

	const offsets = [];
	let cursor = headerSize;
	for (const bytes of featureBytes) {
		offsets.push(cursor);
		cursor += bytes.length;
	}

	const w = new DataWriter(cursor);
	w.uint16(featureRecords.length);
	for (let i = 0; i < featureRecords.length; i++) {
		w.tag(featureRecords[i].featureTag);
		w.uint16(offsets[i]);
	}
	for (let i = 0; i < featureBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(featureBytes[i]);
	}
	return w.toArray();
}

function writeFeature(feature) {
	const size = 4 + feature.lookupListIndices.length * 2;
	const w = new DataWriter(size);
	w.uint16(feature.featureParamsOffset);
	w.uint16(feature.lookupListIndices.length);
	w.array('uint16', feature.lookupListIndices);
	return w.toArray();
}

// ═══════════════════════════════════════════════════════════════════════════
//  LOOKUPLIST → LOOKUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a LookupList table.
 *
 * @param {DataReader} reader
 * @param {number} offset - absolute offset of the LookupList
 * @param {Function} parseSubtable - (reader, offset, lookupType) → object
 *   Callback to parse lookup-type-specific subtable data.
 * @param {number} [extensionLookupType] - lookup type that signals Extension
 *   (7 for GSUB, 9 for GPOS). When provided, Extension lookups are
 *   transparently unwrapped so the returned data uses the inner type.
 * @returns {object}
 */
export function parseLookupList(
	reader,
	offset,
	parseSubtable,
	extensionLookupType,
) {
	reader.seek(offset);
	const lookupCount = reader.uint16();
	const lookupOffsets = reader.array('uint16', lookupCount);

	const lookups = lookupOffsets.map((lo) =>
		parseLookup(reader, offset + lo, parseSubtable, extensionLookupType),
	);

	return { lookups };
}

function parseLookup(reader, offset, parseSubtable, extensionLookupType) {
	reader.seek(offset);
	const lookupType = reader.uint16();
	const lookupFlag = reader.uint16();
	const subTableCount = reader.uint16();
	const subtableOffsets = reader.array('uint16', subTableCount);
	const markFilteringSet = lookupFlag & 0x0010 ? reader.uint16() : undefined;

	const subtables = subtableOffsets.map((so) =>
		parseSubtable(reader, offset + so, lookupType),
	);

	let finalType = lookupType;
	let finalSubtables = subtables;

	// Transparently unwrap Extension lookups
	if (
		extensionLookupType !== undefined &&
		lookupType === extensionLookupType &&
		subtables.length > 0
	) {
		finalType = subtables[0].extensionLookupType;
		finalSubtables = subtables.map((st) => st.subtable);
	}

	const lookup = {
		lookupType: finalType,
		lookupFlag,
		subtables: finalSubtables,
	};
	if (markFilteringSet !== undefined)
		lookup.markFilteringSet = markFilteringSet;
	return lookup;
}

/**
 * Serialize a LookupList table to bytes.
 *
 * Each Lookup is first serialised as a self-contained block (header + subtable
 * data). If all Lookups fit within Offset16 range, they are written directly.
 * Otherwise any Lookup whose cumulative offset would overflow is automatically
 * wrapped in an Extension header (type 7 for GSUB, 9 for GPOS) so that the
 * large subtable data can be placed in a deferred area accessed via Offset32.
 *
 * The parser transparently unwraps Extension lookups (see parseLookupList), so
 * this auto-wrapping is invisible to consumers.
 *
 * @param {object} lookupList
 * @param {Function} writeSubtable - (subtable, lookupType) → number[]
 * @param {number} [extensionLookupType] - lookup type for Extension (7/9)
 * @returns {number[]}
 */
export function writeLookupList(
	lookupList,
	writeSubtable,
	extensionLookupType,
) {
	const { lookups } = lookupList;
	const EXT_HEADER_SIZE = 8; // format(2) + extensionLookupType(2) + extensionOffset(4)

	// ── Step 1: serialize all subtables ──────────────────────────────

	const lookupData = lookups.map((lk) => {
		const subtableBytes = lk.subtables.map((st) =>
			writeSubtable(st, lk.lookupType),
		);
		return { ...lk, subtableBytes };
	});

	// ── Step 2: build self-contained Lookup blocks ───────────────────

	const buildLookupBlock = (ld) => {
		const { lookupType, lookupFlag, subtableBytes, markFilteringSet } = ld;
		const hasMarkFilteringSet = markFilteringSet !== undefined;
		const headerSize =
			6 + subtableBytes.length * 2 + (hasMarkFilteringSet ? 2 : 0);

		let cursor = headerSize;
		const offsets = subtableBytes.map((sb) => {
			const off = cursor;
			cursor += sb.length;
			return off;
		});

		const w = new DataWriter(cursor);
		w.uint16(lookupType);
		w.uint16(lookupFlag);
		w.uint16(subtableBytes.length);
		w.array('uint16', offsets);
		if (hasMarkFilteringSet) w.uint16(markFilteringSet);
		for (let i = 0; i < subtableBytes.length; i++) {
			w.seek(offsets[i]);
			w.rawBytes(subtableBytes[i]);
		}
		return w.toArray();
	};

	let lookupBlocks = lookupData.map(buildLookupBlock);

	// ── Step 3: check for Offset16 overflow ──────────────────────────

	const llHeaderSize = 2 + lookups.length * 2;
	const checkOverflow = (blocks) => {
		let cursor = llHeaderSize;
		for (const block of blocks) {
			if (cursor > 0xffff) return true;
			cursor += block.length;
		}
		return false;
	};

	if (checkOverflow(lookupBlocks) && extensionLookupType !== undefined) {
		// ── Step 4: auto-wrap non-Extension Lookups ──────────────────

		// Build wrapped lookup blocks with deferred inner data
		const wrappedData = lookupData.map((ld) => {
			const { lookupType, lookupFlag, subtableBytes, markFilteringSet } = ld;
			const hasMarkFilteringSet = markFilteringSet !== undefined;

			// Build a compact Extension-wrapped Lookup:
			// - lookupType = extensionLookupType
			// - each subtable = 8-byte Extension header
			// - inner data is deferred
			const extHeaderSize =
				6 + subtableBytes.length * 2 + (hasMarkFilteringSet ? 2 : 0);

			let cursor = extHeaderSize;
			const offsets = subtableBytes.map(() => {
				const off = cursor;
				cursor += EXT_HEADER_SIZE;
				return off;
			});

			const w = new DataWriter(cursor);
			w.uint16(extensionLookupType);
			w.uint16(lookupFlag);
			w.uint16(subtableBytes.length);
			w.array('uint16', offsets);
			if (hasMarkFilteringSet) w.uint16(markFilteringSet);

			// Write Extension headers with placeholder extensionOffset
			for (let i = 0; i < subtableBytes.length; i++) {
				w.seek(offsets[i]);
				w.uint16(1); // format
				w.uint16(lookupType); // inner type
				w.uint32(0); // placeholder
			}

			return {
				compactBytes: w.toArray(),
				subtableOffsets: offsets,
				innerDataBytes: subtableBytes,
			};
		});

		// Layout: [LLHeader] [compact Extension blocks] [all deferred inner data]
		let cursor = llHeaderSize;
		const lookupOffsets = wrappedData.map((wd) => {
			const off = cursor;
			cursor += wd.compactBytes.length;
			return off;
		});

		const deferredLayout = wrappedData.map((wd) =>
			wd.innerDataBytes.map((ib) => {
				const off = cursor;
				cursor += ib.length;
				return off;
			}),
		);

		const w = new DataWriter(cursor);
		w.uint16(lookups.length);
		w.array('uint16', lookupOffsets);

		// Write compact blocks
		for (let i = 0; i < wrappedData.length; i++) {
			w.seek(lookupOffsets[i]);
			w.rawBytes(wrappedData[i].compactBytes);
		}

		// Write deferred data & patch extensionOffset
		for (let i = 0; i < wrappedData.length; i++) {
			const wd = wrappedData[i];
			for (let j = 0; j < wd.innerDataBytes.length; j++) {
				const extPos = lookupOffsets[i] + wd.subtableOffsets[j];
				const innerPos = deferredLayout[i][j];
				const extOffset = innerPos - extPos;

				// Patch extensionOffset
				w.seek(extPos + 4);
				w.uint32(extOffset);

				// Write inner data
				w.seek(innerPos);
				w.rawBytes(wd.innerDataBytes[j]);
			}
		}

		return w.toArray();
	}

	// ── Step 5: simple path — everything fits ────────────────────────

	let cursor = llHeaderSize;
	const lookupOffsets = lookupBlocks.map((block) => {
		const off = cursor;
		cursor += block.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(lookups.length);
	w.array('uint16', lookupOffsets);
	for (let i = 0; i < lookupBlocks.length; i++) {
		w.seek(lookupOffsets[i]);
		w.rawBytes(lookupBlocks[i]);
	}
	return w.toArray();
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEQUENCE CONTEXT (used by GPOS type 7, GSUB type 5)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a SequenceContext subtable (formats 1, 2, 3).
 * The format uint16 has already been read by the caller who dispatches here.
 *
 * @param {DataReader} reader
 * @param {number} subtableOffset - absolute offset of the subtable start (where format was)
 * @returns {object}
 */
export function parseSequenceContext(reader, subtableOffset) {
	reader.seek(subtableOffset);
	const format = reader.uint16();

	if (format === 1) {
		const coverageOffset = reader.uint16();
		const seqRuleSetCount = reader.uint16();
		const seqRuleSetOffsets = [];
		for (let i = 0; i < seqRuleSetCount; i++)
			seqRuleSetOffsets.push(reader.uint16());

		const coverage = parseCoverage(reader, subtableOffset + coverageOffset);
		const seqRuleSets = seqRuleSetOffsets.map((off) =>
			off === 0 ? null : parseSeqRuleSet(reader, subtableOffset + off),
		);
		return { format, coverage, seqRuleSets };
	}
	if (format === 2) {
		const coverageOffset = reader.uint16();
		const classDefOffset = reader.uint16();
		const classSeqRuleSetCount = reader.uint16();
		const classSeqRuleSetOffsets = [];
		for (let i = 0; i < classSeqRuleSetCount; i++)
			classSeqRuleSetOffsets.push(reader.uint16());

		const coverage = parseCoverage(reader, subtableOffset + coverageOffset);
		const classDef = parseClassDef(reader, subtableOffset + classDefOffset);
		const classSeqRuleSets = classSeqRuleSetOffsets.map((off) =>
			off === 0 ? null : parseClassSeqRuleSet(reader, subtableOffset + off),
		);
		return { format, coverage, classDef, classSeqRuleSets };
	}
	if (format === 3) {
		const glyphCount = reader.uint16();
		const seqLookupCount = reader.uint16();
		const coverageOffsets = reader.array('uint16', glyphCount);
		const seqLookupRecords = parseSeqLookupRecords(reader, seqLookupCount);

		const coverages = coverageOffsets.map((off) =>
			parseCoverage(reader, subtableOffset + off),
		);
		return { format, coverages, seqLookupRecords };
	}
	throw new Error(`Unknown SequenceContext format: ${format}`);
}

function parseSeqRuleSet(reader, offset) {
	reader.seek(offset);
	const seqRuleCount = reader.uint16();
	const seqRuleOffsets = reader.array('uint16', seqRuleCount);
	return seqRuleOffsets.map((off) => {
		reader.seek(offset + off);
		const glyphCount = reader.uint16();
		const seqLookupCount = reader.uint16();
		const inputSequence = reader.array('uint16', glyphCount - 1);
		const seqLookupRecords = parseSeqLookupRecords(reader, seqLookupCount);
		return { glyphCount, inputSequence, seqLookupRecords };
	});
}

function parseClassSeqRuleSet(reader, offset) {
	reader.seek(offset);
	const classSeqRuleCount = reader.uint16();
	const classSeqRuleOffsets = reader.array('uint16', classSeqRuleCount);
	return classSeqRuleOffsets.map((off) => {
		reader.seek(offset + off);
		const glyphCount = reader.uint16();
		const seqLookupCount = reader.uint16();
		const inputSequence = reader.array('uint16', glyphCount - 1);
		const seqLookupRecords = parseSeqLookupRecords(reader, seqLookupCount);
		return { glyphCount, inputSequence, seqLookupRecords };
	});
}

function parseSeqLookupRecords(reader, count) {
	const records = [];
	for (let i = 0; i < count; i++) {
		records.push({
			sequenceIndex: reader.uint16(),
			lookupListIndex: reader.uint16(),
		});
	}
	return records;
}

/**
 * Serialize a SequenceContext subtable.
 * @param {object} ctx
 * @returns {number[]}
 */
export function writeSequenceContext(ctx) {
	if (ctx.format === 1) return writeSeqCtxFormat1(ctx);
	if (ctx.format === 2) return writeSeqCtxFormat2(ctx);
	if (ctx.format === 3) return writeSeqCtxFormat3(ctx);
	throw new Error(`Unknown SequenceContext format: ${ctx.format}`);
}

function writeSeqCtxFormat1(ctx) {
	const { coverage, seqRuleSets } = ctx;
	const covBytes = writeCoverage(coverage);
	const ruleSetByteArrays = seqRuleSets.map((rs) =>
		rs === null ? null : writeSeqRuleSet(rs),
	);

	// Header: format(2) + coverageOffset(2) + seqRuleSetCount(2) + offsets(2 each)
	const headerSize = 6 + seqRuleSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const ruleSetOffsets = ruleSetByteArrays.map((ba) => {
		if (ba === null) return 0;
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(seqRuleSets.length);
	w.array('uint16', ruleSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < ruleSetByteArrays.length; i++) {
		if (ruleSetByteArrays[i]) {
			w.seek(ruleSetOffsets[i]);
			w.rawBytes(ruleSetByteArrays[i]);
		}
	}
	return w.toArray();
}

function writeSeqCtxFormat2(ctx) {
	const { coverage, classDef, classSeqRuleSets } = ctx;
	const covBytes = writeCoverage(coverage);
	const cdBytes = writeClassDef(classDef);
	const ruleSetByteArrays = classSeqRuleSets.map((rs) =>
		rs === null ? null : writeSeqRuleSet(rs),
	);

	// Header: format(2) + coverageOff(2) + classDefOff(2) + count(2) + offsets(2 each)
	const headerSize = 8 + classSeqRuleSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const cdOff = cursor;
	cursor += cdBytes.length;
	const ruleSetOffsets = ruleSetByteArrays.map((ba) => {
		if (ba === null) return 0;
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(2);
	w.uint16(covOff);
	w.uint16(cdOff);
	w.uint16(classSeqRuleSets.length);
	w.array('uint16', ruleSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	w.seek(cdOff);
	w.rawBytes(cdBytes);
	for (let i = 0; i < ruleSetByteArrays.length; i++) {
		if (ruleSetByteArrays[i]) {
			w.seek(ruleSetOffsets[i]);
			w.rawBytes(ruleSetByteArrays[i]);
		}
	}
	return w.toArray();
}

function writeSeqCtxFormat3(ctx) {
	const { coverages, seqLookupRecords } = ctx;
	const covByteArrays = coverages.map(writeCoverage);

	// Header: format(2) + glyphCount(2) + seqLookupCount(2) + covOffsets(2 each)
	//         + seqLookupRecords(4 each)
	const headerSize = 6 + coverages.length * 2 + seqLookupRecords.length * 4;

	let cursor = headerSize;
	const covOffsets = covByteArrays.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(3);
	w.uint16(coverages.length);
	w.uint16(seqLookupRecords.length);
	w.array('uint16', covOffsets);
	writeSeqLookupRecords(w, seqLookupRecords);
	for (let i = 0; i < covByteArrays.length; i++) {
		w.seek(covOffsets[i]);
		w.rawBytes(covByteArrays[i]);
	}
	return w.toArray();
}

function writeSeqRuleSet(rules) {
	const ruleBytes = rules.map(writeSeqRule);
	const headerSize = 2 + rules.length * 2;

	let cursor = headerSize;
	const offsets = ruleBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(rules.length);
	w.array('uint16', offsets);
	for (let i = 0; i < ruleBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(ruleBytes[i]);
	}
	return w.toArray();
}

function writeSeqRule(rule) {
	const { glyphCount, inputSequence, seqLookupRecords } = rule;
	const size = 4 + (glyphCount - 1) * 2 + seqLookupRecords.length * 4;
	const w = new DataWriter(size);
	w.uint16(glyphCount);
	w.uint16(seqLookupRecords.length);
	w.array('uint16', inputSequence);
	writeSeqLookupRecords(w, seqLookupRecords);
	return w.toArray();
}

function writeSeqLookupRecords(w, records) {
	for (const rec of records) {
		w.uint16(rec.sequenceIndex);
		w.uint16(rec.lookupListIndex);
	}
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAINED SEQUENCE CONTEXT (used by GPOS type 8, GSUB type 6)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a ChainedSequenceContext subtable (formats 1, 2, 3).
 * @param {DataReader} reader
 * @param {number} subtableOffset
 * @returns {object}
 */
export function parseChainedSequenceContext(reader, subtableOffset) {
	reader.seek(subtableOffset);
	const format = reader.uint16();

	if (format === 1) {
		const coverageOffset = reader.uint16();
		const chainedSeqRuleSetCount = reader.uint16();
		const chainedSeqRuleSetOffsets = [];
		for (let i = 0; i < chainedSeqRuleSetCount; i++)
			chainedSeqRuleSetOffsets.push(reader.uint16());

		const coverage = parseCoverage(reader, subtableOffset + coverageOffset);
		const chainedSeqRuleSets = chainedSeqRuleSetOffsets.map((off) =>
			off === 0 ? null : parseChainedSeqRuleSet(reader, subtableOffset + off),
		);
		return { format, coverage, chainedSeqRuleSets };
	}
	if (format === 2) {
		const coverageOffset = reader.uint16();
		const backtrackClassDefOffset = reader.uint16();
		const inputClassDefOffset = reader.uint16();
		const lookaheadClassDefOffset = reader.uint16();
		const chainedClassSeqRuleSetCount = reader.uint16();
		const chainedClassSeqRuleSetOffsets = [];
		for (let i = 0; i < chainedClassSeqRuleSetCount; i++)
			chainedClassSeqRuleSetOffsets.push(reader.uint16());

		const coverage = parseCoverage(reader, subtableOffset + coverageOffset);
		const backtrackClassDef = parseClassDef(
			reader,
			subtableOffset + backtrackClassDefOffset,
		);
		const inputClassDef = parseClassDef(
			reader,
			subtableOffset + inputClassDefOffset,
		);
		const lookaheadClassDef = parseClassDef(
			reader,
			subtableOffset + lookaheadClassDefOffset,
		);
		const chainedClassSeqRuleSets = chainedClassSeqRuleSetOffsets.map((off) =>
			off === 0
				? null
				: parseChainedClassSeqRuleSet(reader, subtableOffset + off),
		);
		return {
			format,
			coverage,
			backtrackClassDef,
			inputClassDef,
			lookaheadClassDef,
			chainedClassSeqRuleSets,
		};
	}
	if (format === 3) {
		const backtrackGlyphCount = reader.uint16();
		const backtrackCoverageOffsets = reader.array(
			'uint16',
			backtrackGlyphCount,
		);
		const inputGlyphCount = reader.uint16();
		const inputCoverageOffsets = reader.array('uint16', inputGlyphCount);
		const lookaheadGlyphCount = reader.uint16();
		const lookaheadCoverageOffsets = reader.array(
			'uint16',
			lookaheadGlyphCount,
		);
		const seqLookupCount = reader.uint16();
		const seqLookupRecords = parseSeqLookupRecords(reader, seqLookupCount);

		const backtrackCoverages = backtrackCoverageOffsets.map((off) =>
			parseCoverage(reader, subtableOffset + off),
		);
		const inputCoverages = inputCoverageOffsets.map((off) =>
			parseCoverage(reader, subtableOffset + off),
		);
		const lookaheadCoverages = lookaheadCoverageOffsets.map((off) =>
			parseCoverage(reader, subtableOffset + off),
		);
		return {
			format,
			backtrackCoverages,
			inputCoverages,
			lookaheadCoverages,
			seqLookupRecords,
		};
	}
	throw new Error(`Unknown ChainedSequenceContext format: ${format}`);
}

function parseChainedSeqRuleSet(reader, offset) {
	reader.seek(offset);
	const count = reader.uint16();
	const offsets = reader.array('uint16', count);
	return offsets.map((off) => parseChainedSeqRule(reader, offset + off));
}

function parseChainedSeqRule(reader, offset) {
	reader.seek(offset);
	const backtrackGlyphCount = reader.uint16();
	const backtrackSequence = reader.array('uint16', backtrackGlyphCount);
	const inputGlyphCount = reader.uint16();
	const inputSequence = reader.array('uint16', inputGlyphCount - 1);
	const lookaheadGlyphCount = reader.uint16();
	const lookaheadSequence = reader.array('uint16', lookaheadGlyphCount);
	const seqLookupCount = reader.uint16();
	const seqLookupRecords = parseSeqLookupRecords(reader, seqLookupCount);
	return {
		backtrackSequence,
		inputGlyphCount,
		inputSequence,
		lookaheadSequence,
		seqLookupRecords,
	};
}

function parseChainedClassSeqRuleSet(reader, offset) {
	reader.seek(offset);
	const count = reader.uint16();
	const offsets = reader.array('uint16', count);
	return offsets.map((off) => parseChainedSeqRule(reader, offset + off));
}

/**
 * Serialize a ChainedSequenceContext subtable.
 * @param {object} ctx
 * @returns {number[]}
 */
export function writeChainedSequenceContext(ctx) {
	if (ctx.format === 1) return writeChainedCtxFormat1(ctx);
	if (ctx.format === 2) return writeChainedCtxFormat2(ctx);
	if (ctx.format === 3) return writeChainedCtxFormat3(ctx);
	throw new Error(`Unknown ChainedSequenceContext format: ${ctx.format}`);
}

function writeChainedCtxFormat1(ctx) {
	const { coverage, chainedSeqRuleSets } = ctx;
	const covBytes = writeCoverage(coverage);
	const ruleSetByteArrays = chainedSeqRuleSets.map((rs) =>
		rs === null ? null : writeChainedSeqRuleSet(rs),
	);

	const headerSize = 6 + chainedSeqRuleSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const ruleSetOffsets = ruleSetByteArrays.map((ba) => {
		if (ba === null) return 0;
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(chainedSeqRuleSets.length);
	w.array('uint16', ruleSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < ruleSetByteArrays.length; i++) {
		if (ruleSetByteArrays[i]) {
			w.seek(ruleSetOffsets[i]);
			w.rawBytes(ruleSetByteArrays[i]);
		}
	}
	return w.toArray();
}

function writeChainedCtxFormat2(ctx) {
	const {
		coverage,
		backtrackClassDef,
		inputClassDef,
		lookaheadClassDef,
		chainedClassSeqRuleSets,
	} = ctx;
	const covBytes = writeCoverage(coverage);
	const btCdBytes = writeClassDef(backtrackClassDef);
	const inCdBytes = writeClassDef(inputClassDef);
	const laCdBytes = writeClassDef(lookaheadClassDef);
	const ruleSetByteArrays = chainedClassSeqRuleSets.map((rs) =>
		rs === null ? null : writeChainedSeqRuleSet(rs),
	);

	// Header: format(2) + covOff(2) + btCdOff(2) + inCdOff(2) + laCdOff(2) + count(2) + offsets(2*n)
	const headerSize = 12 + chainedClassSeqRuleSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const btCdOff = cursor;
	cursor += btCdBytes.length;
	const inCdOff = cursor;
	cursor += inCdBytes.length;
	const laCdOff = cursor;
	cursor += laCdBytes.length;
	const ruleSetOffsets = ruleSetByteArrays.map((ba) => {
		if (ba === null) return 0;
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(2);
	w.uint16(covOff);
	w.uint16(btCdOff);
	w.uint16(inCdOff);
	w.uint16(laCdOff);
	w.uint16(chainedClassSeqRuleSets.length);
	w.array('uint16', ruleSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	w.seek(btCdOff);
	w.rawBytes(btCdBytes);
	w.seek(inCdOff);
	w.rawBytes(inCdBytes);
	w.seek(laCdOff);
	w.rawBytes(laCdBytes);
	for (let i = 0; i < ruleSetByteArrays.length; i++) {
		if (ruleSetByteArrays[i]) {
			w.seek(ruleSetOffsets[i]);
			w.rawBytes(ruleSetByteArrays[i]);
		}
	}
	return w.toArray();
}

function writeChainedCtxFormat3(ctx) {
	const {
		backtrackCoverages,
		inputCoverages,
		lookaheadCoverages,
		seqLookupRecords,
	} = ctx;
	const btCovBytes = backtrackCoverages.map(writeCoverage);
	const inCovBytes = inputCoverages.map(writeCoverage);
	const laCovBytes = lookaheadCoverages.map(writeCoverage);

	// Header: format(2) + btCount(2) + btCovOff(2*n) + inCount(2) + inCovOff(2*n)
	//         + laCount(2) + laCovOff(2*n) + seqLookupCount(2) + seqLookupRecords(4*n)
	const headerSize =
		2 +
		2 +
		backtrackCoverages.length * 2 +
		2 +
		inputCoverages.length * 2 +
		2 +
		lookaheadCoverages.length * 2 +
		2 +
		seqLookupRecords.length * 4;

	let cursor = headerSize;
	const btOffsets = btCovBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});
	const inOffsets = inCovBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});
	const laOffsets = laCovBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(3);
	w.uint16(backtrackCoverages.length);
	w.array('uint16', btOffsets);
	w.uint16(inputCoverages.length);
	w.array('uint16', inOffsets);
	w.uint16(lookaheadCoverages.length);
	w.array('uint16', laOffsets);
	w.uint16(seqLookupRecords.length);
	writeSeqLookupRecords(w, seqLookupRecords);

	for (let i = 0; i < btCovBytes.length; i++) {
		w.seek(btOffsets[i]);
		w.rawBytes(btCovBytes[i]);
	}
	for (let i = 0; i < inCovBytes.length; i++) {
		w.seek(inOffsets[i]);
		w.rawBytes(inCovBytes[i]);
	}
	for (let i = 0; i < laCovBytes.length; i++) {
		w.seek(laOffsets[i]);
		w.rawBytes(laCovBytes[i]);
	}
	return w.toArray();
}

function writeChainedSeqRuleSet(rules) {
	const ruleBytes = rules.map(writeChainedSeqRule);
	const headerSize = 2 + rules.length * 2;

	let cursor = headerSize;
	const offsets = ruleBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(rules.length);
	w.array('uint16', offsets);
	for (let i = 0; i < ruleBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(ruleBytes[i]);
	}
	return w.toArray();
}

function writeChainedSeqRule(rule) {
	const {
		backtrackSequence,
		inputGlyphCount,
		inputSequence,
		lookaheadSequence,
		seqLookupRecords,
	} = rule;
	const size =
		2 +
		backtrackSequence.length * 2 +
		2 +
		inputSequence.length * 2 +
		2 +
		lookaheadSequence.length * 2 +
		2 +
		seqLookupRecords.length * 4;
	const w = new DataWriter(size);
	w.uint16(backtrackSequence.length);
	w.array('uint16', backtrackSequence);
	w.uint16(inputGlyphCount);
	w.array('uint16', inputSequence);
	w.uint16(lookaheadSequence.length);
	w.array('uint16', lookaheadSequence);
	w.uint16(seqLookupRecords.length);
	writeSeqLookupRecords(w, seqLookupRecords);
	return w.toArray();
}

// ═══════════════════════════════════════════════════════════════════════════
//  FEATURE VARIATIONS (version 1.1 tables)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a FeatureVariations table.
 * @param {DataReader} reader
 * @param {number} offset
 * @returns {object}
 */
export function parseFeatureVariations(reader, offset) {
	reader.seek(offset);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const recordCount = reader.uint32();

	const records = [];
	for (let i = 0; i < recordCount; i++) {
		records.push({
			conditionSetOffset: reader.uint32(),
			featureTableSubstitutionOffset: reader.uint32(),
		});
	}

	const featureVariationRecords = records.map((rec) => {
		const conditionSet =
			rec.conditionSetOffset !== 0
				? parseConditionSet(reader, offset + rec.conditionSetOffset)
				: null;
		const featureTableSubstitution =
			rec.featureTableSubstitutionOffset !== 0
				? parseFeatureTableSubstitution(
						reader,
						offset + rec.featureTableSubstitutionOffset,
					)
				: null;
		return { conditionSet, featureTableSubstitution };
	});

	return { majorVersion, minorVersion, featureVariationRecords };
}

function parseConditionSet(reader, offset) {
	reader.seek(offset);
	const conditionCount = reader.uint16();
	const conditionOffsets = [];
	for (let i = 0; i < conditionCount; i++)
		conditionOffsets.push(reader.uint32());

	const conditions = conditionOffsets.map((co) => {
		reader.seek(offset + co);
		const format = reader.uint16();
		if (format === 1) {
			const axisIndex = reader.uint16();
			const filterRangeMinValue = reader.int16();
			const filterRangeMaxValue = reader.int16();
			return { format, axisIndex, filterRangeMinValue, filterRangeMaxValue };
		}
		// Unknown format — store raw (shouldn't happen in practice)
		return { format, _raw: true };
	});
	return { conditions };
}

function parseFeatureTableSubstitution(reader, offset) {
	reader.seek(offset);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const substitutionCount = reader.uint16();

	const substitutions = [];
	for (let i = 0; i < substitutionCount; i++) {
		const featureIndex = reader.uint16();
		const alternateFeatureOffset = reader.uint32();
		const feature = parseFeature(reader, offset + alternateFeatureOffset);
		substitutions.push({ featureIndex, feature });
	}
	return { majorVersion, minorVersion, substitutions };
}

/**
 * Serialize a FeatureVariations table to bytes.
 * @param {object} fv
 * @returns {number[]}
 */
export function writeFeatureVariations(fv) {
	const { majorVersion, minorVersion, featureVariationRecords } = fv;

	// Serialize children first
	const childPairs = featureVariationRecords.map((rec) => ({
		csBytes: rec.conditionSet ? writeConditionSet(rec.conditionSet) : null,
		ftsBytes: rec.featureTableSubstitution
			? writeFeatureTableSubstitution(rec.featureTableSubstitution)
			: null,
	}));

	// Header: majorVersion(2) + minorVersion(2) + recordCount(4) + records(8 each)
	const headerSize = 8 + featureVariationRecords.length * 8;
	let cursor = headerSize;

	const recordOffsets = childPairs.map((cp) => {
		const csOff = cp.csBytes ? cursor : 0;
		if (cp.csBytes) cursor += cp.csBytes.length;
		const ftsOff = cp.ftsBytes ? cursor : 0;
		if (cp.ftsBytes) cursor += cp.ftsBytes.length;
		return { csOff, ftsOff };
	});

	const w = new DataWriter(cursor);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint32(featureVariationRecords.length);
	for (const ro of recordOffsets) {
		w.uint32(ro.csOff);
		w.uint32(ro.ftsOff);
	}
	for (let i = 0; i < childPairs.length; i++) {
		const cp = childPairs[i];
		if (cp.csBytes) {
			w.seek(recordOffsets[i].csOff);
			w.rawBytes(cp.csBytes);
		}
		if (cp.ftsBytes) {
			w.seek(recordOffsets[i].ftsOff);
			w.rawBytes(cp.ftsBytes);
		}
	}
	return w.toArray();
}

function writeConditionSet(cs) {
	const conditionBytes = cs.conditions.map(writeCondition);
	// Header: conditionCount(2) + offsets(4 each — Offset32)
	const headerSize = 2 + cs.conditions.length * 4;
	let cursor = headerSize;
	const offsets = conditionBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(cs.conditions.length);
	for (const off of offsets) w.uint32(off);
	for (let i = 0; i < conditionBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(conditionBytes[i]);
	}
	return w.toArray();
}

function writeCondition(cond) {
	if (cond.format === 1) {
		const w = new DataWriter(8);
		w.uint16(1);
		w.uint16(cond.axisIndex);
		w.int16(cond.filterRangeMinValue);
		w.int16(cond.filterRangeMaxValue);
		return w.toArray();
	}
	throw new Error(`Unknown Condition format: ${cond.format}`);
}

function writeFeatureTableSubstitution(fts) {
	const featureBytes = fts.substitutions.map((sub) =>
		writeFeature(sub.feature),
	);

	// Header: majorVersion(2) + minorVersion(2) + substitutionCount(2) + records(6 each: index(2)+offset(4))
	const headerSize = 6 + fts.substitutions.length * 6;
	let cursor = headerSize;
	const offsets = featureBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(fts.majorVersion);
	w.uint16(fts.minorVersion);
	w.uint16(fts.substitutions.length);
	for (let i = 0; i < fts.substitutions.length; i++) {
		w.uint16(fts.substitutions[i].featureIndex);
		w.uint32(offsets[i]);
	}
	for (let i = 0; i < featureBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(featureBytes[i]);
	}
	return w.toArray();
}
