const Product = require('../models/Product');

/**
 * Get all products with optional filters
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { minPrice, maxPrice, search, available } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (available === 'true') {
      filter.isAvailable = true;
      filter.stock = { $gt: 0 };
    }
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      count: products.length,
      products
    });
    
  } catch (err) {
    console.error('GET ALL PRODUCTS ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get single product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.json({
      success: true,
      product
    });
    
  } catch (err) {
    console.error('GET PRODUCT ERROR:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create new product (admin only in real app)
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    
    // Validate required fields
    if (!name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      stock: stock || 0,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
    
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update product by ID
 */
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, isAvailable } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    
    await product.save();
    
    return res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
    
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete product by ID
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
