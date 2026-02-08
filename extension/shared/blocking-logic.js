/**
 * Pure blocking logic functions for Distracted Work extension.
 * Extracted for testability - no browser API dependencies.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  blockedSites: [],
  schedule: {
    enabled: false,
    days: [1, 2, 3, 4, 5], // Monday-Friday
    startTime: '09:00',
    endTime: '17:00'
  },
  theme: 'auto',
  hasDonated: false
};

/**
 * Check if a URL matches any blocked site pattern.
 * Matches against the hostname - supports both exact and subdomain matching.
 * e.g., blocking "reddit.com" also blocks "www.reddit.com" and "old.reddit.com"
 */
function isBlocked(url, blockedSites) {
  let hostname;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch (e) {
    return null;
  }

  for (const site of blockedSites) {
    const pattern = site.domain.toLowerCase();
    if (hostname === pattern || hostname.endsWith('.' + pattern)) {
      return site;
    }
  }
  return null;
}

/**
 * Parse a time string "HH:MM" into minutes since midnight.
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if blocking is currently active based on schedule.
 * When schedule is disabled, blocking is always active.
 * @param {Object} schedule - The schedule config
 * @param {Date} [now] - Optional date for testing (defaults to new Date())
 */
function isWithinSchedule(schedule, now) {
  if (!schedule || !schedule.enabled) {
    return true; // No schedule = always active
  }

  if (!now) now = new Date();
  const day = now.getDay(); // 0=Sunday, 1=Monday, ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!schedule.days.includes(day)) {
    return false;
  }

  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);

  if (start <= end) {
    return currentMinutes >= start && currentMinutes < end;
  } else {
    // Overnight schedule (e.g., 22:00 - 06:00)
    return currentMinutes >= start || currentMinutes < end;
  }
}

/**
 * Determine if a request should be blocked.
 * @param {string} url - The URL to check
 * @param {Object} settings - Current extension settings
 * @param {Date} [now] - Optional date for testing
 */
function shouldBlock(url, settings, now) {
  if (!settings.enabled) return null;

  const matchedSite = isBlocked(url, settings.blockedSites);
  if (!matchedSite) return null;

  // Permanent blocks ignore schedule
  if (matchedSite.permanent) return matchedSite;

  // Scheduled blocks check time
  if (isWithinSchedule(settings.schedule, now)) return matchedSite;

  return null;
}

/**
 * Validate a domain string.
 */
function isValidDomain(domain) {
  if (!domain || domain.length === 0) return false;
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Clean user input into a domain.
 */
function cleanDomain(input) {
  let domain = input.trim().toLowerCase();
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '');
  // Remove path, query, hash
  domain = domain.split('/')[0];
  // Remove www. prefix
  domain = domain.replace(/^www\./, '');
  return domain;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    isBlocked,
    timeToMinutes,
    isWithinSchedule,
    shouldBlock,
    isValidDomain,
    cleanDomain
  };
}
