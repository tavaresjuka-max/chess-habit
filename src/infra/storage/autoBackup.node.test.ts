// @vitest-environment node
// Tests the SSR-guard branch of getSaveFilePicker where `window` is undefined.
import { describe, expect, it } from 'vitest';
import { getSaveFilePicker, isAutoBackupSupported } from './autoBackup';

describe('getSaveFilePicker (node / no window)', () => {
  it('returns undefined when window is not defined (SSR guard)', () => {
    // In the node environment `window` is not defined, so getSaveFilePicker
    // must return undefined without throwing.
    expect(typeof window).toBe('undefined');
    expect(getSaveFilePicker()).toBeUndefined();
  });

  it('isAutoBackupSupported returns false when window is not defined', () => {
    expect(isAutoBackupSupported()).toBe(false);
  });
});
