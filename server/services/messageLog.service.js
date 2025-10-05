const MessageLog = require('../models/MessageLog');

const logMessageAction = async ({
  type,
  action,
  actorUserId,
  sender = null,
  receiver = null,
  group = null,
  institution = null,
  content = '',
  responseCode = null,
  errorMessage = ''
}) => {
  try {
    const contentPreview = String(content || '');
    const log = new MessageLog({
      type,
      action,
      actorUserId,
      sender,
      receiver,
      group,
      institution,
      contentPreview,
      responseCode,
      errorMessage
    });
    await log.save();
    return log;
  } catch (e) {
    console.error('MessageLog error:', e.message);
    return null;
  }
};

// Fetch message logs with optional filters and permission guard applied in controller
const getLogs = async ({ actorUserId = null, type = null, action = null, page = 1, limit = 50 } = {}) => {
  const query = {};
  if (actorUserId) query.actorUserId = actorUserId;
  if (type) query.type = type;
  if (action) query.action = action;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    MessageLog.find(query)
      .populate('actorUserId', 'name email')
      .populate({
        path: 'sender',
        select: 'firstName lastName email institution',
        populate: { path: 'institution', select: 'shortName longName' }
      })
      .populate({
        path: 'receiver',
        select: 'firstName lastName email institution',
        populate: { path: 'institution', select: 'shortName longName' }
      })
      .populate({
        path: 'group',
        select: 'name institution members',
        populate: [
          { path: 'institution', select: 'shortName longName' },
          { path: 'members', select: 'firstName lastName email' }
        ]
      })
      .populate('institution', 'shortName longName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    MessageLog.countDocuments(query)
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
  logMessageAction,
  getLogs
};