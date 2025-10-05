const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Qrup adı tələb olunur'],
    trim: true,
    maxlength: [100, 'Qrup adı 100 simvoldan çox ola bilməz'],
    minlength: [2, 'Qrup adı ən azı 2 simvol olmalıdır']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Təsvir 500 simvoldan çox ola bilməz']
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Qurum sahəsi tələb olunur']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxMembers: {
    type: Number,
    default: 500,
    min: [1, 'Üzv sayı ən azı 1 olmalıdır'],
    max: [500, 'Maksimum üzv sayı 500-dən çox ola bilməz']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual alanlar
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

groupSchema.virtual('adminCount').get(function() {
  return this.admins ? this.admins.length : 0;
});

groupSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    memberCount: this.memberCount,
    adminCount: this.adminCount,
    maxMembers: this.maxMembers,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
});

// Index'lər
groupSchema.index({ name: 1, institution: 1 }, { unique: true });
groupSchema.index({ institution: 1 });
groupSchema.index({ members: 1 });
groupSchema.index({ admins: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ createdAt: -1 });

// Pre-save middleware
groupSchema.pre('save', function(next) {
  // Qrup adminlərinin həm də üzv olmasını təmin et
  if (this.admins && this.admins.length > 0) {
    this.admins.forEach(adminId => {
      if (!this.members.includes(adminId)) {
        this.members.push(adminId);
      }
    });
  }
  next();
});

// Metodlar
groupSchema.methods.addMember = function(employeeId) {
  if (this.members.length >= this.maxMembers) {
    throw new Error('Qrupda maksimum üzv sayına çatılıb');
  }
  
  if (!this.members.includes(employeeId)) {
    this.members.push(employeeId);
    return this.save();
  }
  return this;
};

groupSchema.methods.removeMember = function(employeeId) {
  this.members = this.members.filter(id => !id.equals(employeeId));
  // Əgər admin idisə, adminlərdən də sil
  this.admins = this.admins.filter(id => !id.equals(employeeId));
  return this.save();
};

groupSchema.methods.addAdmin = function(employeeId) {
  // Əvvəlcə üzv olmasını təmin et
  if (!this.members.includes(employeeId)) {
    this.members.push(employeeId);
  }
  
  if (!this.admins.includes(employeeId)) {
    this.admins.push(employeeId);
    return this.save();
  }
  return this;
};

groupSchema.methods.removeAdmin = function(employeeId) {
  this.admins = this.admins.filter(id => !id.equals(employeeId));
  return this.save();
};

groupSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

groupSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

groupSchema.methods.isMember = function(employeeId) {
  return this.members.some(id => id.equals(employeeId));
};

groupSchema.methods.isAdmin = function(employeeId) {
  return this.admins.some(id => id.equals(employeeId));
};

// Static metodlar
groupSchema.statics.findByInstitution = function(institutionId) {
  return this.find({ institution: institutionId, isActive: true })
    .populate('institution', 'longName shortName')
    .populate('members', 'firstName lastName email')
    .populate('admins', 'firstName lastName email')
    .sort({ name: 1 });
};

groupSchema.statics.findByMember = function(employeeId) {
  return this.find({ members: employeeId, isActive: true })
    .populate('institution', 'longName shortName')
    .populate('admins', 'firstName lastName email')
    .sort({ name: 1 });
};

groupSchema.statics.searchByName = function(searchTerm, institutionId = null) {
  const query = {
    name: new RegExp(searchTerm, 'i'),
    isActive: true
  };
  
  if (institutionId) {
    query.institution = institutionId;
  }
  
  return this.find(query)
    .populate('institution', 'longName shortName')
    .populate('members', 'firstName lastName email')
    .populate('admins', 'firstName lastName email')
    .sort({ name: 1 });
};


// JSON dönüşümü
groupSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Group', groupSchema);