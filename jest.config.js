module.exports = {
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  testEnvironment: 'jsdom',
  testMatch: ['**/?(*.)+(test).(js|ts|jsx|tsx)'],
  testPathIgnorePatterns: [
    'node_modules',
    'iframes',
    'rpgscript-vscode-linter',
  ],
  preset: 'ts-jest',
  // preset: 'vite-jest',
  setupFiles: ['<rootDir>/test/mocksSetup.ts'],
  coveragePathIgnorePatterns: ['node_modules', 'view/icons', 'lib/', 'test/'],
};
