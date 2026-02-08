/**
 * Tests for the redirect page UI behavior.
 * Uses jsdom environment.
 */
const { MESSAGES } = require('../extension/redirect/messages');
const fs = require('fs');
const path = require('path');

describe('Redirect Page', () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, '..', 'extension', 'redirect', 'redirect.html'),
      'utf-8'
    );
  });

  beforeEach(() => {
    document.documentElement.innerHTML = html;
    // Mock localStorage
    const store = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = String(value);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('page has a message container element', () => {
    const el = document.getElementById('message');
    expect(el).not.toBeNull();
  });

  test('page has a "Another One" button', () => {
    const btn = document.getElementById('newMessage');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Another One');
  });

  test('page has a "Close This Tab" button', () => {
    const btn = document.getElementById('closeTab');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Close This Tab');
  });

  test('page has a theme toggle button', () => {
    const btn = document.getElementById('themeToggle');
    expect(btn).not.toBeNull();
  });

  test('page has a privacy policy link', () => {
    const links = document.querySelectorAll('a[href="https://distracted.work/privacy.html"]');
    expect(links.length).toBeGreaterThan(0);
  });

  test('page includes the messages.js script', () => {
    const scripts = document.querySelectorAll('script[src="messages.js"]');
    expect(scripts.length).toBe(1);
  });

  test('page includes the redirect.js script', () => {
    const scripts = document.querySelectorAll('script[src="redirect.js"]');
    expect(scripts.length).toBe(1);
  });

  test('page has proper body class for theming', () => {
    const body = document.querySelector('body');
    // Default class is "light" from the HTML
    expect(body.classList.contains('light')).toBe(true);
  });

  test('page subtitle shows distracted.work without dash', () => {
    const subtitle = document.querySelector('.subtitle');
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toBe('distracted.work');
  });

  test('theme toggle shows text label (not emoji)', () => {
    const btn = document.getElementById('themeToggle');
    expect(btn.textContent).toBe('Auto');
  });

  test('has dark mode CSS rules', () => {
    const styles = document.querySelector('style');
    expect(styles.textContent).toContain('body.dark');
    expect(styles.textContent).toContain('body.light');
  });

  test('has attribution with Adam Whitlock link', () => {
    const attr = document.getElementById('redirectAttribution');
    expect(attr).not.toBeNull();
    expect(attr.textContent).toContain('Adam Whitlock');
    const link = attr.querySelector('a[href="https://adamwhitlock.com"]');
    expect(link).not.toBeNull();
  });
});
