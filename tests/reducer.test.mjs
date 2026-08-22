import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadReducer, initialDownloadState } from '../src/context/downloadReducer.js';

test('download reducer reconciles rename and delete with history records', () => {
  const base = { id: 'a1', status: 'completed', filename: 'clip.mp4', updatedAt: 1 };
  let state = downloadReducer(initialDownloadState, { type: 'HYDRATE', payload: [base] });
  state = downloadReducer(state, { type: 'PATCH', id: 'a1', patch: { filename: 'renamed.mp4' } });
  assert.equal(state.downloads[0].filename, 'renamed.mp4');
  state = downloadReducer(state, { type: 'REMOVE', id: 'a1' });
  assert.equal(state.downloads.length, 0);
});
