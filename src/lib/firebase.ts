import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyBdedhr4yUsc1F665UXeBWBEj03U-ttO6Y",
  authDomain:        "vinamed-10b76.firebaseapp.com",
  projectId:         "vinamed-10b76",
  storageBucket:     "vinamed-10b76.firebasestorage.app",
  messagingSenderId: "902644783277",
  appId:             "1:902644783277:web:ce55f4024a6ce4fd578e24",
};

const appVinamed = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const authVinamed = getAuth(appVinamed);
export const dbVinamed = getFirestore(appVinamed);
