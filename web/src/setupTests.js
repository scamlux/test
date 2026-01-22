/**
 * Jest Setup for Frontend
 */

import "@testing-library/jest-dom";

global.fetch = jest.fn();

beforeEach(() => {
  global.fetch.mockClear();
});

afterEach(() => {
  jest.clearAllMocks();
});
