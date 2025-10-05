const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Ad sahəsi tələb olunur'],
    trim: true,
    maxlength: [50, 'Ad 50 simvoldan çox ola bilməz']
  },
  lastName: {
    type: String,
    required: [true, 'Soyad sahəsi tələb olunur'],
    trim: true,
    maxlength: [50, 'Soyad 50 simvoldan çox ola bilməz']
  },
  timsUsername: {
    type: String,
    required: [true, 'TİMS istifadəçi adı sahəsi tələb olunur'],
    trim: true,
    maxlength: [50, 'TİMS istifadəçi adı 50 simvoldan çox ola bilməz']
  },
  email: {
    type: String,
    required: [true, 'Email sahəsi tələb olunur'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Düzgün email formatı daxil edin']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[0-9]{10,15}$/, 'Düzgün telefon nömrəsi formatı daxil edin']
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Qurum sahəsi tələb olunur']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [1000, 'Vəzifə 100 simvoldan çox ola bilməz']
  },
  isActive: {
    type: Boolean,
    default: true
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
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    position: this.position,
    isActive: this.isActive
  };
});

// Index'lər
employeeSchema.index({ email: 1 });
employeeSchema.index({ institution: 1 });
employeeSchema.index({ firstName: 1, lastName: 1 });
employeeSchema.index({ isActive: 1 });

// Metodlar
employeeSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

employeeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Static metodlar
employeeSchema.statics.findByInstitution = function(institutionId) {
  return this.find({ institution: institutionId, isActive: true })
    .populate('institution', 'longName shortName')
    .sort({ firstName: 1, lastName: 1 });
};

employeeSchema.statics.searchByName = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex }
    ],
    isActive: true
  }).populate('institution', 'longName shortName');
};

// JSON dönüşümü
employeeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Employee', employeeSchema);