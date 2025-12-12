const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

// Optional auth middleware - allows both authenticated and guest users
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization header format'
    });
  }

  const jwt = require('jsonwebtoken');
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};


// All cart routes work for both authenticated and guest users
router.get('/', optionalAuth, cartController.getCart);
router.post('/add', optionalAuth, cartController.addToCart);
router.put('/update', optionalAuth, cartController.updateCartItem);
router.delete('/remove/:productId', optionalAuth, cartController.removeFromCart);
router.delete('/clear', optionalAuth, cartController.clearCart);

// Merge guest cart after login (requires authentication)
router.post('/merge', authMiddleware, cartController.mergeGuestCart);

module.exports = router;
