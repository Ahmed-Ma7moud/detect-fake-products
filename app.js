const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require("./config/DB")
const cors = require("./middleware/cors")
const app = express();

// trust proxy
app.set('trust proxy', true);

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())
app.use(cors.publicCors)

// session 
const authMiddleware = require('./middleware/auth')
// routes
app.get('/',(req,res)=>{
  res.status(201).send("Welcome to MediShield")
})
app.use('/api/auth',authMiddleware.apiSessions,require('./routes/authRoutes'))

//google login 
const {loginWithGoogle,googleCallback} = require('./controllers/authController')
app.get('/auth/google', authMiddleware.googleSessions , loginWithGoogle)
app.get('/auth/google/callback', authMiddleware.googleSessions , googleCallback)


//authentication middleware


app.use('/api/products', require('./routes/productRoutes'));

app.use((req, res, next) => {
  res.status(404).json({success : false , msg :'Sorry, the requested resource was not found.'});
});


const PORT = parseInt(process.env.PORT,10) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
