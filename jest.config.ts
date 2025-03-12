export default {
  preset: "ts-jest",
  testEnvironment: "node",
  "setupFilesAfterEnv": ['<rootDir>/src/singleton.ts']
};