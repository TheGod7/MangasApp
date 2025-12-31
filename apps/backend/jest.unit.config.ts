import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '^(?!.*\\.integration\\.spec\\.ts$).*\\.spec\\.ts$',
  testEnvironment: 'node',

  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },

  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.integration.spec.ts',
    '!**/__test__/**',
    '!**/__tests__/**',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/*.config.ts',
    '!**/*.constants.ts',
    '!**/*.errors.ts',
    '!main.ts',
  ],

  coverageDirectory: '../coverage/unit',

  moduleNameMapper: {
    '^@media/(.*)$': '<rootDir>/infra/media/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
