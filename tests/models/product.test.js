const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Product = require('../../models/Product');
const User = require('../../models/User');

let authToken;
let testProductId;

beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState !== 0){
    await mongoose.connection.close();
  } 
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  
  // Clear collections
  await Product.deleteMany({});
  await User.deleteMany({});
  
  // Create test user and get auth token
  const userResponse = await request(app)
    .post('/auth/register')
    .send({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: 'password123'
    });
  
  authToken = userResponse.body.token;
});

afterAll(async () => {
  // Clean up and close connection
  await Product.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Product API Tests', () => {
  
  describe('POST /products - Create Product', () => {
    
    test('Should create a new product with valid data', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          description: 'This is a test product description',
          price: 99.99,
          stock: 100
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.product).toHaveProperty('_id');
      expect(response.body.product.name).toBe('Test Product');
      expect(response.body.product.price).toBe(99.99);
      expect(response.body.product.stock).toBe(100);
      
      testProductId = response.body.product._id;
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app)
        .post('/products')
        .send({
          name: 'Unauthorized Product',
          description: 'This should fail',
          price: 50
        });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Product'
          // Missing description and price
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    test('Should fail with negative price', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Negative Price Product',
          description: 'Invalid price',
          price: -10
        });
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
    
    test('Should create product with default stock (0)', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'No Stock Product',
          description: 'Product without stock specified',
          price: 29.99
        });
      
      expect(response.status).toBe(201);
      expect(response.body.product.stock).toBe(0);
      expect(response.body.product.isAvailable).toBe(true);
    });
    
    test('Should create product with default rating', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Rating Test Product',
          description: 'Check default rating',
          price: 49.99,
          stock: 10
        });
      
      expect(response.status).toBe(201);
      expect(response.body.product.rating.average).toBe(0);
      expect(response.body.product.rating.count).toBe(0);
    });
  });
  
  describe('GET /products - Get All Products', () => {
    
    test('Should get all products', async () => {
      const response = await request(app).get('/products');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
    });
    
    test('Should filter products by price range', async () => {
      const response = await request(app)
        .get('/products')
        .query({ minPrice: 50, maxPrice: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(50);
        expect(product.price).toBeLessThanOrEqual(100);
      });
    });
    
    test('Should search products by name', async () => {
      const response = await request(app)
        .get('/products')
        .query({ search: 'Test' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.products.forEach(product => {
        expect(
          product.name.toLowerCase().includes('test') ||
          product.description.toLowerCase().includes('test')
        ).toBe(true);
      });
    });
    
    test('Should filter available products only', async () => {
      const response = await request(app)
        .get('/products')
        .query({ available: 'true' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.products.forEach(product => {
        expect(product.isAvailable).toBe(true);
        expect(product.stock).toBeGreaterThan(0);
      });
    });
    
    test('Should return all products when no filters applied', async () => {
      const response = await request(app).get('/products');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(response.body.count).toBe(response.body.products.length);
    });
  });
  
  describe('GET /products/:id - Get Product By ID', () => {
    
    test('Should get product by valid ID', async () => {
      const response = await request(app).get(`/products/${testProductId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product._id).toBe(testProductId);
      expect(response.body.product.name).toBe('Test Product');
    });
    
    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/products/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
    
    test('Should return 400 for invalid product ID', async () => {
      const response = await request(app).get('/products/invalid-id-123');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid product ID');
    });
  });
  
  describe('PUT /products/:id - Update Product', () => {
    
    test('Should update product with valid data', async () => {
      const response = await request(app)
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Product Name',
          price: 149.99,
          stock: 50
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe('Updated Product Name');
      expect(response.body.product.price).toBe(149.99);
      expect(response.body.product.stock).toBe(50);
    });
    
    test('Should fail without authentication', async () => {
      const response = await request(app)
        .put(`/products/${testProductId}`)
        .send({ name: 'Unauthorized Update' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Update Non-Existent' });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
    
    test('Should update only specified fields', async () => {
      const response = await request(app)
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'New description only' });
      
      expect(response.status).toBe(200);
      expect(response.body.product.description).toBe('New description only');
      expect(response.body.product.name).toBe('Updated Product Name');
    });
    
    test('Should update availability status', async () => {
      const response = await request(app)
        .put(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isAvailable: false });
      
      expect(response.status).toBe(200);
      expect(response.body.product.isAvailable).toBe(false);
    });
  });
  
  describe('DELETE /products/:id - Delete Product', () => {
    
    test('Should delete product with valid ID', async () => {
      const response = await request(app)
        .delete(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
      
      // Verify product is deleted
      const checkResponse = await request(app).get(`/products/${testProductId}`);
      expect(checkResponse.status).toBe(404);
    });
    
    test('Should fail without authentication', async () => {
      // Create a product to delete
      const createResponse = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Product to Delete',
          description: 'Test',
          price: 10
        });
      
      const productId = createResponse.body.product._id;
      
      const response = await request(app).delete(`/products/${productId}`);
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
    
    test('Should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Product Model Methods', () => {
    
    test('checkAvailability() should return true for available product', async () => {
      const product = await Product.create({
        name: 'Available Product',
        description: 'Test',
        price: 50,
        stock: 10,
        isAvailable: true
      });
      
      expect(product.checkAvailability()).toBe(true);
    });
    
    test('checkAvailability() should return false for out of stock', async () => {
      const product = await Product.create({
        name: 'Out of Stock Product',
        description: 'Test',
        price: 50,
        stock: 0,
        isAvailable: true
      });
      
      expect(product.checkAvailability()).toBe(false);
    });
    
    test('checkAvailability() should return false when not available', async () => {
      const product = await Product.create({
        name: 'Unavailable Product',
        description: 'Test',
        price: 50,
        stock: 10,
        isAvailable: false
      });
      
      expect(product.checkAvailability()).toBe(false);
    });
    
    test('reduceStock() should decrease stock correctly', async () => {
      const product = await Product.create({
        name: 'Stock Test Product',
        description: 'Test',
        price: 50,
        stock: 20
      });
      
      await product.reduceStock(5);
      expect(product.stock).toBe(15);
      expect(product.isAvailable).toBe(true);
      
      await product.reduceStock(15);
      expect(product.stock).toBe(0);
      expect(product.isAvailable).toBe(false);
    });
    
    test('reduceStock() should throw error for insufficient stock', async () => {
      const product = await Product.create({
        name: 'Low Stock Product',
        description: 'Test',
        price: 50,
        stock: 5
      });
      
      await expect(product.reduceStock(10)).rejects.toThrow('Insufficient stock');
    });
    
    test('increaseStock() should increase stock and update availability', async () => {
      const product = await Product.create({
        name: 'Restock Product',
        description: 'Test',
        price: 50,
        stock: 0,
        isAvailable: false
      });
      
      await product.increaseStock(10);
      expect(product.stock).toBe(10);
      expect(product.isAvailable).toBe(true);
    });
    
    test('Product should have default timestamps', async () => {
      const product = await Product.create({
        name: 'Timestamp Test',
        description: 'Test',
        price: 50,
        stock: 10
      });
      
      expect(product.createdAt).toBeDefined();
      expect(product.updatedAt).toBeDefined();
    });
    
    test('Product should update timestamp on save', async () => {
      const product = await Product.create({
        name: 'Update Test',
        description: 'Test',
        price: 50,
        stock: 10
      });
      
      const originalUpdateTime = product.updatedAt;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 100));
      product.price = 60;
      await product.save();
      
      expect(product.updatedAt.getTime()).toBeGreaterThan(originalUpdateTime.getTime());
    });
  });
});
