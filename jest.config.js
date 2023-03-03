process.env.TZ = 'UTC';
process.env.CHECK_QUERY_SYNTAX = 'yupper';

module.exports = {
  roots: ['<rootDir>/src'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/__mocks__/*',
    '<rootDir>/src/models/*',
    '<rootDir>/src/config/*',
    '<rootDir>/src/migrations/*',
    '<rootDir>/src/testMigrations/*'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.js',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/main.ts'
  ],
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy'
  },
  resolver: null,
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  }
};
