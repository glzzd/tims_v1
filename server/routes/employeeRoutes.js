const express = require('express');
const router = express.Router();
const EmployeeController = require('../controllers/employee.controller');
const { validate } = require('../middlewares/validation');
const auth = require('../middlewares/auth');
const {
  createEmployeeValidation,
  updateEmployeeValidation,
  employeeIdValidation,
  searchEmployeeValidation
} = require('../validations/employee.validation');

// Bütün route'lar authentication tələb edir
router.use(auth);

// İşçi əməliyyatları
router.get('/search', searchEmployeeValidation, validate, EmployeeController.searchEmployees);
router.get('/institution/:institutionId', EmployeeController.getEmployeesByInstitution);
router.get('/', EmployeeController.getAllEmployees);
router.post('/', createEmployeeValidation, validate, EmployeeController.createEmployee);
router.get('/:id', employeeIdValidation, validate, EmployeeController.getEmployeeById);
router.put('/:id', employeeIdValidation, updateEmployeeValidation, validate, EmployeeController.updateEmployee);
router.delete('/:id', employeeIdValidation, validate, EmployeeController.deleteEmployee);
router.put('/:id/activate', employeeIdValidation, validate, EmployeeController.activateEmployee);
router.put('/:id/deactivate', employeeIdValidation, validate, EmployeeController.deactivateEmployee);

module.exports = router;