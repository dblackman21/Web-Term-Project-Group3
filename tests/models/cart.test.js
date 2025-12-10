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
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  } 

  await mongoose.connect(process.env.MONGODB_TEST_URI);
  
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
    
    test('Should get empty cart for authenticated user', async () => {
      const response = await request(app)
        .get('/cart')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart).toHaveProperty('items');
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.cart.totalPrice).toBe(0);
      expect(response.body.isGuest).toBe(false);
    });
    
    test('Should get empty cart for guest user', async () => {
      const response = await request(app).get('/cart');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart).toHaveProperty('items');
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.isGuest).toBe(true);
      
      // Should have received a cookie with sessionId
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
  
  describe('POST /cart/add - Add Item to Cart', () => {
    
    test('Should add item to cart for authenticated user', async () => {
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
      expect(response.body.cart.totalPrice).toBe(59.98);
      expect(response.body.isGuest).toBe(false);
    });
    
    test('Should add item to cart for guest user with cookies', async () => {
      const agent = request.agent(app);
      
      const response = await agent
        .post('/cart/add')
        .send({
          productId: testProduct2Id,
          quantity: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.isGuest).toBe(true);
      
      // Verify cookie persists
      const getResponse = await agent.get('/cart');
      expect(getResponse.body.cart.items).toHaveLength(1);
    });
    
    test('Should increase quantity if product already in cart (authenticated)', async () => {
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
      expect(response.body.cart.totalPrice).toBe(149.95);
    });
    
    test('Should add different product to cart (authenticated)', async () => {
      const response = await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: 1
        });
      
      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(2);
      expect(response.body.cart.totalPrice).toBe(199.94);
    });
    
    test('Should fail with missing productId', async () => {
      const response = await request(app)
        .post('/cart/add')
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
        .send({
          productId: testProduct1Id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with quantity less than 1', async () => {
      const response = await request(app)
        .post('/cart/add')
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
    
    test('Should update item quantity successfully (authenticated)', async () => {
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
        i => i.product._id.toString() === testProduct1Id
      );
      expect(item.quantity).toBe(3);
    });
    
    test('Should update item quantity for guest user', async () => {
      const agent = request.agent(app);
      
      // Add item first
      await agent
        .post('/cart/add')
        .send({ productId: testProduct1Id, quantity: 2 });
      
      // Update quantity
      const response = await agent
        .put('/cart/update')
        .send({ productId: testProduct1Id, quantity: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isGuest).toBe(true);
    });
    
    test('Should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct1Id,
          quantity: 0
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const item = response.body.cart.items.find(
        i => i.product._id.toString() === testProduct1Id
      );
      expect(item).toBeUndefined();
    });
    
    test('Should fail with missing fields', async () => {
      const response = await request(app)
        .put('/cart/update')
        .send({
          productId: testProduct1Id
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with negative quantity', async () => {
      const response = await request(app)
        .put('/cart/update')
        .send({
          productId: testProduct1Id,
          quantity: -1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Quantity cannot be negative');
    });
    
    test('Should fail when quantity exceeds stock', async () => {
      const product = await Product.findById(testProduct2Id);
      
      // Add item first
      await request(app)
        .post('/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct2Id, quantity: 1 });
      
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct2Id,
          quantity: product.stock + 10
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('available in stock');
    });
    
    test('Should fail for non-existent item in cart', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put('/cart/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: fakeId,
          quantity: 5
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found in cart');
    });
  });
  
  describe('DELETE /cart/remove/:productId - Remove Item from Cart', () => {
    
    test('Should remove item from cart successfully (authenticated)', async () => {
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
    
    test('Should remove item from cart for guest user', async () => {
      const agent = request.agent(app);
      
      // Add item
      await agent
        .post('/cart/add')
        .send({ productId: testProduct1Id, quantity: 1 });
      
      // Remove item
      const response = await agent
        .delete(`/cart/remove/${testProduct1Id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isGuest).toBe(true);
    });
    
    test('Should fail with missing productId', async () => {
      const response = await request(app)
        .delete('/cart/remove/');
      
      expect(response.status).toBe(404); // Route not found
    });
  });
  
  describe('DELETE /cart/clear - Clear Cart', () => {
    
    test('Should clear all items from cart (authenticated)', async () => {
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
    
    test('Should clear cart for guest user', async () => {
      const agent = request.agent(app);
      
      // Add items
      await agent
        .post('/cart/add')
        .send({ productId: testProduct1Id, quantity: 2 });
      
      // Clear
      const response = await agent.delete('/cart/clear');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.isGuest).toBe(true);
    });
  });
  
  describe('Cart Model Methods', () => {
    
    test('addItem() should add new item to cart', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: testUserId,
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
        userId: testUserId,
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
        userId: testUserId,
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
        userId: testUserId,
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
        userId: testUserId,
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
        userId: testUserId,
        items: []
      });
      
      await expect(
        cart.updateQuantity(testProduct1Id, 5)
      ).rejects.toThrow('Item not found in cart');
    });
    
    test('clearCart() should remove all items', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: testUserId,
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
        userId: testUserId,
        items: [
          { product: testProduct1Id, quantity: 2, price: 29.99 },
          { product: testProduct2Id, quantity: 3, price: 49.99 }
        ]
      });
      
      expect(cart.totalPrice).toBe(209.95);
    });
    
    test('Cart should update timestamp on save', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: testUserId,
        items: []
      });
      
      const originalTime = cart.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await cart.addItem(testProduct1Id, 1, 29.99);
      
      expect(cart.updatedAt.getTime()).toBeGreaterThan(originalTime.getTime());
    });
    
    // NEW TESTS for new Cart model features
    
    test('Should create cart with sessionId for guest', async () => {
      const sessionId = 'test-session-123';
      const cart = await Cart.create({
        sessionId,
        items: []
      });
      
      expect(cart.sessionId).toBe(sessionId);
      expect(cart.userId).toBeUndefined();
      expect(cart.expiresAt).toBeDefined();
    });
    
    test('Should set expiresAt for guest carts', async () => {
      const sessionId = 'test-session-456';
      const cart = await Cart.create({
        sessionId,
        items: []
      });
      
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(cart.expiresAt.getTime() - expectedExpiry.getTime());
      
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
    
    test('Should not set expiresAt for user carts', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: testUserId,
        items: []
      });
      
      expect(cart.expiresAt).toBeUndefined();
    });
    
    test('convertToUserCart() should convert guest cart to user cart', async () => {
      const sessionId = 'test-session-789';
      const testUserId = new mongoose.Types.ObjectId();
      
      const cart = await Cart.create({
        sessionId,
        items: [{ product: testProduct1Id, quantity: 2, price: 29.99 }]
      });
      
      await cart.convertToUserCart(testUserId);
      
      expect(cart.userId).toEqual(testUserId);
      expect(cart.sessionId).toBeUndefined();
      expect(cart.expiresAt).toBeUndefined();
      expect(cart.items).toHaveLength(1);
    });
    
    test('convertToUserCart() should throw if cart already has userId', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const cart = await Cart.create({
        userId: testUserId,
        items: []
      });
      
      const newUserId = new mongoose.Types.ObjectId();
      
      await expect(
        cart.convertToUserCart(newUserId)
      ).rejects.toThrow('Cart is already associated with a user');
    });
    
    test('Should validate that cart has either userId or sessionId', async () => {
      await expect(
        Cart.create({ items: [] })
      ).rejects.toThrow();
    });
    
    test('Should validate that cart cannot have both userId and sessionId', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      
      await expect(
        Cart.create({
          userId: testUserId,
          sessionId: 'test-session',
          items: []
        })
      ).rejects.toThrow();
    });
  });
});
