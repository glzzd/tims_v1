const institutionService = require('../services/institution.service');
const messages = require('../validations/messages');

const createInstitution = async (req, res, next) => {
  try {
    
    const institution = await institutionService.createInstitution(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: messages.INSTITUTION_CREATED,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

const getAllInstitutions = async (req, res, next) => {
  try {
    const { type, isActive, search } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const institutions = await institutionService.getAllInstitutions(filters);
    res.status(200).json({
      success: true,
      data: institutions,
      count: institutions.length
    });
  } catch (error) {
    next(error);
  }
};

const getInstitutionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institution = await institutionService.getInstitutionById(id);
    res.status(200).json({
      success: true,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

const updateInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institution = await institutionService.updateInstitution(id, req.body);
    res.status(200).json({
      success: true,
      message: messages.INSTITUTION_UPDATED,
      data: institution
    });
  } catch (error) {
    next(error);
  }
};

const deleteInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await institutionService.deleteInstitution(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

const updateMessageLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body;
    
    const institution = await institutionService.updateMessageLimit(id, amount, operation);
    res.status(200).json({
      success: true,
      message: 'Mesaj limiti yeniləndi',
      data: {
        institutionId: institution._id,
        newMessageLimit: institution.messageLimit
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyInstitutions = async (req, res, next) => {
  try {
    const institutions = await institutionService.getInstitutionsByResponsiblePerson(req.user.userId);
    res.status(200).json({
      success: true,
      data: institutions,
      count: institutions.length
    });
  } catch (error) {
    next(error);
  }
};

const getInstitutionTypes = async (req, res, next) => {
  try {
    const types = ['dövlət', 'özəl', 'beynəlxalq', 'qeyri-hökumət', 'təhsil', 'səhiyyə', 'maliyyə', 'digər'];
    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInstitution,
  getAllInstitutions,
  getInstitutionById,
  updateInstitution,
  deleteInstitution,
  updateMessageLimit,
  getMyInstitutions,
  getInstitutionTypes
};