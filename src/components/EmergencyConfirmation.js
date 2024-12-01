import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Warning, CaretRight } from 'phosphor-react-native';

const EmergencyConfirmation = ({
  visible,
  onConfirm,
  onCancel,
  emergencyType,
  loading
}) => {
  const [progress] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start(() => {
        onCancel();
      });
    } else {
      progress.setValue(0);
    }
  }, [visible]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Warning size={48} color="#E63946" weight="fill" />
          
          <Text style={styles.title}>Emergency Alert</Text>
          <Text style={styles.description}>
            You are about to request emergency assistance for a{' '}
            <Text style={styles.emergencyType}>{emergencyType}</Text> situation.
          </Text>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              False alarms may result in penalties. Only proceed if you have a genuine emergency.
            </Text>
          </View>

          <View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerBar,
                {
                  width,
                },
              ]}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Confirm</Text>
                  <CaretRight size={20} color="#fff" weight="bold" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyType: {
    color: '#E63946',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  timerContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#E63946',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#2A9D8F',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  cancelText: {
    color: '#666',
  },
});

export default EmergencyConfirmation;
