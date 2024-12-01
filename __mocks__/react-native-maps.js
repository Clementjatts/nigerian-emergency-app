import React from 'react';
import { View } from 'react-native';

const MockMapView = (props) => {
  return <View testID="mock-map-view" {...props} />;
};

const MockMarker = (props) => {
  return <View testID="mock-marker" {...props} />;
};

export default {
  __esModule: true,
  default: MockMapView,
  Marker: MockMarker,
  PROVIDER_GOOGLE: 'google',
};
