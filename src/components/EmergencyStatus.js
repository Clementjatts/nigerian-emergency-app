import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Timer, CheckCircle, Warning, X } from 'phosphor-react-native';

const STATUS_TYPES = {
  PENDING: {
    color: '#F4A261',
    icon: Timer,
    message: 'Requesting assistance...'
  },
  ACCEPTED: {
    color: '#2A9D8F',
    icon: CheckCircle,
    message: 'Help is on the way'
  },
  REJECTED: {
    color: '#E63946',
    icon: X,
    message: 'Request could not be processed'
  },
  ERROR: {
    color: '#E76F51',
    icon: Warning,
    message: 'Connection error'
  }
};

const EmergencyStatus = ({ status, estimatedTime, responderInfo }) => {
  const statusConfig = STATUS_TYPES[status] || STATUS_TYPES.ERROR;
  const StatusIcon = statusConfig.icon;

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: statusConfig.color }]}>
        <StatusIcon size={24} color="#fff" weight="bold" />
        <Text style={styles.statusText}>{statusConfig.message}</Text>
        {status === 'PENDING' && <ActivityIndicator color="#fff" size="small" />}
      </View>

      {status === 'ACCEPTED' && responderInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Responder Information:</Text>
          <Text style={styles.infoText}>Unit: {responderInfo.unit}</Text>
          <Text style={styles.infoText}>ETA: {estimatedTime} minutes</Text>
          <Text style={styles.infoText}>
            Distance: {responderInfo.distance.toFixed(1)} km away
          </Text>
        </View>
      )}

      {status === 'REJECTED' && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Please try calling emergency services directly:
          </Text>
          <Text style={styles.phoneNumber}>112</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A9D8F',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default EmergencyStatus;
