const { body, param, query } = require('express-validator');

const createUserValidation = [
  body('name')
    .notEmpty()
    .withMessage('Ad tələb olunur')
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad ən azı 2, ən çox 50 simvol'),
  body('email')
    .isEmail()
    .withMessage('Düzgün e-poçt ünvanı daxil edin')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifrə ən azı 6 simvol olmalıdır'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('İcazələr obyekt formatında olmalıdır')
  ,
  body('institutionId')
    .optional()
    .custom((val) => {
      if (val === null) return true;
      if (typeof val === 'string' && val.length === 24) return true;
      throw new Error('Düzgün qurum ID-si daxil edin');
    })
];

const updatePermissionsValidation = [
  param('id').isMongoId().withMessage('Düzgün istifadəçi ID-si daxil edin'),
  body('permissions')
    .notEmpty()
    .withMessage('İcazələr tələb olunur')
    .isObject()
    .withMessage('İcazələr obyekt formatında olmalıdır')
];

module.exports = {
  createUserValidation,
  updatePermissionsValidation,
  updateUserValidation: [
    param('id').isMongoId().withMessage('Düzgün istifadəçi ID-si daxil edin'),
    body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Ad ən azı 2, ən çox 50 simvol'),
    body('email').optional().isEmail().withMessage('Düzgün e-poçt ünvanı daxil edin').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Şifrə ən azı 6 simvol olmalıdır'),
    body('institutionId').optional().custom((val) => {
      if (val === null || val === '') return true;
      if (typeof val === 'string' && val.length === 24) return true;
      throw new Error('Düzgün qurum ID-si daxil edin');
    })
  ],
  userIdValidation: [
    param('id').isMongoId().withMessage('Düzgün istifadəçi ID-si daxil edin')
  ],
  searchUsersValidation: [
    query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Axtarış termini 1-100 simvol arasında olmalıdır').trim(),
    query('institution').optional().isMongoId().withMessage('Düzgün qurum ID-si daxil edin'),
    query('page').optional().isInt({ min: 1 }).withMessage('Səhifə nömrəsi müsbət rəqəm olmalıdır').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 arasında olmalıdır').toInt()
  ]
};