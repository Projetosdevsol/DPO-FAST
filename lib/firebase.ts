
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyA8dfNTAO5QqxQfU0n3X4_3JvudizatNPg",
  authDomain: "lgpd-facil-b7246.firebaseapp.com",
  projectId: "lgpd-facil-b7246",
  storageBucket: "lgpd-facil-b7246.firebasestorage.app",
  messagingSenderId: "293358626368",
  appId: "1:293358626368:web:37777f5bab952c7454e1a5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
