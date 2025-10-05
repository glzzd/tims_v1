const UserLog = require('../models/UserLog');

const addLog = async ({ userId, actorUserId, action, message = '', changes = {} }) => {
  try {
    const log = new UserLog({ userId, actorUserId, action, message, changes });
    await log.save();
    return log;
  } catch (e) {
    // Silently ignore logging errors to not block main operation
    console.error('UserLog addLog error:', e.message);
    return null;
  }
};

const getLogsByUser = async (userId, { page = 1, limit = 50 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    UserLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('actorUserId', 'name email'),
    UserLog.countDocuments({ userId })
  ]);
  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

const getLogsByActor = async (actorUserId, { page = 1, limit = 50 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    UserLog.find({ actorUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email'),
    UserLog.countDocuments({ actorUserId })
  ]);
  return {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

module.exports = {
  addLog,
  getLogsByUser,
  getLogsByActor
};