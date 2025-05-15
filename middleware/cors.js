const cors = require('cors');

// Middleware for restricted routes
const restrictedCors = cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://myapp.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

// Middleware for public routes
const publicCors = cors({
    origin: '*',
    credentials: true,
    maxAge: 86400
});

module.exports = {
    restrictedCors,
    publicCors
}  
