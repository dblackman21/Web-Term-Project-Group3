const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { randomUUID } = require('crypto'); 
/**
 * Helper: Get or create session ID from cookies
 */
const getSessionId = (req, res) => {
  let sessionId = req.cookies.guestSessionId;
  
  if (!sessionId) {
    sessionId = randomUUID();
    // Set cookie for 24 hours
    res.cookie('guestSessionId', sessionId, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax'
    });
  }
  
  return sessionId;
};

/**
 * Helper: Get cart for authenticated user or guest session
 */
const getOrCreateCart = async (req, res) => {
  if (req.user) {
    // Authenticated user - find by userId
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
      await cart.populate('items.product');
    }
    return cart;
  } else {
    // Guest user - find by sessionId
    const sessionId = getSessionId(req, res);
    let cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
      await cart.populate('items.product');
    }
    return cart;
  }
};

/**
 * Get user's cart (works for both authenticated and guest users)
 */
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req, res);
    
    return res.json({
      success: true,
      cart,
      isGuest: !req.user
    });
    
  } catch (err) {
    console.error('GET CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add item to cart (works for both authenticated and guest users)
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Validation
    if (!productId || quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    // Check product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.checkAvailability()) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }
    
    // Get or create cart (unified logic)
    const cart = await getOrCreateCart(req, res);
    
    // Add item
    await cart.addItem(productId, quantity, product.price);
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Item added to cart',
      cart,
      isGuest: !req.user
    });
    
  } catch (err) {
    console.error('ADD TO CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update item quantity in cart
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }
    
    // Check stock if quantity > 0
    if (quantity > 0) {
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in cart'
        });
      }
      
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`
        });
      }
    }
    
    // Get cart (unified logic)
    const cart = await getOrCreateCart(req, res);
    
    // Update quantity
    await cart.updateQuantity(productId, quantity);
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Cart updated successfully',
      cart,
      isGuest: !req.user
    });
    
  } catch (err) {
    console.error('UPDATE CART ERROR:', err);
    
    if (err.message === 'Item not found in cart') {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const sessionId = req.cookies.guestSessionId;
    const userId = req.user?._id;

    const cart = await Cart.findOne(userId ? { userId } : { sessionId });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found"
        });
    }
    
    // Remove item
    await cart.removeItem(productId);
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Item removed from cart',
      cart,
      isGuest: !req.user
    });
    
  } catch (err) {
    console.error('REMOVE FROM CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    // Get cart (unified logic)
    const cart = await getOrCreateCart(req, res);
    
    // Clear cart
    await cart.clearCart();
    
    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
      isGuest: !req.user
    });
    
  } catch (err) {
    console.error('CLEAR CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Merge guest cart with user cart after login
 * This is called automatically after successful login
 */
exports.mergeGuestCart = async (req, res) => {
  try {
    // Must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get guest session ID from cookie
    const guestSessionId = req.cookies.guestSessionId;
    
    if (!guestSessionId) {
      return res.json({
        success: true,
        message: 'No guest cart to merge'
      });
    }
    
    // Find guest cart
    const guestCart = await Cart.findOne({ sessionId: guestSessionId });
    
    if (!guestCart || guestCart.items.length === 0) {
      // Clear guest session cookie
      res.clearCookie('guestSessionId');
      return res.json({
        success: true,
        message: 'No guest cart to merge'
      });
    }
    
    // Find or create user cart
    let userCart = await Cart.findOne({ userId: req.user.id });
    
    if (!userCart) {
      // No existing user cart - just convert guest cart to user cart
      await guestCart.convertToUserCart(req.user.id);
      await guestCart.populate('items.product');
      
      // Clear guest session cookie
      res.clearCookie('guestSessionId');
      
      return res.json({
        success: true,
        message: 'Guest cart converted to user cart',
        cart: guestCart
      });
    }
    
    // Merge guest cart items into user cart
    for (const guestItem of guestCart.items) {
      await userCart.addItem(
        guestItem.product,
        guestItem.quantity,
        guestItem.price
      );
    }
    
    // Delete guest cart
    await Cart.deleteOne({ sessionId: guestSessionId });
    
    // Clear guest session cookie
    res.clearCookie('guestSessionId');
    
    await userCart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Guest cart merged successfully',
      cart: userCart
    });
    
  } catch (err) {
    console.error('MERGE CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
