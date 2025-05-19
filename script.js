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
    const btnMostrarToken = document.getElementById("btnMostrarToken");
    if (btnMostrarToken) {
        btnMostrarToken.style.display = "inline";
    }
    cargarUsuarios(); // Cargar usuarios al mostrar el panel
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

                // --- Verifica la fecha de expiración ---
                const usuarioAdmin = docSnap.data();
                if (usuarioAdmin.expiracion) {
                    const fechaExpiracion = usuarioAdmin.expiracion.toDate();
                    const ahora = new Date();

                    if (fechaExpiracion < ahora) {
                        console.log("⚠️ Cuenta de administrador expirada.");
                        alert("Tu cuenta de administrador ha expirado. Contacta al soporte.");
                        return; // Detiene la ejecución si la cuenta está expirada
                    }
                }
                // ---------------------------------------------------------

                // Al autenticar correctamente y no estar expirado, se guarda el estado de sesión y se muestra el panel
                establecerEstadoSesion(true);
                mostrarAdminPanel();

                // ------------------- Nuevos cambios -------------------
                const passwordInput = document.getElementById("passwordInput");
                const btnAdmin = document.getElementById("btnConfirmarAdmin");
                if (passwordInput && btnAdmin) {
                    passwordInput.style.display = "none"; // Ocultar el input
                    btnAdmin.textContent = "Cerrar Sesión"; // Cambiar el texto del botón
                }
                // -------------------------------------------------------

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
    // Restablecer el texto del botón y mostrar el input nuevamente para futuros inicios de sesión
    const btnAdmin = document.getElementById("btnConfirmarAdmin");
    const passwordInput = document.getElementById("passwordInput");
    if (btnAdmin && passwordInput) {
        btnAdmin.textContent = "Administrador";
        passwordInput.style.display = "block";
    }
}

