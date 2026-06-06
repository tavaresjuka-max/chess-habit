import { describe, expect, it } from 'vitest';

describe('domain barrel', () => {
  it('loads the domain entrypoint', async () => {
    await expect(import('./index')).resolves.toBeDefined();
  });
});
