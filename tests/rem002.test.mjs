import test from 'node:test';
import assert from 'node:assert/strict';
import { decideNetworkPolicy, needsExternalPower } from '../src/utils/transferPolicy.js';
import { classifyPlayerError } from '../src/utils/mediaUtils.js';
import { validateSettings } from '../src/utils/settingsUtils.js';

test('transfer policy distinguishes offline, Wi-Fi wait, mobile confirmation and allowed mobile transfer', () => {
  assert.equal(decideNetworkPolicy({}, { isConnected: false, type: 'NONE' }).code, 'NETWORK_UNAVAILABLE');
  assert.equal(decideNetworkPolicy({ wifiOnly: true }, { isConnected: true, type: 'CELLULAR' }).code, 'WIFI_REQUIRED');
  assert.equal(decideNetworkPolicy({ wifiOnly: false, mobileDataWarning: true }, { isConnected: true, type: 'CELLULAR' }, false).code, 'MOBILE_DATA_CONFIRMATION_REQUIRED');
  assert.equal(decideNetworkPolicy({ wifiOnly: false, mobileDataWarning: true }, { isConnected: true, type: 'CELLULAR' }, true), null);
});

test('charging policy accepts only charging or full battery state for large transfers', () => {
  const states = { CHARGING: 2, FULL: 5, NOT_CHARGING: 3, UNKNOWN: 0 };
  const settings = { chargingOnlyLargeTransfers: true, chargingOnlyThresholdMb: 100 };
  assert.equal(needsExternalPower(settings, 200 * 1024 * 1024, states.CHARGING, states), false);
  assert.equal(needsExternalPower(settings, 200 * 1024 * 1024, states.FULL, states), false);
  assert.equal(needsExternalPower(settings, 200 * 1024 * 1024, states.NOT_CHARGING, states), true);
  assert.equal(needsExternalPower(settings, 200 * 1024 * 1024, states.UNKNOWN, states), true);
  assert.equal(needsExternalPower(settings, 50 * 1024 * 1024, states.NOT_CHARGING, states), false);
});

test('player error classification does not mislabel generic remote errors as network failures', () => {
  assert.equal(classifyPlayerError(new Error('Playback failed'), { uri: 'https://example.test/media.mp4' }).code, 'PLAYER_ERROR');
  assert.equal(classifyPlayerError(new Error('connection timeout'), { uri: 'https://example.test/media.mp4' }).code, 'NETWORK_UNAVAILABLE');
  assert.equal(classifyPlayerError(new Error('decoder failed'), { uri: 'file:///media.mkv' }).code, 'UNSUPPORTED_CODEC');
});

test('settings validation rejects malformed containers and clamps valid values', () => {
  assert.throws(() => validateSettings([]), /invalid data shape/i);
  const v = validateSettings({ concurrentDownloads: 99, chargingOnlyThresholdMb: 1, historyRetentionDays: 99999, filenameConflictPolicy: 'bogus' });
  assert.equal(v.concurrentDownloads, 6);
  assert.equal(v.chargingOnlyThresholdMb, 50);
  assert.equal(v.historyRetentionDays, 3650);
  assert.equal(v.filenameConflictPolicy, 'rename');
});
