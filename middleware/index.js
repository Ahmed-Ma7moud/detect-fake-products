const cors = require('./cors');
const rateLimiter = require('./rateLimiter');
const auth = require('./auth');

module.exports = {
  cors,
  rateLimiter,
  auth
};