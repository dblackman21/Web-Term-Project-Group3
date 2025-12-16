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

const products = [
  {
    name: 'Whoop Sol',
    description: 'The ultimate performance strap designed for the Whoop module. Featuring high-tension weave for maximum comfort and an adjustable fit that stays secure during high-intensity training.',
    price: 34.99,
    stock: 50,
    category: 'Whoop',
    images: ['/img_library/whoop/sol_black.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Black', image: '/img_library/whoop/sol_black.jpg'},
      {color: 'Navy', image: '/img_library/whoop/sol_navy.png'},
      {color: 'Maroon', image: '/img_library/whoop/sol_red.png'},
      {color: 'Charcoal Grey', image: '/img_library/whoop/sol_charcoal.png'}
    ]
  },
  {
    name: 'Fitbit Sol',
    description: 'A sleek, everyday replacement strap for Fitbit users. Crafted from soft-touch, breathable nylon, it offers a stylish look that transitions perfectly from the gym to the office.',
    price: 34.99,
    stock: 45,
    category: 'Fitbit',
    images: ['/img_library/fitbit/sol_black.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Black', image: '/img_library/fitbit/sol_black.jpg'},
      {color: 'Navy', image: '/img_library/fitbit/sol_navy.jpg'},
      {color: 'Maroon', image: '/img_library/fitbit/sol_red.jpg'},
      {color: 'Charcoal Grey', image: '/img_library/fitbit/sol_charcoal.jpg'}
    ]
  },
  {
    name: 'Whoop Aqua',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. The perfect companion for swimmers and surfers using the Whoop tracking system.',
    price: 44.99,
    stock: 90,
    category: 'Swimwear',
    images: ['/img_library/whoop/aqua_black.jpg'],
    isAvailable: true,
    variants: [
      { color: 'Black', image: '/img_library/whoop/aqua_black.jpg' },
      { color: 'Spring Green', image: '/img_library/whoop/aqua_spring.jpeg' },
      { color: 'Purple', image: '/img_library/whoop/aqua_purple.jpg' }
    ]
  },
  {
    name: 'Fitbit Aqua',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. The perfect companion for swimmers and surfers using the Whoop tracking system.',
    price: 44.99,
    stock: 35,
    category: 'Swimwear',
    images: ['/img_library/fitbit/aqua_black.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Black', image: '/img_library/fitbit/aqua_black.jpg'},
      {color: 'Spring Green', image: '/img_library/fitbit/aqua_spring.jpg'},
      {color: 'Purple', image: '/img_library/fitbit/aqua_purple.jpg'}      
    ]
  },
  {
    name: 'Whoop Lux',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking.',
    price: 64.99,
    stock: 35,
    category: 'Whoop',
    images: ['/img_library/whoop/lux_brown.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Brown', image: '/img_library/whoop/lux_brown.jpg'},
      {color: 'Black', image: '/img_library/whoop/lux_black.jpg'},
    ]
  },
  {
    name: 'Fitbit Lux',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking.',
    price: 64.99,
    stock: 35,
    category: 'Fitbit',
    images: ['/img_library/fitbit/lux_brown.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Brown', image: '/img_library/fitbit/lux_brown.jpg'},
      {color: 'Black', image: '/img_library/fitbit/lux_black.jpg'},
    ]
  },
  {
    name: 'Nexus Shorts',
    description: 'High-performance athletic shorts featuring our proprietary Nexus pod-pocket. Securely house your Fitbit or Whoop module directly in your apparel for wrist-free tracking.',
    price: 46.99,
    stock: 35,
    category: 'Bottoms',
    images: ['/img_library/bottoms/shorts_black.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Black', image: '/img_library/bottoms/shorts_black.jpg'},
      {color: 'Navy', image: '/img_library/bottoms/shorts_navy.jpg'},
      {color: 'Red', image: '/img_library/bottoms/shorts_red.jpg'}
    ]
  },
  {
    name: 'Nexus Top',
    description: 'A compression-fit athletic top designed with integrated wearable tech support. The internal sleeve keeps your module flat against the skin for the most accurate heart rate readings.',
    price: 46.99,
    stock: 35,
    category: 'Tops',
    images: ['/img_library/tops/womens_black.jpg'],
    isAvailable: true,
    variants: [
      {color: 'Black', image: '/img_library/tops/womens_black.jpg'},
      {color: 'Creme', image: '/img_library/tops/womens_creme.jpg'},
      {color: 'Red', image: '/img_library/tops/womens_red.jpg'}
    ]
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
