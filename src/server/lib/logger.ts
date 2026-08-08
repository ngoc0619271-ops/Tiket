const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args: unknown[]) => isDev && console.info('[tiket]', ...args),
  warn: (...args: unknown[]) => console.warn('[tiket:warn]', ...args),
  error: (...args: unknown[]) => console.error('[tiket:error]', ...args),
};
