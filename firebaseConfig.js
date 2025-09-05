// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBOApRnKAGZprCaHXXIxpMpkP0qNIzDUEc",
  authDomain: "red-metec.firebaseapp.com",
  projectId: "red-metec",
  storageBucket: "red-metec.firebasestorage.app",
  messagingSenderId: "1007870179537",
  appId: "1:1007870179537:web:fd5bca4fc9cbc33b266df0",
  measurementId: "G-LV131V5SCH"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar auth para login/registro
export const auth = getAuth(app);
