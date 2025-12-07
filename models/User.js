const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'Firstname is required'],
    trim: true
  },
  lastname: {
    type: String,
    required : [true, 'Lastname is required'],
    trim: true 
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password has to contain at least 6 characters']
  },
  shippingAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  lastLogin: {
    type: Date
  }
});

// 2. Middleware pre-save
// Called before any modifications/save of password
userSchema.pre('save', async function(next) {

    // No modifications on password : jump to next()
    if (this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 3. Méthode comparePassword
userSchema.methods.comparePassword = async function(candidatePassword) {
  // À COMPLÉTER :
    return await bcrypt.compare(candidatePassword, this.password);
};

// 4. Méthod toJSON
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

// 5. Exporter le modèle
module.exports = mongoose.model('User', userSchema);
