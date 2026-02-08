/**
 * Tests for the core blocking logic functions.
 */
const {
  DEFAULT_SETTINGS,
  isBlocked,
  timeToMinutes,
  isWithinSchedule,
  shouldBlock,
  isValidDomain,
  cleanDomain
} = require('../extension/shared/blocking-logic');

// --- isBlocked ---

describe('isBlocked', () => {
  const sites = [
    { domain: 'reddit.com', permanent: false },
    { domain: 'twitter.com', permanent: true },
    { domain: 'facebook.com', permanent: false }
  ];

  test('matches exact domain', () => {
    const result = isBlocked('https://reddit.com/r/programming', sites);
    expect(result).not.toBeNull();
    expect(result.domain).toBe('reddit.com');
  });

  test('matches www subdomain', () => {
    const result = isBlocked('https://www.reddit.com/', sites);
    expect(result).not.toBeNull();
    expect(result.domain).toBe('reddit.com');
  });

  test('matches arbitrary subdomain', () => {
    const result = isBlocked('https://old.reddit.com/r/all', sites);
    expect(result).not.toBeNull();
    expect(result.domain).toBe('reddit.com');
  });

  test('matches deeply nested subdomain', () => {
    const result = isBlocked('https://a.b.c.reddit.com/page', sites);
    expect(result).not.toBeNull();
    expect(result.domain).toBe('reddit.com');
  });

  test('does not match unblocked sites', () => {
    expect(isBlocked('https://google.com', sites)).toBeNull();
  });

  test('does not match partial domain names', () => {
    expect(isBlocked('https://notreddit.com', sites)).toBeNull();
  });

  test('handles invalid URLs gracefully', () => {
    expect(isBlocked('not-a-url', sites)).toBeNull();
    expect(isBlocked('', sites)).toBeNull();
  });

  test('is case insensitive', () => {
    const result = isBlocked('https://REDDIT.COM/page', sites);
    expect(result).not.toBeNull();
  });

  test('returns null for empty blocklist', () => {
    expect(isBlocked('https://reddit.com', [])).toBeNull();
  });

  test('returns the matching site object', () => {
    const result = isBlocked('https://twitter.com', sites);
    expect(result).toEqual({ domain: 'twitter.com', permanent: true });
  });

  test('handles http protocol', () => {
    const result = isBlocked('http://reddit.com/page', sites);
    expect(result).not.toBeNull();
  });

  test('handles URLs with ports', () => {
    const result = isBlocked('https://reddit.com:8080/page', sites);
    expect(result).not.toBeNull();
  });

  test('handles URLs with query strings and hashes', () => {
    const result = isBlocked('https://reddit.com/page?q=test#section', sites);
    expect(result).not.toBeNull();
  });
});

// --- timeToMinutes ---

describe('timeToMinutes', () => {
  test('converts midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  test('converts 9am', () => {
    expect(timeToMinutes('09:00')).toBe(540);
  });

  test('converts 5pm', () => {
    expect(timeToMinutes('17:00')).toBe(1020);
  });

  test('converts 11:59pm', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  test('converts noon', () => {
    expect(timeToMinutes('12:00')).toBe(720);
  });

  test('handles minutes correctly', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('14:45')).toBe(885);
  });
});

// --- isWithinSchedule ---

