/**
 * Background script for Distracted Work extension.
 * Intercepts navigation to blocked sites and redirects to the motivational page.
 */
(function () {
  'use strict';

  // Redirect URL - uses the extension's built-in redirect page
  const REDIRECT_URL = browser.runtime.getURL('redirect/redirect.html');

  /**
   * Load settings from storage, merging with defaults.
   */
  async function loadSettings() {
    try {
      const result = await browser.storage.local.get('settings');
      if (result.settings) {
        return { ...DEFAULT_SETTINGS, ...result.settings };
      }
      return { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.error('Distracted Work: Failed to load settings', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to storage.
   */
  async function saveSettings(settings) {
    await browser.storage.local.set({ settings });
  }

  // --- Listener Management ---

  let currentListener = null;

  /**
   * Set up the webRequest listener with current settings.
   */
  async function setupListener() {
    const settings = await loadSettings();

    // Remove existing listener if any
    if (currentListener) {
      browser.webRequest.onBeforeRequest.removeListener(currentListener);
      currentListener = null;
    }

    if (!settings.enabled || settings.blockedSites.length === 0) {
      updateIcon(settings.enabled);
      return;
    }

    // Build URL patterns for efficiency
    const patterns = [];
    for (const site of settings.blockedSites) {
      patterns.push(`*://*.${site.domain}/*`);
      patterns.push(`*://${site.domain}/*`);
    }

    currentListener = function (details) {
      // Don't redirect our own pages
      if (details.url.startsWith(browser.runtime.getURL(''))) {
        return {};
      }

      // Only redirect main frame navigations
      if (details.type !== 'main_frame') {
        return {};
      }

      const blockedSite = shouldBlock(details.url, settings);
      if (blockedSite) {
        return { redirectUrl: REDIRECT_URL };
      }
      return {};
    };

    browser.webRequest.onBeforeRequest.addListener(
      currentListener,
      { urls: patterns, types: ['main_frame'] },
      ['blocking']
    );

    updateIcon(settings.enabled);
  }

  /**
   * Update the browser action icon based on state.
   */
  function updateIcon(enabled) {
    const suffix = enabled ? '' : '-disabled';
    browser.browserAction.setIcon({
      path: {
        48: `icons/icon-48${suffix}.svg`,
        96: `icons/icon-96${suffix}.svg`
      }
    }).catch(() => {
      // Icon files may not exist yet - that's ok
    });

    browser.browserAction.setTitle({
      title: enabled ? 'Distracted Work (Active)' : 'Distracted Work (Paused)'
    });
  }

  // --- Message Handling ---

  browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'getSettings') {
      loadSettings().then(sendResponse);
      return true;
    }

    if (message.type === 'saveSettings') {
      saveSettings(message.settings).then(function () {
        setupListener();
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'toggle') {
      loadSettings().then(function (settings) {
        settings.enabled = !settings.enabled;
        return saveSettings(settings).then(function () {
          setupListener();
          sendResponse({ enabled: settings.enabled });
        });
      });
      return true;
    }

    if (message.type === 'addSite') {
      loadSettings().then(function (settings) {
        const domain = message.domain.toLowerCase().replace(/^www\./, '');
        const exists = settings.blockedSites.some(function (s) {
          return s.domain === domain;
        });
        if (!exists) {
          settings.blockedSites.push({
            domain: domain,
            permanent: message.permanent || false,
            addedAt: Date.now()
          });
          return saveSettings(settings).then(function () {
            setupListener();
            sendResponse({ success: true, sites: settings.blockedSites });
          });
        } else {
          sendResponse({ success: false, error: 'Site already blocked' });
        }
      });
      return true;
    }

    if (message.type === 'removeSite') {
      loadSettings().then(function (settings) {
        const site = settings.blockedSites.find(function (s) {
          return s.domain === message.domain;
        });
        if (site && site.permanent && !message.confirmedPermanent) {
          sendResponse({ success: false, error: 'permanent', domain: message.domain });
          return;
        }
        settings.blockedSites = settings.blockedSites.filter(function (s) {
          return s.domain !== message.domain;
        });
        return saveSettings(settings).then(function () {
          setupListener();
          sendResponse({ success: true, sites: settings.blockedSites });
        });
      });
      return true;
    }

    if (message.type === 'getBlockStatus') {
      loadSettings().then(function (settings) {
        const active = settings.enabled && isWithinSchedule(settings.schedule);
        sendResponse({
          enabled: settings.enabled,
          scheduleActive: isWithinSchedule(settings.schedule),
          blocking: active,
          siteCount: settings.blockedSites.length
        });
      });
      return true;
    }
  });

  // Re-setup listener when storage changes (e.g., from options page)
  browser.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.settings) {
      setupListener();
    }
  });

  // Initialize on startup
  setupListener();
})();
