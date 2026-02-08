/**
 * Tests for the manifest.json - validates Firefox extension requirements.
 */
const fs = require('fs');
const path = require('path');

describe('manifest.json', () => {
  let manifest;

  beforeAll(() => {
    const raw = fs.readFileSync(
      path.join(__dirname, '..', 'extension', 'manifest.json'),
      'utf-8'
    );
    manifest = JSON.parse(raw);
  });

  test('uses manifest_version 2', () => {
    expect(manifest.manifest_version).toBe(2);
  });

  test('has required name field', () => {
    expect(manifest.name).toBe('Distracted Work');
  });

  test('has valid version format', () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('has a description', () => {
    expect(manifest.description).toBeTruthy();
    expect(manifest.description.length).toBeGreaterThan(10);
    expect(manifest.description.length).toBeLessThanOrEqual(132); // AMO limit
  });

  test('has required permissions', () => {
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('webRequest');
    expect(manifest.permissions).toContain('webRequestBlocking');
    expect(manifest.permissions).toContain('<all_urls>');
  });

  test('has background scripts', () => {
    expect(manifest.background).toBeTruthy();
    expect(manifest.background.scripts).toBeTruthy();
    expect(manifest.background.scripts.length).toBeGreaterThan(0);
    expect(manifest.background.persistent).toBe(true);
  });

  test('background scripts include shared logic', () => {
    expect(manifest.background.scripts).toContain('shared/blocking-logic.js');
    expect(manifest.background.scripts).toContain('background/blocker.js');
    // shared logic must come before blocker
    const sharedIdx = manifest.background.scripts.indexOf('shared/blocking-logic.js');
    const blockerIdx = manifest.background.scripts.indexOf('background/blocker.js');
    expect(sharedIdx).toBeLessThan(blockerIdx);
  });

  test('has browser_action with popup', () => {
    expect(manifest.browser_action).toBeTruthy();
    expect(manifest.browser_action.default_popup).toBe('popup/popup.html');
  });

  test('has icons at required sizes', () => {
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons['48']).toBeTruthy();
    expect(manifest.icons['96']).toBeTruthy();
  });

  test('has options_ui that opens in tab', () => {
    expect(manifest.options_ui).toBeTruthy();
    expect(manifest.options_ui.page).toBe('options/options.html');
    expect(manifest.options_ui.open_in_tab).toBe(true);
  });

  test('has gecko-specific settings with valid ID', () => {
    expect(manifest.browser_specific_settings).toBeTruthy();
    expect(manifest.browser_specific_settings.gecko).toBeTruthy();
    expect(manifest.browser_specific_settings.gecko.id).toBeTruthy();
    // Firefox extension IDs should be email-like or UUID
    expect(manifest.browser_specific_settings.gecko.id).toMatch(/@/);
  });

  test('has minimum Firefox version set', () => {
    expect(manifest.browser_specific_settings.gecko.strict_min_version).toBeTruthy();
  });

  test('redirect page is web-accessible', () => {
    expect(manifest.web_accessible_resources).toContain('redirect/redirect.html');
    expect(manifest.web_accessible_resources).toContain('redirect/redirect.js');
    expect(manifest.web_accessible_resources).toContain('redirect/messages.js');
  });

  test('all referenced files exist', () => {
    const extDir = path.join(__dirname, '..', 'extension');

    // Check background scripts
    manifest.background.scripts.forEach(script => {
      const filePath = path.join(extDir, script);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    // Check popup
    const popupPath = path.join(extDir, manifest.browser_action.default_popup);
    expect(fs.existsSync(popupPath)).toBe(true);

    // Check options
    const optionsPath = path.join(extDir, manifest.options_ui.page);
    expect(fs.existsSync(optionsPath)).toBe(true);

    // Check web_accessible_resources
    manifest.web_accessible_resources.forEach(resource => {
      const filePath = path.join(extDir, resource);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    // Check icon files
    Object.values(manifest.icons).forEach(iconPath => {
      const filePath = path.join(extDir, iconPath);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('does not request unnecessary permissions', () => {
    const dangerous = ['tabs', 'history', 'bookmarks', 'cookies', 'downloads',
      'management', 'nativeMessaging', 'privacy', 'proxy', 'webNavigation'];
    dangerous.forEach(perm => {
      expect(manifest.permissions).not.toContain(perm);
    });
  });
});
