// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDmN6eko7hlwWwYja9bAn4U34GXjOGkSZY",
    authDomain: "repcontver-app-time.firebaseapp.com",
    projectId: "repcontver-app-time",
    storageBucket: "repcontver-app-time.firebasestorage.app",
    messagingSenderId: "562206423224",
    appId: "1:562206423224:web:bfd4b40d3fe10c19d85c4d"
};

// Inicializar Firebase (versión compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log("🔥 Firebase conectado correctamente");
