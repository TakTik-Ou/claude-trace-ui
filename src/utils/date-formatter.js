/**
 * Date Formatter - Utilities for formatting dates and durations
 */

/**
 * Format a timestamp to relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (weeks < 4) {
    return `${weeks}w ago`;
  }
  if (months < 12) {
    return `${months}mo ago`;
  }
  return `${years}y ago`;
}

/**
 * Format a timestamp to full date/time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {Object} [options]
 * @param {boolean} [options.includeTime=true] - Include time
 * @param {boolean} [options.includeSeconds=false] - Include seconds
 * @returns {string}
 */
export function formatDateTime(timestamp, options = {}) {
  const { includeTime = true, includeSeconds = false } = options;

  const date = new Date(timestamp);

  const dateStr = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  if (!includeTime) {
    return dateStr;
  }

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {})
  };

  const timeStr = date.toLocaleTimeString(undefined, timeOptions);

  return `${dateStr} ${timeStr}`;
}

/**
 * Format a timestamp to short date (e.g., "Nov 29")
 * @param {number} timestamp
 * @returns {string}
 */
export function formatShortDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  // If same year, omit year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a duration in milliseconds to human readable string
 * @param {number} durationMs - Duration in milliseconds
 * @param {Object} [options]
 * @param {boolean} [options.long=false] - Use long format
 * @returns {string}
 */
export function formatDuration(durationMs, options = {}) {
  const { long = false } = options;

  if (durationMs < 0) {
    return '0s';
  }

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (long) {
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
    if (seconds % 60 > 0 && days === 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
    return parts.join(', ') || '0 seconds';
  }

  // Short format
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format time of day (e.g., "2:30 PM")
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if two timestamps are on the same day
 * @param {number} timestamp1
 * @param {number} timestamp2
 * @returns {boolean}
 */
export function isSameDay(timestamp1, timestamp2) {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if timestamp is today
 * @param {number} timestamp
 * @returns {boolean}
 */
export function isToday(timestamp) {
  return isSameDay(timestamp, Date.now());
}

/**
 * Check if timestamp is yesterday
 * @param {number} timestamp
 * @returns {boolean}
 */
export function isYesterday(timestamp) {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  return isSameDay(timestamp, yesterday);
}

/**
 * Get start of day timestamp
 * @param {number} [timestamp=Date.now()]
 * @returns {number}
 */
export function startOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp
 * @param {number} [timestamp=Date.now()]
 * @returns {number}
 */
export function endOfDay(timestamp = Date.now()) {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export const dateFormatter = {
  formatRelativeTime,
  formatDateTime,
  formatShortDate,
  formatDuration,
  formatTime,
  isSameDay,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay
};

export default dateFormatter;
