/**
 * Font-to-JSON : hdmx table
 * Horizontal Device Metrics Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const HDMX_HEADER_SIZE = 8;

export function parseHdmx(rawBytes, tables) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const numRecords = reader.uint16();
	const sizeDeviceRecord = reader.uint32();

	const numGlyphs = tables?.maxp?.numGlyphs;
	const records = [];

	for (let i = 0; i < numRecords; i++) {
		const start = reader.position;
		if (start + sizeDeviceRecord > rawBytes.length || sizeDeviceRecord < 2) {
			break;
		}

		const pixelSize = reader.uint8();
		const maxWidth = reader.uint8();
		const payloadSize = sizeDeviceRecord - 2;
		const widthCount =
			typeof numGlyphs === 'number'
				? Math.min(numGlyphs, payloadSize)
				: payloadSize;
		const widths = reader.bytes(widthCount);
		const padCount = payloadSize - widthCount;
		const padding = padCount > 0 ? reader.bytes(padCount) : [];

		records.push({
			pixelSize,
			maxWidth,
			widths,
			padding,
		});
	}

	return {
		version,
		numRecords,
		sizeDeviceRecord,
		records,
	};
}

export function writeHdmx(hdmx) {
	const version = hdmx.version ?? 0;
	const records = hdmx.records ?? [];
	const inferredWidths = Math.max(0, ...records.map((r) => (r.widths ?? []).length));
	const inferredRecordSize = alignTo4(2 + inferredWidths);
	const sizeDeviceRecord = hdmx.sizeDeviceRecord ?? inferredRecordSize;
	const safeRecordSize = Math.max(2, sizeDeviceRecord);

	const totalSize = HDMX_HEADER_SIZE + safeRecordSize * records.length;
	const w = new DataWriter(totalSize);
	w.uint16(version);
	w.uint16(records.length);
	w.uint32(safeRecordSize);

	for (const record of records) {
		w.uint8(record.pixelSize ?? 0);
		w.uint8(record.maxWidth ?? 0);

		const payloadSize = safeRecordSize - 2;
		const widths = (record.widths ?? []).slice(0, payloadSize);
		const padSource = record.padding ?? [];
		const bytes = widths.concat(padSource).slice(0, payloadSize);
		while (bytes.length < payloadSize) {
			bytes.push(0);
		}
		w.rawBytes(bytes);
	}

	return w.toArray();
}

function alignTo4(value) {
	return value + ((4 - (value % 4)) % 4);
}
