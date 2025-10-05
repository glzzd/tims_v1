const express = require('express');
const InstitutionController = require('../controllers/institution.controller');
const { 
  createInstitutionValidation, 
  updateInstitutionValidation 
} = require('../validations/institution.validation');
const { handleValidationErrors } = require('../middlewares/validation');
const auth = require('../middlewares/auth');
const router = express.Router();

// Get institution types (public route)
router.get('/types', InstitutionController.getInstitutionTypes);

// Protected routes - require authentication
router.use(auth);

// Get all institutions
router.get('/', InstitutionController.getAllInstitutions);

// Get my institutions (where user is responsible person)
router.get('/my', InstitutionController.getMyInstitutions);

// Get institution by ID
router.get('/:id', InstitutionController.getInstitutionById);

// Create new institution
router.post('/', 
  createInstitutionValidation, 
  handleValidationErrors, 
  InstitutionController.createInstitution
);

// Update institution
router.put('/:id', 
  updateInstitutionValidation, 
  handleValidationErrors, 
  InstitutionController.updateInstitution
);

// Delete institution
router.delete('/:id', InstitutionController.deleteInstitution);

// Update message limit
router.patch('/:id/message-limit', InstitutionController.updateMessageLimit);

module.exports = router;