const authService = require("../services/auth.service");
const messages = require("../validations/messages");

const login = async (req, res, next) => {
  try {
    const { token } = await authService.login(req.body);
    res.status(200).json({ message: messages.LOGIN_SUCCESS, success: true, token });
  } catch (error) {
    next(error);
  }
};

// Return current authenticated user profile
const profile = async (req, res) => {
  try {
    // req.user is set by auth middleware and already sanitized (no password)
    if (!req.user) {
      return res.status(401).json({ success: false, message: messages.TOKEN_INVALID });
    }
    // Normalize shape
    const { _id, userId, name, email, permissions, isActive, institution } = req.user;
    res.status(200).json({
      success: true,
      data: {
        id: String(userId || _id),
        name: name || null,
        email,
        permissions: permissions || {},
        institution: institution || null,
        isActive: isActive !== false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profil alınamadı' });
  }
};

// Logout endpoint - stateless JWT, so just acknowledge
const logout = async (req, res) => {
  try {
    // If using refresh tokens or server-side sessions, revoke here.
    res.status(200).json({ success: true, message: 'Çıkış başarılı' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Çıkış başarısız' });
  }
};

// Verify endpoint - checks auth middleware successfully validated token
const verify = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: messages.TOKEN_INVALID });
    }
    res.status(200).json({ success: true, message: 'Token geçerli' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Doğrulama başarısız' });
  }
};

module.exports = {
  login,
  profile,
  logout,
  verify
};