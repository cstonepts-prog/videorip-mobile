export const DEFAULT_SETTINGS = {
  concurrentDownloads: 2,
  wifiOnly: false,
  mobileDataWarning: true,
  chargingOnlyLargeTransfers: false,
  chargingOnlyThresholdMb: 500,
  notifications: true,
  autoSaveToGallery: false,
  playerResume: true,
  defaultPlaybackSpeed: 1,
  defaultFullscreen: false,
  filenameConflictPolicy: 'rename',
  historyRetentionDays: 0,
  diagnosticLogLimit: 200,
};

export function isSettingsObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function boundedNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function validateSettings(raw = {}) {
  if (!isSettingsObject(raw)) throw new Error('Settings have an invalid data shape.');
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  return {
    concurrentDownloads: Math.round(boundedNumber(merged.concurrentDownloads, 2, 1, 6)),
    chargingOnlyThresholdMb: Math.round(boundedNumber(merged.chargingOnlyThresholdMb, 500, 50, 10000)),
    defaultPlaybackSpeed: boundedNumber(merged.defaultPlaybackSpeed, 1, 0.25, 3),
    historyRetentionDays: Math.round(boundedNumber(merged.historyRetentionDays, 0, 0, 3650)),
    diagnosticLogLimit: Math.round(boundedNumber(merged.diagnosticLogLimit, 200, 20, 2000)),
    filenameConflictPolicy: ['rename', 'fail'].includes(merged.filenameConflictPolicy) ? merged.filenameConflictPolicy : 'rename',
    wifiOnly: Boolean(merged.wifiOnly),
    mobileDataWarning: Boolean(merged.mobileDataWarning),
    chargingOnlyLargeTransfers: Boolean(merged.chargingOnlyLargeTransfers),
    notifications: Boolean(merged.notifications),
    autoSaveToGallery: Boolean(merged.autoSaveToGallery),
    playerResume: Boolean(merged.playerResume),
    defaultFullscreen: Boolean(merged.defaultFullscreen),
  };
}
