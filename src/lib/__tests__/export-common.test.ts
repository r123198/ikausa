import { downloadUrls, type Photo } from '@/lib/events';
import { EXPORT_MESSAGES, ExportError, exportErrorMessage, prepareUrls } from '@/lib/export-common';

jest.mock('@/lib/events', () => ({ downloadUrls: jest.fn() }));

const sign = downloadUrls as jest.Mock;
const photos = [{ path: 'a.jpg' }, { path: 'b.jpg' }] as Photo[];

describe('prepareUrls', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('returns a link for every photo', async () => {
    sign.mockResolvedValue(['1', '2']);

    await expect(prepareUrls(photos)).resolves.toEqual(['1', '2']);
  });

  test('fails when any photo could not be signed', async () => {
    sign.mockResolvedValue(['1']);

    await expect(prepareUrls(photos)).rejects.toThrow(EXPORT_MESSAGES.partial);
  });

  test('reports a network failure as offline', async () => {
    sign.mockRejectedValue(new Error('Network request failed'));

    await expect(prepareUrls(photos)).rejects.toThrow(EXPORT_MESSAGES.offline);
  });
});

describe('exportErrorMessage', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  test('shows an ExportError as written', () => {
    expect(exportErrorMessage(new ExportError('Plain copy'))).toBe('Plain copy');
  });

  test('hides the raw text of an unknown error', () => {
    expect(exportErrorMessage(new Error('SQLSTATE 42P01'))).toBe(EXPORT_MESSAGES.unknown);
  });
});
