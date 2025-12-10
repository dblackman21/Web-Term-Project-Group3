const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
require("dotenv").config();

// Disable mongoose strictQuery warnings
mongoose.set("strictQuery", false);

// Connect to test database before all tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  // Clean up any existing test data
  await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  // Clean up all test users created during tests
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe("User Model Tests", () => {
  
  test("Should create a user and hash the password", async () => {
    const plainPassword = "mypassword123";
    const user = await User.create({
      firstname: "John",
      lastname: "Doe",
      email: "john.doe@example.com",
      password: plainPassword,
    });

    // Verify user was created
    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.firstname).toBe("John");
    expect(user.lastname).toBe("Doe");
    expect(user.email).toBe("john.doe@example.com");
    
    // Verify password is hashed (not plain text)
    expect(user.password).not.toBe(plainPassword);
    expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$/); // bcrypt hash format
    
    // Verify user exists in database
    const foundUser = await User.findOne({ email: "john.doe@example.com" });
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe("john.doe@example.com");
  });

  test("Should not allow duplicate emails", async () => {
    expect.assertions(1);
    
    try {
      await User.create({
        firstname: "Jane",
        lastname: "Doe",
        email: "john.doe@example.com", // Duplicate email from previous test
        password: "mypassword456",
      });
    } catch (error) {
      // Should throw error due to unique constraint on email
      expect(error).toBeDefined();
    }
  });

  test("comparePassword() should return true for correct password", async () => {
    const user = await User.findOne({ email: "john.doe@example.com" });
    const isMatch = await user.comparePassword("mypassword123");
    
    expect(isMatch).toBe(true);
  });

  test("comparePassword() should return false for incorrect password", async () => {
    const user = await User.findOne({ email: "john.doe@example.com" });
    const isMatch = await user.comparePassword("wrongpassword");
    
    expect(isMatch).toBe(false);
  });

  test("toJSON() should remove the password field", async () => {
    const user = await User.findOne({ email: "john.doe@example.com" });
    const jsonUser = user.toJSON();
    
    // Password should not be in JSON output
    expect(jsonUser.password).toBeUndefined();
    
    // Other fields should still be present
    expect(jsonUser.email).toBe("john.doe@example.com");
    expect(jsonUser.firstname).toBe("John");
    expect(jsonUser.lastname).toBe("Doe");
  });

  test("Should update user without re-hashing password", async () => {
    const user = await User.findOne({ email: "john.doe@example.com" });
    const originalHash = user.password;
    
    // Update firstname without changing password
    user.firstname = "Johnny";
    await user.save();
    
    // Password hash should remain the same
    expect(user.password).toBe(originalHash);
    expect(user.firstname).toBe("Johnny");
  });

  test("Should re-hash password when password is modified", async () => {
    const user = await User.findOne({ email: "john.doe@example.com" });
    const originalHash = user.password;
    
    // Change password
    user.password = "newpassword456";
    await user.save();
    
    // Password should be re-hashed (different from original)
    expect(user.password).not.toBe(originalHash);
    expect(user.password).not.toBe("newpassword456");
    
    // New password should work
    const isMatch = await user.comparePassword("newpassword456");
    expect(isMatch).toBe(true);
    
    // Old password should not work
    const isOldMatch = await user.comparePassword("mypassword123");
    expect(isOldMatch).toBe(false);
  });
});

