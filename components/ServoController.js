import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Button } from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { realtimeDb } from './../firebaseConfig';
import { terminate } from 'firebase/firestore';

const ServoController = () => {
  const [servoState, setServoState] = useState({
    enabled: false,
    term: 0, // Number of rotations
  });
  const [TermMin,setTermMin] = useState(0);
  useEffect(() => {
    const servoRef = ref(realtimeDb, 'servo');

    // Listen for changes to the 'servo' object in the Realtime Database
    const unsubscribe = onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setServoState(data);
        console.log(data);
        setTermMin(data.term/60000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleServo = () => {
    const newEnabledState = !servoState.enabled;
    set(ref(realtimeDb, 'servo/enabled'), newEnabledState);
    setServoState((prevState) => ({ ...prevState, enabled: newEnabledState }));
    
  };

  const updateTerm = () => {
    console.log(TermMin);
    set(ref(realtimeDb, 'servo/term'), TermMin * 60000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đảo trứng</Text>

      {/* Toggle Servo On/Off */}
      <Switch
        value={servoState.enabled}
        onValueChange={toggleServo}
      />

      {/* Input for Number of Rotations */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Chu kì(phút):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={TermMin.toString()}
          onChangeText={(text) => setTermMin(text)}
        />
        <Button title="Cập nhật" onPress={updateTerm} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD', // Màu nền xanh nhạt
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#388E3C', // Màu xanh đậm
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 10,
    padding: 10,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
    color: '#424242',
  },
  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});


export default ServoController;
