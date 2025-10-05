const { body } = require('express-validator');

const createInstitutionValidation = [
  body('longName')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Qurumun uzun adı ən azı 3, ən çox 200 simvoldan ibarət olmalıdır'),
  body('shortName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Qurumun qısa adı ən azı 2, ən çox 50 simvoldan ibarət olmalıdır')
    .matches(/^[a-zA-ZəƏıİöÖüÜçÇğĞşŞ0-9\s-_]+$/)
    .withMessage('Qısa ad yalnız hərf, rəqəm, tire və alt xətt ehtiva edə bilər'),
  body('type')
    .isIn(['dövlət', 'özəl', 'beynəlxalq', 'qeyri-hökumət', 'təhsil', 'səhiyyə', 'maliyyə', 'digər'])
    .withMessage('Qurum tipi düzgün seçilməlidir'),
  body('messageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mesaj limiti 0 və ya müsbət rəqəm olmalıdır')
    .toInt(),
  body('responsiblePerson')
    .optional()
    .isMongoId()
    .withMessage('Sorumlu şəxs ID-si düzgün format olmalıdır'),
  body('timsUUID')
    .optional()
    .isString()
    .withMessage('TIMS UUID dəyəri düzgün olmalıdır')
    .trim(),
  body('corporationIds')
    .optional()
    .isArray()
    .withMessage('Corporation ID-lər massiv formatında olmalıdır'),
  body('timsAccessToken')
    .optional()
    .isString()
    .withMessage('TIMS accessToken dəyəri düzgün olmalıdır')
    .trim()
];

const updateInstitutionValidation = [
  body('longName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Qurumun uzun adı ən azı 3, ən çox 200 simvoldan ibarət olmalıdır'),
  body('shortName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Qurumun qısa adı ən azı 2, ən çox 50 simvoldan ibarət olmalıdır')
    .matches(/^[a-zA-ZəƏıİöÖüÜçÇğĞşŞ0-9\s-_]+$/)
    .withMessage('Qısa ad yalnız hərf, rəqəm, tire və alt xətt ehtiva edə bilər'),
  body('type')
    .optional()
    .isIn(['dövlət', 'özəl', 'beynəlxalq', 'qeyri-hökumət', 'təhsil', 'səhiyyə', 'maliyyə', 'digər'])
    .withMessage('Qurum tipi düzgün seçilməlidir'),
  body('messageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mesaj limiti 0 və ya müsbət rəqəm olmalıdır')
    .toInt(),
  body('responsiblePerson')
    .optional()
    .isMongoId()
    .withMessage('Sorumlu şəxs ID-si düzgün format olmalıdır'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiv statusu boolean dəyər olmalıdır'),
  body('timsUUID')
    .optional()
    .isString()
    .withMessage('TIMS UUID dəyəri düzgün olmalıdır')
    .trim(),
  body('corporationIds')
    .optional()
    .isArray()
    .withMessage('Corporation ID-lər massiv formatında olmalıdır'),
  body('timsAccessToken')
    .optional()
    .isString()
    .withMessage('TIMS accessToken dəyəri düzgün olmalıdır')
    .trim()
];

const institutionIdValidation = [
  body('institutionId')
    .isMongoId()
    .withMessage('Qurum ID-si düzgün format olmalıdır')
];

module.exports = {
  createInstitutionValidation,
  updateInstitutionValidation,
  institutionIdValidation
};