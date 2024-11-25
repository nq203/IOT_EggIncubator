import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  View,
  Dimensions,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../firebaseConfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";

interface SensorData {
  id: string;
  humidity: string;
  temperature: string;
  lux: string;
  timestamp: string;
}

const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number }) => {
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("vi-VN", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<string>("humidity");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSensorData = () => {
      setLoading(true);
      const q = query(collection(db, "SensorData"), orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: SensorData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SensorData[];
        setSensorData(data);
        setLoading(false);
      });
      return () => unsubscribe();
    };
    fetchSensorData();
  }, []);

  const handleSensorChange = (sensor: string) => {
    setSelectedSensor(sensor);
  };

  const processDataForChart = () => {
    const selectedData = sensorData.map((item) => parseFloat(item[selectedSensor]));
    const timestamps = sensorData.map((item) => formatTimestamp(item.timestamp)).slice(-5);
    return {
      labels: timestamps,
      datasets: [
        {
          data: selectedData.slice(-5),
          strokeWidth: 4,
        },
      ],
    };
  };

  const chartData = processDataForChart();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đồ thị cảm biến</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00bfff" style={styles.loader} />
      ) : (
        <>
          <Picker
            selectedValue={selectedSensor}
            style={styles.sensorPicker}
            onValueChange={handleSensorChange}
          >
            <Picker.Item label="Humidity" value="humidity" />
            <Picker.Item label="Temperature" value="temperature" />
            <Picker.Item label="Lux" value="lux" />
          </Picker>
          <Text style={styles.subtitle}>Loại cảm biến: {selectedSensor}</Text>
          <ScrollView horizontal>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width * 1.5}
              height={280}
              chartConfig={{
                // backgroundColor: "#0f4c75",
                backgroundGradientFrom: "#0f4c75",
                backgroundGradientTo: "#3282b8",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#00aaff",
                },
                propsForBackgroundLines: {
                  stroke: "rgba(255, 255, 255, 0.2)",
                },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  sensorPicker: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  loader: {
    marginTop: 20,
  },
});

export default Dashboard;
