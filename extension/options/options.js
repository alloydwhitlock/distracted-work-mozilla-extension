/**
 * Options page logic for Distracted Work extension.
 */
(function () {
  'use strict';

  var enableToggle = document.getElementById('enableToggle');
  var newSiteInput = document.getElementById('newSiteInput');
  var addSiteBtn = document.getElementById('addSiteBtn');
  var permanentCheck = document.getElementById('permanentCheck');
  var addFeedback = document.getElementById('addFeedback');
  var siteList = document.getElementById('siteList');
  var scheduleToggle = document.getElementById('scheduleToggle');
  var scheduleConfig = document.getElementById('scheduleConfig');
  var dayPicker = document.getElementById('dayPicker');
  var startTime = document.getElementById('startTime');
  var endTime = document.getElementById('endTime');
  var saveScheduleBtn = document.getElementById('saveScheduleBtn');
  var scheduleFeedback = document.getElementById('scheduleFeedback');
  var themeSelector = document.getElementById('themeSelector');
  var donorToggle = document.getElementById('donorToggle');
  var attribution = document.getElementById('attribution');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var modalMessage = document.getElementById('modalMessage');
  var modalDomain = document.getElementById('modalDomain');
  var modalButtons = document.getElementById('modalButtons');
  var modalCancel = document.getElementById('modalCancel');
  var modalConfirm = document.getElementById('modalConfirm');

  var currentSettings = null;
  var pendingRemoveDomain = null;
  var modalStep = 0;

  // Confirmation messages in the extension's voice
  var CONFIRM_MESSAGES = [
    "You marked {domain} as a permanent block for a reason. Your past self was looking out for you.",
    "Remember when you decided {domain} was too distracting? That was a good call.",
    "Your future self is going to judge this decision about {domain}. Just saying.",
    "Removing the permanent block on {domain}? Imagine explaining this in your standup."
  ];

  var FINAL_MESSAGES = [
    "This will remove the permanent block on {domain}. Your productivity called — it's worried.",
    "Last chance. Unblocking {domain} permanently. Your to-do list just got nervous.",
    "Fine. Removing {domain} from permanent blocks. Don't say we didn't warn you."
  ];

  function showFeedback(el, text, type) {
    el.textContent = text;
    el.className = 'message ' + type;
    setTimeout(function () {
      el.className = 'message';
    }, 3000);
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

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // --- Theme ---

  function resolveTheme(setting) {
    if (setting === 'dark' || setting === 'light') return setting;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(setting) {
    var resolved = resolveTheme(setting);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(resolved);

    var btns = themeSelector.querySelectorAll('.theme-btn');
    btns.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === setting);
    });
  }

  // Listen for OS theme changes when in auto mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (currentSettings && currentSettings.theme === 'auto') {
      applyTheme('auto');
    }
  });

  // --- Permanent removal modal ---

  function showModal(domain) {
    pendingRemoveDomain = domain;
    modalStep = 1;
    modalDomain.textContent = domain;
    modalTitle.textContent = 'Are you sure about that?';
    modalMessage.textContent = pickRandom(CONFIRM_MESSAGES).replace('{domain}', domain);
    modalCancel.textContent = 'Keep it blocked';
    modalConfirm.textContent = 'Yes, remove it';
    modalButtons.classList.add('swappy');
    modalOverlay.classList.add('visible');
  }

  function showModalStep2() {
    modalStep = 2;
    var domain = pendingRemoveDomain;
    modalTitle.textContent = 'You\'re really doing this?';
    modalMessage.textContent = pickRandom(FINAL_MESSAGES).replace('{domain}', domain);
    modalCancel.textContent = 'No, keep blocking';
    modalConfirm.textContent = 'Remove permanently';
    modalButtons.classList.remove('swappy');
    // Re-trigger animation
    var modal = document.getElementById('confirmModal');
    modal.style.animation = 'none';
    void modal.offsetHeight;
    modal.style.animation = 'modalIn 0.25s ease-out';
  }

  function hideModal() {
    modalOverlay.classList.remove('visible');
    pendingRemoveDomain = null;
    modalStep = 0;
  }

  modalCancel.addEventListener('click', hideModal);

  modalConfirm.addEventListener('click', function () {
    if (modalStep === 1) {
      showModalStep2();
      return;
    }
    // Step 2: actually remove
    if (pendingRemoveDomain) {
      browser.runtime.sendMessage({
        type: 'removeSite',
        domain: pendingRemoveDomain,
        confirmedPermanent: true
      }).then(function (response) {
        if (response.success) {
          hideModal();
          loadAndRender();
        }
      });
    }
  });

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) hideModal();
  });

  // --- Site list ---

  function renderSiteList(sites) {
    while (siteList.firstChild) {
      siteList.removeChild(siteList.firstChild);
    }

    if (!sites || sites.length === 0) {
      var emptyLi = document.createElement('li');
      emptyLi.className = 'empty-state';
      emptyLi.textContent = 'No sites blocked yet. Add one above.';
      siteList.appendChild(emptyLi);
      return;
    }

    var sorted = sites.slice().sort(function (a, b) {
      if (a.permanent && !b.permanent) return -1;
      if (!a.permanent && b.permanent) return 1;
      return a.domain.localeCompare(b.domain);
    });

    sorted.forEach(function (site) {
      var li = document.createElement('li');

      var info = document.createElement('div');
      info.className = 'site-info';

      var name = document.createElement('span');
      name.className = 'site-domain';
      name.textContent = site.domain;
      info.appendChild(name);

      if (site.permanent) {
        var badge = document.createElement('span');
        badge.className = 'badge badge-permanent';
        badge.textContent = 'Permanent';
        info.appendChild(badge);
      }

      var removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove';
      removeBtn.textContent = 'Remove';

      removeBtn.addEventListener('click', function () {
        if (site.permanent) {
          showModal(site.domain);
        } else {
          removeSite(site.domain);
        }
      });

      li.appendChild(info);
      li.appendChild(removeBtn);
      siteList.appendChild(li);
    });
  }

  function renderSchedule(schedule) {
    scheduleToggle.checked = schedule.enabled;
    scheduleConfig.classList.toggle('schedule-disabled', !schedule.enabled);
    startTime.value = schedule.startTime || '09:00';
    endTime.value = schedule.endTime || '17:00';

    var dayBtns = dayPicker.querySelectorAll('.day-btn');
    dayBtns.forEach(function (btn) {
      var day = parseInt(btn.dataset.day, 10);
      btn.classList.toggle('active', schedule.days.includes(day));
    });
  }

  function renderAttribution(hasDonated) {
    attribution.style.display = hasDonated ? 'none' : '';
    donorToggle.checked = hasDonated;
  }

  function loadAndRender() {
    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      currentSettings = settings;
      enableToggle.checked = settings.enabled;
      renderSiteList(settings.blockedSites);
      renderSchedule(settings.schedule);
      applyTheme(settings.theme || 'auto');
      renderAttribution(settings.hasDonated || false);
    });
  }

  function removeSite(domain) {
    browser.runtime.sendMessage({ type: 'removeSite', domain: domain }).then(function (response) {
      if (response.success) {
        loadAndRender();
      } else if (response.error === 'permanent') {
        showModal(domain);
      } else {
        showFeedback(addFeedback, response.error || 'Failed to remove site', 'error');
      }
    });
  }

  // --- Event Listeners ---

  enableToggle.addEventListener('change', function () {
    browser.runtime.sendMessage({ type: 'toggle' }).then(function () {
      loadAndRender();
    });
  });

  addSiteBtn.addEventListener('click', function () {
    var raw = newSiteInput.value;
    var domain = cleanDomain(raw);

    if (!isValidDomain(domain)) {
      showFeedback(addFeedback, 'Please enter a valid domain (e.g. reddit.com)', 'error');
      return;
    }

    browser.runtime.sendMessage({
      type: 'addSite',
      domain: domain,
      permanent: permanentCheck.checked
    }).then(function (response) {
      if (response.success) {
        showFeedback(addFeedback, domain + ' added to blocklist!', 'success');
        newSiteInput.value = '';
        permanentCheck.checked = false;
        loadAndRender();
      } else {
        showFeedback(addFeedback, response.error || 'Failed to add site', 'error');
      }
    });
  });

  newSiteInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addSiteBtn.click();
  });

  scheduleToggle.addEventListener('change', function () {
    scheduleConfig.classList.toggle('schedule-disabled', !scheduleToggle.checked);
  });

  dayPicker.addEventListener('click', function (e) {
    var btn = e.target.closest('.day-btn');
    if (btn) btn.classList.toggle('active');
  });

  saveScheduleBtn.addEventListener('click', function () {
    var days = [];
    dayPicker.querySelectorAll('.day-btn.active').forEach(function (btn) {
      days.push(parseInt(btn.dataset.day, 10));
    });

    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      settings.schedule = {
        enabled: scheduleToggle.checked,
        days: days,
        startTime: startTime.value,
        endTime: endTime.value
      };
      browser.runtime.sendMessage({ type: 'saveSettings', settings: settings }).then(function () {
        showFeedback(scheduleFeedback, 'Schedule saved!', 'success');
      });
    });
  });

  // Theme selector
  themeSelector.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-btn');
    if (!btn) return;
    var theme = btn.dataset.theme;
    applyTheme(theme);

    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      settings.theme = theme;
      browser.runtime.sendMessage({ type: 'saveSettings', settings: settings });
    });
  });

  // Donor toggle
  donorToggle.addEventListener('change', function () {
    var hasDonated = donorToggle.checked;
    renderAttribution(hasDonated);

    browser.runtime.sendMessage({ type: 'getSettings' }).then(function (settings) {
      settings.hasDonated = hasDonated;
      browser.runtime.sendMessage({ type: 'saveSettings', settings: settings });
    });
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', loadAndRender);

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      isValidDomain, cleanDomain, resolveTheme,
      CONFIRM_MESSAGES, FINAL_MESSAGES
    };
  }
})();
