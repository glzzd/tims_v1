const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group', 'institution'],
    required: true
  },
  action: {
    type: String,
    enum: ['send', 'delivered', 'failed'],
    required: true
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution'
  },
  contentPreview: {
    type: String,
    default: ''
  },
  responseCode: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, { timestamps: true });

messageLogSchema.index({ actorUserId: 1, createdAt: -1 });
messageLogSchema.index({ type: 1, createdAt: -1 });
messageLogSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('MessageLog', messageLogSchema);