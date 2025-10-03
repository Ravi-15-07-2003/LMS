import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "lmslogin-35066.firebaseapp.com",
  projectId: "lmslogin-35066",
  storageBucket: "lmslogin-35066.firebasestorage.app",
  messagingSenderId: "495813735629",
  appId: "1:495813735629:web:282afa63dec0a281e5a584"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
export {auth,provider}  