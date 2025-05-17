// Configuración de Firebase (modo compat)
const firebaseConfig = {
    apiKey: "AIzaSyDj70Y4Xo60etQv3ACJ_BoxkYtWi_-jkUk",
    authDomain: "portero-6b079.firebaseapp.com",
    projectId: "portero-6b079",
    storageBucket: "portero-6b079.firebasestorage.app",
    messagingSenderId: "600288315443",
    appId: "1:600288315443:web:74204033fb50197a4dbb46"
};

// Inicializa Firebase si aún no ha sido inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// **Función corregida** para confirmar acceso de administrador desde Firestore
async function autenticarAdmin() {
    console.log("autenticarAdmin() invocado");
    const claveIngresada = document.getElementById("passwordInput").value;
    const adminDoc = db.collection("config").doc("admin");

    try {
        const docSnap = await adminDoc.get();
        if (docSnap.exists && docSnap.data().password) {
            const claveGuardada = docSnap.data().password;
            console.log("🔒 Clave obtenida de Firestore:", claveGuardada);

            if (claveIngresada === claveGuardada) {
                console.log("✅ Autenticación exitosa");
                document.getElementById("adminPanel").style.display = "block";
                document.getElementById("btnMostrarToken").style.display = "inline"; 
            } else {
                console.log("❌ Contraseña incorrecta");
                alert("Contraseña incorrecta.");
            }
        } else {
            console.log("❌ El documento 'admin' existe pero el campo 'password' no está definido.");
            alert("No se encontró la contraseña en la base de datos.");
        }
    } catch (error) {
        console.error("⚠️ Error al autenticar:", error);
    }
}

// **Función corregida** para validar el token, redirigir y generar uno nuevo automáticamente**
async function validarToken() {
    console.log("validarToken() invocado");
    const tokenIngresado = document.getElementById("tokenInput").value;
    const tokensCollection = db.collection("tokens");

    try {
        const snapshot = await tokensCollection.where("token", "==", tokenIngresado).get();

        if (!snapshot.empty) {
            console.log("✅ Token válido, redirigiendo...");

            // 🔹 Eliminar el token usado antes de generar uno nuevo
            snapshot.forEach(async doc => {
                await doc.ref.delete();
            });
            console.log("🛑 Token utilizado eliminado.");

            // 🔹 Generar un nuevo token automáticamente
            const nuevoToken = Math.random().toString(36).substr(2, 10);
            await tokensCollection.add({ token: nuevoToken, activo: true });
            console.log("✅ Nuevo token generado automáticamente:", nuevoToken);

            // 🔹 Actualizar la vista de tokens
            mostrarToken();

            // 🔹 Redirección a AppCreator24
            window.location.href = "go:token";

        } else {
            console.log("❌ Token inválido, solicita uno nuevo");
            alert("Token incorrecto.");
        }
    } catch (error) {
        console.error("❌ Error al validar token:", error);
        alert("Hubo un error en la validación.");
    }
}

// **Función corregida** para generar nuevos tokens con límite de 10 activos**
async function generarToken() {
    console.log("generarToken() invocado");
    const tokensCollection = db.collection("tokens");

    try {
        const snapshot = await tokensCollection.get();
        const cantidadTokens = snapshot.size;

        // **Si hay menos de 10 tokens, agregar uno nuevo**
        if (cantidadTokens < 10) {
            const nuevoToken = Math.random().toString(36).substr(2, 10);
            await tokensCollection.add({ token: nuevoToken, activo: true });
            console.log("✅ Token generado correctamente:", nuevoToken);
        } else {
            // **Si ya hay 10 tokens activos, eliminar todos y comenzar nuevamente**
            snapshot.forEach(async doc => {
                await doc.ref.delete();
            });

            console.log("🛑 Se eliminaron todos los tokens para reiniciar el ciclo.");
            
            // **Generar el nuevo primer token del nuevo ciclo**
            const nuevoToken = Math.random().toString(36).substr(2, 10);
            await tokensCollection.add({ token: nuevoToken, activo: true });
            console.log("✅ Nuevo ciclo iniciado con el primer token:", nuevoToken);
        }
        
        // **Actualizar el listado de tokens en pantalla**
        mostrarToken();

    } catch (error) {
        console.error("❌ Error al generar token:", error);
        alert("Hubo un error al generar el token.");
    }
}

// **Función corregida** para mostrar todos los tokens activos en lista numerada**
async function mostrarToken() {
    console.log("mostrarToken() invocado");
    const tokensCollection = db.collection("tokens");

    try {
        const snapshot = await tokensCollection.get();
        if (!snapshot.empty) {
            let listaTokens = "<ul>";  // 🔹 Convertimos a lista HTML
            
            let contador = 1; // 🔹 Para numeración automática, sin duplicación
            snapshot.forEach(doc => {
                listaTokens += `<li>${contador}. ${doc.data().token}</li>`;
                contador++;
            });

            listaTokens += "</ul>";

            console.log("🔹 Tokens activos:", listaTokens);
            document.getElementById("tokenDisplay").innerHTML = listaTokens;
        } else {
            console.log("❌ No hay tokens activos.");
            document.getElementById("tokenDisplay").innerHTML = "<p>No hay tokens disponibles.</p>";
        }
    } catch (error) {
        console.error("❌ Error al recuperar tokens:", error);
        alert("Hubo un error al mostrar los tokens.");
    }
}

// **Asegurar que los botones ejecutan sus funciones**
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
        btnConfirmarAdmin.addEventListener("click", autenticarAdmin); // 🔹 **Ahora bien vinculado**
    }
    if (btnGenerarToken) {
        btnGenerarToken.addEventListener("click", generarToken);
    }
    if (btnMostrarToken) {
        btnMostrarToken.addEventListener("click", mostrarToken);
    }
});