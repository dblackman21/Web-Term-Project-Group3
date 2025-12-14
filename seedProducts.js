/**
 * seedProducts.js
 * Script pour peupler la base de données avec les produits initiaux
 * 
 * Usage: node seedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Produits à créer (basés sur ton index.html)
const products = [
  {
    name: 'Whoop Sol',
    description: 'Premium Whoop strap with advanced comfort and durability. Perfect for athletes and fitness enthusiasts.',
    price: 34.99,
    stock: 50,
    category: 'Whoop',
    images: ['./img_library/temp_strap.jpg'], // Tu peux ajouter plusieurs images ici
    isAvailable: true
  },
  {
    name: 'Fitbit Sol',
    description: 'High-quality Fitbit strap designed for everyday wear. Comfortable and stylish.',
    price: 32.99,
    stock: 45,
    category: 'Fitbit',
    images: ['./img_library/temp_strap.jpg'],
    isAvailable: true
  },
  {
    name: 'Whoop Aqua',
    description: 'Water-resistant Whoop strap ideal for swimming and water sports. Maximum durability.',
    price: 44.99,
    stock: 30,
    category: 'Swimwear',
    images: ['./img_library/temp_strap.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Aqua',
    description: 'Premium water-resistant Fitbit strap. Perfect for swimmers and water activities.',
    price: 44.99,
    stock: 35,
    category: 'Swimwear',
    images: ['./img_library/temp_strap.jpg'],
    isAvailable: true
  }
];

async function seedProducts() {
  try {
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    
    console.log('🌱 Creating products...');
    const createdProducts = await Product.insertMany(products);
    
    console.log('\n✅ Products created successfully!\n');
    
    console.log('📦 Created products:');
    console.log('='.repeat(80));
    createdProducts.forEach(product => {
      console.log(`
Product: ${product.name}
ObjectId: ${product._id}
Price: $${product.price}
Stock: ${product.stock}
      `.trim());
      console.log('-'.repeat(80));
    });
    
    console.log('\n💡 Copy these ObjectIds and update your index.html:');
    console.log('='.repeat(80));
    createdProducts.forEach(product => {
      console.log(`${product.name}: data-product-id="${product._id}"`);
    });
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

// Exécuter le script
seedProducts();
