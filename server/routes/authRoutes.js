const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { loginValidation } = require("../validations/auth.validation");
const { handleValidationErrors } = require("../middlewares/validation");
const auth = require('../middlewares/auth');
const router = express.Router();

router.post("/login", loginValidation, handleValidationErrors, AuthController.login);

// Authenticated profile
router.get('/profile', auth, AuthController.profile);

// Verify token
router.get('/verify', auth, AuthController.verify);

// Logout (optionally protected)
router.post('/logout', auth, AuthController.logout);

module.exports = router;