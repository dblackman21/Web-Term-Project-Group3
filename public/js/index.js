const CART_API_BASE_URL = '/cart';

/**
 * Update cart icon badge w/ total item count from server.
 * @param {Object} cartResponse - The cart object returned from the API.
 */
function updateCartCount(cartResponse) {
  const cartCountElem = document.getElementById('cart-count-badge');
  let totalCount = 0;

  if (cartResponse && cartResponse.items) {
    totalCount = cartResponse.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  if (cartCountElem) {
    cartCountElem.textContent = totalCount;
    cartCountElem.style.display = totalCount > 0 ? 'flex' : 'none';
  }
}

/**
 * Get auth headers with token if available
 */
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('authToken');
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Cart fetch - Load cart and update count
 */
async function loadAndDisplayCart() {
  try {
    const response = await fetch(CART_API_BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include' // Important pour les cookies
    });

    if (!response.ok) {
      console.error('Failed to load cart:', response.statusText);
      return null;
    }
    
    const cartData = await response.json();
    updateCartCount(cartData);
    return cartData;
  } catch (error) {
    console.error('Network error during cart load:', error);
    return null;
  }
} 

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("go-to-login");
  const registerBtn = document.getElementById("go-to-register"); 
  const sideMenuOverlay = document.getElementById("side-menu-overlay");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const menuIconBtn = document.querySelector(".menu-icon");
  const cartIconBtn = document.getElementById("cart-icon-btn");
  const exploreBtn = document.getElementById("explore-collection-btn");
  const productList = document.getElementById("product-list");
  const HEADER_OFFSET = 100;
  const userIconBtn = document.querySelector(".user-icon");
  
  // Load cart count on page load
  loadAndDisplayCart();

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
        window.location.href = "./pages/profile.html";
      } else {
        window.location.href = "./pages/login.html";
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

  if (cartIconBtn) {
    cartIconBtn.addEventListener("click", () => {
      window.location.href = "./pages/cart.html";
    });
  }

  // Smooth scroll to products
  if (exploreBtn && productList) {
    exploreBtn.addEventListener("click", () => {
      const targetPosition = productList.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  }
});
