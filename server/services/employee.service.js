const Employee = require('../models/Employee');
const Institution = require('../models/Institution');
const messages = require('../validations/messages');
const User = require('../models/User');

class EmployeeService {
  async createEmployee(data, createdBy) {
    // Qurum kontrolü
    const institution = await Institution.findById(data.institution);
    if (!institution) throw new Error(messages.INSTITUTION_NOT_FOUND);
    if (!institution.isActive) throw new Error(messages.INSTITUTION_INACTIVE);

    // Admin ise yalnız öz qurumuna işçi əlavə edə bilər
    const creator = await User.findById(createdBy);
    if (creator && creator.permissions?.isSuperAdmin !== true) {
      const isResponsible = institution.responsiblePerson && String(institution.responsiblePerson) === String(creator._id);
      if (!isResponsible) throw new Error(messages.INSTITUTION_ACCESS_DENIED);
    }

    // Email tekillik kontrolü
    const exists = await Employee.findOne({ email: data.email });
    if (exists) throw new Error(messages.EMPLOYEE_ALREADY_EXISTS);

    const employee = new Employee({
      ...data,
      createdBy
    });
    await employee.save();
    return this.getEmployeeById(employee._id);
  }

  async getAllEmployees(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.institution) query.institution = filters.institution;
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;
    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { timsUsername: regex }
      ];
    }

    const employees = await Employee.find(query)
      .populate('institution', 'longName shortName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);
    return {
      employees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  async getEmployeeById(id) {
    const employee = await Employee.findById(id)
      .populate('institution', 'longName shortName')
      .populate('createdBy', 'name email');
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    return employee;
  }

  async updateEmployee(id, updateData) {
    if (updateData.email) {
      const conflict = await Employee.findOne({ email: updateData.email, _id: { $ne: id } });
      if (conflict) throw new Error(messages.EMPLOYEE_ALREADY_EXISTS);
    }
    if (updateData.institution) {
      const institution = await Institution.findById(updateData.institution);
      if (!institution) throw new Error(messages.INSTITUTION_NOT_FOUND);
      if (!institution.isActive) throw new Error(messages.INSTITUTION_INACTIVE);
    }

    const updated = await Employee.findByIdAndUpdate(id, updateData, { new: true })
      .populate('institution', 'longName shortName')
      .populate('createdBy', 'name email');
    if (!updated) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    return updated;
  }

  async deleteEmployee(id) {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    return { success: true };
  }

  async getEmployeesByInstitution(institutionId) {
    const institution = await Institution.findById(institutionId);
    if (!institution) throw new Error(messages.INSTITUTION_NOT_FOUND);
    return Employee.find({ institution: institutionId, isActive: true })
      .populate('institution', 'longName shortName')
      .sort({ firstName: 1, lastName: 1 });
  }

  async searchEmployees(searchTerm, institutionId = null, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const query = {
      isActive: true,
      $or: [
        { firstName: new RegExp(searchTerm, 'i') },
        { lastName: new RegExp(searchTerm, 'i') },
        { email: new RegExp(searchTerm, 'i') },
        { timsUsername: new RegExp(searchTerm, 'i') }
      ]
    };
    if (institutionId) query.institution = institutionId;

    const employees = await Employee.find(query)
      .populate('institution', 'longName shortName')
      .sort({ firstName: 1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);
    return {
      employees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  async activateEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    await employee.activate();
    return employee;
  }

  async deactivateEmployee(id) {
    const employee = await Employee.findById(id);
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    await employee.deactivate();
    return employee;
  }
}

module.exports = new EmployeeService();