const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  longName: {
    type: String,
    required: [true, 'Qurumun uzun adı tələb olunur'],
    trim: true,
    maxlength: [200, 'Uzun ad 200 simvoldan çox ola bilməz']
  },
  shortName: {
    type: String,
    required: [true, 'Qurumun qısa adı tələb olunur'],
    trim: true,
    maxlength: [50, 'Qısa ad 50 simvoldan çox ola bilməz'],
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Qurum tipi tələb olunur'],
    enum: {
      values: ['dövlət', 'özəl', 'beynəlxalq', 'qeyri-hökumət', 'təhsil', 'səhiyyə', 'maliyyə', 'digər'],
      message: 'Qurum tipi düzgün seçilməlidir'
    }
  },
  responsiblePerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  messageLimit: {
    type: Number,
    required: [true, 'Mesaj limiti tələb olunur'],
    min: [0, 'Mesaj limiti mənfi ola bilməz'],
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // TIMS entegrasiya sahələri
  timsUUID: {
    type: String,
    trim: true
  },
  corporationIds: {
    type: [Number],
    default: []
  },
  timsAccessToken: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance
institutionSchema.index({ shortName: 1 });
institutionSchema.index({ type: 1 });
institutionSchema.index({ isActive: 1 });
institutionSchema.index({ timsUUID: 1 });

// Virtual for full display name
institutionSchema.virtual('displayName').get(function() {
  return `${this.shortName} - ${this.longName}`;
});

// Method to check if institution can send messages
institutionSchema.methods.canSendMessage = function() {
  return this.isActive && this.messageLimit > 0;
};

// Method to decrease message limit
institutionSchema.methods.decreaseMessageLimit = function(amount = 1) {
  if (this.messageLimit >= amount) {
    this.messageLimit -= amount;
    return this.save();
  }
  throw new Error('Mesaj limiti kifayət etmir');
};

// Method to increase message limit
institutionSchema.methods.increaseMessageLimit = function(amount) {
  this.messageLimit += amount;
  return this.save();
};

// Transform output
institutionSchema.methods.toJSON = function() {
  const institution = this.toObject();
  return {
    id: institution._id,
    longName: institution.longName,
    shortName: institution.shortName,
    type: institution.type,
    responsiblePerson: institution.responsiblePerson,
    messageLimit: institution.messageLimit,
    isActive: institution.isActive,
    timsUUID: institution.timsUUID,
    corporationIds: institution.corporationIds,
    displayName: this.displayName,
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt
  };
};

module.exports = mongoose.model('Institution', institutionSchema);