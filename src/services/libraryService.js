import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalId } from '../utils/downloadUtils';
import { classifyMedia } from '../utils/mediaUtils';

const LIBRARY_KEY = '@videorip/library/v2';
const SCHEMA_VERSION = 2;

function normaliseItem(item) {
  if (!item || typeof item.uri !== 'string' || !item.uri) return null;
  const classification = classifyMedia({ name: item.name || item.filename, mimeType: item.mimeType, uri: item.uri });
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createLocalId(),
    origin: item.origin || 'unknown',
    uri: item.uri,
    managed: item.managed !== false,
    name: item.name || item.filename || item.uri.split('/').pop() || 'Media',
    originalName: item.originalName || item.name || item.filename || null,
    sourceUrl: item.sourceUrl || item.url || null,
    resolvedUrl: item.resolvedUrl || null,
    mimeType: item.mimeType || null,
    mediaType: item.mediaType || classification.mediaType,
    sourceType: item.sourceType || classification.sourceType,
    container: item.container || classification.container,
    size: Number(item.size) || 0,
    duration: Number(item.duration) || null,
    width: Number(item.width) || null,
    height: Number(item.height) || null,
    playability: item.playability || (classification.playable === true ? 'expected' : classification.playable === false ? 'unsupported' : 'unknown'),
    playabilityReason: item.playabilityReason || classification.reason,
    createdAt: Number(item.createdAt || item.importedAt || item.completedAt) || Date.now(),
    importedAt: Number(item.importedAt) || null,
    completedAt: Number(item.completedAt) || null,
    lastPlayedAt: Number(item.lastPlayedAt) || null,
    resumePosition: Math.max(0, Number(item.resumePosition) || 0),
    thumbnailUri: item.thumbnailUri || null,
    downloadId: item.downloadId || null,
  };
}

function normalise(items) { if(!Array.isArray(items)) throw new Error('Library storage has an invalid item collection.'); return items.map(normaliseItem).filter(Boolean); }

export async function loadLibraryItems() {
  const raw = await AsyncStorage.getItem(LIBRARY_KEY);
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Stored library data is not valid JSON.'); }
  const items = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? parsed.items : null;
  if (!Array.isArray(items)) throw new Error('Stored library data has an invalid schema.');
  return normalise(items).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function saveLibraryItems(items) {
  const payload = { schemaVersion: SCHEMA_VERSION, items: normalise(items) };
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(payload));
}

export async function addLibraryItems(items) {
  const current = await loadLibraryItems();
  const byUri = new Map(current.map((item) => [item.uri, item]));
  for (const candidate of items || []) {
    const item = normaliseItem(candidate);
    if (item) byUri.set(item.uri, { ...byUri.get(item.uri), ...item });
  }
  const next = [...byUri.values()].sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  await saveLibraryItems(next);
  return next;
}

export async function updateLibraryItem(id, patch) {
  const current = await loadLibraryItems();
  const next = current.map((item) => item.id === id ? normaliseItem({ ...item, ...patch, id }) : item);
  await saveLibraryItems(next);
  return next;
}

export async function updateLibraryItemByUri(uri, patch) {
  const current = await loadLibraryItems();
  const next = current.map((item) => item.uri === uri ? normaliseItem({ ...item, ...patch }) : item);
  await saveLibraryItems(next);
  return next;
}

export async function removeLibraryItem(id) {
  const current = await loadLibraryItems();
  const next = current.filter((item) => item.id !== id);
  await saveLibraryItems(next);
  return next;
}

export async function removeLibraryItems(ids) {
  const wanted = new Set(ids || []);
  const current = await loadLibraryItems();
  const next = current.filter((item) => !wanted.has(item.id));
  await saveLibraryItems(next);
  return next;
}

export async function markPlayed(id, position = null) {
  return updateLibraryItem(id, { lastPlayedAt: Date.now(), ...(position == null ? {} : { resumePosition: Math.max(0, Number(position) || 0) }) });
}

export async function clearPlaybackHistory(){
  const current=await loadLibraryItems();
  const next=current.map(item=>({...item,lastPlayedAt:null,resumePosition:0}));
  await saveLibraryItems(next);
  return next;
}
export async function applyHistoryRetention(days){
  const n=Math.max(0,Number(days)||0);
  if(!n)return loadLibraryItems();
  const cutoff=Date.now()-n*86400000;
  const current=await loadLibraryItems();
  const next=current.map(item=>item.lastPlayedAt&&item.lastPlayedAt<cutoff?{...item,lastPlayedAt:null,resumePosition:0}:item);
  await saveLibraryItems(next);
  return next;
}
