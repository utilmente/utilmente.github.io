// Mensaje para confirmar que el script se carga correctamente
console.log("script.js cargado correctamente");

// Configuración de Firebase (modo compat)
const firebaseConfig = {
    apiKey: "AIzaSyDj70Y4Xo60etQv3ACJ_BoxkYtWi_-jkUk",
    authDomain: "portero-6b079.firebaseapp.com",
    projectId: "portero-6b079",
    storageBucket: "portero-6b079.firebasestorage.app",
    messagingSenderId: "600288315443",
    appId: "1:600288315443:web:74204033fb50197a4dbb46"
};

// Inicializa Firebase solo si aún no ha sido inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Confirmar en consola que Firebase se ha inicializado correctamente
console.log("✅ Firestore inicializado:", db);

// Función para validar token
async function validarToken() {
    console.log("validarToken() invocado");
    const tokenIngresado = document.getElementById("tokenInput").value;
    const tokenDoc = db.collection("tokens").doc("actual");
    
    try {
        const docSnap = await tokenDoc.get();
        if (docSnap.exists) {
            const tokenGuardado = docSnap.data().token;
            console.log("Token en Firestore:", tokenGuardado, "Token ingresado:", tokenIngresado);
            
            if (tokenGuardado === tokenIngresado) {
                console.log("✅ Token válido, redirigiendo...");
                
                // 🔹 Redirección directa sin notificaciones
                window.location.href = "go:token";
                
                // Se espera 3 segundos antes de eliminar el token
                setTimeout(async () => {
                    await tokenDoc.delete();
                    console.log("Token eliminado tras validación.");
                }, 3000);
            } else {
                console.log("❌ Token inválido, solicita uno nuevo");
                alert("Token incorrecto.");
            }
        } else {
            console.log("❌ No se encontró token en Firestore");
            alert("No hay token disponible.");
        }
    } catch (error) {
        console.error("Error al validar token:", error);
    }
}

// Función para confirmar acceso de administrador
function solicitarClave() {
    console.log("solicitarClave() invocado");
    const claveIngresada = document.getElementById("passwordInput").value;
    
    if (claveIngresada === "pepe") {
        console.log("✅ Acceso de administrador concedido");
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("btnMostrarToken").style.display = "inline"; // Muestra el botón de mostrar token
    } else {
        console.log("❌ Contraseña incorrecta");
        alert("Contraseña incorrecta.");
    }
}

// Función para generar un nuevo token
async function generarToken() {
    console.log("generarToken() invocado");
    
    const tokenDoc = db.collection("tokens").doc("actual");
    const docSnap = await tokenDoc.get();
    
    if (docSnap.exists) {
        console.log("⚠️ Ya hay un token generado:", docSnap.data().token);
        alert("Ya hay un token activo.");
        return;
    }
    
    const nuevoToken = Math.random().toString(36).substr(2, 10);
    
    try {
        await tokenDoc.set({ token: nuevoToken });
        document.getElementById("tokenDisplay").textContent = "Token generado: " + nuevoToken;
        console.log("✅ Token generado correctamente:", nuevoToken);
    } catch (error) {
        console.error("❌ Error al generar token:", error);
    }
}

// Función para mostrar el token actual
async function mostrarToken() {
    console.log("mostrarToken() invocado");
    const tokenDoc = db.collection("tokens").doc("actual");
    
    try {
        const docSnap = await tokenDoc.get();
        if (docSnap.exists) {
            const tokenActual = docSnap.data().token;
            console.log("🔹 Token recuperado:", tokenActual);
            document.getElementById("tokenDisplay").textContent = "Token válido: " + tokenActual;
        } else {
            console.log("❌ No hay un token almacenado.");
            alert("No hay un token activo.");
        }
    } catch (error) {
        console.error("❌ Error al recuperar token:", error);
    }
}

// Asignar eventos a los botones cuando el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente cargado");
    
    const btnEntrar = document.getElementById("btnEntrar");
    const btnConfirmarAdmin = document.getElementById("btnConfirmarAdmin");
    const btnGenerarToken = document.getElementById("btnGenerarToken");
    const btnMostrarToken = document.getElementById("btnMostrarToken");
    
    if (btnEntrar) {
        btnEntrar.addEventListener("click", validarToken);
    }
    if (btnConfirmarAdmin) {
        btnConfirmarAdmin.addEventListener("click", solicitarClave);
    }
    if (btnGenerarToken) {
        btnGenerarToken.addEventListener("click", generarToken);
    }
    if (btnMostrarToken) {
        btnMostrarToken.style.display = "none"; // Oculta el botón hasta que el administrador acceda
        btnMostrarToken.addEventListener("click", mostrarToken);
    }
});