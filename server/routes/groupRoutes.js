const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/group.controller');
const {
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
} = require('../validations/group.validation');
const { validate } = require('../middlewares/validation');
const auth = require('../middlewares/auth');

// Bütün route'lar authentication tələb edir
router.use(auth);

// Qrup əməliyyatları
router.get('/search', searchGroupValidation, validate, GroupController.searchGroups);
router.get('/my-groups', GroupController.getMyGroups);
router.get('/institution/:institutionId', GroupController.getGroupsByInstitution);
router.get('/institution/:institutionId/messages/count', GroupController.getInstitutionMessageCount);
router.get('/employee/:employeeId', GroupController.getEmployeeGroups);
router.get('/', GroupController.getAllGroups);
router.post('/', createGroupValidation, validate, GroupController.createGroup);
router.get('/:id', groupIdValidation, validate, GroupController.getGroupById);
router.put('/:id', groupIdValidation, updateGroupValidation, validate, GroupController.updateGroup);
router.delete('/:id', groupIdValidation, validate, GroupController.deleteGroup);

// Üzv idarəetməsi
router.post('/:id/members', addMemberValidation, validate, GroupController.addMember);
router.delete('/:id/members', removeMemberValidation, validate, GroupController.removeMember);

// Admin idarəetməsi
router.post('/:id/admins', addAdminValidation, validate, GroupController.addAdmin);
router.delete('/:id/admins', removeAdminValidation, validate, GroupController.removeAdmin);

// Mesaj əməliyyatları
router.post('/:id/messages', sendMessageValidation, validate, GroupController.sendMessage);
router.get('/:id/messages', groupIdValidation, validate, GroupController.getGroupMessages);
router.get('/:id/messages/search', searchMessageValidation, validate, GroupController.searchMessagesInGroup);
router.get('/:id/messages/unread-count', groupIdValidation, validate, GroupController.getUnreadMessageCount);
router.put('/messages/:messageId/read', markMessageReadValidation, validate, GroupController.markMessageAsRead);
router.put('/messages/:messageId', updateMessageValidation, validate, GroupController.updateMessage);

// Kuruma toplu mesaj və bir işçiyə Birbaşa mesaj
router.post('/institution/:institutionId/messages', sendInstitutionMessageValidation, validate, GroupController.sendInstitutionMessage);
router.post('/messages/direct', sendDirectMessageValidation, validate, GroupController.sendDirectMessage);
router.get('/messages/direct/:employeeId', validate, GroupController.getDirectMessages);
// Mesaj tranzaksiyonları (loglar)
router.get('/messages/logs', validate, GroupController.getMessageLogs);

module.exports = router;