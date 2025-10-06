const Group = require('../models/Group');
const Employee = require('../models/Employee');
const Message = require('../models/Message');
const Institution = require('../models/Institution');
const messages = require('../validations/messages');
const MessagingService = require('./messaging.service');
const DirectMessage = require('../models/DirectMessage');
const { logMessageAction } = require('./messageLog.service');
const { addLog } = require('./userLog.service');

class GroupService {
  // Qrup yaratma
  async createGroup(groupData, createdBy) {
    try {
      // Qurum mövcudluğunu yoxla
      const institution = await Institution.findById(groupData.institution);
      if (!institution) {
        throw new Error(messages.INSTITUTION_NOT_FOUND);
      }

      if (!institution.isActive) {
        throw new Error(messages.INSTITUTION_INACTIVE);
      }

      // Eyni adda qrup mövcudluğunu yoxla
      const existingGroup = await Group.findOne({
        name: groupData.name,
        institution: groupData.institution
      });

      if (existingGroup) {
        throw new Error(messages.GROUP_ALREADY_EXISTS);
      }

      // Üzvləri yoxla
      if (groupData.members && groupData.members.length > 0) {
        const employees = await Employee.find({
          _id: { $in: groupData.members },
          institution: groupData.institution,
          isActive: true
        });

        if (employees.length !== groupData.members.length) {
          throw new Error('Bəzi işçilər tapılmadı və ya fərqli quruma aiddir');
        }
      }

      // Adminləri yoxla
      if (groupData.admins && groupData.admins.length > 0) {
        const adminEmployees = await Employee.find({
          _id: { $in: groupData.admins },
          institution: groupData.institution,
          isActive: true
        });

        if (adminEmployees.length !== groupData.admins.length) {
          throw new Error('Bəzi admin işçilər tapılmadı və ya fərqli quruma aiddir');
        }
      }

      const group = new Group({
        ...groupData,
        createdBy
      });

      await group.save();
      return await this.getGroupById(group._id);
    } catch (error) {
      throw error;
    }
  }

  // Bütün qrupları getir
  async getAllGroups(page = 1, limit = 10, institutionId = null, actorUser = null) {
    try {
      const skip = (page - 1) * limit;
      const query = { isActive: true };
      
      // Permission-aware scoping: if actorUser provided and does not have global read,
      // restrict to actor's institution regardless of provided institutionId
      if (actorUser) {
        const isSuper = actorUser?.permissions?.isSuperAdmin === true;
        const canReadAll = actorUser?.permissions?.canReadAllGroups === true;
        const canReadInst = actorUser?.permissions?.canReadInstitutionGroups === true;

        if (!isSuper && !canReadAll && canReadInst) {
          if (actorUser.institution) {
            query.institution = actorUser.institution;
          } else {
            // No institution -> no results for institution-scoped readers
            query.institution = null;
          }
        } else if (institutionId) {
          query.institution = institutionId;
        }
      } else if (institutionId) {
        query.institution = institutionId;
      }

      const groups = await Group.find(query)
        .populate('institution', 'longName shortName')
        .populate('members', 'firstName lastName email')
        .populate('admins', 'firstName lastName email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Group.countDocuments(query);

      return {
        groups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // ID ilə qrup getir
  async getGroupById(groupId) {
    try {
      const group = await Group.findById(groupId)
        .populate('institution', 'longName shortName')
        .populate('members', 'firstName lastName email position')
        .populate('admins', 'firstName lastName email position')
        .populate('createdBy', 'name email');

      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      return group;
    } catch (error) {
      throw error;
    }
  }

  // Qrup yenilə
  async updateGroup(groupId, updateData, updatedBy) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      // Eyni adda başqa qrup mövcudluğunu yoxla
      if (updateData.name) {
        const existingGroup = await Group.findOne({
          name: updateData.name,
          institution: group.institution,
          _id: { $ne: groupId }
        });

        if (existingGroup) {
          throw new Error(messages.GROUP_ALREADY_EXISTS);
        }
      }

      Object.assign(group, updateData);
      await group.save();

      return await this.getGroupById(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Qrup sil
  async deleteGroup(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      group.isActive = false;
      await group.save();

      return { message: messages.GROUP_DELETED };
    } catch (error) {
      throw error;
    }
  }

  // Üzv əlavə et
  async addMember(groupId, employeeId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isActive) {
        throw new Error(messages.GROUP_INACTIVE);
      }

      const employee = await Employee.findOne({
        _id: employeeId,
        institution: group.institution,
        isActive: true
      });

      if (!employee) {
        throw new Error(messages.EMPLOYEE_NOT_FOUND);
      }

      if (group.isMember(employeeId)) {
        throw new Error(messages.GROUP_MEMBER_ALREADY_EXISTS);
      }

      await group.addMember(employeeId);
      return { message: messages.GROUP_MEMBER_ADDED };
    } catch (error) {
      throw error;
    }
  }

  // Üzv çıxar
  async removeMember(groupId, employeeId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isMember(employeeId)) {
        throw new Error(messages.GROUP_MEMBER_NOT_FOUND);
      }

      await group.removeMember(employeeId);
      return { message: messages.GROUP_MEMBER_REMOVED };
    } catch (error) {
      throw error;
    }
  }

