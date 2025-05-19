// 🔹 Inicializar Firebase sin `import`
const firebaseConfig = {
    apiKey: "AIzaSyDj70Y4Xo60etQv3ACJ_BoxkYtWi_-jkUk",
    authDomain: "portero-6b079.firebaseapp.com",
    projectId: "portero-6b079",
    storageBucket: "portero-6b079.firebasestorage.app",
    messagingSenderId: "600288315443",
    appId: "1:600288315443:web:74204033fb50197a4dbb46"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ============================================
    1️⃣ Autenticación de Usuario
    ============================================ */
async function autenticarUsuario() {
    const usuarioIngresado = document.getElementById("loginUser").value;
    const passwordIngresada = document.getElementById("loginPassword").value;

    try {
        const usuarioRef = db.collection("usuarios").doc(usuarioIngresado);
        const usuarioSnap = await usuarioRef.get();

        if (usuarioSnap.exists) {
            const datos = usuarioSnap.data();
            if (datos.password === passwordIngresada) {
                if (datos.activo) { // 👈 Verificación de cuenta activa
                    const expiracionTimestamp = datos.expiracion;
                    const ahora = firebase.firestore.Timestamp.fromDate(new Date()); // Convertimos la fecha actual a Timestamp para comparar

                    console.log("Fecha de expiración (base de datos):", expiracionTimestamp);
                    console.log("Fecha actual (servidor) como Timestamp:", ahora);

                    if (expiracionTimestamp && expiracionTimestamp.seconds < ahora.seconds) { // Comparamos solo los segundos
                        await usuarioRef.update({ activo: false });
                        mostrarError("❌ Tu cuenta ha expirado y ha sido desactivada. Contacta al administrador.");
                    } else {
                        alert("✅ Inicio de sesión exitoso.");
                        window.location.href = "go:token";
                    }
                } else {
                    mostrarError("❌ Esta cuenta está inactiva."); // 👈 Mensaje si la cuenta está inactiva
                }
            } else {
                mostrarError("❌ Contraseña incorrecta.");
            }
        } else {
            mostrarError("❌ Usuario no encontrado.");
        }
    } catch (error) {
        console.error("⚠️ Error en la autenticación:", error);
        mostrarError("⚠️ Error al verificar datos.");
    }
}

/* ============================================
    2️⃣ Mostrar mensaje de error
    ============================================ */
function mostrarError(mensaje) {
    const errorMensaje = document.getElementById("errorMensaje");
    errorMensaje.textContent = mensaje;
    errorMensaje.style.display = "block";
}

/* ============================================
    3️⃣ Vincular eventos a los botones
    ============================================ */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnLogin").addEventListener("click", autenticarUsuario);
});

// 🔹 Hacer funciones accesibles globalmente
window.autenticarUsuario = autenticarUsuario;