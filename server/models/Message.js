const mongoose = require('mongoose');
const crypto = require('crypto');

// Şifreleme ayarları
// 32 byte anahtar üretimi (sha256) – stabil olması üçün environment-dən törədilir
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.MESSAGE_ENCRYPTION_KEY || 'default_dev_key')
  .digest();
const IV_LENGTH = 16; // AES blok boyutu

const messageSchema = new mongoose.Schema({
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
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Göndərən sahəsi tələb olunur']
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Qrup sahəsi tələb olunur']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number,
    min: 0
  },
  isRead: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  editedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Şifreleme fonksiyonları
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

// Virtual alanlar
messageSchema.virtual('decryptedContent').get(function() {
  if (this.encryptedContent && this.iv) {
    try {
      return decrypt(this.encryptedContent, this.iv);
    } catch (error) {
      // Köhnə şifrələme (iv-siz createDecipher) üçün düşmə – var olan mesajlar üçün
      try {
        const legacyDecipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
        let decrypted = legacyDecipher.update(this.encryptedContent, 'hex', 'utf8');
        decrypted += legacyDecipher.final('utf8');
        return decrypted;
      } catch (legacyError) {
        console.error('Mesaj şifrəsini açma xətası:', legacyError);
        return '[Şifrəli mesaj - açıla bilmədi]';
      }
    }
  }
  return this.content;
});

messageSchema.virtual('readCount').get(function() {
  return this.isRead ? this.isRead.length : 0;
});

messageSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    content: this.decryptedContent,
    messageType: this.messageType,
    fileName: this.fileName,
    fileSize: this.fileSize,
    readCount: this.readCount,
    isDeleted: this.isDeleted,
    editedAt: this.editedAt,
    createdAt: this.createdAt
  };
});

// Index'lər
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isDeleted: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ 'isRead.employee': 1 });

// Pre-validate middleware - Şifrələmə sahələrini doğrulamadan əvvəl doldur
messageSchema.pre('validate', function(next) {
  if (this.content && typeof this.content === 'string' && this.content.length > 0) {
    const encrypted = encrypt(this.content);
    this.encryptedContent = encrypted.encryptedData;
    this.iv = encrypted.iv;
  }
  next();
});

// Pre-save middleware - Orijinal məzmunu sil (təhlükəsizlik üçün)
messageSchema.pre('save', function(next) {
  if (this.content) {
    this.content = undefined;
  }
  next();
});

// Pre-update middleware
messageSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate();
  if (update.content) {
    const encrypted = encrypt(update.content);
    update.encryptedContent = encrypted.encryptedData;
    update.iv = encrypted.iv;
    update.editedAt = new Date();
    delete update.content;
  }
  next();
});

// Metodlar
messageSchema.methods.markAsRead = function(employeeId) {
  const existingRead = this.isRead.find(read => read.employee.equals(employeeId));
  if (!existingRead) {
    this.isRead.push({
      employee: employeeId,
      readAt: new Date()
    });
    return this.save();
  }
  return this;
};

messageSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

messageSchema.methods.updateContent = function(newContent) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

messageSchema.methods.isReadBy = function(employeeId) {
  return this.isRead.some(read => read.employee.equals(employeeId));
};

// Static metodlar
messageSchema.statics.findByGroup = function(groupId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({ group: groupId, isDeleted: false })
    .populate('sender', 'firstName lastName email')
    .populate('replyTo', 'decryptedContent sender')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

messageSchema.statics.findBySender = function(senderId) {
  return this.find({ sender: senderId, isDeleted: false })
    .populate('group', 'name')
    .populate('replyTo', 'decryptedContent sender')
    .sort({ createdAt: -1 });
};

messageSchema.statics.searchInGroup = function(groupId, searchTerm) {
  // Not: Şifreli mesajlarda arama zor olduğu üçün bu metod məhdud işləyəcək
  return this.find({
    group: groupId,
    isDeleted: false,
    messageType: 'text'
  })
  .populate('sender', 'firstName lastName email')
  .sort({ createdAt: -1 })
  .then(messages => {
    // Şifrəni açıb axtarış et
    return messages.filter(message => {
      const decrypted = message.decryptedContent;
      return decrypted && decrypted.toLowerCase().includes(searchTerm.toLowerCase());
    });
  });
};

messageSchema.statics.getUnreadCount = function(groupId, employeeId) {
  return this.countDocuments({
    group: groupId,
    isDeleted: false,
    'isRead.employee': { $ne: employeeId }
  });
};

// JSON dönüşümü
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Şifrəli məlumatları gizlə
    delete ret.encryptedContent;
    delete ret.iv;
    delete ret.content;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);