/**
 * Font Flux JS : GSUB — Glyph Substitution Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gsub
 *
 * Lookup types:
 *   1 — Single substitution (formats 1 & 2)
 *   2 — Multiple substitution (format 1)
 *   3 — Alternate substitution (format 1)
 *   4 — Ligature substitution (format 1)
 *   5 — Contextual substitution (formats 1, 2, 3 — shared SequenceContext)
 *   6 — Chained contexts substitution (formats 1, 2, 3 — shared ChainedSequenceContext)
 *   7 — Extension substitution (format 1)
 *   8 — Reverse chained contexts single substitution (format 1)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseChainedSequenceContext,
	parseCoverage,
	parseFeatureList,
	parseFeatureVariations,
	parseLookupList,
	parseScriptList,
	parseSequenceContext,
	writeChainedSequenceContext,
	writeCoverage,
	writeFeatureList,
	writeFeatureVariations,
	writeLookupList,
	writeScriptList,
	writeSequenceContext,
} from './opentype_layout_common.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a GSUB table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseGSUB(rawBytes) {
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
		lookupList: parseLookupList(reader, lookupListOffset, parseGSUBSubtable, 7),
	};

	if (featureVariationsOffset !== 0) {
		result.featureVariations = parseFeatureVariations(
			reader,
			featureVariationsOffset,
		);
	}

	return result;
}

// --- GSUB Lookup subtable dispatcher ----------------------------------------

function parseGSUBSubtable(reader, offset, lookupType) {
	switch (lookupType) {
		case 1:
			return parseSingleSubst(reader, offset);
		case 2:
			return parseMultipleSubst(reader, offset);
		case 3:
			return parseAlternateSubst(reader, offset);
		case 4:
			return parseLigatureSubst(reader, offset);
		case 5:
			return parseSequenceContext(reader, offset);
		case 6:
			return parseChainedSequenceContext(reader, offset);
		case 7:
			return parseExtensionSubst(reader, offset);
		case 8:
			return parseReverseChainSingleSubst(reader, offset);
		default:
			throw new Error(`Unknown GSUB lookup type: ${lookupType}`);
	}
}

// --- Type 1: Single substitution --------------------------------------------

function parseSingleSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();

	if (format === 1) {
		const coverageOffset = reader.uint16();
		const deltaGlyphID = reader.int16();
		const coverage = parseCoverage(reader, offset + coverageOffset);
		return { format, coverage, deltaGlyphID };
	}
	if (format === 2) {
		const coverageOffset = reader.uint16();
		const glyphCount = reader.uint16();
		const substituteGlyphIDs = reader.array('uint16', glyphCount);
		const coverage = parseCoverage(reader, offset + coverageOffset);
		return { format, coverage, substituteGlyphIDs };
	}
	throw new Error(`Unknown SingleSubst format: ${format}`);
}

// --- Type 2: Multiple substitution ------------------------------------------

function parseMultipleSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown MultipleSubst format: ${format}`);

	const coverageOffset = reader.uint16();
	const sequenceCount = reader.uint16();
	const sequenceOffsets = reader.array('uint16', sequenceCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const sequences = sequenceOffsets.map((so) => {
		reader.seek(offset + so);
		const glyphCount = reader.uint16();
		return reader.array('uint16', glyphCount);
	});

	return { format, coverage, sequences };
}

// --- Type 3: Alternate substitution -----------------------------------------

function parseAlternateSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown AlternateSubst format: ${format}`);

	const coverageOffset = reader.uint16();
	const alternateSetCount = reader.uint16();
	const alternateSetOffsets = reader.array('uint16', alternateSetCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const alternateSets = alternateSetOffsets.map((aso) => {
		reader.seek(offset + aso);
		const glyphCount = reader.uint16();
		return reader.array('uint16', glyphCount);
	});

	return { format, coverage, alternateSets };
}

// --- Type 4: Ligature substitution ------------------------------------------

function parseLigatureSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown LigatureSubst format: ${format}`);

	const coverageOffset = reader.uint16();
	const ligatureSetCount = reader.uint16();
	const ligatureSetOffsets = reader.array('uint16', ligatureSetCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const ligatureSets = ligatureSetOffsets.map((lso) => {
		const lsOffset = offset + lso;
		reader.seek(lsOffset);
		const ligatureCount = reader.uint16();
		const ligatureOffsets = reader.array('uint16', ligatureCount);
		return ligatureOffsets.map((lo) => {
			reader.seek(lsOffset + lo);
			const ligatureGlyph = reader.uint16();
			const componentCount = reader.uint16();
			const componentGlyphIDs = reader.array('uint16', componentCount - 1);
			return { ligatureGlyph, componentCount, componentGlyphIDs };
		});
	});

	return { format, coverage, ligatureSets };
}

// --- Type 7: Extension substitution -----------------------------------------

function parseExtensionSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1) throw new Error(`Unknown ExtensionSubst format: ${format}`);

	const extensionLookupType = reader.uint16();
	const extensionOffset = reader.uint32();

	// Parse the actual subtable at offset + extensionOffset
	const subtable = parseGSUBSubtable(
		reader,
		offset + extensionOffset,
		extensionLookupType,
	);

	return { format, extensionLookupType, extensionOffset, subtable };
}

// --- Type 8: Reverse chained contexts single substitution -------------------

function parseReverseChainSingleSubst(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	if (format !== 1)
		throw new Error(`Unknown ReverseChainSingleSubst format: ${format}`);

	const coverageOffset = reader.uint16();
	const backtrackGlyphCount = reader.uint16();
	const backtrackCoverageOffsets = reader.array('uint16', backtrackGlyphCount);
	const lookaheadGlyphCount = reader.uint16();
	const lookaheadCoverageOffsets = reader.array('uint16', lookaheadGlyphCount);
	const glyphCount = reader.uint16();
	const substituteGlyphIDs = reader.array('uint16', glyphCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const backtrackCoverages = backtrackCoverageOffsets.map((o) =>
		parseCoverage(reader, offset + o),
	);
	const lookaheadCoverages = lookaheadCoverageOffsets.map((o) =>
		parseCoverage(reader, offset + o),
	);

	return {
		format,
		coverage,
		backtrackCoverages,
		lookaheadCoverages,
		substituteGlyphIDs,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Serialize a GSUB table to bytes.
 * @param {object} gsub
 * @returns {number[]}
 */
