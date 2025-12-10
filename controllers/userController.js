const User = require("../models/User");
const Cart = require("../models/Cart");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Helper: Merge guest cart into user cart after login/register
 */
const mergeGuestCartAfterLogin = async (userId, req, res) => {
  try {
    // Get guest session ID from cookie
    const guestSessionId = req.cookies.guestSessionId;
    
    if (!guestSessionId) {
      return null; // No guest cart to merge
    }
    
    // Find guest cart
    const guestCart = await Cart.findOne({ sessionId: guestSessionId });
    
    if (!guestCart || guestCart.items.length === 0) {
      // Clear cookie even if cart is empty
      res.clearCookie('guestSessionId');
      return null; // No items to merge
    }
    
    // Find or create user cart
    let userCart = await Cart.findOne({ userId });
    
    if (!userCart) {
      // No existing user cart - just convert guest cart to user cart
      await guestCart.convertToUserCart(userId);
      await guestCart.populate('items.product');
      
      // Delete the old guest cart reference (it's now a user cart)
      await Cart.deleteOne({ sessionId: guestSessionId });
      
      // Clear guest session cookie
      res.clearCookie('guestSessionId');
      
      return guestCart;
    }
    
    // Merge guest cart items into existing user cart
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
    
    return userCart;
    
  } catch (err) {
    console.error('AUTO MERGE CART ERROR:', err);
    // Clear cookie even on error to prevent repeated attempts
    res.clearCookie('guestSessionId');
    return null; // Don't block login/register if merge fails
  }
};

/**
 * Register a new user
 */
exports.registerUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check missing fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email already taken?
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Create user
    const user = await User.create({
      firstname,
      lastname,
      email,
      password
    });

    const token = generateToken(user._id);

    // Merge guest cart
    const mergedCart = await mergeGuestCartAfterLogin(user._id, req, res);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: user.toJSON(),
      cart: mergedCart // Include merged cart in response (null if no cart)
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
  }
};

/**
 * Login user
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
          message: "Email and password are required",
          success: false
      });
    }

    // Check email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
          message: "Invalid credentials",
          success: false
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
          message: "Invalid credentials",
          success: false
      });
    }
    
    // Update last Login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    // Merge guest cart
    const mergedCart = await mergeGuestCartAfterLogin(user._id, req, res);

    return res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
      success: true,
      cart: mergedCart // Include merged cart in response (null if no cart)
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
        message: "Internal server error",
        success: false
    });
  }
};

/**
 * Logout user
 */
exports.logoutUser = (req, res) => {
  // Note: req.session.destroy() won't work anymore since we removed express-session
  // JWT is stateless, so logout is handled client-side by removing the token
  
  // Optional: Clear any remaining cookies
  res.clearCookie('guestSessionId');
  
  res.json({ 
    success: true,
    message: "Logged out successfully" 
  });
};

/**
 * Get profile for logged-in user
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
