/**
 * Jest Setup for Services
 */

beforeAll(() => {
  jest.setTimeout(10000);
});

afterEach(() => {
  jest.clearAllMocks();
});