  // Admin əlavə et
  async addAdmin(groupId, employeeId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isActive) {
        throw new Error(messages.GROUP_INACTIVE);
      }

      const employee = await Employee.findOne({
        _id: employeeId,
        institution: group.institution,
        isActive: true
      });

      if (!employee) {
        throw new Error(messages.EMPLOYEE_NOT_FOUND);
      }

      if (group.isAdmin(employeeId)) {
        throw new Error(messages.GROUP_ADMIN_ALREADY_EXISTS);
      }

      await group.addAdmin(employeeId);
      return { message: messages.GROUP_ADMIN_ADDED };
    } catch (error) {
      throw error;
    }
  }

  // Admin çıxar
  async removeAdmin(groupId, employeeId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isAdmin(employeeId)) {
        throw new Error(messages.GROUP_ADMIN_NOT_FOUND);
      }

      await group.removeAdmin(employeeId);
      return { message: messages.GROUP_ADMIN_REMOVED };
    } catch (error) {
      throw error;
    }
  }

  // İşçinin qruplarını getir
  async getEmployeeGroups(employeeId) {
    try {
      const groups = await Group.findByMember(employeeId);
      return groups;
    } catch (error) {
      throw error;
    }
  }

  // Quruma görə qrupları getir
  async getGroupsByInstitution(institutionId) {
    try {
      const groups = await Group.findByInstitution(institutionId);
      return groups;
    } catch (error) {
      throw error;
    }
  }

  // Qurum daxilində göndərilən mesajların sayını getir
  async getMessageCountByInstitution(institutionId) {
    try {
      // Bu quruma aid qrupları tap (yalnız aktiv)
      const groups = await Group.find({ institution: institutionId, isActive: true }, { _id: 1 });
      const groupIds = groups.map(g => g._id);

      if (groupIds.length === 0) {
        return 0;
      }

      // Bu qruplara aid (silinməmiş) mesajların sayını say
      const count = await Message.countDocuments({
        group: { $in: groupIds },
        isDeleted: { $ne: true }
      });

      return count;
    } catch (error) {
      throw error;
    }
  }

  // Qrup axtarışı
  async searchGroups(searchTerm, institutionId = null, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const groups = await Group.searchByName(searchTerm, institutionId);
      
      const paginatedGroups = groups.slice(skip, skip + limit);
      
      return {
        groups: paginatedGroups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(groups.length / limit),
          totalItems: groups.length,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Mesaj göndər
  async sendMessage(groupId, authUser, messageData) {
    try {
      const group = await Group.findById(groupId)
        .populate('members', 'timsUsername isActive')
        .populate('admins', 'timsUsername isActive')
        .populate('institution', 'timsUUID corporationIds timsAccessToken responsiblePerson');
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isActive) {
        throw new Error(messages.GROUP_INACTIVE);
      }

      // Göndərən təyini: üzv deyilsə admin/sorumlu override
      let senderEmployeeId = null;
      // Əgər auth user bir Employee id deyil və üzv yoxlaması uğursuz olursa,
      // admin və ya qurumun sorumlusu ise override et
      const isAdminUser = authUser?.permissions?.isSuperAdmin === true;
      const isResponsible = group.institution?.responsiblePerson && String(group.institution.responsiblePerson) === String(authUser?.userId);

      // Normaldə istifadəçi bir Employee olmalı idi; uyğun üzv yoxsa override qaydasını işlət
      // Qeyd: authUser.userId Mongo User ID-dir, Employee ID deyil
      const canOverride = isAdminUser || isResponsible;
      if (!canOverride) {
        // Üzv olmadığı halda giriş qadağandır
        // Qeyd: authUser.userId Employee ID olmadığı üçün isMember yoxlaması mənasızdır
        // Bu səbəblə override hüququ olmayanlara icazə verilmir
        throw new Error(messages.GROUP_ACCESS_DENIED);
      }

      // Override: varsa qrup adminlərindən biri, yoxdursa üzvlərdən biri göndərən olsun
      if (group.admins && group.admins.length > 0) {
        senderEmployeeId = group.admins[0]._id || group.admins[0];
      } else if (group.members && group.members.length > 0) {
        senderEmployeeId = group.members[0]._id || group.members[0];
      } else {
        throw new Error(messages.GROUP_MEMBER_NOT_FOUND);
      }

      // Gönderim öncesi log (tranzaksiya)
      try {
        await logMessageAction({
          type: 'group',
          action: 'send',
          actorUserId: authUser.userId,
          sender: senderEmployeeId,
          group: groupId,
          institution: group.institution?._id || group.institution,
          content: messageData.content
        });
      } catch (_) {}

      const message = new Message({
        content: messageData.content,
        sender: senderEmployeeId,
        group: groupId,
        messageType: messageData.messageType || 'text',
        replyTo: messageData.replyTo || null
      });

      await message.save();
      
      // TIMS API'ye mesaj göndərmə (best-effort)
      try {
        const populatedGroup = await Group.findById(groupId)
          .populate('members', 'timsUsername isActive')
          .populate('institution', 'timsUUID corporationIds timsAccessToken');

        const timsUsernames = (populatedGroup.members || [])
          .filter(m => m.isActive !== false && m.timsUsername)
          .map(m => m.timsUsername);

        const corporationIds = (populatedGroup.institution?.corporationIds || []);
        const uuid = populatedGroup.institution?.timsUUID || process.env.UUID;
        const accessToken = populatedGroup.institution?.timsAccessToken || process.env.accessToken;

        if (timsUsernames.length > 0 && corporationIds.length > 0) {
          const resp = await MessagingService.sendBotMessage({
            users: timsUsernames,
            corporationIds,
            message: messageData.content,
            notification: true
          }, { uuid, accessToken });
          // Gönderim sonrası log (delivered/failed)
          try {
            const delivered = resp.statusCode >= 200 && resp.statusCode < 300;
            await logMessageAction({
              type: 'group',
              action: delivered ? 'delivered' : 'failed',
              actorUserId: authUser.userId,
              sender: senderEmployeeId,
              group: groupId,
              institution: populatedGroup.institution?._id || populatedGroup.institution,
              content: messageData.content,
              responseCode: resp.statusCode,
              errorMessage: delivered ? '' : (resp?.error || resp?.body || '')
            });
          } catch (_) {}
        }
      } catch (e) {
        console.warn('TIMS message delivery failed:', e && e.message ? e.message : e);
        try {
          await logMessageAction({
            type: 'group',
            action: 'failed',
            actorUserId: authUser.userId,
            sender: senderEmployeeId,
            group: groupId,
            institution: group.institution?._id || group.institution,
            content: messageData.content,
            errorMessage: e && e.message ? e.message : String(e)
          });
        } catch (_) {}
      }

      return await Message.findById(message._id)
        .populate('sender', 'firstName lastName email')
        .populate('replyTo', 'decryptedContent sender');
    } catch (error) {
      throw error;
    }
  }

  // Kurumdaki bütün qruplara mesaj (TIMS broadcast)
  async sendInstitutionMessage(institutionId, authUser, content) {
    const institution = await Institution.findById(institutionId);
    if (!institution) throw new Error(messages.INSTITUTION_NOT_FOUND);
    if (!institution.isActive) throw new Error(messages.INSTITUTION_INACTIVE);

      const isSuperadmin = Boolean(authUser?.permissions?.isSuperAdmin);
      const isAdminOfInstitution = institution.responsiblePerson && String(institution.responsiblePerson) === String(authUser.userId);
    const hasPermission = isSuperadmin || isAdminOfInstitution || authUser.permissions?.canMessageInstitutionGroups;
    if (!hasPermission) throw new Error(messages.UNAUTHORIZED);
    // Yeni qayda: Superadmin deyilse, yalnız öz qurumuna mesaj göndərə bilər
    if (!isSuperadmin && !isAdminOfInstitution) {
      if (!authUser.institution || String(authUser.institution) !== String(institution._id)) {
        throw new Error(messages.UNAUTHORIZED);
      }
    }

    const groups = await Group.find({ institution: institutionId, isActive: true })
      .populate('members', 'timsUsername isActive');

    const timsUsernames = Array.from(new Set(
      groups.flatMap(g => (g.members || [])
        .filter(m => m.isActive !== false && m.timsUsername)
        .map(m => m.timsUsername))
    ));

    const corporationIds = institution.corporationIds || [];
    const uuid = institution.timsUUID || process.env.UUID;
    const accessToken = institution.timsAccessToken || process.env.accessToken;

    if (timsUsernames.length === 0 || corporationIds.length === 0) {
      return { delivered: false, reason: 'Hədəf istifadəçilər və ya corporation boşdur' };
    }

    // Gönderim öncesi log
    try {
      await logMessageAction({
        type: 'institution',
        action: 'send',
        actorUserId: authUser.userId,
        institution: institution._id,
        content
      });
    } catch (_) {}

    const resp = await MessagingService.sendBotMessage({
      users: timsUsernames,
      corporationIds,
      message: content,
      notification: true
    }, { uuid, accessToken });

    const delivered = resp.statusCode >= 200 && resp.statusCode < 300;
    // Gönderim sonrası log
    try {
      await logMessageAction({
        type: 'institution',
        action: delivered ? 'delivered' : 'failed',
        actorUserId: authUser.userId,
        institution: institution._id,
        content,
        responseCode: resp.statusCode,
        errorMessage: delivered ? '' : (resp?.error || resp?.body || '')
      });
    } catch (_) {}

    return { delivered, response: resp };
  }

  // Bir işçiyə Birbaşa mesaj (TIMS direct)
  async sendDirectMessage(employeeId, authUser, content) {
    const employee = await Employee.findById(employeeId).populate('institution');
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    if (!employee.isActive) throw new Error(messages.EMPLOYEE_INACTIVE);

    const institution = employee.institution;
    if (!institution || !institution.isActive) throw new Error(messages.INSTITUTION_INACTIVE);

      const isSuperadmin = authUser?.permissions?.isSuperAdmin === true;
      const isAdminOfInstitution = institution.responsiblePerson && String(institution.responsiblePerson) === String(authUser.userId);
    const hasPermission = isSuperadmin || isAdminOfInstitution || authUser.permissions?.canMessageDirect;
    if (!hasPermission) throw new Error(messages.UNAUTHORIZED);
    // Yeni qayda: Superadmin deyilse, yalnız öz qurumunun işçilərinə birbaşa mesaj göndərə bilər
    if (!isSuperadmin && !isAdminOfInstitution) {
      if (!authUser.institution || String(authUser.institution) !== String(institution._id)) {
        throw new Error(messages.UNAUTHORIZED);
      }
    }

    const uuid = institution.timsUUID || process.env.UUID;
    const accessToken = institution.timsAccessToken || process.env.accessToken;
    const corporationIds = institution.corporationIds || [];

    if (!employee.timsUsername || corporationIds.length === 0) {
      return { delivered: false, reason: 'İstifadəçinin TİMS adı və ya corporation yoxdur' };
    }

    // Gönderim öncesi log
    await logMessageAction({
      type: 'direct',
      action: 'send',
      actorUserId: authUser.userId,
      receiver: employee._id,
      institution: institution._id,
      content
    });
    // İstifadəçi aktivite günlüğü (özet)
    try {
      await addLog({
        userId: authUser.userId,
        actorUserId: authUser.userId,
        action: 'update',
        message: `Birbaşa mesaj göndərildi: ${employee.firstName} ${employee.lastName} (${employee.email})`,
        changes: { employeeId: employee._id, institutionId: institution._id }
      });
    } catch (_) {}

    const resp = await MessagingService.sendBotMessage({
      users: [employee.timsUsername],
      corporationIds,
      message: content,
      notification: true
    }, { uuid, accessToken });

    const delivered = resp.statusCode >= 200 && resp.statusCode < 300;

    // Birbaşa mesajı kalıcı kaydet
    try {
      const direct = new DirectMessage({
        content,
        actorUserId: authUser.userId,
        sender: null, // İleride actor Employee mapping eklenirse doldurulabilir
        receiver: employee._id,
        institution: institution._id,
        messageType: 'text',
        delivered,
        responseCode: resp.statusCode,
        responseBody: resp
      });
      await direct.save();
    } catch (persistErr) {
      console.error('DirectMessage persist error:', persistErr.message);
    }

    // Gönderim sonrası log
    await logMessageAction({
      type: 'direct',
      action: delivered ? 'delivered' : 'failed',
      actorUserId: authUser.userId,
      receiver: employee._id,
      institution: institution._id,
      content,
      responseCode: resp.statusCode,
      errorMessage: delivered ? '' : (resp?.error || resp?.body || '')
    });
    // İstifadəçi aktivite günlüğü (sonuç)
    try {
      await addLog({
        userId: authUser.userId,
        actorUserId: authUser.userId,
        action: 'update',
        message: delivered ? `Birbaşa mesaj çatdırıldı: ${employee.firstName} ${employee.lastName}` : `Birbaşa mesaj uğursuz: ${employee.firstName} ${employee.lastName}`,
        changes: { employeeId: employee._id, institutionId: institution._id, responseCode: resp.statusCode }
      });
    } catch (_) {}

    return { delivered, response: resp };
  }

  // Bir işçi ilə Birbaşa tarixini getir (actor'a göre)
  async getDirectMessages(employeeId, actorUserId, page = 1, limit = 50) {
    const employee = await Employee.findById(employeeId).populate('institution');
    if (!employee) throw new Error(messages.EMPLOYEE_NOT_FOUND);
    if (!employee.isActive) throw new Error(messages.EMPLOYEE_INACTIVE);
    const institution = employee.institution;
    if (!institution || !institution.isActive) throw new Error(messages.INSTITUTION_INACTIVE);

    const directMessages = await DirectMessage.findByEmployeeForActor(employeeId, actorUserId, page, limit);
    const total = await DirectMessage.countDocuments({ receiver: employeeId, actorUserId, isDeleted: false });
    return {
      messages: directMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  // Qrup mesajlarını getir (actor-based permission overrides)
  async getGroupMessages(groupId, authUser, page = 1, limit = 50) {
    try {
      const group = await Group.findById(groupId).populate('institution', 'responsiblePerson');
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      // Permission overrides: superadmin, institution responsible, or any group-level access (read/write/message)
      const isSuperadmin = authUser?.permissions?.isSuperAdmin === true;
      const isResponsible = group.institution && group.institution.responsiblePerson && String(group.institution.responsiblePerson) === String(authUser?.userId);

      // Global group access (any of read/write/message)
      const globalAccess = Boolean(
        authUser?.permissions?.canReadAllGroups ||
        authUser?.permissions?.canWriteAllGroups ||
        authUser?.permissions?.canMessageAllGroups
      );

      // Institution-scoped group access (any of read/write/message) with institution match
      const sameInstitution = String(authUser?.institution || '') === String(group.institution?._id || group.institution || '');
      const institutionAccess = sameInstitution && Boolean(
        authUser?.permissions?.canReadInstitutionGroups ||
        authUser?.permissions?.canWriteInstitutionGroups ||
        authUser?.permissions?.canMessageInstitutionGroups
      );

      const hasAccess = isSuperadmin || isResponsible || globalAccess || institutionAccess;
      if (!hasAccess) {
        throw new Error(messages.GROUP_ACCESS_DENIED);
      }

      const groupMessages = await Message.findByGroup(groupId, page, limit);
      const total = await Message.countDocuments({ group: groupId, isDeleted: false });

      return {
        messages: groupMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Mesajı oxunmuş kimi işarələ
  async markMessageAsRead(messageId, employeeId) {
    try {
      const message = await Message.findById(messageId).populate('group');
      if (!message) {
        throw new Error(messages.MESSAGE_NOT_FOUND);
      }

      if (!message.group.isMember(employeeId)) {
        throw new Error(messages.MESSAGE_ACCESS_DENIED);
      }

      await message.markAsRead(employeeId);
      return { message: messages.MESSAGE_MARKED_READ };
    } catch (error) {
      throw error;
    }
  }

  // Qrupda mesaj axtarışı (actor-based permission overrides)
  async searchMessagesInGroup(groupId, authUser, searchTerm) {
    try {
      const group = await Group.findById(groupId).populate('institution', 'responsiblePerson');
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      // Permission overrides: superadmin, institution responsible, or any group-level access (read/write/message)
      const isSuperadmin = Boolean(authUser?.permissions?.isSuperAdmin);
      const isResponsible = group.institution && group.institution.responsiblePerson && String(group.institution.responsiblePerson) === String(authUser?.userId);

      const globalAccess = Boolean(
        authUser?.permissions?.canReadAllGroups ||
        authUser?.permissions?.canWriteAllGroups ||
        authUser?.permissions?.canMessageAllGroups
      );

      const sameInstitution = String(authUser?.institution || '') === String(group.institution?._id || group.institution || '');
      const institutionAccess = sameInstitution && Boolean(
        authUser?.permissions?.canReadInstitutionGroups ||
        authUser?.permissions?.canWriteInstitutionGroups ||
        authUser?.permissions?.canMessageInstitutionGroups
      );

      const hasAccess = isSuperadmin || isResponsible || globalAccess || institutionAccess;
      if (!hasAccess) {
        throw new Error(messages.GROUP_ACCESS_DENIED);
      }

      const groupMessages = await Message.searchInGroup(groupId, searchTerm);
      return groupMessages;
    } catch (error) {
      throw error;
    }
  }

  // Mesajı yenilə (actor-based permission: superadmin/responsible/write access)
  async updateMessage(messageId, authUser, newContent) {
    try {
      const message = await Message.findById(messageId).populate('group', 'institution isActive').populate('sender', 'firstName lastName email');
      if (!message) {
        throw new Error(messages.MESSAGE_NOT_FOUND);
      }

      const group = message.group ? await Group.findById(message.group._id || message.group) .populate('institution', 'responsiblePerson') : null;
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }
      if (!group.isActive) {
        throw new Error(messages.GROUP_INACTIVE);
      }

      const isSuperadmin = Boolean(authUser?.permissions?.isSuperAdmin);
      const isResponsible = group.institution && group.institution.responsiblePerson && String(group.institution.responsiblePerson) === String(authUser?.userId);

      const globalWrite = Boolean(authUser?.permissions?.canWriteAllGroups);
      const sameInstitution = String(authUser?.institution || '') === String(group.institution?._id || group.institution || '');
      const institutionWrite = sameInstitution && Boolean(authUser?.permissions?.canWriteInstitutionGroups);

      const hasAccess = isSuperadmin || isResponsible || globalWrite || institutionWrite;
      if (!hasAccess) {
        throw new Error(messages.GROUP_ACCESS_DENIED);
      }

      // Log action before update
      try {
        await logMessageAction({
          type: 'group',
          action: 'update',
          actorUserId: authUser.userId,
          sender: message.sender?._id || message.sender,
          group: group._id,
          institution: group.institution?._id || group.institution,
          content: newContent
        });
      } catch (_) {}

      await message.updateContent(newContent);
      const updated = await Message.findById(messageId)
        .populate('sender', 'firstName lastName email')
        .populate('replyTo', 'decryptedContent sender');
      return updated;
    } catch (error) {
      throw error;
    }
  }

  // Oxunmamış mesaj sayını getir
  async getUnreadMessageCount(groupId, employeeId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(messages.GROUP_NOT_FOUND);
      }

      if (!group.isMember(employeeId)) {
        throw new Error(messages.GROUP_ACCESS_DENIED);
      }

      const count = await Message.getUnreadCount(groupId, employeeId);
      return { unreadCount: count };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new GroupService();