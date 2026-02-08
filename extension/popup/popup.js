/**
 * Popup script for Distracted Work extension.
 */
(function () {
  'use strict';

  var enableToggle = document.getElementById('enableToggle');
  var statusBadge = document.getElementById('statusBadge');
  var siteCount = document.getElementById('siteCount');
  var siteInput = document.getElementById('siteInput');
  var addSiteBtn = document.getElementById('addSiteBtn');
  var permanentCheck = document.getElementById('permanentCheck');
  var feedbackMsg = document.getElementById('feedbackMsg');
  var optionsBtn = document.getElementById('optionsBtn');
  var themeBtn = document.getElementById('themeBtn');
  var popupAttribution = document.getElementById('popupAttribution');

  var THEME_CYCLE = ['auto', 'light', 'dark'];
  var THEME_LABELS = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var currentThemeSetting = 'auto';

  function showFeedback(text, type) {
    feedbackMsg.textContent = text;
    feedbackMsg.className = 'message ' + type;
    setTimeout(function () {
      feedbackMsg.className = 'message';
    }, 3000);
  }

  function resolveTheme(setting) {
    if (setting === 'dark' || setting === 'light') return setting;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(setting) {
    currentThemeSetting = setting;
    var resolved = resolveTheme(setting);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(resolved);
    if (themeBtn) {
      themeBtn.textContent = THEME_LABELS[setting] || 'Auto';
    }
  }

  function applyStyle(style) {
    document.body.setAttribute('data-style', style);
  }

  function cycleTheme() {
    var idx = THEME_CYCLE.indexOf(currentThemeSetting);
    var next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    applyTheme(next);
    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      settings.theme = next;
      browser.runtime.sendMessage({ type: 'saveSettings', settings: settings });
    });
  }

  function updateStatus(data) {
    enableToggle.checked = data.enabled;
    siteCount.textContent = data.siteCount || 0;

    if (!data.enabled) {
      statusBadge.textContent = 'Paused';
      statusBadge.className = 'status-badge paused';
    } else if (!data.scheduleActive) {
      statusBadge.textContent = 'Scheduled';
      statusBadge.className = 'status-badge scheduled';
    } else {
      statusBadge.textContent = 'Active';
      statusBadge.className = 'status-badge active';
    }
  }

  function isValidDomain(domain) {
    if (!domain || domain.length === 0) return false;
    var domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  function cleanDomain(input) {
    var domain = input.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.split('/')[0];
    domain = domain.replace(/^www\./, '');
    return domain;
  }

  // Load settings for theme, style, and attribution, then load status
  browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
    applyTheme(settings.theme || 'auto');
    applyStyle(settings.style || 'classic');
    if (settings.hideAuthor) {
      popupAttribution.style.display = 'none';
    }
  });

  browser.runtime.sendMessage({ type: 'getBlockStatus' }).then(updateStatus);

  // Listen for OS theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      if (!settings.theme || settings.theme === 'auto') {
        applyTheme('auto');
      }
    });
  });

  enableToggle.addEventListener('change', function () {
    browser.runtime.sendMessage({ type: 'toggle' }).then(function () {
      browser.runtime.sendMessage({ type: 'getBlockStatus' }).then(updateStatus);
    });
  });

  addSiteBtn.addEventListener('click', function () {
    var raw = siteInput.value;
    var domain = cleanDomain(raw);

    if (!isValidDomain(domain)) {
      showFeedback('Please enter a valid domain (e.g. reddit.com)', 'error');
      return;
    }

    browser.runtime.sendMessage({
      type: 'addSite',
      domain: domain,
      permanent: permanentCheck.checked
    }).then(function (response) {
      if (response.success) {
        showFeedback(domain + ' blocked!', 'success');
        siteInput.value = '';
        permanentCheck.checked = false;
        browser.runtime.sendMessage({ type: 'getBlockStatus' }).then(updateStatus);
      } else {
        showFeedback(response.error || 'Failed to add site', 'error');
      }
    });
  });

  siteInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addSiteBtn.click();
  });

  optionsBtn.addEventListener('click', function () {
    browser.runtime.openOptionsPage();
    window.close();
  });

  themeBtn.addEventListener('click', cycleTheme);

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isValidDomain, cleanDomain, resolveTheme };
  }
})();
