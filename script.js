// Configuración de Firebase (modo compat)
const firebaseConfig = {
    apiKey: "AIzaSyDj70Y4Xo60etQv3ACJ_BoxkYtWi_-jkUk",
    authDomain: "portero-6b079.firebaseapp.com",
    projectId: "portero-6b079",
    storageBucket: "portero-6b079.firebasestorage.app",
    messagingSenderId: "600288315443",
    appId: "1:600288315443:web:74204033fb50197a4dbb46"
};

let db;
let usuariosCargados = false; // Nueva bandera para controlar la carga de usuarios

async function testFirebaseConnection() {
    try {
        await db.collection('test').doc('testDoc').get();
        console.log("Prueba de conexión a Firebase exitosa.");
    } catch (error) {
        console.error("Prueba de conexión a Firebase fallida:", error);
        const vpnMensaje = document.getElementById("vpn-mensaje");
        if (vpnMensaje && error.code === 'unavailable') {
            vpnMensaje.textContent = "Importante: Si lees esto es porque no conexión con el servidor (VPN obligatorio)para que funcione.";
            vpnMensaje.style.display = 'block';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const vpnMensaje = document.getElementById("vpn-mensaje") || document.createElement('div');
    vpnMensaje.id = "vpn-mensaje";
    vpnMensaje.style.color = 'red';
    vpnMensaje.style.fontWeight = 'bold';
    vpnMensaje.style.display = 'none';
    document.body.prepend(vpnMensaje);

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("Firebase inicializado correctamente.");
        testFirebaseConnection();
        obtenerEstadoSesionYMostrarPanel();
        mostrarToken();

    } catch (error) {
        console.error("Error al inicializar Firebase:", error);
        const vpnMensaje = document.getElementById("vpn-mensaje");
        if (vpnMensaje) {
            vpnMensaje.textContent = "Ocurrió un error inesperado al inicializar la aplicación.";
            vpnMensaje.style.display = 'block';
        }
    }

    function obtenerEstadoSesion() {
        return localStorage.getItem("sesionAdmin") === "activa";
    }

    function establecerEstadoSesion(activa) {
        localStorage.setItem("sesionAdmin", activa ? "activa" : "inactiva");
    }

    function mostrarAdminPanel() {
        document.getElementById("adminPanel").style.display = "block";
        const btnMostrarToken = document.getElementById("btnMostrarToken");
        if (btnMostrarToken) {
            btnMostrarToken.style.display = "inline";
        }
        if (!usuariosCargados) { // Verificar si los usuarios ya se cargaron
            cargarUsuarios();
            usuariosCargados = true; // Establecer la bandera a true después de la primera carga
        }
    }

    function ocultarAdminPanel() {
        document.getElementById("adminPanel").style.display = "none";
    }

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

                    const usuarioAdmin = docSnap.data();
                    if (usuarioAdmin.expiracion) {
                        const fechaExpiracion = usuarioAdmin.expiracion.toDate();
                        const ahora = new Date();

                        if (fechaExpiracion < ahora) {
                            console.log("⚠️ Cuenta de administrador expirada.");
                            alert("Tu cuenta de administrador ha expirado. Contacta al soporte.");
                            return;
                        }
                    }

                    establecerEstadoSesion(true);
                    mostrarAdminPanel();

                    const passwordInput = document.getElementById("passwordInput");
                    const btnAdmin = document.getElementById("btnConfirmarAdmin");
                    if (passwordInput && btnAdmin) {
                        passwordInput.style.display = "none";
                        btnAdmin.textContent = "Cerrar Sesión";
                    }

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
            if (error.code === 'unavailable') {
                const vpnMensaje = document.getElementById("vpn-mensaje");
                if (vpnMensaje && vpnMensaje.style.display === 'none') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

    function cerrarSesion() {
        console.log("🔒 Cierre de sesión realizado");
        establecerEstadoSesion(false);
        ocultarAdminPanel();
        alert("Has cerrado sesión como administrador.");
        const btnAdmin = document.getElementById("btnConfirmarAdmin");
        const passwordInput = document.getElementById("passwordInput");
        if (btnAdmin && passwordInput) {
            btnAdmin.textContent = "Administrador";
            passwordInput.style.display = "block";
        }
        usuariosCargados = false; // Restablecer la bandera al cerrar sesión
    }

    async function validarToken() {
        console.log("validarToken() invocado");
        const tokenIngresado = document.getElementById("tokenInput").value;
        const tokensCollection = db.collection("tokens");

        try {
            const tokenSnapshot = await tokensCollection.where("token", "==", tokenIngresado).where("activo", "==", true).get();

            if (!tokenSnapshot.empty) {
                console.log("✅ Token válido, redirigiendo...");
                await Promise.all(tokenSnapshot.docs.map(doc => doc.ref.update({ activo: false })));
                console.log("🛑 Token utilizado marcado como inactivo.");
                console.log("🔹 Redireccionando...");
                window.location.href = "registro.html";
            } else {
                console.log("❌ Token inválido, solicita uno nuevo.");
                alert("Token incorrecto.");
            }
        } catch (error) {
            console.error("❌ Error al validar token:", error);
            alert("Hubo un error en la validación.");
            if (error.code === 'unavailable') {
                const vpnMensaje = document.getElementById("vpn-mensaje");
                if (vpnMensaje && vpnMensaje.style.display === 'none') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

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
            if (error.code === 'unavailable') {
                const vpnMensaje = document.getElementById("vpn-mensaje");
                if (vpnMensaje && vpnMensaje.style.display === 'none') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

    async function mostrarToken() {
        console.log("mostrarToken() invocado");
        const tokensCollection = db.collection("tokens");

        try {
            const snapshot = await tokensCollection.get();
            if (!snapshot.empty) {
                let listaTokens = "<ul>";
                let contador = 1;
                snapshot.forEach(doc => {
                    const tokenValue = doc.data().token;
                    const color = doc.data().activo ? "#fff" : "#ff0000";
                    listaTokens += `<li style="color: ${color};">${contador}. <span class="token-value">${tokenValue}</span>
            <button class="copy-btn">📋 Copiar</button></li>`;
                    contador++;
                });
                listaTokens += "</ul>";
                console.log("🔹 Tokens activos:", listaTokens);
                document.getElementById("tokenDisplay").innerHTML = listaTokens;

                const copyButtons = document.querySelectorAll(".copy-btn");
                copyButtons.forEach(button => {
                    button.addEventListener("click", function() {
                        const tokenElement = this.previousElementSibling;
                        const tokenText = tokenElement.textContent.trim();
                        navigator.clipboard.writeText(tokenText).then(() => {
                            this.textContent = "✅ Copiado";
                            setTimeout(() => {
                                this.textContent = "📋 Copiar";
                            }, 2000);
                        }).catch(err => {
                            console.error("❌ Error al copiar token:", err);
                        });
                    });
                });
            } else {
                console.log("❌ No hay tokens activos.");
                document.getElementById("tokenDisplay").innerHTML = "<p>No hay tokens disponibles.</p>";
            }
        } catch (error) {
            console.error("❌ Error al recuperar tokens:", error);
            alert("Hubo un error al mostrar los tokens.");
            if (error.code === 'unavailable') {
                const vpnMensaje = document.getElementById("vpn-mensaje");
                if (vpnMensaje && vpnMensaje.style.display === 'none') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

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

    async function cargarUsuarios() {
        console.log("cargarUsuarios() invocado");
        const listaUsuariosTabla = document.getElementById("listaUsuarios");
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
                        const isoDate = date.toISOString().slice(0, 16);
                        fechaExpiracionInput.value = isoDate;
                    }
                    expiracionCell.appendChild(fechaExpiracionInput);

                    const guardarExpiracionButton = document.createElement("button");
                    guardarExpiracionButton.textContent = "Guardar";
                    guardarExpiracionButton.onclick = () => guardarFechaExpiracion(userId, fechaExpiracionInput.value);
                    expiracionCell.appendChild(guardarExpiracionButton);

                    const eliminarEnCell = row.insertCell();
                    const eliminarButton = document.createElement("button");
                    eliminarButton.textContent = "Eliminar";
                    eliminarButton.classList.add("delete-btn");
                    eliminarButton.onclick = () => eliminarUsuario(userId);
                    eliminarEnCell.appendChild(eliminarButton);

                    const accionesCell = row.insertCell();
                    const inactivarButton = document.createElement("button");
                    inactivarButton.textContent = usuarioData.activo ? "Inactivar" : "Activar";
                    inactivarButton.classList.add("inactive-btn");
                    inactivarButton.onclick = () => inactivarUsuario(userId, !usuarioData.activo);
                    accionesCell.appendChild(inactivarButton);
                });
            } else {
                listaUsuariosTabla.innerHTML = "<tr><td colspan='5'>No hay usuarios registrados.</td></tr>";
            }
        } catch (error) {
            console.error("⚠️ Error al cargar usuarios:", error);
            alert("Hubo un error al cargar la lista de usuarios.");
            if (error.code === 'unavailable') {
                const vpnMensaje = document.getElementById("vpn-mensaje");
                if (vpnMensaje && vpnMensaje.style.display === 'none') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

    async function guardarFechaExpiracion(userId, nuevaFechaISO) {
        try {
            if (nuevaFechaISO) {
                const nuevaFechaLocal = new Date(nuevaFechaISO);
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
            if (error.code === 'unavailable') {
                vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                vpnMensaje.style.display = 'block';
            }
        }
    }

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
            if (error.code === 'unavailable') {
                vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                vpnMensaje.style.display = 'block';
            }
        }
    }

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
                if (error.code === 'unavailable') {
                    vpnMensaje.textContent = "Importante: Parece que hay un problema de conexión con nuestros servidores. Por favor, asegúrate de estar conectado a través de una VPN si accedes desde Cuba.";
                    vpnMensaje.style.display = 'block';
                }
            }
        }
    }

    function obtenerEstadoSesionYMostrarPanel() {
        if (obtenerEstadoSesion()) {
            mostrarAdminPanel();
        }
    }

    // Vincular eventos a los botones
    const btnEntrar = document.getElementById("btnEntrar");
    const btnConfirmarAdmin = document.getElementById("btnConfirmarAdmin");
    const btnGenerarToken = document.getElementById("btnGenerarToken");
    const btnMostrarToken = document.getElementById("btnMostrarToken");
    const btnCargarUsuarios = document.getElementById("btnCargarUsuarios");
    const btnIrLogin = document.getElementById("btnLogin");
    const btnAdmin = document.getElementById("btnConfirmarAdmin");
    const passwordInput = document.getElementById("passwordInput");

    if (btnEntrar) {
        btnEntrar.addEventListener("click", validarToken);
    }
    if (btnAdmin && passwordInput) {
        btnAdmin.addEventListener("click", () => {
            if (btnAdmin.textContent === "Administrador") {
                passwordInput.style.display = passwordInput.style.display === "none" ? "block" : "block";
                if (passwordInput.style.display === "block" && passwordInput.value.trim() !== "") {
                    autenticarAdmin();
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
    if (btnIrLogin) {
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

function obtenerEstadoSesionYMostrarPanel() {
    if (obtenerEstadoSesion()) {
        mostrarAdminPanel();
    }
}
