/**
 * Tests for the messages module.
 */
const { MESSAGES } = require('../extension/redirect/messages');

describe('MESSAGES', () => {
  test('is an array', () => {
    expect(Array.isArray(MESSAGES)).toBe(true);
  });

  test('has at least 20 messages', () => {
    expect(MESSAGES.length).toBeGreaterThanOrEqual(20);
  });

  test('all messages are non-empty strings', () => {
    MESSAGES.forEach((msg, i) => {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  test('no duplicate messages', () => {
    const unique = new Set(MESSAGES);
    expect(unique.size).toBe(MESSAGES.length);
  });

  test('messages are professional (no excessive profanity)', () => {
    const badWords = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'crap'];
    MESSAGES.forEach((msg) => {
      const lower = msg.toLowerCase();
      badWords.forEach((word) => {
        expect(lower).not.toContain(word);
      });
    });
  });

  test('messages are reasonably short (under 200 chars)', () => {
    MESSAGES.forEach((msg) => {
      expect(msg.length).toBeLessThan(200);
    });
  });

  test('messages end with punctuation', () => {
    MESSAGES.forEach((msg) => {
      const lastChar = msg[msg.length - 1];
      expect(['.', '!', '?']).toContain(lastChar);
    });
  });
});
