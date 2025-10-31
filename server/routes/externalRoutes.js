const express = require('express');
const router = express.Router();
const ExternalController = require('../controllers/external.controller');
const { 
  sendExternalMessageValidation,
  sendExternalInstitutionMessageValidation,
  getInstitutionApiKeysValidation
} = require('../validations/external.validation');
const { validate } = require('../middlewares/validation');

router.post('/messages', sendExternalMessageValidation, validate, ExternalController.sendMessageByApiKey);

// Kurumun tüm gruplarına veya belirli bir gruba API key ile mesaj gönderme
router.post(
  '/institution/messages',
  sendExternalInstitutionMessageValidation,
  validate,
  ExternalController.sendInstitutionMessagesByApiKey
);

// Kuruma ait tüm API key'leri listeleme (dış sistem için apiKey ile doğrulama)
router.get(
  '/institution/:institutionId/api-keys',
  getInstitutionApiKeysValidation,
  validate,
  ExternalController.getInstitutionApiKeysByApiKey
);

module.exports = router;