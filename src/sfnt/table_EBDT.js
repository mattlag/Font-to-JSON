/**
 * Font Flux JS : EBDT table
 * Embedded Bitmap Data Table
 */

import { parseCBDT, writeCBDT, writeCBDTComputeOffsets } from './table_CBDT.js';

export function parseEBDT(rawBytes, tables) {
	// Map EBLC → CBLC so parseCBDT can find the index info
	return parseCBDT(rawBytes, tables?.EBLC ? { CBLC: tables.EBLC } : tables);
}

export function writeEBDT(ebdt) {
	return writeCBDT(ebdt);
}

export { writeCBDTComputeOffsets as writeEBDTComputeOffsets };
