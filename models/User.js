const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const ms = require('ms');
const { type } = require('os');

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    default: "Unknown"
  },
  lastName: {
    type: String,
    trim: true,
    default: "Unknown"
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age must be less than 120']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    minlength: [8, 'Password should be at least 8 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manufacturer' , 'supplier', 'pharmacy'],
    default: 'user'
  },
  picture: {
    type: String,
    default: '/uploads/images/avatar.png'
  },
  location : {
    type : String,
    required : true,
    default : "Unknown"
  },
  wallet_address : {
    type : String,
    unique : true,
    required : true,
    default : "Unknown"
  },
  privateKey : {
    type : String,
    unique : true,
    required : true,
    default : "Unknown"
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    token: String,
    expiresAt: Date
  },
  emailVerificationToken: {
    token: String,
    expiresAt: Date
  },
  otp: {
    value: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date
    }
  },
  logs: [
    {
      action: {
        type: String,
        enum: ['login', 'logout', 'password_change', 'email_change', 'two_factor_setup', 'account_update', 'failed_login']
      },
      time: { 
        type: Date, 
        default: Date.now 
      },
      ipAddress: String,
      userAgent: String,
      method:String
    }
  ],
  lastLogin: {
    time: Date,
    ipAddress: String,
    userAgent: String,
    method:String
  },
  googleAuthKey: {
    type: String
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    token: String,      // Encrypted refresh token
    createdAt: Date,    
    expiresAt: Date,
  },
  accountLocked: {
    status: {
      type: Boolean,
      default: false
    },
    reason: String,
    until: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  accessTokenVersion: {
    type: Number,
    default: 0
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  // socialProfiles: {
  //   google: {       // to store only ID
  //     type: String,
  //     unique: true,
  //     sparse: true // allows multiple nulls
  //   }, 
  //   facebook: {
  //     type: String,
  //     unique: true,
  //     sparse: true // allows multiple nulls
  //   },
  //   github: {
  //     type: String,
  //     unique: true,
  //     sparse: true // allows multiple nulls
  //   },
  //   twitter: {
  //     type: String,
  //     unique: true,
  //     sparse: true // allows multiple nulls
  //   }
  // },
  providers: {
    type: String,
    enum: ['local', 'google'],
    default: "local"
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) { // res.json(User.findById(_id))
      delete ret.password;          // does not sent pass or refres otp an so on
      delete ret.refreshToken;
      delete ret.googleAuthKey;
      delete ret.otp;
      delete ret.resetPasswordToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = 12; 
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the timestamps if document is updated
userSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
  //it update document in momory only and does not notify mongoose
  //with this modificaiton then if you use User.save nothing will update
  //this.updatedAt = Date.now() 
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Load the password field explicitly since it's not selected by default
    const user = this.password ? this : await this.constructor.findById(this._id).select('+password');
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      email: this.email,
      address:this.wallet_address,
      location : this.location,
      version: this.accessTokenVersion 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  // Create a random token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Set expiration to 30 days or whatever is configured
  const expiresIn = ms(process.env.REFRESH_TOKEN_EXPIRE) || 30 * 24 * 60 * 60 * 1000; // 30 days
  const expiresAt = new Date(Date.now() + expiresIn);
  // Store encrypted version of token
  const encryptedToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');
  
  // Update user's refresh token record
  this.refreshToken = {
    token: encryptedToken,
    createdAt: new Date(),
    expiresAt: expiresAt,
  };
  
  return refreshToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = {
    token: crypto.createHash('sha256').update(resetToken).digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Token expires in 10 minutes
  };
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  // Create reset token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.emailVerificationToken = {
    token: crypto.createHash('sha256').update(verificationToken).digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // Token expires in 10 minutes
  };
  
  return verificationToken;
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store hashed version of OTP
  this.otp = {
    value: crypto.createHash('sha256').update(otp).digest('hex'),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // OTP expires in 5 minutes
  };
  
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(candidateOTP) {
  // Check if OTP is expired
  if (Date.now() > this.otp.expiresAt) {
    return false;
  }
  
  const hashedOTP = crypto.createHash('sha256').update(candidateOTP).digest('hex');
  return this.otp.value === hashedOTP;
};

// Add a login attempt
userSchema.methods.addLoginAttempt = function(success, ipAddress, userAgent , method) {
  // Update login attempts counter
  if (!success) {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.accountLocked = {
        status: true,
        reason: 'Too many failed login attempts',
        until: new Date(Date.now() + 5 * 60 * 1000) // Lock for 5 minutes
      };
    }
  } else {
    // Reset failed attempts on successful login
    this.failedLoginAttempts = 0;
    
    // Update last login info
    this.lastLogin = {
      time: new Date(),
      ipAddress,
      userAgent,
      method
    };
  }
  
  // Add to logs
  this.logs.push({
    action: success ? 'login' : 'failed_login',
    time: new Date(),
    ipAddress,
    userAgent,
    method
  });
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'refreshToken.token': 1 });
userSchema.index({ 'resetPasswordToken.token': 1 });

// Export the User model
module.exports = mongoose.model('User', userSchema);