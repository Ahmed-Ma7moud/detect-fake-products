// const rateLimit = require('express-rate-limit');

// // Create a custom key generator function
// const keyGenerator = (req) => {
//   // For authenticated users, use their ID
//   if (req.user && req.user.id) {
//     return `user:${req.user.id}`;
//   }
//   // For unauthenticated users, use IP address
//   return `ip:${req.ip}`;
// };

// // Create a limiter that handles both cases
// exports.limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   // The limit will be applied based on the key
//   max: (req) => {
//     // Higher limit for authenticated users
//     if (req.user && req.user.id) {
//       return 300; // 300 requests per 15 minutes for authenticated users
//     }
//     // Lower limit for public/unauthenticated users
//     return 60; // 60 requests per 15 minutes for public users
//   },
//   keyGenerator: keyGenerator,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: (req) => {
//     const isAuthenticated = req.user && req.user.id;
//     if (isAuthenticated) {
//       return 'Too many requests from your account. Please try again later.';
//     }
//     return 'Too many requests from your IP. Please try again later.';
//   }
// });

const rateLimit = require('express-rate-limit');

// Standard API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  message: 'Too many requests from this IP, please try again later'
});

// login limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many login attempts, please try again later'
});

//for auth like register resent password
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 150,
  message: 'Too many login attempts, please try again later'
});


// Public API rate limiter (less strict)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // More generous limit for public APIs
  standardHeaders: true
});

module.exports = {
  apiLimiter,
  authLimiter,
  publicLimiter,
  loginLimiter
};