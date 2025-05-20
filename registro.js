// Configuración de Firebase (modo compat)
const firebaseConfig = {
    apiKey: "AIzaSyDj70Y4Xo60etQv3ACJ_BoxkYtWi_-jkUk",
    authDomain: "portero-6b079.firebaseapp.com",
    projectId: "portero-6b079",
    storageBucket: "portero-6b079.firebasestorage.app",
    messagingSenderId: "600288315443",
    appId: "1:600288315443:web:74204033fb50197a4dbb46"
};

// Import Firebase Compat SDK
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();

/* ============================================
    1️⃣ Registro de Nuevo Usuario en Firestore
    ============================================ */
async function registrarUsuario() {
    const usuario = document.getElementById("userInput").value;
    const password = document.getElementById("passwordInput").value;
    
    if (usuario.trim() === "" || password.trim() === "") {
        alert("Ingrese usuario y contraseña.");
        return;
    }
    
    const fechaExpiracion = firebase.firestore.Timestamp.fromDate(new Date());
    const eliminarEn = firebase.firestore.Timestamp.fromDate(new Date());
    eliminarEn.toDate().setDate(eliminarEn.toDate().getDate() + 10); // 🔹 Se eliminará en 10 días
    
    try {
        const usuarioRef = db.collection("usuarios").doc(usuario);
        const usuarioSnap = await usuarioRef.get();
        
        if (usuarioSnap.exists) {
            alert(`⚠️ El usuario "${usuario}" ya existe. Por favor, elige otro nombre de usuario.`);
            return; // Detener la función si el usuario ya existe
        } else {
            await db.collection("usuarios").doc(usuario).set({
                usuario: usuario,
                password: password,
                activo: true,
                expiracion: fechaExpiracion,
                eliminarEn: eliminarEn,
                bloqueado: false
            });
            
            localStorage.setItem('registrationComplete', 'true'); // 👈 Establecer la bandera
            alert("✅ Usuario registrado correctamente.");
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        }
    } catch (error) {
        console.error("⚠️ Error al registrar usuario:", error);
        alert("⚠️ Ocurrió un problema al registrar el usuario.");
    }
}

/* ============================================
    2️⃣ Vincular eventos a los botones
    ============================================ */
document.addEventListener("DOMContentLoaded", () => {
    const registrationComplete = localStorage.getItem('registrationComplete');
    if (registrationComplete === 'true') {
        localStorage.removeItem('registrationComplete'); // 👈 Limpiar la bandera al cargar la página
        window.location.href = "index.html";
    }
    
    const btnRegistrarUsuario = document.getElementById("btnRegistrarUsuario");
    if (btnRegistrarUsuario) {
        btnRegistrarUsuario.addEventListener("click", () => {
            localStorage.removeItem('registrationComplete'); // 👈 Limpiar la bandera al hacer clic en registrar
            registrarUsuario();
        });
    }
    
    const btnValidarToken = document.getElementById("btnValidarToken");
    if (btnValidarToken) {
        btnValidarToken.addEventListener("click", validarTokenYMostrarFormulario);
    }
});

async function validarTokenYMostrarFormulario() {
    const tokenIngresado = document.getElementById("tokenInput").value;
    const tokensCollection = db.collection("tokens");
    
    try {
        const snapshot = await tokensCollection.where("token", "==", tokenIngresado).where("activo", "==", true).get();
        
        if (!snapshot.empty) {
            document.getElementById("validacionToken").style.display = "none";
            document.getElementById("registroForm").style.display = "block";
        } else {
            alert("Token inválido o ya usado. Por favor, solicita un token válido.");
        }
    } catch (error) {
        console.error("❌ Error al validar token:", error);
        alert("Hubo un error al validar el token.");
    }
}

// 🔹 Hacer funciones accesibles globalmente
window.registrarUsuario = registrarUsuario;
window.validarTokenYMostrarFormulario = validarTokenYMostrarFormulario;