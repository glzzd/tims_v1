const { body, param, query } = require('express-validator');

// İşçi yaratma validation
const createEmployeeValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('Ad sahəsi tələb olunur')
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 simvol arasında olmalıdır')
    .trim(),

  body('lastName')
    .notEmpty()
    .withMessage('Soyad sahəsi tələb olunur')
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 simvol arasında olmalıdır')
    .trim(),

  body('timsUsername')
    .notEmpty()
    .withMessage('TİMS istifadəçi adı sahəsi tələb olunur')
    .isLength({ min: 2, max: 50 })
    .withMessage('TİMS istifadəçi adı 2-50 simvol arasında olmalıdır')
    .trim(),

  body('email')
    .notEmpty()
    .withMessage('Email sahəsi tələb olunur')
    .isEmail()
    .withMessage('Düzgün email formatı daxil edin')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Düzgün telefon nömrəsi formatı daxil edin')
    .trim(),

  body('institution')
    .notEmpty()
    .withMessage('Qurum sahəsi tələb olunur')
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),

  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Vəzifə 100 simvoldan çox ola bilməz')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiv statusu boolean dəyər olmalıdır')
    .toBoolean()
];

// İşçi güncelleme validation
const updateEmployeeValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 simvol arasında olmalıdır')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 simvol arasında olmalıdır')
    .trim(),

  body('timsUsername')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('TİMS istifadəçi adı 2-50 simvol arasında olmalıdır')
    .trim(),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Düzgün email formatı daxil edin')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Düzgün telefon nömrəsi formatı daxil edin')
    .trim(),

  body('institution')
    .optional()
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),

  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Vəzifə 100 simvoldan çox ola bilməz')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiv statusu boolean dəyər olmalıdır')
    .toBoolean()
];

// İşçi ID validation
const employeeIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin')
];

// İşçi arama validation
const searchEmployeeValidation = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Axtarış termini 1-100 simvol arasında olmalıdır')
    .trim(),

  query('institution')
    .optional()
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Səhifə nömrəsi müsbət rəqəm olmalıdır')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır')
    .toInt()
];

module.exports = {
  createEmployeeValidation,
  updateEmployeeValidation,
  employeeIdValidation,
  searchEmployeeValidation
};