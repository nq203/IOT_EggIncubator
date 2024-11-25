import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./src/screens/home.screen";
import  Dashboard  from "./src/screens/dashboard.screen";
import  SensorConfig  from "./src/screens/SensorConfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import HatchCycleManager from "./src/screens/chuki.screen";
import CameraControl from "./src/screens/camera.screen";
export type TabParams = {
  Home: undefined;
  Dashboard: undefined;
  SensorConfig: undefined;
  CameraControl: undefined;
  HatchCycleManager: undefined;
};

const Tab = createBottomTabNavigator<TabParams>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
  initialRouteName="Home"
  screenOptions={{
    headerStyle: { backgroundColor: '#FFFFFF' }, // Header nền trắng
    headerTintColor: '#000', // Màu chữ header là đen
    tabBarStyle: {
      backgroundColor: '#FFFFFF', // Thanh điều hướng nền trắng
      borderTopWidth: 0, // Không viền trên thanh điều hướng
      height: 55, // Độ cao hợp lý
    },
    tabBarActiveTintColor: '#000', // Màu đen cho icon đang chọn
    tabBarInactiveTintColor: '#A9A9A9', // Màu xám nhạt cho icon chưa chọn // Ẩn text bên dưới icon
    tabBarIconStyle: {
      marginVertical: 5, // Khoảng cách giữa icon và viền
    },
  }}
>
  <Tab.Screen
    name="Home"
    component={HomeScreen}
    options={{
      title: "Trang chủ",
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Icon name="home" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Dashboard"
    component={Dashboard}
    options={{
      title: "Đồ thị",
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Icon name="dashboard" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="HatchCycleManager"
    component={HatchCycleManager}
    options={{
      title: "Chu Kì ấp",
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Icon name="content-paste" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="CameraControl"
    component={CameraControl}
    options={{
      title: "Quản lý ảnh",
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Icon name="camera" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="SensorConfig"
    component={SensorConfig}
    options={{
      title: "Cấu hình",
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Icon name="settings" size={size} color={color} />
      ),
    }}
  />
</Tab.Navigator>

    </NavigationContainer>
  );
};

export default App;
