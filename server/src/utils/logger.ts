// Logger utility — console fallback when winston is not installed
export const logger = {
  info: (message: string, meta?: unknown) => console.log('[INFO]', message, meta ?? ''),
  warn: (message: string, meta?: unknown) => console.warn('[WARN]', message, meta ?? ''),
  error: (message: string, meta?: unknown) => console.error('[ERROR]', message, meta ?? ''),
  debug: (message: string, meta?: unknown) => console.debug('[DEBUG]', message, meta ?? ''),
};

export function log(level: string, message: string, meta?: unknown): void {
  logger[level as keyof typeof logger]?.(message, meta);
}
