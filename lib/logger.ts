// Logger that works in World App by sending logs to server
const LOG_ENDPOINT = '/api/debug-log';

export const log = async (category: string, message: string, data?: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    category,
    message,
    data,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  // Always log to console (for browser/dev)
  console.log(`[${category}]`, message, data || '');

  // Also send to server for World App visibility
  if (typeof fetch !== 'undefined') {
    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Silently fail - logging shouldn't break the app
    }
  }
};

export const logError = async (category: string, error: Error | unknown, context?: any) => {
  const errorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context
  };

  console.error(`[${category}] ERROR:`, errorData);

  if (typeof fetch !== 'undefined') {
    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          category: `${category}-ERROR`,
          message: errorData.message,
          data: errorData
        })
      });
    } catch (e) {
      // Silently fail
    }
  }
};
