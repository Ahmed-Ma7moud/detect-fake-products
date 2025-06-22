const cors = require('cors');

// Middleware for restricted routes
// const restrictedCors = cors({
//   origin: 'your front end domain',
//   credentials: true, // Allow cookies
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// });

// Middleware for public routes
const publicCors = cors({
    origin: '*',
    maxAge: 86400
});

module.exports = {
    restrictedCors,
    publicCors
}  
