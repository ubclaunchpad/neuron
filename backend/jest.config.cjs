// jest.config.js
module.exports = {
    // For TypeScript projects, tell Jest to use ts-jest for transformation
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testEnvironment: 'node',
    // Optionally, if you organize tests in a specific folder or pattern:
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    moduleNameMapper: {
      '^\\.{2}/volunteerClassMatching\\.js$': '<rootDir>/src/services/volunteerClassMatching.ts',
    },
  };
  