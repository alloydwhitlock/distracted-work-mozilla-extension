/**
 * Tests for the distracted.work landing page (site/index.html).
 */
const fs = require('fs');
const path = require('path');

describe('Landing Page (site/index.html)', () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, '..', 'site', 'index.html'),
      'utf-8'
    );
  });

  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  test('has a message container', () => {
    const el = document.getElementById('message');
    expect(el).not.toBeNull();
  });

  test('has an "Another One" button', () => {
    const btn = document.getElementById('newMessage');
    expect(btn).not.toBeNull();
  });

  test('has a "Close This Tab" button', () => {
    const btn = document.getElementById('closeTab');
    expect(btn).not.toBeNull();
  });

  test('has a theme toggle', () => {
    const btn = document.getElementById('themeToggle');
    expect(btn).not.toBeNull();
  });

  test('has a link to the Firefox extension', () => {
    const link = document.getElementById('extensionLink');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Firefox Extension');
  });

  test('has a privacy policy link', () => {
    const links = document.querySelectorAll('a[href="/privacy.html"]');
    expect(links.length).toBeGreaterThan(0);
  });

  test('page contains embedded MESSAGES array', () => {
    // The landing page has messages inline in a script tag
    const scripts = document.querySelectorAll('script');
    const inlineScript = Array.from(scripts).find(s => !s.src && s.textContent.includes('MESSAGES'));
    expect(inlineScript).not.toBeNull();
  });

  test('inline messages match the extension messages', () => {
    // Parse messages from inline script
    const scripts = document.querySelectorAll('script');
    const inlineScript = Array.from(scripts).find(s => !s.src && s.textContent.includes('MESSAGES'));
    // Extract array content via eval in test context
    const scriptContent = inlineScript.textContent;
    // Find MESSAGES array
    const match = scriptContent.match(/const MESSAGES\s*=\s*(\[[\s\S]*?\]);/);
    expect(match).not.toBeNull();

    // Compare with extension messages
    const { MESSAGES: extensionMessages } = require('../extension/redirect/messages');
    const siteMessages = eval(match[1]);
    expect(siteMessages).toEqual(extensionMessages);
  });

  test('has proper meta description', () => {
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.content.length).toBeGreaterThan(0);
  });
});
