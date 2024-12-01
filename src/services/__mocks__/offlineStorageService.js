export const isOfflineDataAvailable = jest.fn().mockResolvedValue(false);

export const downloadOfflineArea = jest.fn().mockImplementation((lat, lng, radius) => {
  return Promise.resolve({
    status: 'success',
    message: 'Offline data downloaded successfully',
  });
});

export const clearOfflineData = jest.fn().mockResolvedValue(true);
