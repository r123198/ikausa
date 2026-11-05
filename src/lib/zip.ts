/**
 * Minimal ZIP writer for exporting a roll on the web as one download.
 * Files are stored, not compressed: photos are already JPEG-compressed, so deflating
 * them would cost time and save almost nothing.
 */

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_DIRECTORY = 0x06054b50;
const VERSION = 20;
/** General purpose flag bit 11: file names are UTF-8. */
const UTF8_NAMES = 0x0800;
const STORED = 0;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_SIZE = 22;
/** Classic ZIP limits; ZIP64 isn't needed for a roll of photos. */
const MAX_ENTRIES = 0xffff;
const MAX_BYTES = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date fields, which is what ZIP stores. */
function dosDateTime(date: Date): { time: number; day: number } {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

export function createZip(entries: ZipEntry[], modified: Date = new Date()): Uint8Array<ArrayBuffer> {
  if (entries.length > MAX_ENTRIES) throw new Error('Too many files for one zip.');
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(modified);
  const prepared = entries.map((entry) => ({
    name: encoder.encode(entry.name),
    data: entry.data,
    crc: crc32(entry.data),
  }));

  const localSize = prepared.reduce((sum, e) => sum + LOCAL_HEADER_SIZE + e.name.length + e.data.length, 0);
  const centralSize = prepared.reduce((sum, e) => sum + CENTRAL_HEADER_SIZE + e.name.length, 0);
  const total = localSize + centralSize + END_SIZE;
  if (total > MAX_BYTES) throw new Error('The roll is too large for one zip.');

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  const offsets: number[] = [];
  let at = 0;

  for (const entry of prepared) {
    offsets.push(at);
    view.setUint32(at, LOCAL_HEADER, true);
    view.setUint16(at + 4, VERSION, true);
    view.setUint16(at + 6, UTF8_NAMES, true);
    view.setUint16(at + 8, STORED, true);
    view.setUint16(at + 10, time, true);
    view.setUint16(at + 12, day, true);
    view.setUint32(at + 14, entry.crc, true);
    view.setUint32(at + 18, entry.data.length, true);
    view.setUint32(at + 22, entry.data.length, true);
    view.setUint16(at + 26, entry.name.length, true);
    view.setUint16(at + 28, 0, true);
    out.set(entry.name, at + LOCAL_HEADER_SIZE);
    out.set(entry.data, at + LOCAL_HEADER_SIZE + entry.name.length);
    at += LOCAL_HEADER_SIZE + entry.name.length + entry.data.length;
  }

  const centralStart = at;
  prepared.forEach((entry, i) => {
    view.setUint32(at, CENTRAL_HEADER, true);
    view.setUint16(at + 4, VERSION, true);
    view.setUint16(at + 6, VERSION, true);
    view.setUint16(at + 8, UTF8_NAMES, true);
    view.setUint16(at + 10, STORED, true);
    view.setUint16(at + 12, time, true);
    view.setUint16(at + 14, day, true);
    view.setUint32(at + 16, entry.crc, true);
    view.setUint32(at + 20, entry.data.length, true);
    view.setUint32(at + 24, entry.data.length, true);
    view.setUint16(at + 28, entry.name.length, true);
    // Extra field, comment, disk number, internal and external attributes are all zero.
    view.setUint32(at + 42, offsets[i], true);
    out.set(entry.name, at + CENTRAL_HEADER_SIZE);
    at += CENTRAL_HEADER_SIZE + entry.name.length;
  });

  view.setUint32(at, END_OF_DIRECTORY, true);
  view.setUint16(at + 8, prepared.length, true);
  view.setUint16(at + 10, prepared.length, true);
  view.setUint32(at + 12, centralSize, true);
  view.setUint32(at + 16, centralStart, true);
  return out;
}
