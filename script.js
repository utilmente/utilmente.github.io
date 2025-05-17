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

/* ============================================
   Funciones para el manejo de la sesión
   ============================================ */

// Recupera el estado de sesión desde localStorage
function obtenerEstadoSesion() {
  return localStorage.getItem("sesionAdmin") === "activa";
}

// Establece el estado de sesión en localStorage
function establecerEstadoSesion(activa) {
  localStorage.setItem("sesionAdmin", activa ? "activa" : "inactiva");
}

// Muestra el panel de administrador y los botones correspondientes
function mostrarAdminPanel() {
  document.getElementById("adminPanel").style.display = "block";
  document.getElementById("btnMostrarToken").style.display = "inline";
  document.getElementById("btnCerrarSesion").style.display = "inline";
}

// Oculta el panel de administrador
function ocultarAdminPanel() {
  document.getElementById("adminPanel").style.display = "none";
}

/* ============================================
   Funciones de autenticación y tokens
   ============================================ */

// Función para autenticar al administrador desde Firestore
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
        // Al autenticar correctamente, se guarda el estado de sesión y se muestra el panel
        establecerEstadoSesion(true);
        mostrarAdminPanel();
      } else {
        console.log("❌ Contraseña incorrecta");
        alert("Contraseña incorrecta.");
      }
    } else {
      console.log("❌ No se encontró la contraseña en Firestore.");
      alert("No hay contraseña registrada.");
    }
  } catch (error) {
    console.error("⚠️ Error al autenticar:", error);
  }
}

// Función para cerrar sesión (el administrador deberá reautenticarse)
function cerrarSesion() {
  console.log("🔒 Cierre de sesión realizado");
  establecerEstadoSesion(false);
  ocultarAdminPanel();
  alert("Has cerrado sesión como administrador.");
}

// Función para validar el token y marcarlo como usado
async function validarToken() {
  console.log("validarToken() invocado");
  const tokenIngresado = document.getElementById("tokenInput").value;
  const tokensCollection = db.collection("tokens");

  try {
    const snapshot = await tokensCollection.where("token", "==", tokenIngresado).get();

    if (!snapshot.empty) {
      console.log("✅ Token válido, redirigiendo...");

      // Marcar el token como usado (inactivo)
      snapshot.forEach(async doc => {
        await doc.ref.update({ activo: false });
      });
      console.log("🛑 Token utilizado marcado como inactivo.");

      // Generar automáticamente un nuevo token
      const nuevoToken = Math.random().toString(36).substr(2, 10);
      await tokensCollection.add({ token: nuevoToken, activo: true });
      console.log("✅ Nuevo token generado automáticamente:", nuevoToken);

      mostrarToken();
      console.log("🔹 Redireccionando...");
      window.location.href = "go:token"; // Reemplaza "go:token" por la URL o comportamiento deseado

    } else {
      console.log("❌ Token inválido, solicita uno nuevo.");
      alert("Token incorrecto.");
    }
  } catch (error) {
    console.error("❌ Error al validar token:", error);
    alert("Hubo un error en la validación.");
  }
}

// Función para generar nuevos tokens con límite de 10 activos
async function generarToken() {
  console.log("generarToken() invocado");
  const tokensCollection = db.collection("tokens");

  try {
    const snapshot = await tokensCollection.get();
    const cantidadTokens = snapshot.size;

    if (cantidadTokens < 10) {
      const nuevoToken = Math.random().toString(36).substr(2, 10);
      await tokensCollection.add({ token: nuevoToken, activo: true });
      console.log("✅ Token generado correctamente:", nuevoToken);
    } else {
      // Si hay 10 o más tokens, se eliminan todos para reiniciar el ciclo
      snapshot.forEach(async doc => {
        await doc.ref.delete();
      });
      console.log("🛑 Se eliminaron todos los tokens para reiniciar el ciclo.");
      
      const nuevoToken = Math.random().toString(36).substr(2, 10);
      await tokensCollection.add({ token: nuevoToken, activo: true });
      console.log("✅ Nuevo ciclo iniciado con el primer token:", nuevoToken);
    }
    
    mostrarToken();
  } catch (error) {
    console.error("❌ Error al generar token:", error);
    alert("Hubo un error al generar el token.");
  }
}

// Función para mostrar tokens activos (en blanco) y usados (en rojo)
async function mostrarToken() {
  console.log("mostrarToken() invocado");
  const tokensCollection = db.collection("tokens");

  try {
    const snapshot = await tokensCollection.get();
    if (!snapshot.empty) {
      let listaTokens = "<ul>";
      let contador = 1; 
      snapshot.forEach(doc => {
        const color = doc.data().activo ? "#fff" : "#ff0000"; // Color rojo si el token está inactivo
        listaTokens += `<li style="color: ${color};">${contador}. ${doc.data().token} 
          <button class="copy-btn" onclick="copiarToken('${doc.data().token}', this)">📋 Copiar</button></li>`;
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

// Función para copiar el token al portapapeles
function copiarToken(token, boton) {
  navigator.clipboard.writeText(token).then(() => {
    boton.textContent = "✅ Copiado";
    setTimeout(() => {
      boton.textContent = "📋 Copiar";
    }, 2000);
  }).catch(err => {
    console.error("❌ Error al copiar token:", err);
  });
}

// Al cargar el DOM, se vinculan los eventos y se verifica el estado de la sesión
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente cargado");

  // Vincular eventos a los botones
  const btnEntrar = document.getElementById("btnEntrar");
  const btnConfirmarAdmin = document.getElementById("btnConfirmarAdmin");
  const btnGenerarToken = document.getElementById("btnGenerarToken");
  const btnMostrarToken = document.getElementById("btnMostrarToken");
  const btnCerrarSesion = document.getElementById("btnCerrarSesion");

  if (btnEntrar) {
    btnEntrar.addEventListener("click", validarToken);
  }
  if (btnConfirmarAdmin) {
    btnConfirmarAdmin.addEventListener("click", autenticarAdmin);
  }
  if (btnGenerarToken) {
    btnGenerarToken.addEventListener("click", generarToken);
  }
  if (btnMostrarToken) {
    btnMostrarToken.addEventListener("click", mostrarToken);
  }
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", cerrarSesion);
  }

  // Si la sesión está activa, se muestra el panel de administrador automáticamente
  if (obtenerEstadoSesion()) {
    console.log("🔹 Sesión de administrador activa");
    mostrarAdminPanel();
  }
  
  console.log("🔹 Botones vinculados correctamente");
});

// Hacer que las funciones de copiar, generar y mostrar tokens sean accesibles globalmente
window.copiarToken = copiarToken;
window.generarToken = generarToken;
window.mostrarToken = mostrarToken;