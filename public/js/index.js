// public/app.js

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("go-to-login");
  const registerBtn = document.getElementById("go-to-register");
  const sideMenuOverlay = document.getElementById("side-menu-overlay");
  const menuIconBtn = document.getElementById("menu-icon-btn");
  const closeMenuBtn = document.getElementById("close-menu-btn");

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
