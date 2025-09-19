// Simple Firebase test to check if we can connect
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC7XUJDG7PXB3YUiSyh0WMbbqeiR81zNlg",
  authDomain: "uber-like-freelas.firebaseapp.com",
  databaseURL: "https://uber-like-freelas-default-rtdb.firebaseio.com/",
  projectId: "uber-like-freelas",
  storageBucket: "uber-like-freelas.firebasestorage.app",
  messagingSenderId: "901683796826",
  appId: "1:901683796826:web:6db0585afabdf5e8383163"
};

export const testFirebaseConnection = async () => {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('🧪 Firebase app initialized');
    
    // Get database reference
    const database = getDatabase(app);
    console.log('🧪 Database reference obtained');
    
    // Test write
    const testRef = ref(database, 'test');
    await set(testRef, {
      message: 'Hello Firebase!',
      timestamp: Date.now()
    });
    console.log('🧪 Test write successful');
    
    // Test read
    return new Promise((resolve, reject) => {
      onValue(testRef, (snapshot) => {
        const data = snapshot.val();
        console.log('🧪 Test read successful:', data);
        resolve(data);
      }, (error) => {
        console.error('🧪 Test read failed:', error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('🧪 Firebase test failed:', error);
    throw error;
  }
};