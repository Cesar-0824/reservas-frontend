// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxuaHsBYmyXNOx3-A17jB7GTqHFqYURsc",
  authDomain: "reservas-front.firebaseapp.com",
  projectId: "reservas-front",
  storageBucket: "reservas-front.appspot.com",
  messagingSenderId: "381547431346",
  appId: "1:381547431346:web:c86a30a5cf1d11aa0c50ab",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
