const PRODUCTS_API_URL = '/products';
const CART_API_URL = '/cart';

/**
 * Format price
 */
function formatPrice(price) {
    return `$${price.toFixed(2)}`;
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
 * Create product card HTML (remplace les cartes statiques)
 */
function createProductCard(product) {
    const isAvailable = product.isAvailable && product.stock > 0;
    
    const productImage = product.mainImage || 
                        (product.images && product.images[0]) || 
                        './img_library/temp_strap.jpg';
    
    const category = product.category || 'Product';
    
    return `
        <div class="product-card" data-product-id="${product._id}">
            <div class="product-image-container">
                <span class="product-category">${category}</span>
                <img src="${productImage}" alt="${product.name}" class="product-image" loading="lazy">
                <a href="./pages/product.html?id=${product._id}" class="quick-view-btn">Quick view</a>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-variants">${product.description.substring(0, 50)}...</p>
                <div class="product-price-row">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    ${isAvailable ? 
                        `<button class="add-to-cart-btn" data-product-id="${product._id}" aria-label="Add to cart">&#43;</button>` : 
                        `<button class="add-to-cart-btn" disabled aria-label="Out of stock">&#10005;</button>`
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Load products from API and render them
 */
async function loadAndRenderProducts() {
    const productListContainer = document.getElementById('product-list');
    
    if (!productListContainer) {
        console.warn('Product list container not found');
        return;
    }

    try {
        // Show loading state
        productListContainer.innerHTML = '<p style="color: var(--text-medium); text-align: center; padding: 40px;">Loading products...</p>';

        const response = await fetch(PRODUCTS_API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (!data.success || !data.products || data.products.length === 0) {
            productListContainer.innerHTML = '<p style="color: var(--text-medium); text-align: center; padding: 40px;">No products available.</p>';
            return;
        }

        // Render products
        const productsHTML = data.products.map(createProductCard).join('');
        productListContainer.innerHTML = productsHTML;

        // Attach event listeners to new buttons
        attachAddToCartListeners();

        console.log(`[SUCCESS] Loaded ${data.products.length} products`);

    } catch (error) {
        console.error('LOAD PRODUCTS ERROR:', error);
        productListContainer.innerHTML = '<p style="color: #ff5c5c; text-align: center; padding: 40px;">Error loading products. Please refresh the page.</p>';
    }
}
/**
 * Expose performSearch to the global window object so index.js can call it
 */
window.performSearch = async function(query) {
    const productListContainer = document.getElementById('product-list');
    
    try {
        const url = query ? `/products?search=${encodeURIComponent(query)}` : '/products';
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.products) {
            const productsHTML = data.products.map(createProductCard).join('');
            productListContainer.innerHTML = productsHTML || '<p style="text-align:center; padding:20px;">No results found.</p>';

            attachAddToCartListeners();
            
            if (query && data.products.length > 0) {
                productListContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {
        console.error('Search Error:', err);
    }
};

/**
 * Add product to cart
 */
async function addToCartAPI(productId, quantity = 1) {
    try {
        const response = await fetch(`${CART_API_URL}/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ 
                productId: productId,
                quantity: quantity 
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to add item to cart');
        }

        // Show success notification
        showNotification('✓ Added to cart!', 'success');

        // Update cart count
        if (window.updateCartCount) {
            window.updateCartCount(data.cart);
        }

        return data;

    } catch (error) {
        console.error('ADD TO CART ERROR:', error);
        showNotification(error.message || 'Error adding to cart', 'error');
        throw error;
    }
}

/**
 * Attach click listeners to all "Add to Cart" buttons
 */
function attachAddToCartListeners() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn:not([disabled])');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            
            const productId = event.currentTarget.getAttribute('data-product-id');
            
            if (!productId) {
                console.error('Product ID not found on button');
                return;
            }

            // Disable button during request
            const originalContent = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '⏳';

            try {
                await addToCartAPI(productId, 1);
                
                // Show success state briefly
                button.innerHTML = '✓';
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalContent;
                }, 1500);
                
            } catch (error) {
                // Reset button on error
                button.disabled = false;
                button.innerHTML = originalContent;
            }
        });
    });
}

/**
 * Show notification message
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load products dynamically if we're on the home page
    if (document.getElementById('product-list')) {
        loadAndRenderProducts();
    }
});
