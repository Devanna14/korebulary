// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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