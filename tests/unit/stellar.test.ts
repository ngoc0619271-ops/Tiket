import { describe, expect, it } from 'vitest';
import {
  explorerTx,
  fromStroops,
  generateAssetCode,
  isValidPublicKey,
  settlementAsset,
  ticketAsset,
  toStroops,
} from '@/server/stellar';

describe('generateAssetCode', () => {
  it('produces a valid 1-12 char alphanumeric code starting with TKT', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateAssetCode();
      expect(code).toMatch(/^TKT[A-Z0-9]{5}$/);
      expect(code.length).toBeLessThanOrEqual(12);
    }
  });
});

describe('isValidPublicKey', () => {
  it('accepts a real ed25519 key', () => {
    expect(isValidPublicKey('GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47')).toBe(true);
  });
  it('rejects junk', () => {
    expect(isValidPublicKey('not-a-key')).toBe(false);
  });
});

describe('settlementAsset', () => {
  it('returns native for XLM', () => {
    expect(settlementAsset('XLM').isNative()).toBe(true);
  });
  it('returns USDC credit asset otherwise', () => {
    expect(settlementAsset('USDC').getCode()).toBe('USDC');
  });
});

describe('ticketAsset / explorerTx', () => {
  it('builds a credit asset with the issuer', () => {
    expect(ticketAsset('TKT12345').getCode()).toBe('TKT12345');
  });
  it('builds a testnet explorer url', () => {
    expect(explorerTx('abc')).toContain('/explorer/testnet/tx/abc');
  });
});

describe('stroops conversion', () => {
  it('converts XLM decimal strings to integer stroops', () => {
    expect(toStroops('1')).toBe(10_000_000n);
    expect(toStroops('0.5')).toBe(5_000_000n);
    expect(toStroops('0')).toBe(0n);
  });
  it('round-trips back to a trimmed decimal string', () => {
    expect(fromStroops(10_000_000n)).toBe('1');
    expect(fromStroops(5_000_000n)).toBe('0.5');
    expect(fromStroops(0n)).toBe('0');
  });
});
