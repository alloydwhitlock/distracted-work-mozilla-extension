/**
 * Tests for the popup HTML structure and behavior.
 */
const fs = require('fs');
const path = require('path');

describe('Popup Page', () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, '..', 'extension', 'popup', 'popup.html'),
      'utf-8'
    );
  });

  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  test('has an enable/disable toggle', () => {
    const toggle = document.getElementById('enableToggle');
    expect(toggle).not.toBeNull();
    expect(toggle.type).toBe('checkbox');
  });

  test('has a status badge', () => {
    const badge = document.getElementById('statusBadge');
    expect(badge).not.toBeNull();
  });

  test('has a site count display', () => {
    const count = document.getElementById('siteCount');
    expect(count).not.toBeNull();
  });

  test('has a site input field', () => {
    const input = document.getElementById('siteInput');
    expect(input).not.toBeNull();
    expect(input.placeholder).toContain('reddit.com');
  });

  test('has an add site button', () => {
    const btn = document.getElementById('addSiteBtn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Block');
  });

  test('has a permanent block checkbox', () => {
    const check = document.getElementById('permanentCheck');
    expect(check).not.toBeNull();
    expect(check.type).toBe('checkbox');
  });

  test('permanent label says "always on, ignores schedule"', () => {
    const label = document.querySelector('label[for="permanentCheck"]');
    expect(label.textContent).toContain('always on');
    expect(label.textContent).toContain('ignores schedule');
  });

  test('has an options button', () => {
    const btn = document.getElementById('optionsBtn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Options');
  });

  test('has a donate button/link with correct Ko-fi URL', () => {
    const btn = document.getElementById('donateBtn');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Donate');
    expect(btn.href).toContain('ko-fi.com/alloydwhitlock');
  });

  test('popup has constrained width styling', () => {
    const styles = document.querySelector('style');
    expect(styles.textContent).toContain('width: 340px');
  });

  test('has a feedback message area', () => {
    const msg = document.getElementById('feedbackMsg');
    expect(msg).not.toBeNull();
  });

  test('has dark mode CSS rules', () => {
    const styles = document.querySelector('style');
    expect(styles.textContent).toContain('body.dark');
    expect(styles.textContent).toContain('body.light');
  });

  test('has attribution footer with Adam Whitlock link', () => {
    const attr = document.getElementById('popupAttribution');
    expect(attr).not.toBeNull();
    expect(attr.textContent).toContain('Adam Whitlock');
    const link = attr.querySelector('a[href="https://adamwhitlock.com"]');
    expect(link).not.toBeNull();
  });
});
