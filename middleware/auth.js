const jwt = require('jsonwebtoken');
const User = require('../models/User');
const session = require('express-session')

// custom sessions
exports.apiSessions = session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{
    sameSite:"none",
    secure:process.env.NODE_ENV === 'production',
    httpOnly:true
  }
})
exports.googleSessions = session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie:{
    sameSite:"lax",
    secure:process.env.NODE_ENV === 'production',
    httpOnly:true
  }
})

// Protect routes middleware
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to get access.'
      });
    }
    
    // Verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // Check if user still exists
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if token version matches current user version (for invalidation)
    if (decoded.version !== user.accessTokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Your token has been invalidated. Please log in again.'
      });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.'
      });
    }
    
    // Add user to request object
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your token has expired. Please log in again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// Restrict to roles middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Ensure email is verified middleware
exports.ensureEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this resource'
    });
  }
  
  next();
};

exports.verify2FA = async(req,res,next) => {
  //I will receive user for authenticate middleware
  try {
    const { token } = req.body;
    const user = req.user
    //check if 2FA is activated
    if(!user.twoFactorEnabled)
      next();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token'
      });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.googleAuthKey,
      encoding: 'base32',
      token:token,
      window:1 // allow current and previous otp 
    });
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}