// Importar Firebase y Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCYfDp-FeHJ0-1InhZOcGRegHavvUFIckw",
    authDomain: "databasechofer.firebaseapp.com",
    projectId: "databasechofer",
    storageBucket: "databasechofer.firebasestorage.app",
    messagingSenderId: "321776427857",
    appId: "1:321776427857:web:4aa3e868c0ce8996446970",
    measurementId: "G-WERC0XVNF0"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener usuarios desde Firestore
async function obtenerUsuarios() {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    querySnapshot.forEach(doc => {
        console.log(`Usuario: ${doc.id}, Token: ${doc.data().token}`);
    });
}

// Función para agregar un usuario a Firestore
async function agregarUsuario(username) {
    const token = Math.random().toString(36).substr(2, 10); // Generar un token aleatorio
    await addDoc(collection(db, "usuarios"), { username, token });
    console.log(`Usuario ${username} agregado con token: ${token}`);
}

// Prueba: Obtener usuarios al cargar la página
obtenerUsuarios();
