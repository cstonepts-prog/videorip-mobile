import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMedia, sourceHintForPlayer, matchesLibrarySearch } from '../src/utils/mediaUtils.js';
import { discoverMediaCandidatesFromHtml, normaliseUrl } from '../src/services/linkAnalysisService.js';
import { validateSettings } from '../src/utils/settingsUtils.js';

test('media classifier distinguishes progressive, HLS, DASH, audio, HTML and unknown sources', () => {
  assert.equal(classifyMedia({ uri: 'https://x.test/a.mp4', mimeType: 'video/mp4' }).sourceType, 'progressive');
  assert.equal(classifyMedia({ uri: 'https://x.test/a.m3u8' }).sourceType, 'hls');
  assert.equal(classifyMedia({ uri: 'https://x.test/a.mpd', mimeType: 'application/dash+xml' }).sourceType, 'dash');
  assert.equal(classifyMedia({ uri: 'https://x.test/a.mp3', mimeType: 'audio/mpeg' }).mediaType, 'audio');
  assert.equal(classifyMedia({ mimeType: 'text/html' }).mediaType, 'document');
});

test('player source hint includes HLS/DASH contentType when needed', () => {
  assert.deepEqual(sourceHintForPlayer({ uri: 'https://x.test/a.m3u8', sourceType: 'hls' }), { uri: 'https://x.test/a.m3u8', contentType: 'hls' });
  assert.deepEqual(sourceHintForPlayer({ uri: 'https://x.test/a.mpd', sourceType: 'dash' }), { uri: 'https://x.test/a.mpd', contentType: 'dash' });
  assert.equal(sourceHintForPlayer({ uri: 'https://x.test/a.mp4', sourceType: 'progressive' }), 'https://x.test/a.mp4');
});

test('public HTML media candidate discovery resolves relative URLs and rejects unrelated links', () => {
  const html = '<a href="/videos/clip.mp4">v</a><video src="https://cdn.example.test/stream.m3u8"></video><a href="/about">x</a>';
  const candidates = discoverMediaCandidatesFromHtml(html, 'https://site.example.test/page');
  assert.ok(candidates.some((c) => c.url.includes('clip.mp4')));
  assert.ok(candidates.some((c) => c.url.includes('stream.m3u8')));
  assert.ok(!candidates.some((c) => c.url.includes('/about')));
});

test('URL normalisation accepts HTTP(S) and rejects unsafe schemes', () => {
  assert.equal(normaliseUrl(' https://cdn.example.test/a.mp4 '), 'https://cdn.example.test/a.mp4');
  assert.throws(() => normaliseUrl('javascript:alert(1)'), /valid HTTP or HTTPS/i);
});

test('settings validation clamps concurrency, thresholds and playback speed', () => {
  const v = validateSettings({ concurrentDownloads: 0, chargingOnlyThresholdMb: 99999, defaultPlaybackSpeed: 9 });
  assert.equal(v.concurrentDownloads, 1);
  assert.equal(v.chargingOnlyThresholdMb, 10000);
  assert.equal(v.defaultPlaybackSpeed, 3);
});

test('library search covers source, type and names', () => {
  const item = { name: 'Demo', originalName: 'demo_src.mp4', sourceUrl: 'https://cdn.example.test/demo', mediaType: 'video', container: 'MP4' };
  assert.equal(matchesLibrarySearch(item, 'demo'), true);
  assert.equal(matchesLibrarySearch(item, 'mp4'), true);
  assert.equal(matchesLibrarySearch(item, 'audio'), false);
});
