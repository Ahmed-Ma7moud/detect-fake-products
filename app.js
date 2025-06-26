const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();
const connectDB = require("./config/DB")
const {cors} = require("./middleware/cors")
const {session} = require('./middleware/auth')


const app = express();

// trust proxy
// app.set('trust proxy', true);

// Connect to MongoDB
connectDB();

//helmet 
app.use(helmet())
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())
app.use(cors)
app.use(session)
// routes
app.get('/',(req,res)=>{
  res.status(201).send("Welcome to MediShield")
})
//auth routes
app.use('/api/auth', require('./routes/authRoutes'))

//google login routes
const {loginWithGoogle,googleCallback} = require('./controllers/authController')
app.get('/auth/google' , loginWithGoogle)
app.get('/auth/google/callback' , googleCallback)


//product routes
app.use('/api/products', require('./routes/productRoutes'));

//contract routes
app.use('/api/contracts', require('./routes/contractRoutes'));

//orders route
app.use('/api/orders', require('./routes/orderRoutes'));
app.use((req, res, next) => {
  res.status(404).json({success : false , msg :'Sorry, the requested resource was not found.'});
});


const PORT = parseInt(process.env.PORT,10) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
