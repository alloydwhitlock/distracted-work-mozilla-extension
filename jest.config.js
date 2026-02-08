module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],

  collectCoverageFrom: [
    'extension/**/*.js',
    '!extension/icons/**'
  ]
};
