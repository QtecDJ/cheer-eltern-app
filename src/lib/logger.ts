// Lightweight logger wrapper
const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProd) (console.debug as (...a: unknown[]) => void)(...args);
  },
  info: (...args: unknown[]) => (console.info as (...a: unknown[]) => void)(...args),
  warn: (...args: unknown[]) => (console.warn as (...a: unknown[]) => void)(...args),
  error: (...args: unknown[]) => (console.error as (...a: unknown[]) => void)(...args),
};

export default logger;
