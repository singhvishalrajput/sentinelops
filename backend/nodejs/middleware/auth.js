const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - No token provided'
    });
  }

  try {
    console.log('🔐 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', { userId: decoded.id });
    
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found - Please login again'
      });
    }
    
    console.log('✅ User authenticated:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message,
      hint: 'Try logging in again'
    });
  }
};
