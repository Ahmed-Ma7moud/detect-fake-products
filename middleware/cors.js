const cors = require('cors');

// only allow requests from 'http://192.168.156.158:4200' (browser)
// postman is not a browser so it does not respect cors policy
// and will allow all requests to reach to the server
exports.cors = cors({
  origin: "http://192.168.156.158:4200",
  credentials : true
});


 
