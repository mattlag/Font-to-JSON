/**
 * Font Flux JS : bdat table
 * Apple Bitmap Data Table — binary-identical to EBDT/CBDT.
 */

import { parseCBDT, writeCBDT, writeCBDTComputeOffsets } from './table_CBDT.js';

export function parseBdat(rawBytes, tables) {
	// Map bloc → CBLC so parseCBDT can find the index info
	return parseCBDT(rawBytes, tables?.bloc ? { CBLC: tables.bloc } : tables);
}

export function writeBdat(bdat) {
	return writeCBDT(bdat);
}

export { writeCBDTComputeOffsets as writeBdatComputeOffsets };
