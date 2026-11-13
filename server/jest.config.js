const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only real sources contain tests. Without this, `npm run build` emits dist/Tests/**/*.js
  // and jest discovers those compiled copies as extra suites (the TM-20 failure mode, one level over).
  roots: ["<rootDir>/src"],
  transform: {
    ...tsJestTransformCfg,
  },
  clearMocks: true,
};
