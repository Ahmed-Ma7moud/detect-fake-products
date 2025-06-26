const express = require('express');
const {
  register,
  login,
  loginWithGoogle,
  googleCallback,
  logout,
  refreshToken,
  setup2FA,
  enable2FA,
  disable2FA,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  getUserProfile
} = require('../controllers/authController');
const { auth , rateLimiter , cors} = require('../middleware/index');
const validators = require("../middleware/validators/auth")
const {validate} = require("../middleware/errorHandling")
const router = express.Router();

// for specific domain
//router.use(cors.restrictedCors)

// limiter for all auth routes 
router.use(rateLimiter.authLimiter)
// Public routes
router.post('/register' , validators.registerValidation , validate , register);
router.post('/login', validators.loginValidation , validate , rateLimiter.loginLimiter, login); // specific limiter for login field
router.get('/google', rateLimiter.loginLimiter, loginWithGoogle); // specific limiter for login field
router.post('/google/callback', rateLimiter.loginLimiter, googleCallback); // specific limiter for login field
router.post('/refresh-token' , refreshToken);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail); 

// Protected routes to fetch user payload / data before going to route
router.get('/profile' , auth.authenticate , getUserProfile);
router.post('/logout', auth.authenticate , logout);
router.post('/setup-2fa', auth.authenticate ,setup2FA);
router.post('/enable-2fa', auth.authenticate , enable2FA);
router.post('/disable-2fa', auth.authenticate , disable2FA);

// Routes that require verified email (auth.ensureEmailVerified)


module.exports = router;