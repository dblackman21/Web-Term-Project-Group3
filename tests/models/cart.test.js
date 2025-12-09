const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Cart = require('../../models/Cart');
const Product = require('../../models/Product');
const User = require('../../models/User');

let authToken;
let userId;
let testProduct1Id;
let testProduct2Id;

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
  
  // Clear collections
  await Cart.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
  
  // Create test user and get auth token
  const userResponse = await request(app)
    .post('/auth/register')
    .send({
      firstname: 'Cart',
      lastname: 'Tester',
      email: 'cart@example.com',
      password: 'password123'
    });
  
  authToken = userResponse.body.token;
  userId = userResponse.body.user._id;
  
  // Create test products
  const product1 = await Product.create({
    name: 'Test Product 1',
    description: 'First test product',
    price: 29.99,
    stock: 100,
    isAvailable: true
  });
  testProduct1Id = product1._id.toString();
  
  const product2 = await Product.create({
    name: 'Test Product 2',
    description: 'Second test product',
    price: 49.99,
    stock: 50,
    isAvailable: true
  });
  testProduct2Id = product2._id.toString();
  
  // Create out-of-stock product
  await Product.create({
    name: 'Out of Stock Product',
    description: 'No stock',
    price: 99.99,
    stock: 0,
    isAvailable: false
  });
});

afterAll(async () => {
  // Clean up and close connection
  await Cart.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Cart API Tests', () => {
  
  describe('GET /cart - Get User Cart', () => {
    
    test('Should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart).toHaveProperty('items');
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.cart.totalPrice).toBe(0);
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app).get('/cart');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /cart/add - Add Item to Cart', () => {
    
    test('Should add item to cart successfully', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 2
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].quantity).toBe(2);
      expect(response.body.cart.items[0].price).toBe(29.99);
      expect(response.body.cart.totalPrice).toBe(59.98); // 29.99 * 2
    });
    
    test('Should increase quantity if product already in cart', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 3
        });
      
      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].quantity).toBe(5); // 2 + 3
      expect(response.body.cart.totalPrice).toBe(149.95); // 29.99 * 5
    });
    
    test('Should add different product to cart', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(2);
      expect(response.body.cart.totalPrice).toBe(199.94); // 149.95 + 49.99
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app)
        .post('/cart/add')
        .send({
          productId: testProduct1Id,
          quantity: 1
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with missing productId', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product ID and quantity are required');
    });
    
    test('Should fail with missing quantity', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with quantity less than 1', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 0
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity must be at least 1');
    });
    
    test('Should fail with non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: fakeId,
          quantity: 1
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
    
    test('Should fail for out-of-stock product', async () => {
      const outOfStockProduct = await Product.findOne({ stock: 0 });
      
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: outOfStockProduct._id,
          quantity: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product is not available');
    });
    
    test('Should fail when quantity exceeds stock', async () => {
      const product = await Product.findById(testProduct2Id);
      
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: product.stock + 10
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available in stock');
    });
  });
  
  describe('PUT /cart/update - Update Cart Item Quantity', () => {
    
    test('Should update item quantity successfully', async () => {
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 3
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const item = response.body.cart.items.find(
        item => item.product._id === testProduct1Id
      );
      expect(item.quantity).toBe(3);
    });
    
    test('Should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: 0
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const item = response.body.cart.items.find(
        item => item.product._id === testProduct2Id
      );
      expect(item).toBeUndefined();
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app)
        .put('/cart/update')
        .send({
          productId: testProduct1Id,
          quantity: 1
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with missing fields', async () => {
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with negative quantity', async () => {
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: -5
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity cannot be negative');
    });
    
    test('Should fail when quantity exceeds stock', async () => {
      const product = await Product.findById(testProduct1Id);
      
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: product.stock + 50
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail for non-existent item in cart', async () => {
      const newProduct = await Product.create({
        name: 'Not In Cart',
        description: 'Test',
        price: 10,
        stock: 20
      });
      
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: newProduct._id,
          quantity: 5
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found in cart');
    });
  });
  
  describe('DELETE /cart/remove/:productId - Remove Item from Cart', () => {
    
    test('Should remove item from cart successfully', async () => {
      // First add an item
      await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: 2
        });
      
      const response = await request(app)
        .delete(`/cart/remove/${testProduct2Id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const item = response.body.cart.items.find(
        item => item.product._id === testProduct2Id
      );
      expect(item).toBeUndefined();
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/cart/remove/${testProduct1Id}`);
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with missing productId', async () => {
      const response = await request(app)
        .delete('/cart/remove/')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404); // Route not found
    });
  });
  
  describe('DELETE /cart/clear - Clear Cart', () => {
    
    test('Should clear all items from cart', async () => {
      // Add some items first
      await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 2
        });
      
      await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: 1
        });
      
      const response = await request(app)
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.cart.totalPrice).toBe(0);
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app).delete('/cart/clear');
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Cart Model Methods', () => {
    
    test('addItem() should add new item to cart', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: []
      });
      
      await cart.addItem(testProduct1Id, 2, 29.99);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totalPrice).toBe(59.98);
    });
    
    test('addItem() should increase quantity for existing item', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [{
          product: testProduct1Id,
          quantity: 2,
          price: 29.99
        }]
      });
      
      await cart.addItem(testProduct1Id, 3, 29.99);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });
    
    test('removeItem() should remove item from cart', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [{
          product: testProduct1Id,
          quantity: 2,
          price: 29.99
        }]
      });
      
      await cart.removeItem(testProduct1Id);
      
      expect(cart.items).toHaveLength(0);
      expect(cart.totalPrice).toBe(0);
    });
    
    test('updateQuantity() should update item quantity', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [{
          product: testProduct1Id,
          quantity: 2,
          price: 29.99
        }]
      });
      
      await cart.updateQuantity(testProduct1Id, 5);
      
      expect(cart.items[0].quantity).toBe(5);
    });
    
    test('updateQuantity() should remove item when quantity is 0', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [{
          product: testProduct1Id,
          quantity: 2,
          price: 29.99
        }]
      });
      
      await cart.updateQuantity(testProduct1Id, 0);
      
      expect(cart.items).toHaveLength(0);
    });
    
    test('updateQuantity() should throw error for non-existent item', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: []
      });
      
      await expect(
        cart.updateQuantity(testProduct1Id, 5)
      ).rejects.toThrow('Item not found in cart');
    });
    
    test('clearCart() should remove all items', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [
          { product: testProduct1Id, quantity: 2, price: 29.99 },
          { product: testProduct2Id, quantity: 1, price: 49.99 }
        ]
      });
      
      await cart.clearCart();
      
      expect(cart.items).toEqual([]);
      expect(cart.totalPrice).toBe(0);
    });
    
    test('Cart should auto-calculate totalPrice on save', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: [
          { product: testProduct1Id, quantity: 2, price: 29.99 },
          { product: testProduct2Id, quantity: 3, price: 49.99 }
        ]
      });
      
      expect(cart.totalPrice).toBe(209.95); // (29.99 * 2) + (49.99 * 3)
    });
    
    test('Cart should update timestamp on save', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        user: testUserId,
        items: []
      });
      
      const originalTime = cart.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await cart.addItem(testProduct1Id, 1, 29.99);
      
      expect(cart.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });
});
