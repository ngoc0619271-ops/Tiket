import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice } from '@/lib/format';
import { shortKey } from '@/lib/stellar-client';

describe('formatPrice', () => {
  it('renders Free for zero', () => {
    expect(formatPrice('0', 'XLM')).toBe('Free');
  });
  it('renders amount with asset', () => {
    expect(formatPrice('5', 'XLM')).toBe('5 XLM');
    expect(formatPrice('2.5', 'USDC')).toBe('2.5 USDC');
  });
});

describe('formatDate', () => {
  it('formats an ISO string', () => {
    expect(formatDate('2026-07-01T18:00:00.000Z')).toMatch(/2026/);
  });
});

describe('shortKey', () => {
  it('truncates a public key', () => {
    expect(shortKey('GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47')).toBe('GBL5…IE47');
  });
  it('handles empty', () => {
    expect(shortKey(null)).toBe('');
  });
});
