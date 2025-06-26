const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/sendEmail');
const validator = require('validator');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const qs = require('qs')
const axios = require('axios')
const jwksClient = require('jwks-rsa')
const {generateEthAddress} = require('../utils/generateEtherAddress');
const exp = require('constants');
// Register a new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, age , location, tradeName , role} = req.body;
    let user = await User.findOne({email})
    if(user)
      return res.status(400).json({msg:false,error:"User is Already exist"})

    // generate private key and wallet address
    const {address , privateKey} =  await generateEthAddress();
    // Create user if He does not exist in database
    user = new User({
      firstName,
      lastName,
      email,
      password,
      age,
      location,
      privateKey,
      wallet_address:address,
      tradeName,
      role
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();

//Send verification email
const verificationURL = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;
    try{
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message: `Please verify your email by clicking: ${verificationURL}`
      });
    }catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
    

    // save user in database after sending email and before assign payload (user._id)
    await user.save();
    
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.'
    });
  } catch (error) {
    console.log(error)
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

//  traditional login
exports.login = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user and select password field
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    // If user login with social accounts only 
    if (user.providers == "google") {
      return res.status(400).json({ message: "Login with Google" });
    }
    
    // check if email account is verified
    // if (!user.isEmailVerified) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Please verify your email before logging in.'
    //   });
    // }
    // Check if account is locked
    if (user.accountLocked && user.accountLocked.status) {
      if (user.accountLocked.until > Date.now()) {
        return res.status(403).json({
          success: false,
          message: `Account locked: ${user.accountLocked.reason}. Try again after ${new Date(user.accountLocked.until).toLocaleString()}`,
          lockedUntil: user.accountLocked.until
        });
      } else {
        // Unlock account if lock period has passed
        user.accountLocked.status = false;
      }
    }
    // Check if account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.'
      });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed login attempt
      user.addLoginAttempt(false, req.ip, req.headers['user-agent'], "local");
      await user.save({ validateBeforeSave: false });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if 2FA is enabled and verify OTP if necessary
    if (user.twoFactorEnabled) {
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'Please provide OTP',
          requiresOTP: true
        });
      }
      
      // Verify OTP
      const verified = speakeasy.totp.verify({
        secret: user.googleAuthKey,
        encoding: 'base32',
        token: otp,
        window:1
      });
      
      if (!verified) {
        user.addLoginAttempt(false, req.ip, req.headers['user-agent'], "local" ,{ reason: 'Invalid OTP' });
        await user.save({ validateBeforeSave: false });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid OTP'
        });
      }
    }
    
    // invalid all access token of this user
    user.accessTokenVersion+=1;

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    // Record successful login
    user.addLoginAttempt(true, req.ip, req.headers['user-agent'] , "local");
    await user.save({ validateBeforeSave: false });

    // Set refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite : "none",
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10) * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// login with google
exports.loginWithGoogle = async (req,res,next) =>{
  try{
    const state = crypto.randomBytes(16).toString('hex'); // Generate a random state
  req.session.state = state;
  const url ="https://accounts.google.com/o/oauth2/v2/auth?" +
    qs.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile", 
      access_type: "online",
      prompt: "select_account", 
      state: state, 
    });
  res.redirect(url);
  }catch(error){
    res.status(500).json({message:`failed to login with google:${error}`})
  }
}

