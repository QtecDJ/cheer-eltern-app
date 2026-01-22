// Lightweight logger wrapper
const isProd = process.env.NODE_ENV === 'production';
const log = (...args: any[]) => console.log(...args);

export const logger = {
  debug: (...args: any[]) => {
    if (!isProd) console.debug(...args);
  },
  info: (...args: any[]) => log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

export default logger;
