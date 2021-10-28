module.exports = {
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(test).(js|ts|jsx|tsx)'],
  testPathIgnorePatterns: ['node_modules', 'iframes'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/test/mocksSetup.ts'],
  coveragePathIgnorePatterns: ['node_modules', 'view/icons', 'lib/', 'test/'],
};
