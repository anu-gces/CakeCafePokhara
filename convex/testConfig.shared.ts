// convex/testSetup.ts
/// <reference types="vite/client" />
export const modules = import.meta.glob(
  './**/!(*.*.*)*.*s', // excludes test files (*.test.ts has multiple dots)
)
