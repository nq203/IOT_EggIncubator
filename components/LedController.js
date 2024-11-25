import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue, set } from 'firebase/database';
import { realtimeDb } from './../firebaseConfig';
import ttsService from '../src/services/TTSServices';



const LEDController = ({ sensorData }) => {
  const [devices, setDevices] = useState({
    LED: false,
    FAN: false,
    Mist: false,
  });
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [config, setConfig] = useState({
    temperatureThreshold: 37.5,
    humidityThreshold: 60,
  });
  const DeviceButton = ({ device, state, toggleDevice }) => {
    const getDeviceName = (device) => {
      const deviceNames = {
        LED: 'Sưởi',
        FAN: 'Điều hòa',
        Mist: 'Phun sương',
      };
      return deviceNames[device] || device;
    };
  
    return (
      <TouchableOpacity
        style={[styles.button, state ? styles.buttonOn : styles.buttonOff]}
        onPress={() => toggleDevice(device, state)}
      >
        <Text style={styles.buttonText}>{getDeviceName(device)}</Text>
      </TouchableOpacity>
    );
  };
  // Load configuration from AsyncStorage
  useEffect(() => {
    const configRef = ref(realtimeDb, 'autoMode/config');
    const unsubscribe = onValue(
      configRef,
      (snapshot) => {
        const configData = snapshot.val();
        if (configData) {
          setConfig(configData); // Cập nhật cấu hình từ Firebase
        }
      },
      (error) => {
        console.error('Error fetching configuration from Firebase: ', error);
      }
    );
    // Hủy đăng ký lắng nghe khi component unmount
    // return () => unsubscribe();
    const autoModeRef = ref(realtimeDb, 'autoMode/isAutoMode');
    const autoModeUnsubscribe = onValue(
      autoModeRef,(snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setIsAutoMode(data);
        }
      },(error) => {
        console.error('Error fetching auto mode state from Firebase: ', error);
      });

  }, []);
  toggleautoMode = async () => {
    set(ref(realtimeDb, 'autoMode/isAutoMode'), !isAutoMode);
  };

  // Listen for device state changes in Firebase
  useEffect(() => {
    const deviceRefs = {
      LED: ref(realtimeDb, 'devices/LED/state'),
      FAN: ref(realtimeDb, 'devices/FAN/state'),
      Mist: ref(realtimeDb, 'devices/Mist/state'),
    };

    const unsubscribes = Object.keys(deviceRefs).map((device) =>
      onValue(deviceRefs[device], (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setDevices((prevDevices) => {
            const newDevices = { ...prevDevices, [device]: data };
            if (prevDevices[device] !== data) {
              const deviceName = getDeviceName(device);
              const stateText = data ? 'đã bật' : 'đã tắt';
              ttsService.speak(`${deviceName} ${stateText}`);
            }
            return newDevices;
          });
        }
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
  
  // Automatically control devices based on sensor data and configuration
  useEffect(() => {
    if (sensorData && isAutoMode) {
      const { temperature, humidity } = sensorData;

      // Control Heater
      if (temperature < config.temperatureThreshold && !devices.LED) {
        toggleDevice('LED', false);
      } else if (temperature >= config.temperatureThreshold && devices.LED) {
        toggleDevice('LED', true);
      }

      // Control FAN
      if (temperature > config.temperatureThreshold  && !devices.FAN) {
        toggleDevice('FAN', false);
      } else if (temperature <= config.temperatureThreshold && devices.FAN) {
        toggleDevice('FAN', true);
      }

      // Control Mist
      if (humidity < config.humidityThreshold && !devices.Mist) {
        toggleDevice('Mist', false);
      } else if (humidity >= config.humidityThreshold && devices.Mist) {
        toggleDevice('Mist', true);
      }
    }
  }, [sensorData, devices, isAutoMode, config]);

  const toggleDevice = async (device, currentState) => {
    const newState = !currentState;
    setDevices((prevDevices) => ({ ...prevDevices, [device]: newState }));

    try {
      await set(ref(realtimeDb, `devices/${device}/state`), newState);
      const deviceName = getDeviceName(device);
      const stateText = newState ? 'đã bật' : 'đã tắt';
      ttsService.speak(`${deviceName} ${stateText}`);
    } catch (error) {
      console.error(`Error updating ${device} state: `, error);
    }
  };

  const getDeviceName = (device) => {
    const deviceNames = {
      LED: 'Sưởi',
      FAN: 'Điều hòa',
      Mist: 'Phun sương',
    };
    return deviceNames[device] || device;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Điều khiển thiết bị</Text>
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Chế độ tự động</Text>
        <Switch value={isAutoMode} onValueChange={toggleautoMode} />
      </View>
      <FlatList
        data={Object.keys(devices)}
        renderItem={({ item }) => (
          <DeviceButton device={item} state={devices[item]} toggleDevice={toggleDevice} />
        )}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.deviceList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 18,
    marginRight: 10,
  },
  deviceList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    margin: 5,
  },
  buttonOn: {
    backgroundColor: '#66BB6A',
  },
  buttonOff: {
    backgroundColor: '#EF5350',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LEDController;
