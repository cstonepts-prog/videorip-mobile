export const initialDownloadState = { downloads: [], hydrated: false, storageError: null };

export function downloadReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, downloads: action.payload || [], hydrated: true, storageError: null };
    case 'STORAGE_ERROR':
      return { ...state, storageError: action.payload, hydrated: true };
    case 'STORAGE_OK':
      return { ...state, storageError: null };
    case 'PATCH': {
      const downloads = state.downloads.map((d) => (d.id === action.id ? { ...d, ...action.patch, updatedAt: Date.now() } : d));
      return { ...state, downloads };
    }
    case 'ADD':
      return { ...state, downloads: [action.payload, ...state.downloads] };
    case 'REMOVE':
      return { ...state, downloads: state.downloads.filter((d) => d.id !== action.id) };
    default:
      return state;
  }
}
