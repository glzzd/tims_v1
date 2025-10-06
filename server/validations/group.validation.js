const { body, param, query } = require('express-validator');

// Qrup yaratma validation
const createGroupValidation = [
  body('name')
    .notEmpty()
    .withMessage('Qrup adı tələb olunur')
    .isLength({ min: 2, max: 100 })
    .withMessage('Qrup adı 2-100 simvol arasında olmalıdır')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Təsvir 500 simvoldan çox ola bilməz')
    .trim(),
  
  body('institution')
    .notEmpty()
    .withMessage('Qurum sahəsi tələb olunur')
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('Üzvlər massiv formatında olmalıdır')
    .custom((members) => {
      if (members && members.length > 0) {
        const invalidIds = members.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
        if (invalidIds.length > 0) {
          throw new Error('Bütün üzv ID-ləri düzgün MongoDB ObjectId formatında olmalıdır');
        }
      }
      return true;
    }),
  
  body('admins')
    .optional()
    .isArray()
    .withMessage('Adminlər massiv formatında olmalıdır')
    .custom((admins) => {
      if (admins && admins.length > 0) {
        const invalidIds = admins.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
        if (invalidIds.length > 0) {
          throw new Error('Bütün admin ID-ləri düzgün MongoDB ObjectId formatında olmalıdır');
        }
      }
      return true;
    }),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maksimum üzv sayı 1-1000 arasında olmalıdır')
    .toInt()
];

// Qrup yeniləmə validation
const updateGroupValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Qrup adı 2-100 simvol arasında olmalıdır')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Təsvir 500 simvoldan çox ola bilməz')
    .trim(),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maksimum üzv sayı 1-1000 arasında olmalıdır')
    .toInt(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Aktiv statusu boolean dəyər olmalıdır')
    .toBoolean()
];

// Qrup ID validation
const groupIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Düzgün qrup ID-si daxil edin')
];

// Üzv əlavə etmə validation
const addMemberValidation = [
  ...groupIdValidation,
  body('employeeId')
    .notEmpty()
    .withMessage('İşçi ID-si tələb olunur')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin')
];

// Üzv silmə validation
const removeMemberValidation = [
  ...groupIdValidation,
  body('employeeId')
    .notEmpty()
    .withMessage('İşçi ID-si tələb olunur')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin')
];

// Admin əlavə etmə validation
const addAdminValidation = [
  ...groupIdValidation,
  body('employeeId')
    .notEmpty()
    .withMessage('İşçi ID-si tələb olunur')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin')
];

// Admin silmə validation
const removeAdminValidation = [
  ...groupIdValidation,
  body('employeeId')
    .notEmpty()
    .withMessage('İşçi ID-si tələb olunur')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin')
];

// Qrup axtarışı validation
const searchGroupValidation = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Axtarış termini 1-100 simvol arasında olmalıdır')
    .trim(),
  
  query('institution')
    .optional()
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Səhifə nömrəsi müsbət rəqəm olmalıdır')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır')
    .toInt()
];

// Mesaj göndərmə validation
const sendMessageValidation = [
  ...groupIdValidation,
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

// Kuruma toplu mesaj validation
const sendInstitutionMessageValidation = [
  param('institutionId')
    .isMongoId()
    .withMessage('Düzgün qurum ID-si daxil edin'),
  body('content')
    .notEmpty()
    .withMessage('Mesaj məzmunu tələb olunur')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mesaj məzmunu 1-5000 simvol arasında olmalıdır')
    .trim()
];

// Bir işçiyə Birbaşa mesaj validation
const sendDirectMessageValidation = [
  body('employeeId')
    .notEmpty()
    .withMessage('İşçi ID-si tələb olunur')
    .isMongoId()
    .withMessage('Düzgün işçi ID-si daxil edin'),
  body('content')
    .notEmpty()
    .withMessage('Mesaj məzmunu tələb olunur')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mesaj məzmunu 1-5000 simvol arasında olmalıdır')
    .trim()
];

// Mesaj yeniləmə validation
const updateMessageValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Düzgün mesaj ID-si daxil edin'),
  body('content')
    .notEmpty()
    .withMessage('Mesaj məzmunu tələb olunur')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mesaj məzmunu 1-5000 simvol arasında olmalıdır')
    .trim()
];

// Mesaj oxuma validation
const markMessageReadValidation = [
  param('messageId')
    .isMongoId()
    .withMessage('Düzgün mesaj ID-si daxil edin')
];

// Mesaj axtarışı validation
const searchMessageValidation = [
  ...groupIdValidation,
  query('search')
    .notEmpty()
    .withMessage('Axtarış termini tələb olunur')
    .isLength({ min: 1, max: 100 })
    .withMessage('Axtarış termini 1-100 simvol arasında olmalıdır')
    .trim(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Səhifə nömrəsi müsbət rəqəm olmalıdır')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit 1-50 arasında olmalıdır')
    .toInt()
];

module.exports = {
  createGroupValidation,
  updateGroupValidation,
  groupIdValidation,
  addMemberValidation,
  removeMemberValidation,
  addAdminValidation,
  removeAdminValidation,
  searchGroupValidation,
  sendMessageValidation,
  markMessageReadValidation,
  searchMessageValidation,
  sendInstitutionMessageValidation,
  sendDirectMessageValidation,
  updateMessageValidation
};