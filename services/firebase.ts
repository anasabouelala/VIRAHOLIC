
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAX048wbozJ78pg5UHegTIXZHxTqgN_SJ0",
  authDomain: "viraholic.firebaseapp.com",
  projectId: "viraholic",
  storageBucket: "viraholic.firebasestorage.app",
  messagingSenderId: "879226731649",
  appId: "1:879226731649:web:ea86abcc5a6ba5f7e2e180",
  measurementId: "G-VX3JDVSE06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { auth, onAuthStateChanged };
export type { User };
