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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total price cannot be negative']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total price before saving
cartSchema.pre('save', async function() {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  this.updatedAt = Date.now();
});

// Add item to cart or update quantity if already exists
cartSchema.methods.addItem = async function(productId, quantity, price) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, price });
  }

  await this.save();
};

// Remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  await this.save();
};

// Update item quantity
cartSchema.methods.updateQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );

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

module.exports = mongoose.model('Cart', cartSchema);
