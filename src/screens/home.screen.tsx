import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  Text,
  View,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import thư viện icon
import {realtimeDb} from './../../firebaseConfig';
import {ref, onValue} from 'firebase/database';
import LEDController from '../../components/LedController';
import ServoController from '../../components/ServoController';

interface SensorData {
  humidity: number;
  lux: number;
  temperature: number;
}

interface Config {
  humidityThreshold: number;
  luxThreshold: number;
  temperatureThreshold: number;
}

const HomeScreen: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Lắng nghe dữ liệu cảm biến
  useEffect(() => {
    const sensorRef = ref(realtimeDb, 'Sensor/');
    const unsubscribe = onValue(
      sensorRef,
      snapshot => {
        const data = snapshot.val();
        setSensorData(data);
        setLoading(false);
      },
      error => {
        console.error('Error fetching sensor data: ', error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Lắng nghe ngưỡng lý tưởng từ Firebase
  useEffect(() => {
    const configRef = ref(realtimeDb, 'autoMode/config');
    const unsubscribe = onValue(
      configRef,
      snapshot => {
        const configData = snapshot.val();
        setConfig(configData);
      },
      error => {
        console.error('Error fetching config data: ', error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const getColor = (type: 'humidity' | 'lux' | 'temperature', value: number) => {
    if (!config) return '#555'; // Nếu chưa có config, hiển thị màu xám

    switch (type) {
      case 'humidity': // Độ ẩm
        return Math.abs(value - config.humidityThreshold) <= 10
          ? '#2ecc71' // Xanh lá (gần lý tưởng)
          : Math.abs(value - config.humidityThreshold) <= 20
          ? '#f1c40f' // Vàng (hơi lệch ngưỡng)
          : '#e74c3c'; // Đỏ (cảnh báo - lệch xa ngưỡng)

      case 'lux': // Độ sáng
        return Math.abs(value - config.luxThreshold) <= 50
          ? '#2ecc71' // Xanh lá (gần lý tưởng)
          : Math.abs(value - config.luxThreshold) <= 150
          ? '#f1c40f' // Vàng (hơi lệch ngưỡng)
          : '#e74c3c'; // Đỏ (cảnh báo - lệch xa ngưỡng)

      case 'temperature': // Nhiệt độ
        return Math.abs(value - config.temperatureThreshold) <= 1
          ? '#2ecc71' // Xanh lá (gần lý tưởng)
          : Math.abs(value - config.temperatureThreshold) <= 3
          ? '#f1c40f' // Vàng (hơi lệch ngưỡng)
          : '#e74c3c'; // Đỏ (cảnh báo - lệch xa ngưỡng)

      default:
        return '#555'; // Màu xám nhạt (giá trị không hợp lệ)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lồng ấp thông minh</Text>

      {loading || !config ? (
        <ActivityIndicator size="large" color="#00bfff" style={styles.loader} />
      ) : (
        sensorData && (
          <View style={styles.dataContainer}>
            {/* Độ ẩm */}
            <View
              style={[
                styles.card,
                { backgroundColor: getColor('humidity', sensorData.humidity) },
              ]}>
              <Icon name="water-percent" size={50} color="#fff" style={styles.icon} />
              <Text style={styles.dataTitle}>Độ ẩm</Text>
              <Text style={styles.dataValue}>{sensorData.humidity}%</Text>
            </View>

            {/* Ánh sáng */}
            <View
              style={[
                styles.card,
                { backgroundColor: getColor('lux', sensorData.lux) },
              ]}>
              <Icon name="weather-sunny" size={50} color="#fff" style={styles.icon} />
              <Text style={styles.dataTitle}>Ánh sáng</Text>
              <Text style={styles.dataValue}>{Math.round(sensorData.lux)}</Text>
            </View>

            {/* Nhiệt độ */}
            <View
              style={[
                styles.card,
                { backgroundColor: getColor('temperature', sensorData.temperature) },
              ]}>
              <Icon name="thermometer" size={50} color="#fff" style={styles.icon} />
              <Text style={styles.dataTitle}>Nhiệt độ</Text>
              <Text style={styles.dataValue}>{sensorData.temperature}°C</Text>
            </View>
          </View>
        )
      )}

      <LEDController sensorData={sensorData} />
      <ServoController />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    // marginVertical: 20,
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  card: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    width: Dimensions.get('window').width / 3 - 20,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  icon: {
    marginBottom: 10,
  },
  loader: {
    marginTop: 20,
  },
});

export default HomeScreen;
