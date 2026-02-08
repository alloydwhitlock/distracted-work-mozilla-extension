/**
 * Redirect page logic for distracted.work
 * Uses browser.storage for theme preference (synced with extension settings).
 */
(function () {
  'use strict';

  var THEME_CYCLE = ['auto', 'light', 'dark'];
  var THEME_LABELS = { auto: 'Auto', light: 'Light', dark: 'Dark' };

  var lastIndex = -1;
  var currentThemeSetting = 'auto';

  function getRandomMessage() {
    if (!MESSAGES || MESSAGES.length === 0) return "Get back to work.";
    var index;
    do {
      index = Math.floor(Math.random() * MESSAGES.length);
    } while (index === lastIndex && MESSAGES.length > 1);
    lastIndex = index;
    return MESSAGES[index];
  }

  function displayMessage() {
    var el = document.getElementById('message');
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'fadeIn 0.6s ease-out forwards';
    el.textContent = getRandomMessage();
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
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.textContent = THEME_LABELS[setting] || 'Auto';
    }
  }

  function cycleTheme() {
    var idx = THEME_CYCLE.indexOf(currentThemeSetting);
    var next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    applyTheme(next);
    // Save to extension storage if available
    if (typeof browser !== 'undefined' && browser.storage) {
      browser.storage.local.get('settings').then(function (result) {
        var settings = result.settings || {};
        settings.theme = next;
        browser.storage.local.set({ settings: settings });
      });
    } else {
      localStorage.setItem('dw-theme', next);
    }
  }

  function initTheme() {
    // Try extension storage first, fall back to localStorage
    if (typeof browser !== 'undefined' && browser.storage) {
      browser.storage.local.get('settings').then(function (result) {
        var theme = (result.settings && result.settings.theme) || 'auto';
        applyTheme(theme);
        // Apply style
        var style = (result.settings && result.settings.style) || 'classic';
        document.body.setAttribute('data-style', style);
        // Also handle attribution hiding
        if (result.settings && result.settings.hideAuthor) {
          var attr = document.getElementById('redirectAttribution');
          if (attr) attr.style.display = 'none';
        }
      });
    } else {
      var saved = localStorage.getItem('dw-theme') || 'auto';
      applyTheme(saved);
    }
  }

  // Listen for OS theme changes when in auto mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (currentThemeSetting === 'auto') {
      applyTheme('auto');
    }
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', function () {
    displayMessage();
    initTheme();

    document.getElementById('newMessage').addEventListener('click', displayMessage);
    document.getElementById('themeToggle').addEventListener('click', cycleTheme);
    document.getElementById('closeTab').addEventListener('click', function () {
      window.close();
      if (!window.closed) {
        history.back();
      }
    });
  });

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getRandomMessage, displayMessage, resolveTheme, applyTheme, cycleTheme, THEME_CYCLE };
  }
})();
