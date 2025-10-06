const mongoose = require('mongoose');
const crypto = require('crypto');

// Şifreleme ayarları (Message ile uyumlu)
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.MESSAGE_ENCRYPTION_KEY || 'default_dev_key')
  .digest();
const IV_LENGTH = 16;

const directMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Mesaj məzmunu tələb olunur']
  },
  encryptedContent: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Qəbul edən işçi tələb olunur']
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  delivered: {
    type: Boolean,
    default: false
  },
  responseCode: {
    type: Number,
    default: null
  },
  responseBody: {
    type: Object,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]).toString('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

function decrypt(encryptedDataHex, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedDataHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
  return decrypted;
}

directMessageSchema.virtual('decryptedContent').get(function() {
  if (this.encryptedContent && this.iv) {
    try {
      return decrypt(this.encryptedContent, this.iv);
    } catch (error) {
      try {
        const legacyDecipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
        let decrypted = legacyDecipher.update(this.encryptedContent, 'hex', 'utf8');
        decrypted += legacyDecipher.final('utf8');
        return decrypted;
      } catch (legacyError) {
        console.error('DirectMessage decrypt error:', legacyError);
        return '[Şifrəli mesaj - açıla bilmədi]';
      }
    }
  }
  return this.content;
});

directMessageSchema.index({ actorUserId: 1, receiver: 1, createdAt: -1 });
directMessageSchema.index({ institution: 1 });
directMessageSchema.index({ delivered: 1 });

directMessageSchema.pre('validate', function(next) {
  if (this.content && typeof this.content === 'string' && this.content.length > 0) {
    const encrypted = encrypt(this.content);
    this.encryptedContent = encrypted.encryptedData;
    this.iv = encrypted.iv;
  }
  next();
});

directMessageSchema.pre('save', function(next) {
  if (this.content) {
    this.content = undefined;
  }
  next();
});

directMessageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.encryptedContent;
    delete ret.iv;
    // UI üçün decrypted məzmunu content kimi göstər
    ret.content = ret.decryptedContent;
    // Xam content saxlanmadığı üçün redundansı təmizlə və yenidən təyin et
    delete ret.content;
    ret.content = ret.decryptedContent;
    delete ret.__v;
    return ret;
  }
});

directMessageSchema.statics.findByEmployeeForActor = function(employeeId, actorUserId, page = 1, limit = 50) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return this.find({ receiver: employeeId, actorUserId, isDeleted: false })
    .populate('receiver', 'firstName lastName email')
    .populate('sender', 'firstName lastName email')
    .populate('institution', 'shortName longName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
};

module.exports = mongoose.model('DirectMessage', directMessageSchema);