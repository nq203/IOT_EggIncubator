import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';  // Import Realtime Database
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBk1bsPhrBViDMYsUJNgHrb_eT4hA1frVs",
//     authDomain: "iotnhom5-8942c.firebaseapp.com",
//     databaseURL: "https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app",
//     projectId: "iotnhom5-8942c",
//     storageBucket: "iotnhom5-8942c.appspot.com",
//     messagingSenderId: "731837978078",
//     appId: "1:731837978078:web:f3105ea66a7a3efe63394f"
// };

const firebaseConfig = {
    apiKey: "AIzaSyA6BueBbQfiADCsvtfob0P5l7RFT4i-op4",
    authDomain: "appfirebase1-d1c0a.firebaseapp.com",
    databaseURL: "https://appfirebase1-d1c0a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "appfirebase1-d1c0a",
    storageBucket: "appfirebase1-d1c0a.appspot.com",
    messagingSenderId: "953571903740",
    appId: "1:953571903740:web:7db28bc0aaaf6c3c0e2f79"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);  // Initialize and export Realtime Database
const storge = getStorage(app);
export { auth, db, realtimeDb, storge };
