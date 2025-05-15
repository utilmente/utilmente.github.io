document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Credenciales del administrador
    const adminUsername = "3mend2";
    const adminPassword = "991022JPm*";

    if (username === adminUsername && password === adminPassword) {
        localStorage.setItem("adminLoggedIn", "true");
        window.location.href = "dashboard.html"; // Redirige al panel de opciones
    } else {
        document.getElementById("error-message").textContent = "Usuario o contraseña incorrectos.";
    }
});