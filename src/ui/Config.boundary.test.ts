import { describe, expect, it } from 'vitest';
import configSource from './Config.tsx?raw';

describe('Config UI boundary', () => {
  it('does not import storage infra directly', () => {
    expect(configSource).not.toContain('../infra/');
  });
});
