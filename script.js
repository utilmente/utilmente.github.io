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
} else {
  firebase.app();
}
const db = firebase.firestore();

// Confirmar en consola que Firebase se ha inicializado correctamente
console.log("Firebase inicializado:", firebase);

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
                alert("Token inválido. Genera un nuevo token.");
            }
        } else {
            console.log("❌ No se encontró token en Firestore");
            alert("No existe token, genéralo primero.");
        }
    } catch (error) {
        console.error("Error al validar token:", error);
    }
          }
