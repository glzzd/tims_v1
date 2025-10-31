const { body, param, query, header, oneOf } = require('express-validator');

const sendExternalMessageValidation = [
  // Allow apiKey in header (preferred) or body
  oneOf([
    header('x-api-key')
      .notEmpty()
      .withMessage('API açarı tələb olunur (header x-api-key)')
      .isLength({ min: 32 })
      .withMessage('API açarı formatı düzgün olmalıdır'),
    header('api-key')
      .notEmpty()
      .withMessage('API açarı tələb olunur (header api-key)')
      .isLength({ min: 32 })
      .withMessage('API açarı formatı düzgün olmalıdır'),
    body('apiKey')
      .notEmpty()
      .withMessage('API açarı tələb olunur (body apiKey)')
      .isLength({ min: 32 })
      .withMessage('API açarı formatı düzgün olmalıdır')
      .trim()
  ]),
  body('content')
    .notEmpty()
    .withMessage('Mesaj məzmunu tələb olunur')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mesaj məzmunu 1-5000 simvol arasında olmalıdır')
    .trim(),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'image'])
    .withMessage('Mesaj tipi düzgün seçilməlidir'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Cavab verilən mesaj ID-si düzgün olmalıdır')
];

module.exports = {
  sendExternalMessageValidation,
  // Kurumun tüm gruplarına veya belirli bir gruba API key ile mesaj gönderme
  sendExternalInstitutionMessageValidation: [
    oneOf([
      header('x-api-key')
        .notEmpty()
        .withMessage('API açarı tələb olunur (header x-api-key)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır'),
      header('api-key')
        .notEmpty()
        .withMessage('API açarı tələb olunur (header api-key)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır'),
      body('apiKey')
        .notEmpty()
        .withMessage('API açarı tələb olunur (body apiKey)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır')
        .trim()
    ]),
    body('institutionId')
      .notEmpty()
      .withMessage('Qurum ID-si tələb olunur')
      .isMongoId()
      .withMessage('Düzgün qurum ID-si daxil edin'),
    body('content')
      .notEmpty()
      .withMessage('Mesaj məzmunu tələb olunur')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Mesaj məzmunu 1-5000 simvol arasında olmalıdır')
      .trim(),
    body('target')
      .optional()
      .isIn(['all', 'group'])
      .withMessage('Target yalnız "all" və ya "group" ola bilər'),
    body('groupId')
      .optional()
      .isMongoId()
      .withMessage('Düzgün qrup ID-si daxil edin')
      .custom((value, { req }) => {
        if ((req.body.target || 'all') === 'group' && !value) {
          throw new Error('Target group üçün groupId tələb olunur');
        }
        return true;
      })
  ],
  // Kuruma ait tüm API key’leri listeleme (dış sistem doğrulaması için apiKey gerektirir)
  getInstitutionApiKeysValidation: [
    param('institutionId')
      .isMongoId()
      .withMessage('Düzgün qurum ID-si daxil edin'),
    oneOf([
      header('x-api-key')
        .notEmpty()
        .withMessage('API açarı tələb olunur (header x-api-key)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır'),
      header('api-key')
        .notEmpty()
        .withMessage('API açarı tələb olunur (header api-key)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır'),
      query('apiKey')
        .notEmpty()
        .withMessage('API açarı tələb olunur (query apiKey)')
        .isLength({ min: 32 })
        .withMessage('API açarı formatı düzgün olmalıdır')
        .trim()
    ])
  ]
};