import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/server/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.warn calls console.warn with prefix', () => {
    logger.warn('something wrong');
    expect(console.warn).toHaveBeenCalledWith('[tiket:warn]', 'something wrong');
  });

  it('logger.error calls console.error with prefix', () => {
    logger.error('fatal error', { code: 500 });
    expect(console.error).toHaveBeenCalledWith('[tiket:error]', 'fatal error', { code: 500 });
  });

  it('logger.info calls console.info in dev (non-production)', () => {
    // NODE_ENV in test is not 'production', so isDev = true
    logger.info('starting up', 'server');
    // In dev, console.info is called
    expect(console.info).toHaveBeenCalledWith('[tiket]', 'starting up', 'server');
  });

  it('logger.warn accepts multiple args', () => {
    logger.warn('event', 'ticket', 123);
    expect(console.warn).toHaveBeenCalledWith('[tiket:warn]', 'event', 'ticket', 123);
  });
});
