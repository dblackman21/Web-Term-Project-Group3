const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Register a new user
 */
exports.registerUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Check missing fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email already taken?
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Create user
    const user = await User.create({
      firstname,
      lastname,
      email,
      password
    });

    // Save user session
    req.session.user = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email
    };

    return res.status(201).json({
      message: "User registered successfully",
      user: req.session.user
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Login user
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Save session
    req.session.user = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email
    };

    return res.json({
      message: "Login successful",
      user: req.session.user
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Logout user
 */
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
};

/**
 * Get profile for logged-in user
 */
exports.getProfile = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return res.json({ user: req.session.user });
};

