/**
 * Get product ID from URL query parameter
 */
function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Load product details and populate the page
 */
async function loadProductDetails() {
  const productId = getProductIdFromURL();
  
  if (!productId) {
    console.error('No product ID found in URL');
    document.querySelector('.product-main').innerHTML = '<p style="color: #ff5c5c; padding: 40px;">Product not found. Please go back and try again.</p>';
    return;
  }

  try {
    const response = await fetch(`${PRODUCTS_API_URL}/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.product) {
      throw new Error('Product not found');
    }

    const product = data.product;
    populateProductPage(product);
    attachEventListeners(product);

  } catch (error) {
    console.error('Error loading product:', error);
    document.querySelector('.product-main').innerHTML = '<p style="color: #ff5c5c; padding: 40px;">Error loading product. Please refresh the page.</p>';
  }
}

/**
 * Convert image path to work from product detail page
 * (Only needed if path starts with ./ - absolute paths work directly)
 */
function correctImagePath(imagePath) {
  // If path starts with ./, replace it with ../
  if (imagePath && imagePath.startsWith('./')) {
    return imagePath.replace('./', '../');
  }
  // If path starts with /, it's absolute and works from any page
  return imagePath || '/img_library/temp_strap.jpg';
}

/**
 * Populate the product page with data
 */
function populateProductPage(product) {
  // Update page title
  document.title = `${product.name} - Bridge-IT`;

  // Product images - correct the paths for the product page location
  const mainImagePath = product.mainImage || (product.images && product.images[0]) || './img_library/temp_strap.jpg';
  const correctedMainImage = correctImagePath(mainImagePath);
  const mainImageElem = document.getElementById('main-product-image');
  if (mainImageElem) {
    mainImageElem.src = correctedMainImage;
    mainImageElem.alt = product.name;
  }

  // Update thumbnail gallery
  const thumbnailGallery = document.querySelector('.thumbnail-gallery');
  if (thumbnailGallery && product.images && product.images.length > 0) {
    thumbnailGallery.innerHTML = product.images.map((img, index) => 
      `<img src="${correctImagePath(img)}" alt="Thumbnail ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-image-index="${index}">`
    ).join('');
    
    // Attach thumbnail click listeners
    attachThumbnailListeners();
  }

  // Product info
  document.querySelector('.product-name-detail').textContent = product.name;
  document.querySelector('.product-cat-detail').textContent = product.category || 'Product';
  document.querySelector('.current-price').textContent = formatPrice(product.price);
  document.querySelector('.product-description').textContent = product.description;

  // Update color selector with variants if they exist
  populateColorSelector(product);

  // Update availability
  const isAvailable = product.isAvailable && product.stock > 0;
  const addToCartBtn = document.getElementById('add-to-cart-lg');
  
  if (!isAvailable) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = 'OUT OF STOCK';
  }

  // Set max quantity based on stock
  const quantityInput = document.getElementById('quantity-input');
  if (quantityInput) {
    quantityInput.max = product.stock || 1;
  }
}

/**
 * Populate the color selector with product variants
 */
function populateColorSelector(product) {
  const colorSelect = document.getElementById('color-select');
  
  if (!colorSelect) {
    console.warn('Color selector not found');
    return;
  }

  // If product has variants, populate dropdown
  if (product.variants && product.variants.length > 0) {
    // Clear existing options
    colorSelect.innerHTML = '';
    
    // Add variant options
    product.variants.forEach((variant, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = variant.color;
      option.dataset.image = variant.image;
      colorSelect.appendChild(option);
    });

    // Store product for later reference when adding to cart
    colorSelect.dataset.productVariants = JSON.stringify(product.variants);
    
    // Add event listener to update image when color changes
    colorSelect.addEventListener('change', () => {
      const selectedIndex = parseInt(colorSelect.value);
      const selectedVariant = product.variants[selectedIndex];
      
      if (selectedVariant && selectedVariant.image) {
        // Update main image
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
          mainImage.src = selectedVariant.image;
          mainImage.alt = selectedVariant.color;
        }
        
        // Update thumbnail gallery with variant images
        updateThumbnailGallery([selectedVariant.image]);
      }
    });
  } else {
    // If no variants, disable the color selector
    colorSelect.disabled = true;
    colorSelect.innerHTML = '<option>No color options available</option>';
  }
}

/**
 * Attach event listeners for product interactions
 */
function attachEventListeners(product) {
  const addToCartBtn = document.getElementById('add-to-cart-lg');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const quantityInput = document.getElementById('quantity-input');
  const colorSelect = document.getElementById('color-select');
  const userBtn = document.getElementById('user-icon-btn');

  if (userBtn) {
    userBtn.addEventListener("click", () => {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        window.location.href = "profile.html";
      } else {
        window.location.href = "login.html";
      }
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const quantity = parseInt(quantityInput?.value || 1);
      const selectedColor = colorSelect ? colorSelect.options[colorSelect.selectedIndex].text : null;
      addToCartFromDetail(product._id, quantity, false, selectedColor);
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const quantity = parseInt(quantityInput?.value || 1);
      const selectedColor = colorSelect ? colorSelect.options[colorSelect.selectedIndex].text : null;
      addToCartFromDetail(product._id, quantity, true, selectedColor); // true = redirect to checkout
    });
  }
}

/**
 * Add product to cart
 */
async function addToCartFromDetail(productId, quantity = 1, redirectToCheckout = false, selectedColor = null) {
  try {
    const body = { productId, quantity };
    
    // Include selected color/variant if available
    if (selectedColor) {
      body.selectedColor = selectedColor;
    }

    const response = await fetch(`${CART_API_URL}/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to add item to cart');
    }

    // Update cart count in header
    if (window.updateCartCount) {
      window.updateCartCount(data.cart);
    }

    if (redirectToCheckout) {
      window.location.href = './checkout.html';
    } else {
      showNotification('✓ Added to cart!', 'success');
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    showNotification(error.message || 'Error adding item to cart', 'error');
  }
}

/**
 * Update thumbnail gallery with new images
 */
function updateThumbnailGallery(images) {
  const thumbnailGallery = document.querySelector('.thumbnail-gallery');
  
  if (!thumbnailGallery || !images || images.length === 0) {
    return;
  }

  // Rebuild thumbnail gallery with new images
  thumbnailGallery.innerHTML = images.map((img, index) => 
    `<img src="${img}" alt="Thumbnail ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-image-index="${index}">`
  ).join('');
  
  // Reattach event listeners to new thumbnails
  attachThumbnailListeners();
}

/**
 * Attach thumbnail click listeners
 */
function attachThumbnailListeners() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.getElementById('main-product-image');

  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
      // Remove active class from all thumbnails
      thumbnails.forEach(thumb => thumb.classList.remove('active'));
      
      // Add active class to clicked thumbnail
      thumbnail.classList.add('active');
      
      // Update main image
      mainImage.src = thumbnail.src;
      mainImage.alt = thumbnail.alt;
    });
  });
}

/**
 * Initialize page on load
 */
document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails();
});