// google callback handler
exports.googleCallback = async(req,res,next) => {
  const code = req.query.code;
  const state = req.query.state; // Get the state from the query parameters(google res)

  if (!state) {
    return res.status(400).send("Missing  state");
  }
  if (!code) {
    return res.status(400).send(`Missing code:${req.query.error}`);
  }

  // Verify state to prevent CSRF attacks
  if (state !== req.session.state) {
    return res.status(400).send("State mismatch, potential CSRF attack");
  }

  try {
    // Step 3: Exchange code for tokens
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { id_token, access_token , refresh_token} = tokenRes.data;
    // Step 4: Verify id_token
    const client = jwksClient({
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    });

    const getKey = (header, callback) => {
      client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      });
    };

    jwt.verify(id_token, getKey, { audience: process.env.GOOGLE_CLIENT_ID }, async (err, decoded) => {
      if (err) {
        console.error("JWT verify failed:", err.message);
        return res.status(401).send("Invalid ID Token");
      }

      // check if user is exist in traditional login or linked
      let user = await User.findOne({ email: decoded.email })  
      if (user && user.providers == "google") {
        // invalid all access token of this user
        user.accessTokenVersion+=1;

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        // Record successful login
        user.addLoginAttempt(true, req.ip, req.headers['user-agent'] , "google");
        await user.save({ validateBeforeSave: false });
        // Set refresh token as an HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
        
        return res.status(200).json({
          success: true,
          accessToken
        });
      }

      if (user && user.providers == "local")
        return res.status(400).json({
          success: false,
          msg : "Please login with your Email and Password "
        });

      // New user signing up with Google
      const {privateKey , address} =  await generateEthAddress();
      user = await User.create({
        firstName: decoded.given_name,
        lastName:decoded.family_name,
        email: decoded.email,
        picture: decoded.picture,
        googleID: decoded.sub,
        isEmailVerified:decoded.email_verified,
        privateKey,
        wallet_address: address,
        providers: 'google'
      });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    // Record successful login
    user.addLoginAttempt(true, req.ip, req.headers['user-agent'] , "google");
    await user.save();
    // Set refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(200).json({
      success: true,
      accessToken
    });

  });
  } catch (err) {
    console.error("Error exchanging code", err.response?.data || err.message);
    res.status(500).send("Authentication failed");
  }
}
// Logout
exports.logout = async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);
    
    if (user) {
      // Clear refresh token
      user.refreshToken = undefined;
      // Increment token version to invalidate current tokens
      user.accessTokenVersion += 1;
      // Add logout to logs
      user.logs.push({
        action: 'logout',
        time: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      await user.save({ validateBeforeSave: false });
    }
    
    // Clear cookie
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    // Try to get token from cookie
    let refreshToken = req.cookies?.refreshToken;

    // If not in cookies, try from Authorization header
    if (!refreshToken) {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        refreshToken = authHeader.split(' ')[1];
      }
    }

    // Handle missing token
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Please log in',
      });
    }
        
    // Hash the token to compare with stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    // Find user with this refresh token
    const user = await User.findOne({
      'refreshToken.token': hashedToken,
      'refreshToken.expiresAt': { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    //validate old accessToken
    user.accessTokenVersion = (user.accessTokenVersion + 1 ) %1000000;
    await user.save();

    // Generate new accessToken
    const accessToken = user.generateAccessToken();
    
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Setup 2FA
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `MediShield:${user.email}`
    });
    
    // Store secret in user's record
    user.googleAuthKey = secret.base32;
    user.logs.push({
      action: 'two_factor_setup',
      time: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await user.save({ validateBeforeSave: false });
    
    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication setup started',
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify and enable 2FA
exports.enable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id , "googleAuthKey twoFactorEnabled");
    if(user.twoFactorEnabled)
      return res.status(200).json({message : "Two factor authentication is already enabled"})
    const { token } = req.body;

    if (!user || !user.googleAuthKey) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication not set up'
      });
    }

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
    
    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify and disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id , "twoFactorEnabled googleAuthKey");
    const { token } = req.body;

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already disabled'
      });
    }
    
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
    
    // disable 2FA
    user.googleAuthKey = undefined;
    user.twoFactorEnabled = false;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid email'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }
    if (user && user.providers == "google") {
      return res.status(404).json({
        success: false,
        message: 'Please login with google'
      });
    }
    
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    // Send email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      message: `You requested a password reset. Please use the following link to reset your password: ${resetURL}. This link will expire in 10 minutes.`
    });
    
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    // Revert token in case of error
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      user.resetPasswordToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error sending email. Try again later.'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Get token and hash it
    const resetToken = req.params.token;
    const password = req.body.password
    if(!password || !resetToken){
      return res.status(400).json({
        success: false,
        message: 'please provide new password in body'
      });
    }
    
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Find user with this token and check if expired
    const user = await User.findOne({
      'resetPasswordToken.token': hashedToken,
      'resetPasswordToken.expiresAt': { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
    
    // Update password and remove reset token
    user.password = password;

    // Log the password change
    user.logs.push({
      action: 'password_change',
      time: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await user.save();
    user.resetPasswordToken = undefined;
    user.accessTokenVersion += 1; // Invalidate existing tokens
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    
    // Get token and hash it
    const verificationToken = req.params.token;
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    // Find user with this token
    const user = await User.findOne({
      'emailVerificationToken.token': hashedToken,
      'emailVerificationToken.expiresAt': { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
    
    // Mark email as verified and remove token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Require user to provide email in request body if not already authenticated
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email"
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Your email is already verified"
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();

    // Save token (but skip validation)
    await user.save({ validateBeforeSave: false });

    // Construct verification link
    const verificationURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    // Send email
    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message: `Please verify your email by clicking the following link: ${verificationURL}`
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('firstName lastName email  location tradeName  wallet_address _id picture');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
