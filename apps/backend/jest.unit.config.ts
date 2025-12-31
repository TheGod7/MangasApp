// jest.unit.config.ts
import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '^(?!.*\\.integration\\.spec\\.ts$).*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
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
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@media/(.*)$': '<rootDir>/infra/media/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
