/**
 * Tests for the options page HTML structure and new features.
 */
const fs = require('fs');
const path = require('path');

describe('Options Page', () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, '..', 'extension', 'options', 'options.html'),
      'utf-8'
    );
  });

  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  test('has a master enable toggle', () => {
    const toggle = document.getElementById('enableToggle');
    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe('checkbox');
  });

  test('has a site input for adding new blocked sites', () => {
    const input = document.getElementById('newSiteInput');
    expect(input).not.toBeNull();
    expect(input.placeholder).toContain('reddit.com');
  });

  test('has an add site button', () => {
    const btn = document.getElementById('addSiteBtn');
    expect(btn).not.toBeNull();
  });

  test('has a permanent block checkbox with correct label', () => {
    const check = document.getElementById('permanentCheck');
    expect(check).not.toBeNull();
    expect(check.type).toBe('checkbox');
    const label = check.closest('label');
    expect(label.textContent).toContain('always on');
    expect(label.textContent).toContain('ignores schedule');
  });

  test('has a site list container', () => {
    const list = document.getElementById('siteList');
    expect(list).not.toBeNull();
  });

  test('has a schedule toggle', () => {
    const toggle = document.getElementById('scheduleToggle');
    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe('checkbox');
  });

  test('schedule description mentions non-permanent sites', () => {
    const desc = document.querySelector('.schedule-grid').closest('.card').querySelector('.toggle-desc');
    expect(desc.textContent).toContain('non-permanent');
  });

  test('has day picker buttons for all 7 days', () => {
    const picker = document.getElementById('dayPicker');
    expect(picker).not.toBeNull();
    const buttons = picker.querySelectorAll('.day-btn');
    expect(buttons.length).toBe(7);
  });

  test('weekdays are active by default', () => {
    const picker = document.getElementById('dayPicker');
    const activeButtons = picker.querySelectorAll('.day-btn.active');
    expect(activeButtons.length).toBe(5);
    const activeDays = Array.from(activeButtons).map(btn => btn.dataset.day);
    expect(activeDays).toEqual(['1', '2', '3', '4', '5']);
  });

  test('has start and end time inputs', () => {
    const start = document.getElementById('startTime');
    const end = document.getElementById('endTime');
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
    expect(start.type).toBe('time');
    expect(end.type).toBe('time');
    expect(start.value).toBe('09:00');
    expect(end.value).toBe('17:00');
  });

  test('has a save schedule button', () => {
    const btn = document.getElementById('saveScheduleBtn');
    expect(btn).not.toBeNull();
  });

  // --- Theme ---

  test('has a theme selector with auto/light/dark buttons', () => {
    const selector = document.getElementById('themeSelector');
    expect(selector).not.toBeNull();
    const buttons = selector.querySelectorAll('.theme-btn');
    expect(buttons.length).toBe(3);
    const themes = Array.from(buttons).map(b => b.dataset.theme);
    expect(themes).toEqual(['auto', 'light', 'dark']);
  });

  test('auto theme is selected by default', () => {
    const autoBtn = document.querySelector('.theme-btn[data-theme="auto"]');
    expect(autoBtn.classList.contains('active')).toBe(true);
  });

  test('has dark mode CSS rules', () => {
    const styles = document.querySelector('style');
    expect(styles.textContent).toContain('body.dark');
    expect(styles.textContent).toContain('body.light');
  });

  // --- Style ---

  test('has a style selector with Classic and New York buttons', () => {
    const selector = document.getElementById('styleSelector');
    expect(selector).not.toBeNull();
    const buttons = selector.querySelectorAll('.theme-btn');
    expect(buttons.length).toBe(2);
    const styles = Array.from(buttons).map(b => b.dataset.style);
    expect(styles).toEqual(['classic', 'new-york']);
  });

  // --- Support ---

  test('has a hide author toggle', () => {
    const toggle = document.getElementById('hideAuthorToggle');
    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe('checkbox');
  });

  test('has a coffee message area with Ko-fi link', () => {
    const coffeeMsg = document.getElementById('coffeeMessage');
    expect(coffeeMsg).not.toBeNull();
    const donateLink = document.getElementById('donateLink');
    expect(donateLink).not.toBeNull();
    expect(donateLink.href).toContain('ko-fi.com/alloydwhitlock');
  });

  // --- Attribution ---

  test('has attribution with Adam Whitlock link', () => {
    const attr = document.getElementById('attribution');
    expect(attr).not.toBeNull();
    expect(attr.textContent).toContain('Adam Whitlock');
    const link = attr.querySelector('a[href="https://adamwhitlock.com"]');
    expect(link).not.toBeNull();
  });

  // --- Privacy & links ---

  test('has a privacy policy link', () => {
    const links = document.querySelectorAll('a');
    const privacyLink = Array.from(links).find(a => a.textContent.includes('Privacy'));
    expect(privacyLink).not.toBeNull();
    expect(privacyLink.href).toContain('privacy');
  });

  test('has a link to distracted.work', () => {
    const links = document.querySelectorAll('a');
    const siteLink = Array.from(links).find(a => a.href.includes('distracted.work'));
    expect(siteLink).not.toBeNull();
  });

  test('shows title and tagline', () => {
    const h1 = document.querySelector('h1');
    expect(h1.textContent).toContain('Distracted Work');
    const tagline = document.querySelector('.tagline');
    expect(tagline).not.toBeNull();
  });

  // --- Permanent removal modal ---

  test('has a modal overlay for permanent block removal', () => {
    const overlay = document.getElementById('modalOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.classList.contains('visible')).toBe(false);
  });

  test('modal has title, message, and two buttons', () => {
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    const cancel = document.getElementById('modalCancel');
    const confirm = document.getElementById('modalConfirm');
    expect(title).not.toBeNull();
    expect(message).not.toBeNull();
    expect(cancel).not.toBeNull();
    expect(confirm).not.toBeNull();
  });

  test('modal cancel button is styled prominently (keep blocked)', () => {
    const cancel = document.getElementById('modalCancel');
    expect(cancel.textContent).toContain('Keep it blocked');
    expect(cancel.classList.contains('modal-btn-cancel')).toBe(true);
  });

  test('modal confirm button is styled subtly (yes remove)', () => {
    const confirm = document.getElementById('modalConfirm');
    expect(confirm.textContent).toContain('Yes, remove it');
    expect(confirm.classList.contains('modal-btn-confirm')).toBe(true);
  });

  test('modal buttons container has swappy class for static position swap', () => {
    const buttons = document.getElementById('modalButtons');
    expect(buttons.classList.contains('swappy')).toBe(true);
    // Verify CSS has the swap rule
    const styles = document.querySelector('style');
    expect(styles.textContent).toContain('.swappy');
    expect(styles.textContent).toContain('order:');
  });

  test('modal has a domain display element', () => {
    const domain = document.getElementById('modalDomain');
    expect(domain).not.toBeNull();
  });
});
