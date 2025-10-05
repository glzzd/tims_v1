const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { createUserValidation, updatePermissionsValidation, updateUserValidation, userIdValidation, searchUsersValidation } = require('../validations/user.validation');
const { handleValidationErrors } = require('../middlewares/validation');
const auth = require('../middlewares/auth');

// Protected routes - require authentication
router.use(auth);

// Get users (permission-based)
router.get('/', searchUsersValidation, handleValidationErrors, UserController.getAllUsers);

// Create user (superadmin can create admin/user; admin can create user if permitted)
router.post('/', createUserValidation, handleValidationErrors, UserController.createUser);

// Update user permissions (permission-based)
router.patch('/:id/permissions', updatePermissionsValidation, handleValidationErrors, UserController.updatePermissions);

// Update user basic info
router.put('/:id', updateUserValidation, handleValidationErrors, UserController.updateUser);

// Delete user
router.delete('/:id', userIdValidation, handleValidationErrors, UserController.deleteUser);

// Get user logs (superadmin only)
router.get('/:id/logs', userIdValidation, handleValidationErrors, UserController.getUserLogs);

// Get activity performed by the user (superadmin only)
router.get('/:id/activity', userIdValidation, handleValidationErrors, UserController.getUserActivity);

module.exports = router;