const GroupService = require('../services/group.service');
const messages = require('../validations/messages');


const sendMessageByApiKey = async (req, res) => {
  try {
    const headerApiKey = req.headers['x-api-key'] || req.headers['api-key'];
    const { apiKey: bodyApiKey, content, messageType, replyTo } = req.body;
    const apiKey = headerApiKey || bodyApiKey;
    const message = await GroupService.sendMessageByApiKey(apiKey, { content, messageType, replyTo });
    res.status(201).json({ success: true, message: messages.MESSAGE_SENT, data: message });
  } catch (error) {
    const invalidKey = error.message === messages.GROUP_APIKEY_INVALID;
    const groupInactive = error.message === messages.GROUP_INACTIVE;
    const notFound = error.message === messages.GROUP_NOT_FOUND;
    const statusCode = invalidKey ? 401 : groupInactive ? 403 : notFound ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// API key ile kuruma veya belirli gruba mesaj gönderme
const sendInstitutionMessagesByApiKey = async (req, res) => {
  try {
    const headerApiKey = req.headers['x-api-key'] || req.headers['api-key'];
    const { apiKey: bodyApiKey, institutionId, content, target = 'all', groupId = null } = req.body;
    const apiKey = headerApiKey || bodyApiKey;
    const result = await GroupService.sendInstitutionMessagesByApiKey(apiKey, {
      institutionId,
      content,
      target,
      groupId
    });
    res.status(201).json({ success: true, message: messages.MESSAGE_SENT, data: result });
  } catch (error) {
    const invalidKey = error.message === messages.GROUP_APIKEY_INVALID;
    const groupInactive = error.message === messages.GROUP_INACTIVE;
    const institutionInactive = error.message === messages.INSTITUTION_INACTIVE;
    const notFound = error.message === messages.INSTITUTION_NOT_FOUND || error.message === messages.GROUP_NOT_FOUND;
    const limitReached = error.message === (messages.MESSAGE_LIMIT_REACHED || messages.INSUFFICIENT_MESSAGE_LIMIT);
    const statusCode = invalidKey ? 401 : (groupInactive || institutionInactive) ? 403 : notFound ? 404 : limitReached ? 400 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// API key ile kuruma ait tüm grup API key’lerini listeleme
const getInstitutionApiKeysByApiKey = async (req, res) => {
  try {
    const headerApiKey = req.headers['x-api-key'] || req.headers['api-key'];
    const { apiKey: queryApiKey } = req.query;
    const apiKey = headerApiKey || queryApiKey;
    const { institutionId } = req.params;
    const data = await GroupService.getInstitutionApiKeysByApiKey(apiKey, institutionId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const invalidKey = error.message === messages.GROUP_APIKEY_INVALID;
    const notFound = error.message === messages.INSTITUTION_NOT_FOUND;
    const statusCode = invalidKey ? 401 : notFound ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessageByApiKey,
  sendInstitutionMessagesByApiKey,
  getInstitutionApiKeysByApiKey
};