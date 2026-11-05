// Link previews for invite links (/join/CODE). Messenger, WhatsApp, iMessage and other
// apps fetch the page without running JavaScript, so vercel.json sends their crawlers
// here for a small HTML page with the roll's name and cover in Open Graph tags.
//   GET /api/join-preview?code=CODE          -> preview HTML
//   GET /api/join-preview?code=CODE&image=1  -> the roll's uploaded cover, streamed
// Env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (already set for the
// web build) and SUPABASE_SERVICE_ROLE_KEY (only needed to show uploaded covers).

const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;
const PRESET_PATTERN = /^preset:([1-9][0-9]?)$/;
const COVER_PATH_PATTERN = /^[0-9a-f-]{36}\/cover\/[A-Za-z0-9._-]+$/;
const MEDIA_BUCKET = 'event-media';
const PRESET_COUNT = 5;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const PAGE_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600';
const IMAGE_CACHE = 'public, max-age=3600, s-maxage=86400';

interface EventPreview {
  name: string;
  cover: string | null;
  host_name: string;
}

interface OgImage {
  url: string;
  /** Known for our own 1200×630 files; uploaded covers can be any shape. */
  isSized: boolean;
}

/** Read per request (not at import) so env changes apply without a cold-start surprise. */
function readEnv() {
  const orNull = (value: string | undefined) => (value && value.length > 0 ? value : null);
  return {
    supabaseUrl: orNull(process.env.EXPO_PUBLIC_SUPABASE_URL),
    publishableKey: orNull(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    serviceKey: orNull(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

/** Legacy keys are JWTs and go in Authorization too; new sb_* keys only go in `apikey`. */
function supabaseHeaders(key: string): Record<string, string> {
  return key.startsWith('eyJ') ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

async function fetchPreview(code: string): Promise<EventPreview | null> {
  const { supabaseUrl: url, publishableKey: key } = readEnv();
  if (!url || !key) {
    console.error('join-preview: Supabase URL or publishable key is not set');
    return null;
  }
  const response = await fetch(`${url}/rest/v1/rpc/get_event_preview`, {
    method: 'POST',
    headers: { ...supabaseHeaders(key), 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    console.error('join-preview: preview lookup failed', response.status, await response.text());
    return null;
  }
  const rows = (await response.json()) as EventPreview[];
  return rows[0] ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ogImage(origin: string, code: string, cover: string | null): OgImage {
  const preset = cover?.match(PRESET_PATTERN);
  if (preset && Number(preset[1]) <= PRESET_COUNT) {
    return { url: `${origin}/og/preset-${preset[1]}.jpg`, isSized: true };
  }
  if (cover && COVER_PATH_PATTERN.test(cover) && readEnv().serviceKey) {
    return { url: `${origin}/api/join-preview?code=${code}&image=1`, isSized: false };
  }
  return { url: `${origin}/og/default.jpg`, isSized: true };
}

function previewHtml(origin: string, code: string, preview: EventPreview | null): string {
  const pageUrl = `${origin}/join/${code}`;
  const title = preview ? preview.name : 'Join a roll on Ikausa';
  const description = preview
    ? `${preview.host_name} invited you to shoot on this roll. Everyone's photos stay hidden until it ends.`
    : 'A shared film camera for your event. Everyone shoots, nobody peeks until the end.';
  const image = ogImage(origin, code, preview?.cover ?? null);
  const size = image.isSized
    ? `<meta property="og:image:width" content="${OG_WIDTH}">\n<meta property="og:image:height" content="${OG_HEIGHT}">`
    : '';
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${preview ? `${t} · Ikausa` : t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ikausa">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${escapeHtml(image.url)}">
<meta property="og:image:alt" content="${t}">
${size}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${escapeHtml(image.url)}">
</head>
<body><a href="${pageUrl}">Open ${t} in Ikausa</a></body>
</html>`;
}

/** Streams the roll's uploaded cover from the private bucket; only that one file. */
async function coverResponse(code: string): Promise<Response> {
  const { supabaseUrl: url, serviceKey } = readEnv();
  const preview = await fetchPreview(code);
  const cover = preview?.cover;
  if (!url || !serviceKey || !cover || !COVER_PATH_PATTERN.test(cover)) {
    return new Response('Not found', { status: 404 });
  }
  const file = await fetch(`${url}/storage/v1/object/${MEDIA_BUCKET}/${cover}`, {
    headers: supabaseHeaders(serviceKey),
  });
  if (!file.ok || !file.body) {
    console.error('join-preview: cover download failed', file.status);
    return new Response('Not found', { status: 404 });
  }
  return new Response(file.body, {
    headers: {
      'Content-Type': file.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': IMAGE_CACHE,
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = (requestUrl.searchParams.get('code') ?? '').trim().toUpperCase();
  const origin = `https://${request.headers.get('x-forwarded-host') ?? requestUrl.host}`;
  if (!CODE_PATTERN.test(code)) return new Response('Not found', { status: 404 });

  if (requestUrl.searchParams.has('image')) return coverResponse(code);

  let preview: EventPreview | null = null;
  try {
    preview = await fetchPreview(code);
  } catch (error) {
    // Still answer with the generic preview so the link never shows nothing.
    console.error('join-preview: lookup threw', error);
  }
  return new Response(previewHtml(origin, code, preview), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': PAGE_CACHE },
  });
}
