const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  clearMocks: true,
  // dist/ holds the compiled copies of src/, so without this every test runs twice.
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
