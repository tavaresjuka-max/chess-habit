import { describe, expect, it } from 'vitest';
import { getMethodTrack, getMethodTrackTitle, METHOD_TRACKS } from './methodTracks';

describe('METHOD_TRACKS', () => {
  it('has exactly five tracks', () => {
    expect(METHOD_TRACKS).toHaveLength(5);
  });

  it('keeps ids, titles and priorities unique', () => {
    expect(new Set(METHOD_TRACKS.map((track) => track.id)).size).toBe(METHOD_TRACKS.length);
    expect(new Set(METHOD_TRACKS.map((track) => track.title)).size).toBe(METHOD_TRACKS.length);
    expect(new Set(METHOD_TRACKS.map((track) => track.priority)).size).toBe(METHOD_TRACKS.length);
  });

  it('returns the pending-review track by id', () => {
    expect(getMethodTrack('pending-review')).toMatchObject({
      id: 'pending-review',
      title: 'Tratamento de Pendências',
      priority: 1,
    });
  });

  it('returns a non-empty calculation track title', () => {
    expect(getMethodTrackTitle('calculation-bridge')).toBe('Cálculo Ponte 800-1200');
  });
});
