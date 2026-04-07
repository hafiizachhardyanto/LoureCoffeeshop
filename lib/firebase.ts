import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  increment,
  onSnapshot,
  deleteField,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData
} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = typeof window !== "undefined" 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = typeof window !== "undefined" ? getAuth(app) : null;
const storage = getStorage(app);

export { app, db, auth, storage };

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  increment,
  onSnapshot,
  deleteField,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL
};

export type { 
  FirebaseUser, 
  QueryConstraint, 
  QueryDocumentSnapshot, 
  DocumentData 
};