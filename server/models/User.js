const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  pushToken: {
    type: String
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'emergency_responder'],
    default: 'user'
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String
  }],
  medicalInfo: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    conditions: [String]
  },
  settings: {
    darkMode: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    radius: {
      type: Number,
      default: 5000 // 5km in meters
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '7d' }
  );
  return token;
};

// Check password
userSchema.methods.checkPassword = async function(password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

// Remove sensitive information when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.__v;

  return userObject;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
  try {
    console.log('Finding user with email:', email);
    const user = await User.findOne({ email }).maxTimeMS(20000); // Add timeout of 20 seconds
    
    if (!user) {
      console.log('No user found with email:', email);
      throw new Error('Invalid login credentials');
    }

    console.log('User found, checking password');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password does not match');
      throw new Error('Invalid login credentials');
    }

    console.log('Password matches, login successful');
    return user;
  } catch (error) {
    console.error('Error in findByCredentials:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
