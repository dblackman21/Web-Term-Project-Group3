const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * Get user's cart
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    return res.json({
      success: true,
      cart
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
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
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
    
    // Check if product exists and is available
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
    
    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    
    // Add item to cart
    await cart.addItem(productId, quantity, product.price);
    
    // Populate product details
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Item added to cart',
      cart
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
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Check stock if increasing quantity
    if (quantity > 0) {
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`
        });
      }
    }
    
    await cart.updateQuantity(productId, quantity);
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Cart updated successfully',
      cart
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
    
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.removeItem(productId);
    await cart.populate('items.product');
    
    return res.json({
      success: true,
      message: 'Item removed from cart',
      cart
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
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    await cart.clearCart();
    
    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });
    
  } catch (err) {
    console.error('CLEAR CART ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
