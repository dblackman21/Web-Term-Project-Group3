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
        totalCount = cartResponse.items.reduct((sum, item) => sum + item.quanity, 0);
    }

    if (CART_COUNT_BADGE) {
        CART_COUNT_BADGE.textContent = totalCount;
        CART_COUNT_BADGE.style.display = totalCount > 0 ? 'flex' : 'none';
    }
}

/** Make HTML markup for single item
 * @param {Object} item - Cart obj from API;
 * @returns {string} - HTML string for the item;
 */
function createCartItemMarkup(item) {
    // controller will populate item.product;
    const product = item.product;
    const itemTotalPrice = item.quanity * product.price;

    // Used example cart item as template here;
    return `
        <div class="cart-item" data-product-id="${product._id}">
                    <img src="../img_library/temp_strap.jpg" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <span class="cart-item-name">"${product.name}"</span>
                        <span class="cart-item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <div class="cart-item-price">${formatPrice(itemTotalPrice)}</div>
                    <button class="cart-remove-btn" data-product-id="${product._id}">Remove</button>
                </div>
            `;
}

async function renderCartItems() { //fetch cart data and render;
    if (!ITEMS_CONTAINER) return;

    try { //fetch from unified route;
        const response = await fetch(CART_API_BASE_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
            // Auth left to cartController;
        });

        if (!response.ok) {
            ITEMS_CONTAINER.innerHTML = '<p class="cart-empty-message" style="color:red;">Error loading cart data.</p>';
            return;
        }

        let cartData = await response.json();
        // incase the cart is empty;
        if (!cartData || cartData.items.length === 0) {
            ITEMS_CONTAINER.innerHTML = '<p class"cart-empty-message">Your cart is currently empty.</p>';
            TOTAL_PRICE_ELEMENT.textContent = formatPrice(0);
            updateCartCount(null); // updates badge to 0;
            return;
        }

        // build item list;
        const itemsMarkup = cartData.items.map(createCartItemMarkup).join('');
        ITEMS_CONTAINER.innderHTML = itemsMarkup;
        // updates total price;
        TOTAL_PRICE_ELEMENT.textContent = formatPrice(cartData.totalPrice);

        updateCartCount(cartData);
        // attach listener to remove button;
        attachRemoveListener();

    } catch (error) {
        ITEMS_CONTAINER.innderHTML = '<p class="cart-empty-message" style="color:red;">Network connection error.</p>';
        console.error('CART RENDERING ERROR:', error);
    }
}

async function removeItemAPI(productId) {
    try {
        const response = await fetch('${CART_API_BASE_URL}/remove/${productId}', {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            renderCartItems();
        } else {
            alert('Failed to remove item: ${data.message}');
        }
    } catch (error) {
        console.error('API REMOVE ERROR:', error);
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('cart-page')) {
        renderCartItems();
    }
});