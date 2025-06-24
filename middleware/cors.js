const cors = require('cors');

// only allow requests from 'http://localhost:5000' (browser)
// postman is not a browser so it does not respect cors policy
// and will allow all requests to reach to the server
exports.cors = cors({
  origin: ['http://localhost:5000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
});


 