// Función para validar el token y marcarlo como usado
async function validarToken() {
    console.log("validarToken() invocado");
    const tokenIngresado = document.getElementById("tokenInput").value;
    const tokensCollection = db.collection("tokens");
    const usuariosCollection = db.collection("usuarios");

    try {
        const tokenSnapshot = await tokensCollection.where("token", "==", tokenIngresado).where("activo", "==", true).get();

        if (!tokenSnapshot.empty) {
            console.log("✅ Token válido, redirigiendo...");

            // Marcar el token como usado (inactivo)
            tokenSnapshot.forEach(async doc => {
                await doc.ref.update({ activo: false });
            });
            console.log("🛑 Token utilizado marcado como inactivo.");

            // Buscar el usuario asociado a este token (aquí necesitarás determinar cómo se relaciona el token con el usuario)
            // Asumo que el token se genera para un usuario específico y podría haber un campo 'usuario' en la colección de tokens
            let usuarioEncontrado = null;
            // Por ejemplo, si tu colección de tokens tiene un campo 'usuarioId':
            // const usuarioSnapshot = await usuariosCollection.doc(doc.data().usuarioId).get();

            // Como no sé la estructura exacta, haré una búsqueda por el token (esto podría no ser lo ideal):
            const usuarioSnapshot = await usuariosCollection.where('tokenUsado', 'array-contains', tokenIngresado).get();


            if (!usuarioSnapshot.empty) {
                usuarioSnapshot.forEach(userDoc => {
                    usuarioEncontrado = userDoc.data();
                    const expiracion = usuarioEncontrado.expiracion ? usuarioEncontrado.expiracion.toDate() : null;
                    const ahora = new Date();

                    if (expiracion && expiracion < ahora) {
                        alert("Tu cuenta ha expirado. Contacta al administrador.");
                        return; // Evita la redirección si la cuenta ha expirado
                    }
                });
            }

            if (usuarioEncontrado || true) { // Si se encuentra el usuario o si la lógica de búsqueda es diferente
                console.log("🔹 Redireccionando...");
                window.location.href = "registro.html"; // Reemplaza "go:token" por la URL o comportamiento deseado
            } else {
                alert("No se encontró un usuario válido para este token.");
            }


            // Generar automáticamente un nuevo token
            const nuevoToken = Math.random().toString(36).substr(2, 10);
            await tokensCollection.add({ token: nuevoToken, activo: true });
            console.log("✅ Nuevo token generado automáticamente:", nuevoToken);

            mostrarToken();


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

/* ============================================
   Funciones para la gestión de usuarios
   ============================================ */

// Función para cargar y mostrar la lista de usuarios
async function cargarUsuarios() {
    console.log("cargarUsuarios() invocado");
    const listaUsuariosTabla = document.getElementById("listaUsuarios");
    // Limpiar la tabla antes de cargar nuevos datos
    listaUsuariosTabla.innerHTML = "";

    try {
        const usuariosSnapshot = await db.collection("usuarios").get();
        if (!usuariosSnapshot.empty) {
            usuariosSnapshot.forEach(doc => {
                const usuarioData = doc.data();
                const row = listaUsuariosTabla.insertRow();
                const userId = doc.id;

                const usuarioCell = row.insertCell();
                usuarioCell.textContent = usuarioData.usuario;

                const estadoCell = row.insertCell();
                estadoCell.textContent = usuarioData.activo ? "Activo" : "Inactivo";

                const expiracionCell = row.insertCell();
                const fechaExpiracionInput = document.createElement("input");
                fechaExpiracionInput.type = "datetime-local";
                if (usuarioData.expiracion) {
                    const date = usuarioData.expiracion.toDate();
                    // Formatear la fecha a ISO directamente (esto ya está en UTC)
                    const isoDate = date.toISOString().slice(0, 16);
                    fechaExpiracionInput.value = isoDate;
                }
                expiracionCell.appendChild(fechaExpiracionInput);

                const guardarExpiracionButton = document.createElement("button");
                guardarExpiracionButton.textContent = "Guardar";
                guardarExpiracionButton.onclick = () => guardarFechaExpiracion(userId, fechaExpiracionInput.value);
                expiracionCell.appendChild(guardarExpiracionButton);

                const eliminarEnCell = row.insertCell(); // Celda para "Eliminar en"
                const eliminarButton = document.createElement("button");
                eliminarButton.textContent = "Eliminar";
                eliminarButton.classList.add("delete-btn"); // Puedes agregarle estilos con CSS
                eliminarButton.onclick = () => eliminarUsuario(userId);
                eliminarEnCell.appendChild(eliminarButton); // Añadir botón "Eliminar" a esta celda

                const accionesCell = row.insertCell(); // Celda para "Acciones"
                const inactivarButton = document.createElement("button");
                inactivarButton.textContent = usuarioData.activo ? "Inactivar" : "Activar";
                inactivarButton.classList.add("inactive-btn"); // Puedes agregarle estilos con CSS
                inactivarButton.onclick = () => inactivarUsuario(userId, !usuarioData.activo);
                accionesCell.appendChild(inactivarButton); // Añadir botón "Inactivar" a esta celda
            });
        } else {
            listaUsuariosTabla.innerHTML = "<tr><td colspan='5'>No hay usuarios registrados.</td></tr>";
        }
    } catch (error) {
        console.error("⚠️ Error al cargar usuarios:", error);
        alert("Hubo un error al cargar la lista de usuarios.");
    }
}

// Función para guardar la fecha de expiración personalizada en Firebase
async function guardarFechaExpiracion(userId, nuevaFechaISO) {
    try {
        if (nuevaFechaISO) {
            const nuevaFechaLocal = new Date(nuevaFechaISO);
            // Convertir a UTC (aproximación simple)
            const offset = nuevaFechaLocal.getTimezoneOffset();
            const nuevaFechaUTC = new Date(nuevaFechaLocal.getTime() - offset * 60 * 1000);

            await db.collection("usuarios").doc(userId).update({
                expiracion: firebase.firestore.Timestamp.fromDate(nuevaFechaUTC)
            });
            alert(`Fecha de expiración actualizada para el usuario con ID: ${userId}`);
            cargarUsuarios(); // Recargar la lista para mostrar la fecha actualizada
        } else {
            alert("Por favor, selecciona una fecha y hora para la expiración.");
        }
    } catch (error) {
        console.error("⚠️ Error al guardar la fecha de expiración:", error);
        alert("Hubo un error al guardar la fecha de expiración.");
    }
}

// Función para inactivar o activar un usuario
async function inactivarUsuario(userId, estado) {
    console.log(`Cambiando estado del usuario ${userId} a ${estado ? 'Activo' : 'Inactivo'}`);
    try {
        await db.collection("usuarios").doc(userId).update({
            activo: estado
        });
        alert(`Estado del usuario con ID: ${userId} cambiado a ${estado ? 'Activo' : 'Inactivo'}`);
        cargarUsuarios(); // Recargar la lista para mostrar el estado actualizado
    } catch (error) {
        console.error("⚠️ Error al cambiar el estado del usuario:", error);
        alert("Hubo un error al cambiar el estado del usuario.");
    }
}

// Función para eliminar un usuario
async function eliminarUsuario(userId) {
    console.log(`Eliminar usuario con ID: ${userId}`);
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario con ID: ${userId}?`)) {
        try {
            await db.collection("usuarios").doc(userId).delete();
            console.log(`✅ Usuario con ID: ${userId} eliminado correctamente.`);
            alert("Usuario eliminado correctamente.");
            cargarUsuarios(); // Recargar la lista de usuarios después de eliminar
        } catch (error) {
            console.error("⚠️ Error al eliminar usuario:", error);
        }
    }
}

/* ============================================
   Vinculación de eventos y estado inicial
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM completamente cargado");

    // Vincular eventos a los botones
    const btnEntrar = document.getElementById("btnEntrar");
    const btnConfirmarAdmin = document.getElementById("btnConfirmarAdmin");
    const btnGenerarToken = document.getElementById("btnGenerarToken");
    const btnMostrarToken = document.getElementById("btnMostrarToken");
    const btnCargarUsuarios = document.getElementById("btnCargarUsuarios");
    const btnIrLogin = document.getElementById("btnLogin"); // 👈 Se obtiene el nuevo botón
    const btnAdmin = document.getElementById("btnConfirmarAdmin"); // 👈 Se obtiene el botón de administrador
    const passwordInput = document.getElementById("passwordInput"); // 👈 Se obtiene el input de la contraseña

    if (btnEntrar) {
        btnEntrar.addEventListener("click", validarToken);
    }
    if (btnAdmin && passwordInput) {
        btnAdmin.addEventListener("click", () => {
            if (btnAdmin.textContent === "Administrador") {
                passwordInput.style.display = passwordInput.style.display === "none" ? "block" : "block"; // Aseguramos que se muestre
                if (passwordInput.style.display === "block" && passwordInput.value.trim() !== "") {
                    autenticarAdmin();
                } else if (passwordInput.style.display === "block") {
                    // Si solo se muestra, no hacer nada más al primer clic
                }
            } else if (btnAdmin.textContent === "Cerrar Sesión") {
                cerrarSesion();
            }
        });
    }
    if (btnGenerarToken) {
        btnGenerarToken.addEventListener("click", generarToken);
    }
    if (btnMostrarToken) {
        btnMostrarToken.addEventListener("click", mostrarToken);
    }
    if (btnCargarUsuarios) {
        btnCargarUsuarios.addEventListener("click", cargarUsuarios);
    }
    if (btnIrLogin) { // 👈 Se añade el listener para el nuevo botón
        btnIrLogin.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    // Si la sesión está activa, se muestra el panel de administrador automáticamente
    if (obtenerEstadoSesion()) {
        console.log("🔹 Sesión de administrador activa");
        mostrarAdminPanel();
        if (btnAdmin) {
            btnAdmin.textContent = "Cerrar Sesión";
            if (passwordInput) {
                passwordInput.style.display = "none";
            }
        }
    }

    console.log("🔹 Botones vinculados correctamente");
});

// Hacer que las funciones sean accesibles globalmente si es necesario
window.copiarToken = copiarToken;
window.generarToken = generarToken;
window.mostrarToken = mostrarToken;
window.eliminarUsuario = eliminarUsuario;
window.guardarFechaExpiracion = guardarFechaExpiracion;
window.inactivarUsuario = inactivarUsuario;