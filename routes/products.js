const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Public routes - anyone can view products
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes - commented out for production (uncomment for testing/development)
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;

