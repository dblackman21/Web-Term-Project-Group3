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
    name: 'Whoop Sol - Black',
    description: 'The ultimate performance strap designed for the Whoop module. Featuring high-tension weave for maximum comfort and an adjustable fit that stays secure during high-intensity training. Classic black colorway.',
    price: 34.99,
    stock: 50,
    category: 'Whoop',
    images: ['/img_library/whoop/sol_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Whoop Sol - Navy',
    description: 'The ultimate performance strap designed for the Whoop module. Featuring high-tension weave for maximum comfort and an adjustable fit that stays secure during high-intensity training. Navy blue colorway.',
    price: 34.99,
    stock: 45,
    category: 'Whoop',
    images: ['/img_library/whoop/sol_navy.png'],
    isAvailable: true
  },
  {
    name: 'Whoop Sol - Maroon',
    description: 'The ultimate performance strap designed for the Whoop module. Featuring high-tension weave for maximum comfort and an adjustable fit that stays secure during high-intensity training. Bold maroon colorway.',
    price: 34.99,
    stock: 42,
    category: 'Whoop',
    images: ['/img_library/whoop/sol_red.png'],
    isAvailable: true
  },
  {
    name: 'Whoop Lux - Brown',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking. Rich brown leather.',
    price: 64.99,
    stock: 25,
    category: 'Whoop',
    images: ['/img_library/whoop/lux_brown.jpg'],
    isAvailable: true
  },
  {
    name: 'Whoop Lux - Black',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking. Sleek black leather.',
    price: 64.99,
    stock: 30,
    category: 'Whoop',
    images: ['/img_library/whoop/lux_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Whoop Aqua - Black',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. The perfect companion for swimmers and surfers using the Whoop tracking system. Classic black.',
    price: 44.99,
    stock: 40,
    category: 'Whoop',
    images: ['/img_library/whoop/aqua_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Whoop Aqua - Spring Green',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. The perfect companion for swimmers and surfers using the Whoop tracking system. Vibrant spring green.',
    price: 44.99,
    stock: 38,
    category: 'Whoop',
    images: ['/img_library/whoop/aqua_spring.jpeg'],
    isAvailable: true
  },
  {
    name: 'Whoop Aqua - Purple',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. The perfect companion for swimmers and surfers using the Whoop tracking system. Bold purple.',
    price: 44.99,
    stock: 35,
    category: 'Whoop',
    images: ['/img_library/whoop/aqua_purple.jpg'],
    isAvailable: true
  },

  // ========== FITBIT STRAPS (8 produits) ==========
  {
    name: 'Fitbit Sol - Black',
    description: 'A sleek, everyday replacement strap for Fitbit users. Crafted from soft-touch, breathable nylon, it offers a stylish look that transitions perfectly from the gym to the office. Timeless black.',
    price: 34.99,
    stock: 48,
    category: 'Fitbit',
    images: ['/img_library/fitbit/sol_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Sol - Navy',
    description: 'A sleek, everyday replacement strap for Fitbit users. Crafted from soft-touch, breathable nylon, it offers a stylish look that transitions perfectly from the gym to the office. Deep navy blue.',
    price: 34.99,
    stock: 44,
    category: 'Fitbit',
    images: ['/img_library/fitbit/sol_navy.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Lux - Brown',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking. Luxurious brown.',
    price: 64.99,
    stock: 22,
    category: 'Fitbit',
    images: ['/img_library/fitbit/lux_brown.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Lux - Black',
    description: 'Elevate your wearable with our premium leather Lux series. Featuring genuine leather and polished hardware, it provides a sophisticated aesthetic without compromising your data tracking. Premium black leather.',
    price: 64.99,
    stock: 28,
    category: 'Fitbit',
    images: ['/img_library/fitbit/lux_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Aqua - Black',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. Perfect for swimmers and water sports enthusiasts who use Fitbit tracking. All-black design.',
    price: 44.99,
    stock: 36,
    category: 'Fitbit',
    images: ['/img_library/fitbit/aqua_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Aqua - Spring Green',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. Perfect for swimmers and water sports enthusiasts who use Fitbit tracking. Fresh spring green.',
    price: 44.99,
    stock: 32,
    category: 'Fitbit',
    images: ['/img_library/fitbit/aqua_spring.jpg'],
    isAvailable: true
  },
  {
    name: 'Fitbit Aqua - Purple',
    description: 'Engineered for the elements, the Aqua series is fast-drying and resistant to chlorine and salt water. Perfect for swimmers and water sports enthusiasts who use Fitbit tracking. Striking purple.',
    price: 44.99,
    stock: 34,
    category: 'Fitbit',
    images: ['/img_library/fitbit/aqua_purple.jpg'],
    isAvailable: true
  },

  // ========== TOPS (3 produits) ==========
  {
    name: 'Nexus Compression Top - Black',
    description: 'A compression-fit athletic top designed with integrated wearable tech support. The internal sleeve keeps your module flat against the skin for the most accurate heart rate readings during intense workouts. Classic black.',
    price: 54.99,
    stock: 45,
    category: 'Tops',
    images: ['/img_library/tops/womens_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Nexus Compression Top - Cream',
    description: 'A compression-fit athletic top designed with integrated wearable tech support. The internal sleeve keeps your module flat against the skin for the most accurate heart rate readings during intense workouts. Elegant cream.',
    price: 54.99,
    stock: 38,
    category: 'Tops',
    images: ['/img_library/tops/womens_creme.jpg'],
    isAvailable: true
  },
  {
    name: 'Nexus Compression Top - Red',
    description: 'A compression-fit athletic top designed with integrated wearable tech support. The internal sleeve keeps your module flat against the skin for the most accurate heart rate readings during intense workouts. Bold red.',
    price: 54.99,
    stock: 40,
    category: 'Tops',
    images: ['/img_library/tops/womens_red.jpg'],
    isAvailable: true
  },

  // ========== BOTTOMS (1 produit) ==========
  {
    name: 'Nexus Performance Shorts - Black',
    description: 'High-performance athletic shorts featuring our proprietary Nexus pod-pocket. Securely house your Fitbit or Whoop module directly in your apparel for wrist-free tracking during runs, lifts, or any activity. Classic black.',
    price: 46.99,
    stock: 60,
    category: 'Bottoms',
    images: ['/img_library/bottoms/shorts_black.jpg'],
    isAvailable: true
  },
  {
    name: 'Nexus Performance Shorts - Red',
    description: 'High-performance athletic shorts featuring our proprietary Nexus pod-pocket. Securely house your Fitbit or Whoop module directly in your apparel for wrist-free tracking during runs, lifts, or any activity. Classic black.',
    price: 46.99,
    stock: 60,
    category: 'Bottoms',
    images: ['/img_library/bottoms/shorts_red.jpg'],
    isAvailable: true
  },
  {
    name: 'Nexus Performance Shorts - Navy',
    description: 'High-performance athletic shorts featuring our proprietary Nexus pod-pocket. Securely house your Fitbit or Whoop module directly in your apparel for wrist-free tracking during runs, lifts, or any activity. Classic black.',
    price: 46.99,
    stock: 60,
    category: 'Bottoms',
    images: ['/img_library/bottoms/shorts_navy.jpg'],
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
    createdProducts.forEach((product, index) => {
      console.log(`
${index + 1}. ${product.name}
   Category: ${product.category}
   ObjectId: ${product._id}
   Price: $${product.price}
   Stock: ${product.stock}
      `.trim());
      console.log('-'.repeat(80));
    });
    
    console.log('\n📊 Summary by Category:');
    console.log('='.repeat(80));
    const categories = {};
    createdProducts.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`${category}: ${count} products`);
    });
    console.log('='.repeat(80));
    
    console.log('\n💡 Total products created:', createdProducts.length);
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
}

// Exécuter le script
seedProducts();
