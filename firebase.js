import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Credencials del teu projecte "Intreramers"
const firebaseConfig = {
  apiKey: "AIzaSyASABBSdj7sT_C-PceqF2K4yInDOnONQug",
  authDomain: "intreramers.firebaseapp.com",
  databaseURL: "https://intreramers-default-rtdb.firebaseio.com",
  projectId: "intreramers",
  storageBucket: "intreramers.firebasestorage.app",
  messagingSenderId: "124456434526",
  appId: "1:124456434526:web:5b5b007b4543cc6dccadcf"
};

// Inicialitzem l'aplicació
const app = initializeApp(firebaseConfig);

// Inicialitzem i exportem els serveis (Firestore, Auth i Storage)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);