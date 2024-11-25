import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {db} from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import {Timestamp} from 'firebase/firestore';
import {getStorage, ref, listAll, getDownloadURL} from 'firebase/storage';
interface HatchCycle {
  id: string;
  name: string;
  startDate: Timestamp; // Firestore Timestamp
  expectedDate: Timestamp; // Firestore Timestamp
  numberOfEggs: number;
  status: 'done' | 'doing' | 'destroy';
}

interface SensorData {
  id: string;
  fanState: boolean;
  humidity: number;
  ledState: boolean;
  lux: number;
  mistState: boolean;
  servoEnabled: boolean;
  temperature: number;
  term: number;
  timestamp: Timestamp;
}

const HatchCycleManager: React.FC = () => {
  const [hatchCycle, setHatchCycle] = useState<HatchCycle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [photoURLs, setPhotoURLs] = useState<string[]>([]);
  // Inputs for new hatch cycle
  const [cycleName, setCycleName] = useState<string>('');
  const [numberOfEggs, setNumberOfEggs] = useState<number | ''>('');
  const fetchPhotos = async () => {
    const storage = getStorage(); // Khởi tạo Storage
    const photosRef = ref(storage, 'photos/'); // Truy cập thư mục photos/

    try {
      const result = await listAll(photosRef); // Lấy danh sách các tệp trong thư mục photos/
      const urls = await Promise.all(
        result.items.map(item => getDownloadURL(item)), // Lấy URL tải xuống của từng ảnh
      );
      setPhotoURLs(urls); // Lưu danh sách URL vào state
    } catch (error) {
      console.error('Lỗi khi tải ảnh:', error);
    }
  };
  // Fetch sensor data
  useEffect(() => {
    const fetchSensorData = () => {
      if (!hatchCycle) return;

      const startDate = hatchCycle.startDate; // Ngày bắt đầu chu kỳ (Firestore Timestamp)
      const q = query(
        collection(db, 'SensorData'),
        where('timestamp', '>=', startDate), // Lấy dữ liệu từ startDate trở đi
        orderBy('timestamp', 'asc'), // Sắp xếp theo thời gian tăng dần
      );

      const unsubscribe = onSnapshot(q, querySnapshot => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SensorData[];
        setSensorData(data); // Lưu dữ liệu cảm biến vào state
        fetchPhotos();
      });

      return () => unsubscribe();
    };

    fetchSensorData();
  }, [hatchCycle]);

  // Fetch hatch cycle data
  useEffect(() => {
    const fetchHatchCycle = () => {
      setLoading(true);
      const q = query(collection(db, 'chuki'), where('status', '==', 'doing'));

      const unsubscribe = onSnapshot(q, querySnapshot => {
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setHatchCycle({id: querySnapshot.docs[0].id, ...data} as HatchCycle);
        } else {
          setHatchCycle(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchHatchCycle();
  }, []);

  // Create a new hatch cycle
  const startNewHatchCycle = async () => {
    if (!cycleName || !numberOfEggs) {
      Alert.alert(
        'Lỗi',
        'Vui lòng điền đầy đủ thông tin trước khi tạo chu kỳ mới.',
      );
      return;
    }

    const startDate = new Date();
    const expectedDate = new Date(startDate);
    expectedDate.setDate(startDate.getDate() + 21); // 21 ngày

    const status: HatchCycle['status'] = 'doing';

    try {
      await addDoc(collection(db, 'chuki'), {
        name: cycleName,
        startDate: Timestamp.fromDate(startDate),
        expectedDate: Timestamp.fromDate(expectedDate),
        numberOfEggs: Number(numberOfEggs),
        status,
      });
      Alert.alert('Chu kỳ mới đã được tạo!');
      setCycleName('');
      setNumberOfEggs('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating new hatch cycle:', error);
    }
  };

  // Manage hatch cycle
  const manageHatchCycle = () => {
    Alert.alert(
      'Quản lý chu kỳ',
      'Bạn muốn làm gì với chu kỳ này?',
      [
        {
          text: 'Hoàn thành',
          onPress: async () => {
            try {
              if (hatchCycle) {
                const cycleDocRef = doc(db, 'chuki', hatchCycle.id);
                await updateDoc(cycleDocRef, {status: 'done'});
                Alert.alert('Chu kỳ đã được đánh dấu là hoàn thành!');
                setHatchCycle(null);
              }
            } catch (error) {
              console.error('Error completing hatch cycle:', error);
              Alert.alert('Lỗi', 'Không thể hoàn thành chu kỳ.');
            }
          },
        },
        {
          text: 'Hủy',
          onPress: async () => {
            try {
              if (hatchCycle) {
                const cycleDocRef = doc(db, 'chuki', hatchCycle.id);
                await updateDoc(cycleDocRef, {status: 'destroy'});
                Alert.alert('Chu kỳ đã bị hủy!');
                setHatchCycle(null);
              }
            } catch (error) {
              console.error('Error canceling hatch cycle:', error);
              Alert.alert('Lỗi', 'Không thể hủy chu kỳ.');
            }
          },
        },
        {
          text: 'Đóng',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  // Calculate average values
  const calculateAverage = (
    key: 'temperature' | 'humidity',
  ): number | string => {
    if (sensorData.length === 0) return 'N/A';
    const total = sensorData.reduce((sum, item) => sum + item[key], 0);
    return (total / sensorData.length).toFixed(1); // 1 chữ số thập phân
  };
  const predictIncubatorStatus = (
    avgTemperature: number | string,
    avgHumidity: number | string,
  ): string => {
    if (avgTemperature === 'N/A' || avgHumidity === 'N/A') {
      return 'Dữ liệu không đủ để dự đoán.';
    }

    const isTemperatureStable = avgTemperature >= 37 && avgTemperature <= 39; // Tiêu chuẩn nhiệt độ
    const isHumidityStable = avgHumidity >= 55 && avgHumidity <= 65; // Tiêu chuẩn độ ẩm

    if (isTemperatureStable && isHumidityStable) {
      return 'Lồng ấp đang hoạt động ổn định.';
    } else if (!isTemperatureStable && !isHumidityStable) {
      return 'Cảnh báo: Nhiệt độ và độ ẩm không đạt yêu cầu!';
    } else if (!isTemperatureStable) {
      return 'Cảnh báo: Nhiệt độ không đạt yêu cầu!';
    } else {
      return 'Cảnh báo: Độ ẩm không đạt yêu cầu!';
    }
  };

  // Display content
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý chu kỳ ấp trứng</Text>

      {loading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : hatchCycle ? (
        <>
          <View style={styles.cycleInfo}>
            <Text style={styles.cycleText}>Tên chu kỳ: {hatchCycle.name}</Text>
            <Text style={styles.cycleText}>
              Ngày bắt đầu:{' '}
              {new Date(hatchCycle.startDate.toDate()).toLocaleDateString()}
            </Text>
            <Text style={styles.cycleText}>
              Ngày dự kiến hoàn thành:{' '}
              {new Date(hatchCycle.expectedDate.toDate()).toLocaleDateString()}
            </Text>
            <Text style={styles.cycleText}>
              Số lượng trứng: {hatchCycle.numberOfEggs}
            </Text>
            <Text style={styles.cycleText}>
              Trạng thái:{' '}
              {hatchCycle.status === 'doing' ? 'Đang ấp' : 'Hoàn thành'}
            </Text>
            <TouchableOpacity onPress={manageHatchCycle} style={styles.button}>
              <Text style={styles.buttonText}>Quản lý chu kỳ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sensorData}>
            <Text style={styles.logsTitle}>Dữ liệu cảm biến</Text>
            <View style={styles.stats}>
              <Text style={styles.statText}>
                Nhiệt độ trung bình toàn chu kì:{' '}
                {calculateAverage('temperature')}°C
              </Text>
              <Text style={styles.statText}>
                Độ ẩm trung bình toàn chu kì: {calculateAverage('humidity')}%
              </Text>
              <Text style={styles.prediction}>
                {predictIncubatorStatus(
                  parseFloat(calculateAverage('temperature')),
                  parseFloat(calculateAverage('humidity')),
                )}
              </Text>
            </View>
            <View style={styles.photoContainer}>
              <Text style={styles.photoTitle}>Ảnh từ lồng ấp</Text>
              <FlatList
                data={photoURLs}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({item}) => (
                  <View style={styles.photoWrapper}>
                    <Image source={{uri: item}} style={styles.photo} />
                  </View>
                )}
              />
            </View>
          </View>
        </>
      ) : showCreateForm ? (
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>Tạo chu kỳ mới</Text>

          <TextInput
            style={styles.input}
            placeholder="Tên chu kỳ"
            value={cycleName}
            onChangeText={setCycleName}
          />
          <TextInput
            style={styles.input}
            placeholder="Số lượng trứng"
            value={numberOfEggs ? String(numberOfEggs) : ''}
            onChangeText={text => setNumberOfEggs(Number(text))}
            keyboardType="numeric"
          />

          <View style={styles.formButtons}>
            <Button title="Tạo" onPress={startNewHatchCycle} />
            <Button title="Hủy" onPress={() => setShowCreateForm(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.noCycleContainer}>
          <Text style={styles.noCycleText}>
            Chưa có chu kỳ nào đang hoạt động.
          </Text>
          <Button
            title="Tạo chu kỳ mới"
            onPress={() => setShowCreateForm(true)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cycleInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cycleText: {
    fontSize: 18,
    marginBottom: 10,
  },
  sensorData: {
    marginTop: 20,
  },
  logsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stats: {
    marginTop: 20,
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 10,
  },
  statText: {
    fontSize: 16,
    marginBottom: 5,
  },
  noCycleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  noCycleText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 20,
  },
  createForm: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prediction: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F', // Màu đỏ cho cảnh báo
  },
  photoContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  photoWrapper: {
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photo: {
    width: 150,
    height: 150,
    resizeMode: 'cover',
  },
  
});

export default HatchCycleManager;
