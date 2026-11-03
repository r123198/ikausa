// Web never produces file: URIs; captures and picks are blob:/data: and go through fetch.
export function readFileBytes(uri: string): Promise<ArrayBuffer> {
  return Promise.reject(new Error(`File URIs are not readable on web: ${uri}`));
}