describe('isWithinSchedule', () => {
  test('returns true when schedule is disabled', () => {
    expect(isWithinSchedule({ enabled: false })).toBe(true);
  });

  test('returns true when schedule is null', () => {
    expect(isWithinSchedule(null)).toBe(true);
  });

  test('returns true when schedule is undefined', () => {
    expect(isWithinSchedule(undefined)).toBe(true);
  });

  test('returns true during scheduled hours on scheduled day', () => {
    const wed10am = new Date(2025, 0, 8, 10, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, wed10am)).toBe(true);
  });

  test('returns false outside scheduled hours', () => {
    const wed8am = new Date(2025, 0, 8, 8, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, wed8am)).toBe(false);
  });

  test('returns false after scheduled hours', () => {
    const wed6pm = new Date(2025, 0, 8, 18, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, wed6pm)).toBe(false);
  });

  test('returns false on non-scheduled day', () => {
    const sun10am = new Date(2025, 0, 5, 10, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, sun10am)).toBe(false);
  });

  test('end time is exclusive', () => {
    const wed5pm = new Date(2025, 0, 8, 17, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, wed5pm)).toBe(false);
  });

  test('start time is inclusive', () => {
    const wed9am = new Date(2025, 0, 8, 9, 0);
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '09:00', endTime: '17:00'
    };
    expect(isWithinSchedule(schedule, wed9am)).toBe(true);
  });

  test('handles overnight schedule (start > end)', () => {
    const schedule = {
      enabled: true, days: [1, 2, 3, 4, 5],
      startTime: '22:00', endTime: '06:00'
    };
    const wed11pm = new Date(2025, 0, 8, 23, 0);
    expect(isWithinSchedule(schedule, wed11pm)).toBe(true);
    const wed3am = new Date(2025, 0, 8, 3, 0);
    expect(isWithinSchedule(schedule, wed3am)).toBe(true);
    const wedNoon = new Date(2025, 0, 8, 12, 0);
    expect(isWithinSchedule(schedule, wedNoon)).toBe(false);
  });

  test('handles weekends in schedule', () => {
    const schedule = {
      enabled: true, days: [0, 6],
      startTime: '10:00', endTime: '14:00'
    };
    const sat11am = new Date(2025, 0, 4, 11, 0);
    expect(isWithinSchedule(schedule, sat11am)).toBe(true);
    const mon11am = new Date(2025, 0, 6, 11, 0);
    expect(isWithinSchedule(schedule, mon11am)).toBe(false);
  });
});

// --- shouldBlock ---

describe('shouldBlock', () => {
  const baseSites = [
    { domain: 'reddit.com', permanent: false },
    { domain: 'twitter.com', permanent: true }
  ];

  test('blocks when enabled and site is in blocklist', () => {
    const settings = {
      enabled: true, blockedSites: baseSites,
      schedule: { enabled: false }
    };
    const result = shouldBlock('https://reddit.com', settings);
    expect(result).not.toBeNull();
    expect(result.domain).toBe('reddit.com');
  });

  test('does not block when disabled', () => {
    const settings = {
      enabled: false, blockedSites: baseSites,
      schedule: { enabled: false }
    };
    expect(shouldBlock('https://reddit.com', settings)).toBeNull();
  });

  test('does not block unblocked sites', () => {
    const settings = {
      enabled: true, blockedSites: baseSites,
      schedule: { enabled: false }
    };
    expect(shouldBlock('https://google.com', settings)).toBeNull();
  });

  test('permanent blocks ignore schedule', () => {
    const settings = {
      enabled: true, blockedSites: baseSites,
      schedule: {
        enabled: true, days: [1, 2, 3, 4, 5],
        startTime: '09:00', endTime: '17:00'
      }
    };
    const sun3am = new Date(2025, 0, 5, 3, 0);
    const result = shouldBlock('https://twitter.com', settings, sun3am);
    expect(result).not.toBeNull();
    expect(result.permanent).toBe(true);
  });

  test('non-permanent blocks respect schedule', () => {
    const settings = {
      enabled: true, blockedSites: baseSites,
      schedule: {
        enabled: true, days: [1, 2, 3, 4, 5],
        startTime: '09:00', endTime: '17:00'
      }
    };
    const sun3am = new Date(2025, 0, 5, 3, 0);
    expect(shouldBlock('https://reddit.com', settings, sun3am)).toBeNull();
  });

  test('non-permanent blocks work during scheduled time', () => {
    const settings = {
      enabled: true, blockedSites: baseSites,
      schedule: {
        enabled: true, days: [1, 2, 3, 4, 5],
        startTime: '09:00', endTime: '17:00'
      }
    };
    const wed10am = new Date(2025, 0, 8, 10, 0);
    const result = shouldBlock('https://reddit.com', settings, wed10am);
    expect(result).not.toBeNull();
  });
});

