import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Network from 'expo-network';
import { loadSettings } from './settingsService';
import { loadLibraryItems } from './libraryService';
import { loadDownloads } from './storageService';

const LOG_KEY = '@videorip/diagnostics/v2';
const DIAG_DIR = `${FileSystem.cacheDirectory}videorip-diagnostics/`;

function redact(value) {
  return String(value ?? '')
    .replace(/(authorization|cookie|token|password|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .replace(/([?&](?:token|key|signature|sig|auth)=[^&#\s]+)/gi, '[REDACTED_QUERY]');
}

export async function recordDiagnostic(level, code, message, details = null) {
  try {
    const settings = await loadSettings();
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const current = raw ? JSON.parse(raw) : [];
    const next = [{ at: Date.now(), level, code, message: redact(message), details: details ? redact(JSON.stringify(details)) : null }, ...(Array.isArray(current) ? current : [])]
      .slice(0, settings.diagnosticLogLimit);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    // Diagnostics must never destabilise core workflows.
  }
}

export async function loadDiagnosticLog() {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export async function clearDiagnosticLog() {
  await AsyncStorage.removeItem(LOG_KEY);
}

export async function collectDiagnostics() {
  const [settings, library, downloads, log, network] = await Promise.all([
    loadSettings(), loadLibraryItems(), loadDownloads(), loadDiagnosticLog(),
    Network.getNetworkStateAsync().catch(() => null),
  ]);
  const freeBytes = await FileSystem.getFreeDiskStorageAsync().catch(() => null);
  return {
    generatedAt: new Date().toISOString(),
    app: { name: 'VideoRip', version: '2.0.0', package: 'app.videorip.mobile' },
    storage: { documentDirectory: FileSystem.documentDirectory, freeBytes },
    network: network ? { isConnected: network.isConnected, isInternetReachable: network.isInternetReachable, type: network.type } : null,
    settings,
    queue: {
      total: downloads.length,
      active: downloads.filter((x) => ['analysing','queued','preparing','downloading','retrying'].includes(x.status)).length,
      failed: downloads.filter((x) => x.status === 'failed').length,
      completed: downloads.filter((x) => x.status === 'completed').length,
    },
    library: { total: library.length, playableExpected: library.filter((x) => x.playability === 'expected').length },
    recentFailures: downloads.filter((x) => x.status === 'failed').slice(0, 20).map((x) => ({ id: x.id, filename: x.filename, error: redact(x.error) })),
    log,
  };
}

export async function exportDiagnostics() {
  const data = await collectDiagnostics();
  const info = await FileSystem.getInfoAsync(DIAG_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIAG_DIR, { intermediates: true });
  const uri = `${DIAG_DIR}videorip-diagnostics-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
  const available = await Sharing.isAvailableAsync();
  if (available) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export VideoRip diagnostics' });
  return uri;
}
