import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCQxWeetb3EOORG9aRGc7hQTHGhlMWpLlU",
  authDomain: "korebulary.firebaseapp.com",
  projectId: "korebulary",
  storageBucket: "korebulary.firebasestorage.app",
  messagingSenderId: "367379768598",
  appId: "1:367379768598:web:2009f72ac2801c42955c37",
  measurementId: "G-SL2CMKRTCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);