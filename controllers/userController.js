const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

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

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: user.toJSON()
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
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
      return res.status(400).json({
          message: "Email and password are required",
          success: false
      });
    }

    // Check email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
          message: "Invalid credentials",
          success: false
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
          message: "Invalid credentials",
          success: false
      });
    }
    
    //Update last Login
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
      success: true
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
        message: "Internal server error",
        success: false
    });
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
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
