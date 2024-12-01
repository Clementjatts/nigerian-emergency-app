const mockFacilities = [
  {
    id: '1',
    name: 'General Hospital',
    type: 'hospital',
    location: { lat: 9.0820, lng: 8.6753 },
    address: '123 Hospital Road',
    phoneNumber: '+234123456789',
  },
  {
    id: '2',
    name: 'Central Police Station',
    type: 'police',
    location: { lat: 9.0830, lng: 8.6763 },
    address: '456 Police Avenue',
    phoneNumber: '+234987654321',
  },
];

export const getCurrentLocation = jest.fn().mockResolvedValue({
  coords: {
    latitude: 9.0820,
    longitude: 8.6753,
  },
});

export const findNearbyFacilities = jest.fn().mockImplementation((type) => {
  if (type === 'all') {
    return Promise.resolve(mockFacilities);
  }
  return Promise.resolve(mockFacilities.filter(facility => facility.type === type));
});

export const requestLocationPermission = jest.fn().mockResolvedValue(true);
