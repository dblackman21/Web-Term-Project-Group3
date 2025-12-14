const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  // Either userId OR sessionId must be present
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total price cannot be negative']
  },
  // For guest carts: auto-delete after 24 hours
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for unique constraints (sparse allows null values)
cartSchema.index({ userId: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
// TTL index for automatic deletion of guest carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Validation: Must have either userId or sessionId, but not both
cartSchema.pre('validate', function() {
  const hasUserId = !!this.userId;
  const hasSessionId = !!this.sessionId;
  
  if (hasUserId && hasSessionId) {
    this.invalidate('userId', 'Cart cannot have both userId and sessionId');
  } else if (!hasUserId && !hasSessionId) {
    this.invalidate('userId', 'Cart must have either userId or sessionId');
  }
});

// Calculate total price before saving
cartSchema.pre('save', function() {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  this.updatedAt = Date.now();
  
  // Set expiration for guest carts (24 hours from now)
  if (this.sessionId && !this.userId) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    // Remove expiration for user carts
    this.expiresAt = undefined;
  }
});

cartSchema.methods.addItem = async function(productId, quantity, price) {
  const productIdStr = productId.toString();
  
  // Chercher si le produit existe déjà dans le panier
  const existingItem = this.items.find(item => {
    if (!item.product) {
      console.warn('Warning: Cart item has null product reference');
      return false;
    }
    
    // Handle both populated (object) and unpopulated (ObjectId) products
    const itemProductId = item.product._id || item.product;
    return itemProductId.toString() === productIdStr;
  });

  if (existingItem) {
    // Produit déjà dans le panier : augmenter la quantité
    existingItem.quantity += quantity;
    existingItem.price = price; // Mettre à jour le prix au cas où il aurait changé
  } else {
    // Nouveau produit : l'ajouter au panier
    this.items.push({ 
      product: productId, 
      quantity, 
      price 
    });
  }

  await this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  const productIdStr = productId.toString();
  
  this.items = this.items.filter(item => {
    if (!item.product) {
      return false; // Supprimer les items avec produit null
    }
    
    const itemProductId = item.product._id || item.product;
    return itemProductId.toString() !== productIdStr;
  });
  
  await this.save();
};

// Update item quantity
cartSchema.methods.updateQuantity = async function(productId, quantity) {
  const productIdStr = productId.toString();
  
  const item = this.items.find(item => {
    if (!item.product) {
      return false;
    }
    
    const itemProductId = item.product._id || item.product;
    return itemProductId.toString() === productIdStr;
  });

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    await this.removeItem(productId);
  } else {
    item.quantity = quantity;
    await this.save();
  }
};

// Clear all items from cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.save();
};

// Convert guest cart to user cart (called after login)
cartSchema.methods.convertToUserCart = async function(userId) {
  if (this.userId) {
    throw new Error('Cart is already associated with a user');
  }
  
  this.userId = userId;
  this.sessionId = undefined;
  this.expiresAt = undefined; // Remove expiration
  await this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
