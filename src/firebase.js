import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCukteQ-xHI9BPRWYlHvkRTih62V4N50hE",
  authDomain: "obiltalk.firebaseapp.com",
  projectId: "obiltalk",
  storageBucket: "obiltalk.firebasestorage.app",
  messagingSenderId: "1024187169262",
  appId: "1:1024187169262:web:b1b3ecda948a06c6a4f6ff"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
