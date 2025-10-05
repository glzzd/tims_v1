const EmployeeService = require('../services/employee.service');
const messages = require('../validations/messages');

const createEmployee = async (req, res, next) => {
  try {
    // Permission check: must have canAddEmployee; superadmin bypass via isSuperAdmin
    const requester = req.user;
    const isSuper = requester?.permissions?.isSuperAdmin === true;
    if (!isSuper && requester?.permissions?.canAddEmployee !== true) {
      return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
    }

    const employee = await EmployeeService.createEmployee(req.body, req.user.userId);
    res.status(201).json({ success: true, message: messages.EMPLOYEE_CREATED, data: employee });
  } catch (error) {
    next(error);
  }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, institution, isActive, search } = req.query;
    const filters = {};
    if (institution) filters.institution = institution;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const result = await EmployeeService.getAllEmployees(parseInt(page), parseInt(limit), filters);
    res.status(200).json({ success: true, data: result.employees, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
    res.status(200).json({ success: true, message: messages.EMPLOYEE_UPDATED, data: employee });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await EmployeeService.deleteEmployee(req.params.id);
    res.status(200).json({ success: true, message: messages.EMPLOYEE_DELETED });
  } catch (error) {
    next(error);
  }
};

const getEmployeesByInstitution = async (req, res, next) => {
  try {
    const employees = await EmployeeService.getEmployeesByInstitution(req.params.institutionId);
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

const searchEmployees = async (req, res, next) => {
  try {
    const { search, institution, page = 1, limit = 10 } = req.query;
    const result = await EmployeeService.searchEmployees(search, institution, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, data: result.employees, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

const activateEmployee = async (req, res, next) => {
  try {
    const employee = await EmployeeService.activateEmployee(req.params.id);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

const deactivateEmployee = async (req, res, next) => {
  try {
    const employee = await EmployeeService.deactivateEmployee(req.params.id);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByInstitution,
  searchEmployees,
  activateEmployee,
  deactivateEmployee
};