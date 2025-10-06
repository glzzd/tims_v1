const GroupService = require('../services/group.service');
const { getLogs: getMessageLogsService } = require('../services/messageLog.service');
const messages = require('../validations/messages');

// Qrup yaratma
const createGroup = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      // If only institution-level writer, enforce same institution
      if (!isSuper && !canWriteAll && canWriteInst) {
        if (!requester.institution || String(requester.institution) !== String(req.body.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const group = await GroupService.createGroup(req.body, requester.userId);
      res.status(201).json({
        success: true,
        message: messages.GROUP_CREATED,
        data: group
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

// Mesaj tranzaksiyonlarını getir (permission-based)
const getMessageLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type = null, action = null } = req.query;
    const isSuper = req.user?.permissions?.isSuperAdmin === true;
    const actorFilter = isSuper ? null : (req.user?.userId || req.user?._id);
    const result = await getMessageLogsService({
      actorUserId: actorFilter,
      type: type || null,
      action: action || null,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Bütün qrupları getir
const getAllGroups = async (req, res) => {
    try {
      const requester = req.user;
      const { page = 1, limit = 10, institution } = req.query;

      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canReadAll = requester?.permissions?.canReadAllGroups === true;
      const canReadInst = requester?.permissions?.canReadInstitutionGroups === true;

      if (!isSuper && !canReadAll && !canReadInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      // If only institution-level reader, restrict institution to requester’s institution
      const effectiveInstitution = (!isSuper && !canReadAll && canReadInst)
        ? (requester.institution || null)
        : (institution || null);

      const result = await GroupService.getAllGroups(
        parseInt(page),
        parseInt(limit),
        effectiveInstitution,
        requester
      );
      
      res.status(200).json({
        success: true,
        data: result.groups,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// ID ilə qrup getir
const getGroupById = async (req, res) => {
    try {
      const group = await GroupService.getGroupById(req.params.id);
      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Qrup yenilə
const updateGroup = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const group = await GroupService.updateGroup(
        req.params.id,
        req.body,
        requester.userId
      );
      
      res.status(200).json({
        success: true,
        message: messages.GROUP_UPDATED,
        data: group
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Qrup sil
const deleteGroup = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const result = await GroupService.deleteGroup(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Üzv əlavə et
const addMember = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const result = await GroupService.addMember(
        req.params.id,
        req.body.employeeId
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Üzv sil
const removeMember = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const result = await GroupService.removeMember(
        req.params.id,
        req.body.employeeId
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Admin əlavə et
const addAdmin = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const result = await GroupService.addAdmin(
        req.params.id,
        req.body.employeeId
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Admin sil
const removeAdmin = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canWriteAll = requester?.permissions?.canWriteAllGroups === true;
      const canWriteInst = requester?.permissions?.canWriteInstitutionGroups === true;

      if (!isSuper && !canWriteAll && !canWriteInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      if (!isSuper && !canWriteAll && canWriteInst) {
        const current = await GroupService.getGroupById(req.params.id);
        if (!requester.institution || String(requester.institution) !== String(current?.institution?._id || current?.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const result = await GroupService.removeAdmin(
        req.params.id,
        req.body.employeeId
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// İşçinin qruplarını getir
const getEmployeeGroups = async (req, res) => {
    try {
      const groups = await GroupService.getEmployeeGroups(req.params.employeeId);
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// Kuruma görə qrupları getir
const getGroupsByInstitution = async (req, res) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canReadAll = requester?.permissions?.canReadAllGroups === true;
      const canReadInst = requester?.permissions?.canReadInstitutionGroups === true;

      if (!isSuper && !canReadAll && !canReadInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      // If only institution-level reader, enforce same institution
      if (!isSuper && !canReadAll && canReadInst) {
        if (!requester.institution || String(requester.institution) !== String(req.params.institutionId || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
      }

      const groups = await GroupService.getGroupsByInstitution(req.params.institutionId);
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// Kuruma görə göndərilən mesajların sayını getir
const getInstitutionMessageCount = async (req, res) => {
    try {
      const count = await GroupService.getMessageCountByInstitution(req.params.institutionId);
      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// Qrup axtarışı
const searchGroups = async (req, res) => {
    try {
      const requester = req.user;
      const { search, institution, page = 1, limit = 10 } = req.query;

      const isSuper = requester?.permissions?.isSuperAdmin === true;
      const canReadAll = requester?.permissions?.canReadAllGroups === true;
      const canReadInst = requester?.permissions?.canReadInstitutionGroups === true;

      if (!isSuper && !canReadAll && !canReadInst) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      const effectiveInstitution = (!isSuper && !canReadAll && canReadInst)
        ? (requester.institution || null)
        : (institution || null);
      const result = await GroupService.searchGroups(
        search,
        effectiveInstitution,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.groups,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

// Mesaj göndər
const sendMessage = async (req, res) => {
    try {
  const message = await GroupService.sendMessage(
    req.params.id,
    req.user,
    req.body
  );
      
      res.status(201).json({
        success: true,
        message: messages.MESSAGE_SENT,
        data: message
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Kurumdaki tüm qruplara mesaj
const sendInstitutionMessage = async (req, res) => {
  try {
    const result = await GroupService.sendInstitutionMessage(
      req.params.institutionId,
      req.user,
      req.body.content
    );
    res.status(201).json({ success: true, message: messages.MESSAGE_SENT, data: result });
  } catch (error) {
    const statusCode = error.message === messages.INSTITUTION_NOT_FOUND ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// Bir işçiyə Birbaşa mesaj
const sendDirectMessage = async (req, res) => {
  try {
    const result = await GroupService.sendDirectMessage(
      req.body.employeeId,
      req.user,
      req.body.content
    );
    res.status(201).json({ success: true, message: messages.MESSAGE_SENT, data: result });
  } catch (error) {
    const statusCode = error.message === messages.EMPLOYEE_NOT_FOUND ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// Qrup mesajlarını getir
const getGroupMessages = async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await GroupService.getGroupMessages(
        req.params.id,
        req.user,
        parseInt(page),
        parseInt(limit)
      );
      
      res.status(200).json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Mesajı oxunmuş olaraq işarələ
const markMessageAsRead = async (req, res) => {
    // İstək üzrə: Mesajı oxunmuş kimi işarələmə funksiyası deaktiv edildi
    return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
  };

// Qrupda mesaj axtarışı
const searchMessagesInGroup = async (req, res) => {
    try {
      const { search } = req.query;
      const messages = await GroupService.searchMessagesInGroup(
        req.params.id,
        req.user,
        search
      );
      
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      const statusCode = error.message === messages.GROUP_NOT_FOUND ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Oxunmamış mesaj sayını getir — deaktiv edildi
const getUnreadMessageCount = async (req, res) => {
    return res.status(200).json({ success: true, data: { unreadCount: 0 } });
  };

// Cari istifadəçinin qruplarını getir
const getMyGroups = async (req, res) => {
    try {
      const groups = await GroupService.getEmployeeGroups(req.user.userId);
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

// Birbaşa mesaj geçmişi getir (actor'a göre)
const getDirectMessages = async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await GroupService.getDirectMessages(
        req.params.employeeId,
        req.user.userId,
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json({
        success: true,
        data: result.messages,
        pagination: result.pagination
      });
    } catch (error) {
      const statusCode =
        error.message === messages.EMPLOYEE_NOT_FOUND || error.message === messages.INSTITUTION_INACTIVE
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

// Mesajı yenilə
const updateMessage = async (req, res) => {
  try {
    const updated = await GroupService.updateMessage(
      req.params.messageId,
      req.user,
      req.body.content
    );
    res.status(200).json({ success: true, message: messages.MESSAGE_UPDATED, data: updated });
  } catch (error) {
    const notFound = error.message === messages.MESSAGE_NOT_FOUND;
    const accessDenied = error.message === messages.GROUP_ACCESS_DENIED || error.message === messages.MESSAGE_ACCESS_DENIED;
    const statusCode = notFound ? 404 : accessDenied ? 403 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  addAdmin,
  removeAdmin,
  getEmployeeGroups,
  getGroupsByInstitution,
  getInstitutionMessageCount,
  searchGroups,
  sendMessage,
  getGroupMessages,
  markMessageAsRead,
  searchMessagesInGroup,
  getUnreadMessageCount,
  getMyGroups,
  sendInstitutionMessage,
  sendDirectMessage,
  getDirectMessages,
  updateMessage,
  getMessageLogs
};