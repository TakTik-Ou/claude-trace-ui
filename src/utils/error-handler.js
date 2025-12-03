/**
 * Error Handler - Graceful error handling with user notifications
 */

/**
 * @typedef {Object} ErrorInfo
 * @property {string} message - User-friendly message
 * @property {string} [code] - Error code
 * @property {Error} [originalError] - Original error
 * @property {string} [context] - Where the error occurred
 * @property {boolean} [recoverable=true] - Can the app continue?
 */

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Error callbacks
 * @type {Set<(error: ErrorInfo, severity: string) => void>}
 */
const errorCallbacks = new Set();

/**
 * Register an error callback
 * @param {(error: ErrorInfo, severity: string) => void} callback
 * @returns {() => void} Cleanup function
 */
export function onError(callback) {
  errorCallbacks.add(callback);
  return () => errorCallbacks.delete(callback);
}

/**
 * Report an error
 * @param {ErrorInfo} error
 * @param {string} [severity='error']
 */
export function reportError(error, severity = ErrorSeverity.ERROR) {
  // Log to console
  const logFn = severity === ErrorSeverity.CRITICAL ? console.error :
    severity === ErrorSeverity.WARNING ? console.warn :
      console.log;

  logFn(`[${severity.toUpperCase()}] ${error.context || 'App'}: ${error.message}`);
  if (error.originalError) {
    logFn(error.originalError);
  }

  // Notify callbacks
  errorCallbacks.forEach((callback) => {
    try {
      callback(error, severity);
    } catch (e) {
      console.error('Error in error callback:', e);
    }
  });
}

/**
 * Create a user-friendly error from an unknown error
 * @param {unknown} error
 * @param {string} [context]
 * @returns {ErrorInfo}
 */
export function normalizeError(error, context) {
  if (error instanceof Error) {
    return {
      message: getUserFriendlyMessage(error),
      code: error.name,
      originalError: error,
      context,
      recoverable: true
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      context,
      recoverable: true
    };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error;
    return {
      message: obj.message || 'An unknown error occurred',
      code: obj.code,
      context,
      recoverable: obj.recoverable !== false
    };
  }

  return {
    message: 'An unknown error occurred',
    context,
    recoverable: true
  };
}

/**
 * Get user-friendly message from error
 * @param {Error} error
 * @returns {string}
 */
function getUserFriendlyMessage(error) {
  // Map common error types to user-friendly messages
  const errorMap = {
    'ENOENT': 'File or directory not found',
    'EACCES': 'Permission denied',
    'ENOTDIR': 'Not a directory',
    'EISDIR': 'Is a directory, expected a file',
    'EMFILE': 'Too many open files',
    'ENOSPC': 'No space left on device',
    'NetworkError': 'Network connection error',
    'AbortError': 'Operation was cancelled',
    'TimeoutError': 'Operation timed out',
    'SyntaxError': 'Invalid data format'
  };

  // Check for known error codes/names
  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key) || error.name === key) {
      return message;
    }
  }

  // Return original message if reasonably short
  if (error.message.length < 100) {
    return error.message;
  }

  // Truncate long messages
  return error.message.slice(0, 97) + '...';
}

/**
 * Wrap an async function with error handling
 * @template T
 * @param {() => Promise<T>} fn
 * @param {string} [context]
 * @returns {Promise<T | null>}
 */
export async function withErrorHandling(fn, context) {
  try {
    return await fn();
  } catch (error) {
    reportError(normalizeError(error, context));
    return null;
  }
}

/**
 * Create an error boundary for a function
 * @template {(...args: unknown[]) => unknown} T
 * @param {T} fn
 * @param {string} [context]
 * @returns {T}
 */
export function errorBoundary(fn, context) {
  return ((...args) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          reportError(normalizeError(error, context));
          return null;
        });
      }
      return result;
    } catch (error) {
      reportError(normalizeError(error, context));
      return null;
    }
  });
}

/**
 * Show a toast notification for an error
 * @param {string} message
 * @param {string} [severity='error']
 */
export function showErrorToast(message, severity = ErrorSeverity.ERROR) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-slide-up ${getToastColorClass(severity)
    }`;

  const content = document.createElement('div');
  content.className = 'flex items-center gap-2';

  const icon = document.createElement('span');
  icon.textContent = getToastIcon(severity);
  content.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  content.appendChild(text);

  toast.appendChild(content);
  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Get toast background color class
 * @param {string} severity
 * @returns {string}
 */
function getToastColorClass(severity) {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case ErrorSeverity.WARNING:
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case ErrorSeverity.CRITICAL:
      return 'bg-red-200 text-red-900 border border-red-300';
    default:
      return 'bg-red-100 text-red-800 border border-red-200';
  }
}

/**
 * Get toast icon
 * @param {string} severity
 * @returns {string}
 */
function getToastIcon(severity) {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'ℹ️';
    case ErrorSeverity.WARNING:
      return '⚠️';
    default:
      return '❌';
  }
}

export const errorHandler = {
  ErrorSeverity,
  onError,
  reportError,
  normalizeError,
  withErrorHandling,
  errorBoundary,
  showErrorToast
};

export default errorHandler;
