/**
 * Tests for the privacy policy page.
 */
const fs = require('fs');
const path = require('path');

describe('Privacy Policy Page', () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, '..', 'site', 'privacy.html'),
      'utf-8'
    );
  });

  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  test('has a title mentioning Privacy Policy', () => {
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1.textContent).toContain('Privacy Policy');
  });

  test('states no data collection', () => {
    const body = document.body.textContent;
    expect(body).toContain('don\'t collect anything');
  });

  test('mentions the extension stores data locally', () => {
    const body = document.body.textContent;
    expect(body.toLowerCase()).toContain('locally');
  });

  test('states no analytics or tracking', () => {
    const body = document.body.textContent;
    expect(body.toLowerCase()).toContain('analytics');
    expect(body.toLowerCase()).toContain('tracking');
  });

  test('states no cookies (except theme)', () => {
    const body = document.body.textContent;
    expect(body.toLowerCase()).toContain('cookie');
  });

  test('has contact information', () => {
    const body = document.body.textContent;
    expect(body).toContain('privacy@distracted.work');
  });

  test('has a back link to main site', () => {
    const backLink = document.querySelector('a[href="/"]');
    expect(backLink).not.toBeNull();
  });

  test('covers both website and extension', () => {
    const body = document.body.textContent;
    expect(body).toContain('Website');
    expect(body).toContain('Extension');
  });

  test('mentions data never leaves device', () => {
    const body = document.body.textContent;
    expect(body.toLowerCase()).toContain('never leaves');
  });
});
