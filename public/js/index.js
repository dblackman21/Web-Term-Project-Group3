document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("go-to-login");
  const registerBtn = document.getElementById("go-to-register");
  const sideMenuOverlay = document.getElementById("side-menu-overlay");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const menuIconBtn = document.querySelector(".menu-icon");
  const cartIconBtn = document.getElementById("cart-icon-btn");
  const exploreBtn = document.getElementById("explore-collection-btn");
  const productList = document.getElementById("product-list");
  const HEADER_OFFESET = 100;

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

  if (cartIconBtn) {
    cartIconBtn.addEventListener("click", () => {
      window.location.href = "./pages/cart.html";
    });
  }

  if (exploreBtn && productList) {
    exploreBtn.addEventListener("click", () => {
      const targetPosition = productList.getBoundingClientRect().top + window.scrollY - HEADER_OFFESET;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  }
});
