document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("go-to-login");
    const registerBtn = document.getElementById("go-to-register");
    const sideMenuOverlay = document.getElementById("side-menu-overlay");
    const closeMenuBtn = document.getElementById("close-menu-btn");
    const menuIconBtn = document.querySelector(".menu-icon");
    const userIconBtn = document.querySelector(".user-icon");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "./pages/login.html";
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            window.location.href = "./pages/register.html";
        });
    }
    // User icon click handler
    if (userIconBtn) {
        userIconBtn.addEventListener("click", () => {
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                window.location.href = "./pages/profile.html";  // Connecté → Profile
            } else {
                window.location.href = "./pages/login.html";     // Guest → Login
            }
        });
    }

    if (menuIconBtn) {
        menuIconBtn.addEventListener("click", () => {
            sideMenuOverlay.classList.add('open');
        });
    }
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener("click", () => {
            sideMenuOverlay.classList.remove('open');
        });
    }
    if (sideMenuOverlay) {
        sideMenuOverlay.addEventListener("click", (event) => {
            if (event.target === sideMenuOverlay) {
                sideMenuOverlay.classList.remove('open');
            }
        });
    }
});
