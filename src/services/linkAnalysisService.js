import { classifyMedia } from '../utils/mediaUtils.js';
import { contentDispositionFilename, contentLengthFromHeaders, headerValue, sanitiseFilename } from '../utils/downloadUtils.js';

export const LINK_ERROR = Object.freeze({
  INVALID_URL: 'INVALID_URL', NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE', HTTP_ERROR: 'HTTP_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED', REDIRECT_ERROR: 'REDIRECT_ERROR', NOT_MEDIA: 'NOT_MEDIA',
  UNSUPPORTED_SOURCE: 'UNSUPPORTED_SOURCE', PROTECTED_SOURCE: 'PROTECTED_SOURCE',
});

export function normaliseUrl(value) {
  const input = String(value || '').trim().replace(/^[<\s]+|[>\s]+$/g, '');
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw Object.assign(new Error('Enter a valid HTTP or HTTPS URL.'), { code: LINK_ERROR.INVALID_URL });
  return url.toString();
}

function responseClass(response, originalUrl) {
  const contentType = headerValue(response.headers, 'content-type') || '';
  const contentDisposition = headerValue(response.headers, 'content-disposition') || '';
  const classified = classifyMedia({ mimeType: contentType, uri: response.url || originalUrl });
  const status = response.status;
  if ([401, 403].includes(status)) return { sourceType: 'protected', mediaType: 'unknown', protected: true };
  if (/text\/html|application\/xhtml\+xml/i.test(contentType)) return { sourceType: 'webpage', mediaType: 'document', protected: false };
  return { ...classified, protected: false, contentDisposition };
}

async function fetchMetadata(url, method = 'HEAD') {
  return fetch(url, { method, redirect: 'follow', headers: method === 'GET' ? { Range: 'bytes=0-65535' } : undefined });
}

export async function analyseUrl(value) {
  const originalUrl = normaliseUrl(value);
  let response;
  try {
    response = await fetchMetadata(originalUrl, 'HEAD');
    if ([405, 501].includes(response.status) || !headerValue(response.headers, 'content-type')) response = await fetchMetadata(originalUrl, 'GET');
  } catch (error) {
    throw Object.assign(new Error(`Could not reach the source: ${error.message}`), { code: LINK_ERROR.NETWORK_UNAVAILABLE });
  }
  if ([401, 403].includes(response.status)) throw Object.assign(new Error('This source requires authentication or access permission. VideoRip will not bypass it.'), { code: LINK_ERROR.AUTH_REQUIRED });
  if (!response.ok && response.status !== 206) throw Object.assign(new Error(`Source returned HTTP ${response.status}.`), { code: LINK_ERROR.HTTP_ERROR, status: response.status });
  const classification = responseClass(response, originalUrl);
  const resolvedUrl = response.url || originalUrl;
  const contentType = headerValue(response.headers, 'content-type') || null;
  const size = contentLengthFromHeaders(response.headers);
  const acceptRanges = headerValue(response.headers, 'accept-ranges') || null;
  const supplied = contentDispositionFilename(headerValue(response.headers, 'content-disposition'));
  const pathName = (() => { try { return decodeURIComponent(new URL(resolvedUrl).pathname.split('/').filter(Boolean).pop() || ''); } catch { return ''; } })();
  const filename = sanitiseFilename(supplied || pathName || `media_${Date.now()}`, `media_${Date.now()}`);
  return {
    originalUrl, resolvedUrl, status: response.status, contentType, size, acceptRanges,
    filename, ...classification,
    acquirable: classification.sourceType !== 'webpage' && classification.sourceType !== 'protected',
    inspectable: Boolean(contentType || classification.sourceType !== 'unknown'),
    playable: classification.playable,
    candidates: classification.sourceType === 'webpage' ? [] : [{ url: resolvedUrl, filename, contentType, size, sourceType: classification.sourceType, mediaType: classification.mediaType }],
  };
}

export function discoverMediaCandidatesFromHtml(html, baseUrl) {
  const text = String(html || '');
  const matches = new Set();
  const pattern = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(text))) {
    try {
      const url = new URL(match[1], baseUrl).toString();
      const c = classifyMedia({ uri: url });
      if (c.mediaType !== 'unknown') matches.add(url);
    } catch { /* ignore malformed candidate */ }
  }
  return [...matches].slice(0, 50).map((url) => ({ url, ...classifyMedia({ uri: url }) }));
}

export async function analysePublicPage(value) {
  const base = normaliseUrl(value);
  let response;
  try { response = await fetch(base, { redirect: 'follow' }); }
  catch (error) { throw Object.assign(new Error(`Could not load page: ${error.message}`), { code: LINK_ERROR.NETWORK_UNAVAILABLE }); }
  if ([401, 403].includes(response.status)) throw Object.assign(new Error('This page requires access permission. VideoRip will not bypass it.'), { code: LINK_ERROR.AUTH_REQUIRED });
  if (!response.ok) throw Object.assign(new Error(`Page returned HTTP ${response.status}.`), { code: LINK_ERROR.HTTP_ERROR });
  const type = headerValue(response.headers, 'content-type') || '';
  if (!/text\/html|application\/xhtml\+xml/i.test(type)) return analyseUrl(response.url || base);
  const text = await response.text();
  return { originalUrl: base, resolvedUrl: response.url || base, sourceType: 'webpage', mediaType: 'document', contentType: type, candidates: discoverMediaCandidatesFromHtml(text, response.url || base), acquirable: false, inspectable: true, playable: false };
}
