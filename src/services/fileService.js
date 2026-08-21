import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export async function shareFile(uri, mimeType) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType: mimeType || undefined, dialogTitle: 'Share with VideoRip' });
}

export async function exportFile(uri, mimeType) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission to save to the media library was denied.');
  const asset = await MediaLibrary.createAssetAsync(uri);
  return asset;
}

export async function ensureCapacity(requiredBytes = 0) {
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    if (Number.isFinite(free) && free < requiredBytes + 5 * 1024 * 1024) {
      const err = new Error('Insufficient storage space for this operation.');
      err.code = 'INSUFFICIENT_STORAGE';
      throw err;
    }
  } catch (e) {
    if (e.code === 'INSUFFICIENT_STORAGE') throw e;
  }
}
