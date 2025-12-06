// public/app.js

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("go-to-login");
  const registerBtn = document.getElementById("go-to-register");

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
});
