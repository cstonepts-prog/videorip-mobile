import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidVideoUrl, sanitiseFilename, validateRenameInput, clampProgress,
  contentDispositionFilename, finalFilenameFromResponse, isManagedFileUri,
} from '../src/utils/downloadUtils.js';

test('HTTP(S) URL validation accepts web media URLs and rejects malformed values', () => {
  assert.equal(isValidVideoUrl('https://cdn.example.test/clip.mp4'), true);
  assert.equal(isValidVideoUrl('http://cdn.example.test/clip.mp4'), true);
  assert.equal(isValidVideoUrl('ftp://cdn.example.test/clip.mp4'), false);
  assert.equal(isValidVideoUrl('not-a-url'), false);
});

test('filename creation strips traversal and unsafe filename characters', () => {
  assert.equal(sanitiseFilename('../../etc/passwd'), 'etc_passwd');
  assert.equal(sanitiseFilename('my video?.mp4'), 'my video_.mp4');
});

test('rename input rejects path traversal', () => {
  assert.throws(() => validateRenameInput('../secret'), /path characters/i);
  assert.equal(validateRenameInput('clip.mp4'), 'clip.mp4');
});

test('content-disposition filename is preferred and sanitised', () => {
  assert.equal(contentDispositionFilename('attachment; filename="clip.mp4"'), 'clip.mp4');
  assert.equal(contentDispositionFilename("attachment; filename*=UTF-8''my%20clip.mp4"), 'my clip.mp4');
});

test('progress clamps on both bounds and preserves indeterminate state', () => {
  assert.equal(clampProgress(-1), 0);
  assert.equal(clampProgress(2), 1);
  assert.equal(clampProgress(0.4), 0.4);
  assert.equal(clampProgress(null), null);
});

test('final response Content-Disposition overrides fallback filename safely', () => {
  const name = finalFilenameFromResponse({
    headers: { get: (k) => k.toLowerCase() === 'content-disposition' ? 'attachment; filename="final.mp4"' : null },
    url: 'https://cdn.example.test/ignored.bin',
    fallback: 'fallback.mp4',
    mimeType: 'video/mp4',
  });
  assert.equal(name, 'final.mp4');
});

test('managed file URI containment rejects traversal, nested paths, and sibling prefixes', () => {
  const dir = 'file:///data/user/0/app.videorip.mobile/files/downloads/';
  assert.equal(isManagedFileUri('file:///data/user/0/app.videorip.mobile/files/downloads/clip.mp4', dir), true);
  assert.equal(isManagedFileUri('file:///data/user/0/app.videorip.mobile/files/downloads/../clip.mp4', dir), false);
  assert.equal(isManagedFileUri('file:///data/user/0/app.videorip.mobile/files/downloads/sub/clip.mp4', dir), false);
});