describe("JWT Token Tests", () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    // Create a test user for token tests
    testUser = await User.create({
      firstname: "Token",
      lastname: "Test",
      email: "token.test@example.com",
      password: "testpassword123",
    });
  });

  afterAll(async () => {
    // Clean up token test user
    await User.deleteOne({ email: "token.test@example.com" });
  });

  test("Should generate a valid JWT token", () => {
    // Generate token (simulating login)
    testToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    expect(testToken).toBeDefined();
    expect(typeof testToken).toBe("string");
    expect(testToken.split(".").length).toBe(3); // JWT has 3 parts
  });

  test("Should verify and decode a valid token", () => {
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);

    expect(decoded).toBeDefined();
    expect(decoded.id).toBe(testUser._id.toString());
    expect(decoded.iat).toBeDefined(); // Issued at
    expect(decoded.exp).toBeDefined(); // Expiration
  });

  test("Should reject an invalid token", () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";

    expect(() => {
      jwt.verify(fakeToken, process.env.JWT_SECRET);
    }).toThrow();
  });

  test("Should reject a token with wrong secret", () => {
    const tokenWithWrongSecret = jwt.sign(
      { id: testUser._id },
      "wrong_secret",
      { expiresIn: "7d" }
    );

    expect(() => {
      jwt.verify(tokenWithWrongSecret, process.env.JWT_SECRET);
    }).toThrow();
  });

  test("Should reject an expired token", () => {
    // Create token that expires immediately
    const expiredToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "0s" } // Expires in 0 seconds
    );

    // Wait a bit to ensure expiration
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(() => {
          jwt.verify(expiredToken, process.env.JWT_SECRET);
        }).toThrow();
        resolve();
      }, 100);
    });
  });

  test("Token should contain correct user ID", async () => {
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const foundUser = await User.findById(decoded.id);
    
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe("token.test@example.com");
    expect(foundUser.firstname).toBe("Token");
  });

  test("Should generate different tokens for different users", async () => {
    // Create another user
    const anotherUser = await User.create({
      firstname: "Another",
      lastname: "User",
      email: "another.user@example.com",
      password: "password123",
    });

    const token1 = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const token2 = jwt.sign(
      { id: anotherUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Tokens should be different
    expect(token1).not.toBe(token2);

    // But both should be valid
    const decoded1 = jwt.verify(token1, process.env.JWT_SECRET);
    const decoded2 = jwt.verify(token2, process.env.JWT_SECRET);

    expect(decoded1.id).toBe(testUser._id.toString());
    expect(decoded2.id).toBe(anotherUser._id.toString());

    // Clean up
    await User.deleteOne({ email: "another.user@example.com" });
  });
});

describe("User Database Persistence Tests", () => {
  
  test("Should persist user data correctly in database", async () => {
    const userData = {
      firstname: "Persist",
      lastname: "Test",
      email: "persist.test@example.com",
      password: "password123",
    };

    // Create user
    const createdUser = await User.create(userData);
    
    // Fetch from database in a new query
    const fetchedUser = await User.findById(createdUser._id);
    
    expect(fetchedUser).toBeDefined();
    expect(fetchedUser.firstname).toBe(userData.firstname);
    expect(fetchedUser.lastname).toBe(userData.lastname);
    expect(fetchedUser.email).toBe(userData.email);
    expect(fetchedUser.createdAt).toBeDefined();
    
    // Clean up
    await User.deleteOne({ _id: createdUser._id });
  });

  test("Should count users correctly", async () => {
    const initialCount = await User.countDocuments();
    
    // Create multiple users
    await User.create({
      firstname: "Count",
      lastname: "One",
      email: "count.one@example.com",
      password: "password123",
    });

    await User.create({
      firstname: "Count",
      lastname: "Two",
      email: "count.two@example.com",
      password: "password123",
    });

    const newCount = await User.countDocuments();
    expect(newCount).toBe(initialCount + 2);

    // Clean up
    await User.deleteMany({ email: /^count\./i });
  });

  test("Should find users by query", async () => {
    // Create test users
    await User.create({
      firstname: "Query",
      lastname: "TestA",
      email: "query.testa@example.com",
      password: "password123",
    });

    await User.create({
      firstname: "Query",
      lastname: "TestB",
      email: "query.testb@example.com",
      password: "password123",
    });

    // Find users by firstname
    const users = await User.find({ firstname: "Query" });
    
    expect(users).toHaveLength(2);
    expect(users[0].firstname).toBe("Query");
    expect(users[1].firstname).toBe("Query");

    // Clean up
    await User.deleteMany({ firstname: "Query" });
  });
});
