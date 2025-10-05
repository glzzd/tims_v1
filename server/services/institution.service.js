const Institution = require('../models/Institution');
const User = require('../models/User');
const messages = require('../validations/messages');

const createInstitution = async (institutionData, createdBy) => {
  // Check if institution with same short name exists
  const existingInstitution = await Institution.findOne({ shortName: institutionData.shortName });
  if (existingInstitution) {
    throw new Error(messages.INSTITUTION_ALREADY_EXISTS);
  }

  // If responsible person is provided, check if user exists
  if (institutionData.responsiblePerson) {
    const responsibleUser = await User.findById(institutionData.responsiblePerson);
    if (!responsibleUser) {
      throw new Error(messages.RESPONSIBLE_PERSON_NOT_FOUND);
    }
  }

  const institution = new Institution({
    ...institutionData,
    createdBy
  });

  await institution.save();
  return institution;
};

const getAllInstitutions = async (filters = {}) => {
  const query = {};
  
  if (filters.type) query.type = filters.type;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.search) {
    query.$or = [
      { longName: { $regex: filters.search, $options: 'i' } },
      { shortName: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const institutions = await Institution.find(query)
    .populate('responsiblePerson', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  return institutions;
};

const getInstitutionById = async (id) => {
  const institution = await Institution.findById(id)
    .populate('responsiblePerson', 'name email')
    .populate('createdBy', 'name email');
    
  if (!institution) {
    throw new Error(messages.INSTITUTION_NOT_FOUND);
  }

  return institution;
};

const updateInstitution = async (id, updateData) => {
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new Error(messages.INSTITUTION_NOT_FOUND);
  }

  // Check if shortName is being updated and if it already exists
  if (updateData.shortName && updateData.shortName !== institution.shortName) {
    const existingInstitution = await Institution.findOne({ 
      shortName: updateData.shortName,
      _id: { $ne: id }
    });
    if (existingInstitution) {
      throw new Error(messages.INSTITUTION_ALREADY_EXISTS);
    }
  }

  // If responsible person is being updated, check if user exists
  if (updateData.responsiblePerson) {
    const responsibleUser = await User.findById(updateData.responsiblePerson);
    if (!responsibleUser) {
      throw new Error(messages.RESPONSIBLE_PERSON_NOT_FOUND);
    }
  }

  Object.assign(institution, updateData);
  await institution.save();

  return institution;
};

const deleteInstitution = async (id) => {
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new Error(messages.INSTITUTION_NOT_FOUND);
  }

  await Institution.findByIdAndDelete(id);
  return { message: messages.INSTITUTION_DELETED };
};

const updateMessageLimit = async (id, amount, operation = 'decrease') => {
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new Error(messages.INSTITUTION_NOT_FOUND);
  }

  if (operation === 'decrease') {
    if (institution.messageLimit < amount) {
      throw new Error(messages.INSUFFICIENT_MESSAGE_LIMIT);
    }
    institution.messageLimit -= amount;
  } else if (operation === 'increase') {
    institution.messageLimit += amount;
  }

  await institution.save();
  return institution;
};

const getInstitutionsByResponsiblePerson = async (userId) => {
  const institutions = await Institution.find({ 
    responsiblePerson: userId,
    isActive: true 
  }).populate('createdBy', 'name email');
  
  return institutions;
};

module.exports = {
  createInstitution,
  getAllInstitutions,
  getInstitutionById,
  updateInstitution,
  deleteInstitution,
  updateMessageLimit,
  getInstitutionsByResponsiblePerson
};