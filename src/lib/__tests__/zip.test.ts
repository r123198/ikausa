/// <reference types="node" />
// Runs under Jest in Node; the app's tsconfig only loads Jest's types.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { crc32, createZip } from '@/lib/zip';

const encode = (text: string) => new TextEncoder().encode(text);

describe('crc32', () => {
  test('matches the standard check value', () => {
    expect(crc32(encode('123456789'))).toBe(0xcbf43926);
  });

  test('is zero for no data', () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe('createZip', () => {
  const files = [
    { name: 'our-anniversary-01.jpg', data: encode('first photo') },
    { name: 'Ñandú-02.jpg', data: encode('second photo, unicode name') },
  ];

  test('starts with a local file header and ends with the end-of-directory record', () => {
    const zip = createZip(files);
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.byteLength - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(zip.byteLength - 12, true)).toBe(files.length);
  });

  test('passes the system unzip integrity check', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ikausa-zip-'));
    const zipPath = join(dir, 'roll.zip');
    writeFileSync(zipPath, createZip(files));

    expect(() => execFileSync('unzip', ['-tq', zipPath])).not.toThrow();
  });

  test('reads back every file intact, unicode names included', () => {
    // Python's zipfile honours the UTF-8 name flag (macOS's bundled unzip 6.0 doesn't).
    const dir = mkdtempSync(join(tmpdir(), 'ikausa-zip-'));
    const zipPath = join(dir, 'roll.zip');
    writeFileSync(zipPath, createZip(files));

    const listing = execFileSync('python3', [
      '-I',
      '-c',
      'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({n: z.read(n).decode() for n in z.namelist()}))',
      zipPath,
    ]).toString();

    expect(JSON.parse(listing)).toEqual(
      Object.fromEntries(files.map((f) => [f.name, new TextDecoder().decode(f.data)]))
    );
  });
});
