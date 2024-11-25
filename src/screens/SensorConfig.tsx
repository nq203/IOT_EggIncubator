import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { ref , onValue, set } from 'firebase/database';
import { realtimeDb } from '../../firebaseConfig';
const SensorConfig = () => {
  const [config, setConfig] = useState({
    temperatureThreshold: 37.5, // Nhiệt độ lý tưởng (°C)
    humidityThreshold: 60,      // Độ ẩm lý tưởng (%)
    luxThreshold: 50,           // Ánh sáng tối thiểu (lux)
  });
  
  // Load saved configuration from AsyncStorage
  useEffect(() => {
    const configref = ref(realtimeDb, 'autoMode/config');
    const unsubscribe = onValue(configref, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConfig(data);
      }
    });
  }, []);

  // Save configuration to AsyncStorage
  const saveConfig = async () => {
    try {
      set(ref(realtimeDb, 'autoMode/config'), config);
      Alert.alert('Thành công', 'Đã lưu cấu hình!');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cấu hình!');
    }
  };

  const handleChange = (key, value) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value === '' ? '' : parseFloat(value),
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cấu hình chế độ tự động</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ngưỡng nhiệt độ (°C):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.temperatureThreshold)}
          onChangeText={(value) => handleChange('temperatureThreshold', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ngưỡng độ ẩm (%):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.humidityThreshold)}
          onChangeText={(value) => handleChange('humidityThreshold', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ngưỡng ánh sáng (lux):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.luxThreshold)}
          onChangeText={(value) => handleChange('luxThreshold', value)}
        />
      </View>

      <Button title="Lưu cấu hình" onPress={saveConfig} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
    padding: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Hiệu ứng đổ bóng
  },
  label: {
    fontSize: 18,
    color: '#455A64', // Màu xám đậm, dễ đọc
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#B0BEC5', // Màu xám nhạt
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ECEFF1', // Nền xám nhạt
    color: '#333',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#388E3C', // Màu xanh đậm
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Hiệu ứng đổ bóng
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});


export default SensorConfig;
