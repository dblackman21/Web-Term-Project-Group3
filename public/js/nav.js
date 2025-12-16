/**
 * nav.js - Navigation unifiée pour toutes les pages
 * Gère : menu burger, cart icon, user icon, et menu dynamique selon connexion
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log('🔧 nav.js loaded');
  
  // ========== VARIABLES ==========
  const menuBtn = document.querySelector(".menu-icon");
  const overlay = document.getElementById("side-menu-overlay");
  const closeBtn = document.getElementById("close-menu-btn");
  const cartBtn = document.getElementById("cart-icon-btn") || document.querySelector(".cart-icon");
  const userBtn = document.querySelector(".user-icon");
  
  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = !!localStorage.getItem("authToken");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  
  console.log('Auth status:', isLoggedIn ? 'Logged in' : 'Guest');
  if (user) console.log('User:', user.firstname, user.lastname);

  // ========== SIDE MENU (Burger) ==========
  if (menuBtn && overlay) {
    menuBtn.addEventListener("click", () => {
      overlay.classList.add("open");
      console.log('Menu opened');
    });
  }

  if (closeBtn && overlay) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("open");
      console.log('Menu closed');
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.classList.remove("open");
        console.log('Menu closed (overlay click)');
      }
    });
  }

  // ========== DYNAMIC MENU CONTENT ==========
  updateSideMenu();

  // ========== CART BUTTON ==========
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      const isInPagesFolder = window.location.pathname.includes('/pages/');
      const cartPath = isInPagesFolder ? './cart.html' : './pages/cart.html';
      
      console.log('Navigating to cart:', cartPath);
      window.location.href = cartPath;
    });
  }

  // ========== USER BUTTON ==========
  if (userBtn) {
    userBtn.addEventListener("click", () => {
      const isInPagesFolder = window.location.pathname.includes('/pages/');
      
      if (isLoggedIn) {
        const profilePath = isInPagesFolder ? './profile.html' : './pages/profile.html';
        console.log('Navigating to profile:', profilePath);
        window.location.href = profilePath;
      } else {
        const loginPath = isInPagesFolder ? './login.html' : './pages/login.html';
        console.log('Navigating to login:', loginPath);
        window.location.href = loginPath;
      }
    });
  }

  // ========== LOAD CART COUNT ==========
  loadCartCount();
});

/**
 * Update side menu dynamically based on auth status
 */
function updateSideMenu() {
  const menuNav = document.querySelector('.menu-nav');
  
  if (!menuNav) {
    console.warn('Menu nav not found');
    return;
  }

  const isLoggedIn = !!localStorage.getItem("authToken");
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  
  const isInPagesFolder = window.location.pathname.includes('/pages/');
  const basePath = isInPagesFolder ? './' : './pages/';
  const homePath = isInPagesFolder ? '../index.html' : './index.html';

  let menuHTML = `
    <a href="${homePath}" class="menu-link">Home</a>
    <a href="${basePath}about.html" class="menu-link">About</a>
  `;

  if (isLoggedIn) {
    menuHTML += `
      <a href="${basePath}profile.html" class="menu-link">Profile</a>
      <a href="${basePath}cart.html" class="menu-link">Cart</a>
      <a href="#" id="logout-menu-btn" class="menu-link" style="color: var(--highlight-green); font-weight: 550;">Logout</a>
    `;
  } else {
    menuHTML += `
      <a href="${basePath}login.html" class="menu-link" style="color: var(--highlight-green); font-weight: 550;">Login</a>
      <a href="${basePath}register.html" class="menu-link" style="color: var(--highlight-green); font-weight: 550;">Register</a>
    `;
  }

  menuNav.innerHTML = menuHTML;

  if (isLoggedIn) {
    const logoutBtn = document.getElementById('logout-menu-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  }

  console.log('✅ Side menu updated for:', isLoggedIn ? 'logged in user' : 'guest');
}

/**
 * Handle logout
 */
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    console.log('Logging out...');
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear cart count
    updateCartCountBadge(0);
    
    // Redirect to home
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const homePath = isInPagesFolder ? '../index.html' : './index.html';
    
    window.location.href = homePath;
  }
}

/**
 * Load cart count from API
 */
async function loadCartCount() {
  const CART_API_BASE_URL = '/cart';
  const cartCountBadge = document.getElementById('cart-count-badge');
  
  if (!cartCountBadge) return;

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(CART_API_BASE_URL, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });

    if (response.ok) {
      const cartData = await response.json();
      
      if (cartData && cartData.items) {
        const totalCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        updateCartCountBadge(totalCount);
        console.log('✅ Cart count loaded:', totalCount);
      }
    }
  } catch (error) {
    console.error('Error loading cart count:', error);
  }
}

/**
 * Update cart count badge
 */
function updateCartCountBadge(count) {
  const cartCountBadge = document.getElementById('cart-count-badge');
  
  if (cartCountBadge) {
    cartCountBadge.textContent = count;
    cartCountBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

window.navAPI = {
  updateSideMenu,
  updateCartCountBadge,
  loadCartCount
};