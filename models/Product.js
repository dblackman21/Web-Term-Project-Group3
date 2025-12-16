const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: {
    type: [String],
    default: ['/img_library/temp_strap.jpg'],
    validate: {
      validator: function(arr) {
        return arr.length > 0;
      },
      message: 'Product must have at least one image'
    }
  },
  mainImage: {
    type: String,
    default: function() {
      return this.images && this.images.length > 0 
        ? this.images[0] 
        : '/img_library/temp_strap.jpg';
    }
  },
  category: {
    type: String,
    enum: ['Whoop', 'Fitbit', 'Swimwear', 'Tops', 'Bottoms', 'Other'],
    default: 'Other'
  },
  variants: {
    type: [{
    color: { type: String, required: true },
    image: { type: String, required: true },
    // ADD THIS: Reference to the specific product document for this color
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      default: null 
    },
    sku: { type: String, default: null },
    price: { type: Number, default: null }
  }],
  default: []
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
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

// Update timestamp before saving
productSchema.pre('save', async function() {
  this.updatedAt = Date.now();
  
  if (this.images && this.images.length > 0) {
    this.mainImage = this.images[0];
  }
});

// Check if product is available for purchase
productSchema.methods.checkAvailability = function() {
  return this.isAvailable && this.stock > 0;
};

// Reduce stock when product is purchased
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  await this.save();
};

// Increase stock when products are restocked
productSchema.methods.increaseStock = async function(quantity) {
  this.stock += quantity;
  if (this.stock > 0) {
    this.isAvailable = true;
  }
  await this.save();
};

productSchema.methods.addImage = function(imageUrl) {
  if (!this.images.includes(imageUrl)) {
    this.images.push(imageUrl);
  }
};

productSchema.methods.removeImage = function(imageUrl) {
  this.images = this.images.filter(img => img !== imageUrl);
  if (this.images.length === 0) {
    this.images = ['./img_library/temp_strap.jpg'];
  }
};

module.exports = mongoose.model('Product', productSchema);
