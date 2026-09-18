import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDHttmVcc6p0uUx7vifaa9_k55TOGGQx4",
  authDomain: "bovangfarm.firebaseapp.com",
  projectId: "bovangfarm",
  storageBucket: "bovangfarm.firebasestorage.app",
  messagingSenderId: "1092041095434",
  appId: "1:1092041095434:web:999ad2f5fd2bed7aec62f3",
  measurementId: "G-R3NGCBCSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Realtime Database và export ra để các component khác dùng chung
export const database = getDatabase(app);