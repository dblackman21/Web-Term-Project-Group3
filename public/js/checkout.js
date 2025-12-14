const CART_API_BASE_URL = '/cart';
const ORDER_ITEMS_CONTAINER = document.getElementById('order-items-container');
const ORDER_TOTAL_PRICE = document.getElementById('order-total-price');
const CART_COUNT_BADGE = document.getElementById('cart-count-badge');
const CONFIRM_ORDER_BTN = document.getElementById('confirm-order-btn');
const CONTINUE_SHOPPING_BTN = document.getElementById('continue-shopping-btn');
const CHECKOUT_MESSAGE = document.getElementById('checkout-message');
const SHIPPING_INFO = document.getElementById('shipping-info');

/**
 * Format price
 */
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
}

/**
 * Get auth headers
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
 * Update cart count badge
 */
function updateCartCount(count) {
    if (CART_COUNT_BADGE) {
        CART_COUNT_BADGE.textContent = count;
        CART_COUNT_BADGE.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Create order item HTML
 */
function createOrderItemHTML(item) {
    const product = item.product;
    const itemTotal = item.quantity * product.price;
    
    return `
        <div class="order-item">
            <span class="order-item-name">${product.name}</span>
            <span class="order-item-qty">Qty: ${item.quantity}</span>
            <span class="order-item-price">${formatPrice(itemTotal)}</span>
        </div>
    `;
}

/**
 * Load and display cart items for checkout
 */
async function loadCheckoutItems() {
    if (!ORDER_ITEMS_CONTAINER) return;

    try {
        const response = await fetch(CART_API_BASE_URL, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            showError('Error loading cart data.');
            return;
        }

        const cartData = await response.json();

        // Check if cart is empty
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            ORDER_ITEMS_CONTAINER.innerHTML = '<p style="color: var(--text-medium); text-align: center;">Your cart is empty. Please add items before checkout.</p>';
            ORDER_TOTAL_PRICE.textContent = formatPrice(0);
            CONFIRM_ORDER_BTN.disabled = true;
            CONFIRM_ORDER_BTN.style.opacity = '0.5';
            CONFIRM_ORDER_BTN.style.cursor = 'not-allowed';
            return;
        }

        // Render order items
        const itemsHTML = cartData.items.map(createOrderItemHTML).join('');
        ORDER_ITEMS_CONTAINER.innerHTML = itemsHTML;

        // Display total price
        ORDER_TOTAL_PRICE.textContent = formatPrice(cartData.totalPrice);

        // Update cart count badge
        const totalCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        updateCartCount(totalCount);

        console.log(`✅ Loaded ${cartData.items.length} items for checkout`);

    } catch (error) {
        console.error('CHECKOUT LOAD ERROR:', error);
        showError('Network connection error.');
    }
}

/**
 * Show error message
 */
function showError(message) {
    if (ORDER_ITEMS_CONTAINER) {
        ORDER_ITEMS_CONTAINER.innerHTML = `<p style="color: #ff5c5c; text-align: center;">${message}</p>`;
    }
}

/**
 * Clear cart after order confirmation
 */
async function clearCart() {
    try {
        const response = await fetch(`${CART_API_BASE_URL}/clear`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Cart cleared successfully');
            updateCartCount(0);
            return true;
        } else {
            console.error('Failed to clear cart:', data.message);
            return false;
        }
    } catch (error) {
        console.error('CLEAR CART ERROR:', error);
        return false;
    }
}

/**
 * Confirm order
 */
async function confirmOrder() {
    // Disable button to prevent double-click
    CONFIRM_ORDER_BTN.disabled = true;
    CONFIRM_ORDER_BTN.textContent = 'Processing...';

    try {
        // Simulate payment processing (1 second delay)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clear the cart
        const cleared = await clearCart();

        if (cleared) {
            // Show success message
            CHECKOUT_MESSAGE.textContent = 'Thank You for Your Order!';
            CHECKOUT_MESSAGE.style.color = 'var(--highlight-green)';
            
            SHIPPING_INFO.textContent = 'Your order has been successfully placed and will be shipped soon.';
            
            ORDER_ITEMS_CONTAINER.innerHTML = '<p style="color: var(--highlight-green); text-align: center; padding: 20px;">✓ Order Confirmed!</p>';
            
            // Hide confirm button, show continue shopping button
            CONFIRM_ORDER_BTN.style.display = 'none';
            CONTINUE_SHOPPING_BTN.style.display = 'block';

            // Show notification
            showNotification('Order placed successfully!', 'success');
        } else {
            throw new Error('Failed to clear cart');
        }

    } catch (error) {
        console.error('ORDER CONFIRMATION ERROR:', error);
        
        // Re-enable button on error
        CONFIRM_ORDER_BTN.disabled = false;
        CONFIRM_ORDER_BTN.textContent = 'Confirm Order';
        
        showNotification('Error processing order. Please try again.', 'error');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        background: ${type === 'success' ? '#6ccf64' : type === 'error' ? '#ff5c5c' : '#2196F3'};
        color: ${type === 'success' ? '#1e1e1e' : 'white'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 600;
        animation: slideIn 0.3s ease;
        min-width: 200px;
        text-align: center;
    `;

    notificationContainer.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Initialize checkout page
 */
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('checkout-page')) {
        // Load cart items
        loadCheckoutItems();

        // Attach confirm order button listener
        if (CONFIRM_ORDER_BTN) {
            CONFIRM_ORDER_BTN.addEventListener('click', confirmOrder);
        }
    }
});
