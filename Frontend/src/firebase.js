import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB5-Xwotg8XJZrmfYIzTy1DY-g_FjLyEkY",
  authDomain: "docping-86732.firebaseapp.com",
  projectId: "docping-86732",
  storageBucket: "docping-86732.firebasestorage.app",
  messagingSenderId: "234573528906",
  appId: "1:234573528906:web:89883b3bbde83bc9688bb3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();