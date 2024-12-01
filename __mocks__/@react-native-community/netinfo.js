export default {
  addEventListener: jest.fn((callback) => {
    callback({ isConnected: true });
    return jest.fn();
  }),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  isConnected: {
    fetch: jest.fn(() => Promise.resolve(true)),
    addEventListener: jest.fn(() => jest.fn()),
  },
};