// --- isValidDomain ---

describe('isValidDomain', () => {
  test('accepts valid domains', () => {
    expect(isValidDomain('reddit.com')).toBe(true);
    expect(isValidDomain('www.reddit.com')).toBe(true);
    expect(isValidDomain('old.reddit.com')).toBe(true);
    expect(isValidDomain('example.co.uk')).toBe(true);
    expect(isValidDomain('my-site.org')).toBe(true);
  });

  test('rejects invalid domains', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain(null)).toBe(false);
    expect(isValidDomain(undefined)).toBe(false);
    expect(isValidDomain('just-a-word')).toBe(false);
    expect(isValidDomain('.com')).toBe(false);
    expect(isValidDomain('reddit.')).toBe(false);
    expect(isValidDomain('reddit.c')).toBe(false);
  });

  test('rejects domains with spaces', () => {
    expect(isValidDomain('red dit.com')).toBe(false);
  });

  test('rejects domains with protocols', () => {
    expect(isValidDomain('https://reddit.com')).toBe(false);
  });
});

// --- cleanDomain ---

describe('cleanDomain', () => {
  test('removes http protocol', () => {
    expect(cleanDomain('http://reddit.com')).toBe('reddit.com');
  });

  test('removes https protocol', () => {
    expect(cleanDomain('https://reddit.com')).toBe('reddit.com');
  });

  test('removes www prefix', () => {
    expect(cleanDomain('www.reddit.com')).toBe('reddit.com');
  });

  test('removes protocol and www', () => {
    expect(cleanDomain('https://www.reddit.com')).toBe('reddit.com');
  });

  test('removes paths', () => {
    expect(cleanDomain('reddit.com/r/programming')).toBe('reddit.com');
  });

  test('removes query strings', () => {
    expect(cleanDomain('reddit.com/page?q=test')).toBe('reddit.com');
  });

  test('trims whitespace', () => {
    expect(cleanDomain('  reddit.com  ')).toBe('reddit.com');
  });

  test('lowercases input', () => {
    expect(cleanDomain('REDDIT.COM')).toBe('reddit.com');
  });

  test('handles full URL with everything', () => {
    expect(cleanDomain('https://www.reddit.com/r/all?sort=new#top')).toBe('reddit.com');
  });

  test('preserves subdomains other than www', () => {
    expect(cleanDomain('old.reddit.com')).toBe('old.reddit.com');
  });
});

// --- DEFAULT_SETTINGS ---

describe('DEFAULT_SETTINGS', () => {
  test('has expected structure', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      blockedSites: [],
      schedule: {
        enabled: false,
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00'
      },
      theme: 'auto',
      style: 'classic',
      hideAuthor: false
    });
  });

  test('enabled by default', () => {
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
  });

  test('empty blocklist by default', () => {
    expect(DEFAULT_SETTINGS.blockedSites).toEqual([]);
  });

  test('schedule disabled by default', () => {
    expect(DEFAULT_SETTINGS.schedule.enabled).toBe(false);
  });

  test('default schedule is weekdays 9-5', () => {
    expect(DEFAULT_SETTINGS.schedule.days).toEqual([1, 2, 3, 4, 5]);
    expect(DEFAULT_SETTINGS.schedule.startTime).toBe('09:00');
    expect(DEFAULT_SETTINGS.schedule.endTime).toBe('17:00');
  });

  test('theme defaults to auto', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('auto');
  });

  test('hideAuthor defaults to false', () => {
    expect(DEFAULT_SETTINGS.hideAuthor).toBe(false);
  });

  test('style defaults to classic', () => {
    expect(DEFAULT_SETTINGS.style).toBe('classic');
  });
});
