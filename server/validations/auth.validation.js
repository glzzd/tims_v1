const { body } = require('express-validator');

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Düzgün e-poçt ünvanı daxil edin')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifrə ən azı 6 simvoldan ibarət olmalıdır')
];

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad ən azı 2, ən çox 50 simvoldan ibarət olmalıdır'),
  body('email')
    .isEmail()
    .withMessage('Düzgün e-poçt ünvanı daxil edin')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifrə ən azı 6 simvoldan ibarət olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifrə ən azı bir kiçik hərf, bir böyük hərf və bir rəqəm ehtiva etməlidir')
];

module.exports = {
  loginValidation,
  registerValidation
};