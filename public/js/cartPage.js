const CART_API_BASE_URL = '/cart';
const ITEMS_CONTAINER = document.getElementById('cart-items-container');
const TOTAL_PRICE_ELEMENT = document.getElementById('cart-total-price');
const CART_COUNT_BADGE = document.getElementById('cart-count-badge');

function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

function updateCartCount(cartResponse) {
    let totalCount = 0;

    if (cartResponse && cartResponse.items) {
        totalCount = cartResponse.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    if (CART_COUNT_BADGE) {
        CART_COUNT_BADGE.textContent = totalCount;
        CART_COUNT_BADGE.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

/**
 * Make HTML markup for single item
 * @param {Object} item - Cart obj from API
 * @returns {string} - HTML string for the item
 */
function createCartItemMarkup(item) {
    // controller will populate item.product
    const product = item.product;
    const itemTotalPrice = item.quantity * product.price;
    
    const productImage = product.mainImage || 
                        (product.images && product.images[0]) || 
                        '../img_library/temp_strap.jpg';

    // Used example cart item as template here
    return `
        <div class="cart-item" data-product-id="${product._id}">
            <img src="${productImage}" alt="${product.name}" class="cart-item-image">
            <div class="cart-item-info">
                <span class="cart-item-name">${product.name}</span>
                <span class="cart-item-qty">Qty: ${item.quantity}</span>
            </div>
            <div class="cart-item-price">${formatPrice(itemTotalPrice)}</div>
            <button class="cart-remove-btn" data-product-id="${product._id}">Remove</button>
        </div>
    `;
}

async function renderCartItems() {
    if (!ITEMS_CONTAINER) return;

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

        if (!response.ok) {
            ITEMS_CONTAINER.innerHTML = '<p class="cart-empty-message" style="color:red;">Error loading cart data.</p>';
            return;
        }

        let cartData = await response.json();
        
        // incase the cart is empty
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            ITEMS_CONTAINER.innerHTML = '<p class="cart-empty-message">Your cart is currently empty.</p>';
            if (TOTAL_PRICE_ELEMENT) {
                TOTAL_PRICE_ELEMENT.textContent = formatPrice(0);
            }
            updateCartCount(null);
            return;
        }

        // build item list
        const itemsMarkup = cartData.items.map(createCartItemMarkup).join('');

        ITEMS_CONTAINER.innerHTML = itemsMarkup;
        
        // updates total price
        if (TOTAL_PRICE_ELEMENT) {
            TOTAL_PRICE_ELEMENT.textContent = formatPrice(cartData.totalPrice);
        }

        updateCartCount(cartData);
        
        // attach listener to remove button
        attachRemoveListeners();

    } catch (error) {
        ITEMS_CONTAINER.innerHTML = '<p class="cart-empty-message" style="color:red;">Network connection error.</p>';
        console.error('CART RENDERING ERROR:', error);
    }
}

async function removeItemAPI(productId) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('authToken');
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CART_API_BASE_URL}/remove/${productId}`, {
            method: 'DELETE',
            headers: headers,
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            renderCartItems();
        } else {
            alert(`Failed to remove item: ${data.message}`);
        }
    } catch (error) {
        console.error('API REMOVE ERROR:', error);
        alert('Error removing item from cart');
    }
}

function attachRemoveListeners() {
    document.querySelectorAll('.cart-remove-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.currentTarget.getAttribute('data-product-id');
            if (confirm('Are you sure you want to remove this item?')) {
                removeItemAPI(productId);
            }
        });
    });
}

async function addToCart(productId, quantity = 1) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('authToken');
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CART_API_BASE_URL}/add`, {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();

        if (data.success) {
            updateCartCount(data.cart);
            return data;
        } else {
            throw new Error(data.message || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error('ADD TO CART ERROR:', error);
        throw error;
    }
}

async function mergeCartAfterLogin() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('No token, skipping cart merge');
        return;
    }

    try {
        const response = await fetch(`${CART_API_BASE_URL}/merge`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Cart merged successfully:', data.message);
            if (document.body.classList.contains('cart-page')) {
                renderCartItems();
            }
        }
    } catch (error) {
        console.error('MERGE CART ERROR:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('cart-page')) {
        renderCartItems();
    }
});

/**
 * Handle Proceed to Checkout button
 */
function handleCheckoutButton() {
    const checkoutBtn = document.querySelector('a[href="checkout.html"]');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Check if cart is empty
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

                    if (!cartData || !cartData.items || cartData.items.length === 0) {
                        alert('Your cart is empty. Please add items before checkout.');
                        return;
                    }

                    // Cart has items, proceed to checkout
                    window.location.href = 'checkout.html';
                } else {
                    alert('Error checking cart. Please try again.');
                }
            } catch (error) {
                console.error('CHECKOUT CHECK ERROR:', error);
                alert('Network error. Please try again.');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('cart-page')) {
        renderCartItems();
        handleCheckoutButton();
    }
})

window.cartAPI = {
    addToCart,
    mergeCartAfterLogin,
    renderCartItems,
    updateCartCount
};
