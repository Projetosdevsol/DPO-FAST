

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';


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
export const functions = getFunctions(app, 'southamerica-east1');
export const googleProvider = new GoogleAuthProvider();
