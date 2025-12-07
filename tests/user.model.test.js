const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

// Disable mongoose strictQuery warnings
mongoose.set("strictQuery", false);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({});
});

afterAll(async () => {
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

    expect(user).toBeDefined();
    expect(user.password).not.toBe(plainPassword); // Password must be hashed
  });

  test("Should not allow duplicate emails", async () => {
    expect.assertions(1);

    try {
      await User.create({
        firstname: "Jane",
        lastname: "Doe",
        email: "john.doe@example.com", // Same email as previous test
        password: "mypassword456",
      });
    } catch (error) {
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

    expect(jsonUser.password).toBeUndefined();
  });
});

