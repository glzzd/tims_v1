const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const messages = require("../validations/messages");

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error(messages.INVALID_CREDENTIALS);

  if (!user.isActive) throw new Error(messages.USER_INACTIVE);

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error(messages.INVALID_CREDENTIALS);

  // Generate JWT token
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  // Generate refresh token (optional - for future use)
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET + '_refresh',
    { expiresIn: '7d' }
  );

  return { token: accessToken, refreshToken };
};


module.exports = {
  login
};