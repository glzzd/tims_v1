const User = require('../models/User');
const Institution = require('../models/Institution');
const messages = require('../validations/messages');
const userLogService = require('../services/userLog.service');

const createUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const { name, email, password, permissions = {}, institutionId } = req.body;

    // Permission-based guard: require either write-all or write-own
    const canWriteAll = requester.permissions?.canWriteAllUsers === true;
    const canWriteOwn = requester.permissions?.canWriteOwnInstitutionUsers === true;
    if (!canWriteAll && !canWriteOwn) {
      return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Bu e-poçt ilə istifadəçi mövcuddur' });
    }

    let institution = null;
    if (canWriteAll) {
      // can set any institution, or leave null
      if (institutionId) {
        const inst = await Institution.findById(institutionId);
        if (!inst) {
          return res.status(404).json({ success: false, message: messages.INSTITUTION_NOT_FOUND });
        }
        institution = inst._id;
      }
    } else if (canWriteOwn) {
      // enforce requester’s institution
      if (!requester.institution) {
        return res.status(400).json({ success: false, message: 'İstifadəçinin qurum məlumatı yoxdur' });
      }
      institution = requester.institution;
    }

    const user = new User({ name, email, password, permissions, institution });
    await user.save();

    // Log creation
    await userLogService.addLog({
      userId: user._id,
      actorUserId: requester.userId || requester._id,
      action: 'create',
      message: `İstifadəçi yaradıldı: ${name} (${email})`,
      changes: { permissions, institution }
    });

    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

const updatePermissions = async (req, res, next) => {
  try {
    const requester = req.user;
    const canUpdateAll = requester.permissions?.canUpdateAllUsers === true;
    const canUpdateOwn = requester.permissions?.canUpdateOwnInstitutionUsers === true;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: messages.USER_NOT_FOUND });
    }

    if (!canUpdateAll) {
      // If not global updater, must have own-institution permission and same institution
      if (!canUpdateOwn || String(user.institution || '') !== String(requester.institution || '')) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }
    }

    const oldPerms = { ...user.permissions };
    const incomingPerms = req.body.permissions || {};
    const permChanges = Object.keys(incomingPerms).reduce((acc, key) => {
      acc[key] = { from: Boolean(oldPerms[key]), to: Boolean(incomingPerms[key]) };
      return acc;
    }, {});

    user.permissions = { ...user.permissions, ...incomingPerms };
    await user.save();

    // Log permissions update
    await userLogService.addLog({
      userId: user._id,
      actorUserId: requester.userId || requester._id,
      action: 'update_permissions',
      message: `İstifadəçi izinləri güncellendi (${user.email})`,
      changes: permChanges
    });

    res.status(200).json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// List users: permission-based
const getAllUsers = async (req, res, next) => {
  try {
    const requester = req.user;
    if (!requester) {
      return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
    }

    const canReadAll = requester.permissions?.canReadAllUsers === true;
    const canReadOwn = requester.permissions?.canReadOwnInstitutionUsers === true;
    if (!canReadAll && !canReadOwn) {
      return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
    }

    const { search, page = 1, limit = 20, institution } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Scope by institution if needed
    if (!canReadAll) {
      query.institution = requester.institution || null;
    } else if (institution) {
      query.institution = institution;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: users.map(u => u.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user basic info
const updateUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const canUpdateAll = requester.permissions?.canUpdateAllUsers === true;
    const canUpdateOwn = requester.permissions?.canUpdateOwnInstitutionUsers === true;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: messages.USER_NOT_FOUND });
    }

    if (!canUpdateAll) {
      if (!canUpdateOwn || String(user.institution || '') !== String(requester.institution || '')) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }
    }

    const { name, email, password, institutionId } = req.body;
    const changes = {};
    if (name && name !== user.name) {
      changes.name = { from: user.name, to: name };
      user.name = name;
    }
    if (email && email !== user.email) {
      changes.email = { from: user.email, to: email };
      user.email = email;
    }
    if (password) {
      // Do not log actual password values
      changes.password = { from: '***', to: '***' };
      user.password = password;
    }
    if (typeof institutionId !== 'undefined') {
      if (institutionId === null || institutionId === '') {
        changes.institution = { from: user.institution || null, to: null };
        user.institution = null;
      } else {
        const inst = await Institution.findById(institutionId);
        if (!inst) {
          return res.status(404).json({ success: false, message: messages.INSTITUTION_NOT_FOUND });
        }
        // If not global, enforce same institution
        if (!canUpdateAll && String(inst._id) !== String(requester.institution || '')) {
          return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
        }
        changes.institution = { from: user.institution || null, to: inst._id };
        user.institution = inst._id;
      }
    }

    await user.save();

    // Log update if any changes
    if (Object.keys(changes).length > 0) {
      await userLogService.addLog({
        userId: user._id,
        actorUserId: requester.userId || requester._id,
        action: 'update',
        message: `İstifadəçi məlumatları güncellendi (${user.email})`,
        changes
      });
    }
    res.status(200).json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const requester = req.user;
    const canDeleteAll = requester.permissions?.canDeleteUsers === true;
    const canDeleteOwn = requester.permissions?.canDeleteOwnInstitutionUsers === true;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: messages.USER_NOT_FOUND });
    }

    if (!canDeleteAll) {
      if (!canDeleteOwn || String(user.institution || '') !== String(requester.institution || '')) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    // Log delete
    await userLogService.addLog({
      userId: user._id,
      actorUserId: requester.userId || requester._id,
      action: 'delete',
      message: `İstifadəçi silindi (${user.email})`,
      changes: {}
    });
    res.status(200).json({ success: true, message: 'İstifadəçi silindi' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  updatePermissions,
  getAllUsers,
  updateUser,
  deleteUser,
  // Get user logs (superadmin only)
  getUserLogs: async (req, res, next) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      if (!isSuper) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      const { page = 1, limit = 50 } = req.query;
      const result = await userLogService.getLogsByUser(req.params.id, { page, limit });
      res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  },
  // Get activity performed by the user (superadmin only)
  getUserActivity: async (req, res, next) => {
    try {
      const requester = req.user;
      const isSuper = requester?.permissions?.isSuperAdmin === true;
      if (!isSuper) {
        return res.status(403).json({ success: false, message: messages.UNAUTHORIZED });
      }

      const { page = 1, limit = 50 } = req.query;
      const result = await userLogService.getLogsByActor(req.params.id, { page, limit });
      res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }
};