import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import {
  getStorage,
  ref as storageRef,
  listAll,
  getDownloadURL,
} from 'firebase/storage';
import {ref as databaseRef, set, onValue} from 'firebase/database';

import {realtimeDb} from '../../firebaseConfig';

type Photo = string;

const CameraControl: React.FC = () => {
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [latestPhoto, setLatestPhoto] = useState<Photo>('');
  const [autoPhotos, setAutoPhotos] = useState<Photo[]>([]);
  const [timeValue, setTimeValue] = useState<string>('');
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes');
  const [currentInterval, setCurrentInterval] = useState<number | null>(null);
  const fetchAutoPhoto = async () => {
    const storage = getStorage(); // Khởi tạo Storage
    const photosRef = storageRef(storage, 'photos/'); // Truy cập thư mục photos/

    try {
      const result = await listAll(photosRef); // Lấy danh sách các tệp trong thư mục photos/
      const urls = await Promise.all(
        result.items.map(item => getDownloadURL(item)), // Lấy URL tải xuống của từng ảnh
      );
      console.log('Danh sách URL:', urls);
      setAutoPhotos(urls); // Lưu danh sách URL vào state
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
    }
  };
  useEffect(() => {
    // Lắng nghe trạng thái "capture" từ Firebase
    const captureRef = databaseRef(realtimeDb, 'capture');
    onValue(captureRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMode(data.mode);

        if (data.mode === 'auto') {
          const intervalInSeconds = data.interval;
          setCurrentInterval(intervalInSeconds);

          // Chuyển đổi thành timeValue và timeUnit
          if (intervalInSeconds >= 3600) {
            setTimeValue((intervalInSeconds / 3600).toString());
            setTimeUnit('hours');
          } else {
            setTimeValue((intervalInSeconds / 60).toString());
            setTimeUnit('minutes');
          }
        }
      }
    });

    // Lắng nghe thay đổi của ảnh
    const photosRef = databaseRef(realtimeDb, 'photos');
    onValue(photosRef, snapshot => {
      if (snapshot.exists()) {
        const photos = snapshot.val();
        const photoUrls: Photo[] = Object.values(photos);
        setLatestPhoto(photoUrls[photoUrls.length - 1]);

        if (mode === 'auto') {
          fetchAutoPhoto();
        }
      }
    });
  }, [mode]);

  const handleCapture = () => {
    const captureRef = databaseRef(realtimeDb, 'capture');
    set(captureRef, {command: true, mode: 'manual', interval: 0});

    setTimeout(() => {
      set(captureRef, {command: false, mode: 'manual', interval: 0});
    }, 1000);
  };

  const handleAutoMode = () => {
    const seconds = calculateSeconds();
    const captureRef = databaseRef(realtimeDb, 'capture');
    set(captureRef, {command: false, mode: 'auto', interval: seconds});
    setCurrentInterval(seconds);
  };

  const calculateSeconds = (): number => {
    const value = parseInt(timeValue);
    return timeUnit === 'minutes' ? value * 60 : value * 3600;
  };

  const handleModeChange = (newMode: 'manual' | 'auto') => {
    const captureRef = databaseRef(realtimeDb, 'capture');
    if (newMode === 'manual') {
      set(captureRef, {command: true, mode: 'manual', interval: 0});

      setTimeout(() => {
        set(captureRef, {command: false, mode: 'manual', interval: 0});
      }, 1000);
    } else {
      set(captureRef, {
        command: false,
        mode: 'auto',
        interval: currentInterval || 0,
      });
      setAutoPhotos([]);
    }
    setMode(newMode);
  };

  const renderAutoPhotos = ({item}: {item: Photo}) => (
    <View style={styles.autoImageContainer}>
      <Image source={{uri: item}} style={styles.autoPreview} />
      {/* <Text>{item}</Text> */}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Giám sát lồng ấp</Text>

        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'manual' && styles.activeMode]}
            onPress={() => handleModeChange('manual')}>
            <Text style={styles.buttonText}>Thủ công</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'auto' && styles.activeMode]}
            onPress={() => handleModeChange('auto')}>
            <Text style={styles.buttonText}>Tự động</Text>
          </TouchableOpacity>
        </View>

        {mode === 'manual' ? (
          <View style={styles.manualContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}>
              <Text style={styles.buttonText}>Chụp ảnh</Text>
            </TouchableOpacity>
            {latestPhoto && (
              <Image source={{uri: latestPhoto}} style={styles.preview} />
            )}
          </View>
        ) : (
          <View style={styles.autoContainer}>
            <TextInput
              style={styles.timeInput}
              keyboardType="numeric"
              value={timeValue}
              onChangeText={setTimeValue}
              placeholder="Enter time"
            />
            <View style={styles.unitButtons}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  timeUnit === 'minutes' && styles.activeUnit,
                ]}
                onPress={() => setTimeUnit('minutes')}>
                <Text style={styles.buttonText}>Phút</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  timeUnit === 'hours' && styles.activeUnit,
                ]}
                onPress={() => setTimeUnit('hours')}>
                <Text style={styles.buttonText}>giờ</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.setButton} onPress={handleAutoMode}>
              <Text style={styles.buttonText}>Đặt</Text>
            </TouchableOpacity>

            {currentInterval && (
              <Text style={styles.intervalDisplay}>
                Interval:{' '}
                {currentInterval >= 3600
                  ? `${(currentInterval / 3600).toFixed(1)} hours`
                  : `${(currentInterval / 60).toFixed(1)} minutes`}
              </Text>
            )}

            {autoPhotos.length > 0 && (
              <FlatList
                data={autoPhotos}
                renderItem={renderAutoPhotos}
                keyExtractor={(item, index) => index.toString()}
                // contentContainerStyle={styles.autoPhotosGrid}
                horizontal // Hiển thị danh sách theo chiều ngang
                contentContainerStyle={styles.autoPhotosHorizontalList}
                showsHorizontalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  autoPhotosHorizontalList: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeMode: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  manualContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  captureButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    resizeMode: 'cover',
  },
  autoContainer: {
    marginTop: 20,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  unitButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  unitButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeUnit: {
    backgroundColor: '#007BFF',
  },
  setButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  intervalDisplay: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
  },
  autoPhotosGrid: {
    marginTop: 10,
    alignItems: 'center',
  },
  autoImageContainer: {
    margin: 10,
    alignItems: 'center',
  },
  autoPreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    resizeMode: 'cover',
  },
});

export default CameraControl;