export function writeGSUB(gsub) {
	const { majorVersion, minorVersion } = gsub;

	const scriptListBytes = writeScriptList(gsub.scriptList);
	const featureListBytes = writeFeatureList(gsub.featureList);
	const lookupListBytes = writeLookupList(
		gsub.lookupList,
		writeGSUBSubtable,
		7,
	);
	const featureVarBytes = gsub.featureVariations
		? writeFeatureVariations(gsub.featureVariations)
		: null;

	// Header: version(4) + 3 offsets(2 each) = 10 for v1.0
	// v1.1: + featureVariationsOffset(4) = 14
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

// --- GSUB Lookup subtable writer dispatcher ---------------------------------

function writeGSUBSubtable(subtable, lookupType) {
	switch (lookupType) {
		case 1:
			return writeSingleSubst(subtable);
		case 2:
			return writeMultipleSubst(subtable);
		case 3:
			return writeAlternateSubst(subtable);
		case 4:
			return writeLigatureSubst(subtable);
		case 5:
			return writeSequenceContext(subtable);
		case 6:
			return writeChainedSequenceContext(subtable);
		case 7:
			return writeExtensionSubst(subtable);
		case 8:
			return writeReverseChainSingleSubst(subtable);
		default:
			throw new Error(`Unknown GSUB lookup type: ${lookupType}`);
	}
}

// --- Type 1 writer ----------------------------------------------------------

function writeSingleSubst(st) {
	const covBytes = writeCoverage(st.coverage);

	if (st.format === 1) {
		// format(2) + coverageOff(2) + deltaGlyphID(2) = 6
		const headerSize = 6;
		const covOff = headerSize;
		const w = new DataWriter(headerSize + covBytes.length);
		w.uint16(1);
		w.uint16(covOff);
		w.int16(st.deltaGlyphID);
		w.seek(covOff);
		w.rawBytes(covBytes);
		return w.toArray();
	}
	if (st.format === 2) {
		// format(2) + coverageOff(2) + glyphCount(2) + glyphIDs(2*n) = 6 + 2n
		const headerSize = 6 + st.substituteGlyphIDs.length * 2;
		const covOff = headerSize;
		const w = new DataWriter(headerSize + covBytes.length);
		w.uint16(2);
		w.uint16(covOff);
		w.uint16(st.substituteGlyphIDs.length);
		w.array('uint16', st.substituteGlyphIDs);
		w.seek(covOff);
		w.rawBytes(covBytes);
		return w.toArray();
	}
	throw new Error(`Unknown SingleSubst format: ${st.format}`);
}

// --- Type 2 writer ----------------------------------------------------------

function writeMultipleSubst(st) {
	const covBytes = writeCoverage(st.coverage);
	const seqBytes = st.sequences.map((seq) => {
		const w = new DataWriter(2 + seq.length * 2);
		w.uint16(seq.length);
		w.array('uint16', seq);
		return w.toArray();
	});

	// Header: format(2) + covOff(2) + seqCount(2) + seqOffsets(2*n)
	const headerSize = 6 + st.sequences.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const seqOffsets = seqBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(st.sequences.length);
	w.array('uint16', seqOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < seqBytes.length; i++) {
		w.seek(seqOffsets[i]);
		w.rawBytes(seqBytes[i]);
	}
	return w.toArray();
}

// --- Type 3 writer ----------------------------------------------------------

function writeAlternateSubst(st) {
	const covBytes = writeCoverage(st.coverage);
	const altSetBytes = st.alternateSets.map((altSet) => {
		const w = new DataWriter(2 + altSet.length * 2);
		w.uint16(altSet.length);
		w.array('uint16', altSet);
		return w.toArray();
	});

	const headerSize = 6 + st.alternateSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const altSetOffsets = altSetBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(st.alternateSets.length);
	w.array('uint16', altSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < altSetBytes.length; i++) {
		w.seek(altSetOffsets[i]);
		w.rawBytes(altSetBytes[i]);
	}
	return w.toArray();
}

// --- Type 4 writer ----------------------------------------------------------

function writeLigatureSubst(st) {
	const covBytes = writeCoverage(st.coverage);
	const ligSetBytes = st.ligatureSets.map(writeLigatureSet);

	const headerSize = 6 + st.ligatureSets.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const ligSetOffsets = ligSetBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(st.ligatureSets.length);
	w.array('uint16', ligSetOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < ligSetBytes.length; i++) {
		w.seek(ligSetOffsets[i]);
		w.rawBytes(ligSetBytes[i]);
	}
	return w.toArray();
}

function writeLigatureSet(ligatures) {
	const ligBytes = ligatures.map((lig) => {
		const size = 4 + (lig.componentCount - 1) * 2;
		const w = new DataWriter(size);
		w.uint16(lig.ligatureGlyph);
		w.uint16(lig.componentCount);
		w.array('uint16', lig.componentGlyphIDs);
		return w.toArray();
	});

	const headerSize = 2 + ligatures.length * 2;
	let cursor = headerSize;
	const offsets = ligBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(ligatures.length);
	w.array('uint16', offsets);
	for (let i = 0; i < ligBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(ligBytes[i]);
	}
	return w.toArray();
}

// --- Type 7 writer ----------------------------------------------------------

function writeExtensionSubst(st) {
	const innerBytes = writeGSUBSubtable(st.subtable, st.extensionLookupType);
	// format(2) + extensionLookupType(2) + extensionOffset(4) = 8
	const headerSize = 8;
	const w = new DataWriter(headerSize + innerBytes.length);
	w.uint16(1);
	w.uint16(st.extensionLookupType);
	w.uint32(headerSize); // extension subtable immediately follows header
	w.rawBytes(innerBytes);
	return w.toArray();
}

// --- Type 8 writer ----------------------------------------------------------

function writeReverseChainSingleSubst(st) {
	const covBytes = writeCoverage(st.coverage);
	const btCovBytes = st.backtrackCoverages.map(writeCoverage);
	const laCovBytes = st.lookaheadCoverages.map(writeCoverage);

	// Header: format(2) + covOff(2) + btCount(2) + btCovOff(2*n) + laCount(2) + laCovOff(2*n)
	//         + glyphCount(2) + substituteGlyphIDs(2*n)
	const headerSize =
		2 +
		2 +
		2 +
		st.backtrackCoverages.length * 2 +
		2 +
		st.lookaheadCoverages.length * 2 +
		2 +
		st.substituteGlyphIDs.length * 2;

	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const btOffsets = btCovBytes.map((ba) => {
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
	w.uint16(1);
	w.uint16(covOff);
	w.uint16(st.backtrackCoverages.length);
	w.array('uint16', btOffsets);
	w.uint16(st.lookaheadCoverages.length);
	w.array('uint16', laOffsets);
	w.uint16(st.substituteGlyphIDs.length);
	w.array('uint16', st.substituteGlyphIDs);

	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < btCovBytes.length; i++) {
		w.seek(btOffsets[i]);
		w.rawBytes(btCovBytes[i]);
	}
	for (let i = 0; i < laCovBytes.length; i++) {
		w.seek(laOffsets[i]);
		w.rawBytes(laCovBytes[i]);
	}
	return w.toArray();
}
