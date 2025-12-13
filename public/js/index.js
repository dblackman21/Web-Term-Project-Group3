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
//Cart fetch
async function loadAndDisplayCart() {
  try {
    const response = await fetch(CART_API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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

//Use API to add to cart
async function addToCartAPI(productId, quantity = 1) {
  try {
    const response = await fetch(`${CART_API_BASE_URL}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, quantity })
    });
    
    const data = await response.json();

    if (data.success) {
      updateCartCount(data.cart);
      // Could add message or anim for successful cart add
    } else {
      alert(`Failed to add item: ${data.message}`);
    }
  } catch (error) {
    alert('Could not connect to cart service.');
    console.error('API ADD TO CART ERROR:', error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("go-to-login");
  // might not be necessary ^^^^
  const registerBtn = document.getElementById("go-to-register"); 
  // might not be necessary ^^^^
  const sideMenuOverlay = document.getElementById("side-menu-overlay");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const menuIconBtn = document.querySelector(".menu-icon");
  const cartIconBtn = document.getElementById("cart-icon-btn");
  const exploreBtn = document.getElementById("explore-collection-btn");
  const productList = document.getElementById("product-list");
  const HEADER_OFFESET = 100;
  const userIconBtn = document.querySelector(".user-icon");
  

  loadAndDisplayCart();

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "./pages/login.html";
        });
    } // pending removal

    if (registerBtn) {
        registerBtn.addEventListener("click", () => {
            window.location.href = "./pages/register.html";
        });
    } // pending removal

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

  if (cartIconBtn) {
    cartIconBtn.addEventListener("click", () => {
      window.location.href = "./pages/cart.html";
    });
  }
  
const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
addToCartBtns.forEach(button => {
  button.addEventListener('click', async (event) => {
    const productId =event.currentTarget.getAttribute('data-product-id');

    if (productId) {
      await addToCartAPI(productId, 1);
    } else {
      console.error("Missing product ID (Mongoose ObjectId) for Add to Cart button.");
    }
  })
})

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
