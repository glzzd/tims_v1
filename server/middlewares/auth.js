const jwt = require('jsonwebtoken');
const User = require('../models/User');
const messages = require('../validations/messages');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: messages.TOKEN_REQUIRED 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: messages.TOKEN_INVALID 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: messages.USER_INACTIVE 
      });
    }

    req.user = { ...user.toObject(), userId: user._id };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false,
      message: messages.TOKEN_INVALID 
    });
  }
};

module.exports = auth;