const mongoose = require('mongoose');

const userLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'update_permissions'],
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  changes: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

userLogSchema.index({ userId: 1, createdAt: -1 });
userLogSchema.index({ actorUserId: 1, createdAt: -1 });

module.exports = mongoose.model('UserLog', userLogSchema);