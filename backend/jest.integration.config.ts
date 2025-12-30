import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@media/(.*)$': '<rootDir>/infra/media/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageDirectory: '../coverage/integration',
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
};

export default config;
