const VIDEO_EXTENSIONS = new Set(['.mp4','.m4v','.m4s','.mov','.webm','.mkv','.ts','.m2ts','.mts','.mpeg','.mpg','.ogv','.flv','.avi','.3gp','.3g2']);
const AUDIO_EXTENSIONS = new Set(['.mp3','.aac','.m4a','.ogg','.oga','.opus','.flac','.wav','.wave','.amr','.weba']);
const HLS_MIMES = new Set(['application/vnd.apple.mpegurl','application/x-mpegurl','audio/mpegurl','audio/x-mpegurl']);
const DASH_MIMES = new Set(['application/dash+xml']);

export function extensionOfMedia(name) {
  const clean = String(name || '').trim().toLowerCase().split(/[?#]/, 1)[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot) : '';
}

export function classifyMedia({ name, mimeType, uri } = {}) {
  const type = String(mimeType || '').split(';')[0].trim().toLowerCase();
  const ext = extensionOfMedia(name || uri || '');
  if (HLS_MIMES.has(type) || ext === '.m3u8') return { mediaType: 'stream', sourceType: 'hls', container: 'HLS', playable: true, reason: 'HLS source; playback depends on stream codecs and device support.' };
  if (DASH_MIMES.has(type) || ext === '.mpd') return { mediaType: 'stream', sourceType: 'dash', container: 'DASH', playable: true, reason: 'MPEG-DASH source; playback depends on stream codecs and device support.' };
  if (type.startsWith('video/') || VIDEO_EXTENSIONS.has(ext)) return { mediaType: 'video', sourceType: 'progressive', container: ext ? ext.slice(1).toUpperCase() : type.replace('video/','').toUpperCase(), playable: null, reason: 'Playback capability must be confirmed by the device codec stack.' };
  if (type.startsWith('audio/') || AUDIO_EXTENSIONS.has(ext)) return { mediaType: 'audio', sourceType: 'progressive', container: ext ? ext.slice(1).toUpperCase() : type.replace('audio/','').toUpperCase(), playable: null, reason: 'Playback capability must be confirmed by the device codec stack.' };
  if (/text\/html|application\/xhtml\+xml/.test(type)) return { mediaType: 'document', sourceType: 'webpage', container: null, playable: false, reason: 'HTML is not directly playable media.' };
  return { mediaType: 'unknown', sourceType: 'unknown', container: ext ? ext.slice(1).toUpperCase() : null, playable: null, reason: 'Media type could not be identified.' };
}

export function sourceHintForPlayer(item = {}) {
  const sourceType = item.sourceType || classifyMedia(item).sourceType;
  if (sourceType === 'hls') return { uri: item.uri || item.url, contentType: 'hls' };
  if (sourceType === 'dash') return { uri: item.uri || item.url, contentType: 'dash' };
  return item.uri || item.url || null;
}

export function isMediaCandidate(value) { return classifyMedia(value).mediaType !== 'unknown'; }
export function formatBytes(value) {
  const size = Number(value) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
}
export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600); const m = Math.floor((total % 3600) / 60); const s = total % 60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
}
export function matchesLibrarySearch(item, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return [item.name,item.originalName,item.sourceUrl,item.resolvedUrl,item.mimeType,item.mediaType,item.container,item.origin].some((v) => String(v || '').toLowerCase().includes(q));
}

export function classifyPlayerError(error, source=null){
  const message=String(error?.message||error||'').toLowerCase();
  const uri=typeof source==='string'?source:String(source?.uri||'');
  if(/no such file|not found|missing file|enoent/.test(message))return{code:'SOURCE_GONE',message:'The media file is missing or no longer accessible.'};
  if(/permission|denied|access/.test(message)&&!/^https?:/i.test(uri))return{code:'FILE_PERMISSION',message:'The media URI is no longer accessible.'};
  if(/dns|host|resolve/.test(message))return{code:'DNS_FAILURE',message:'The media host could not be resolved.'};
  if(/network|connection|timeout|socket/.test(message))return{code:'NETWORK_UNAVAILABLE',message:'A network error interrupted playback.'};
  if(/codec|decoder|decode/.test(message))return{code:'UNSUPPORTED_CODEC',message:'This device cannot decode the media codec.'};
  if(/container|format|unsupported source|unrecognized/.test(message))return{code:'UNSUPPORTED_CONTAINER',message:'This media container or source format is not supported on this device.'};
  return{code:'PLAYER_ERROR',message:'The native player could not play this source.'};
}
