const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Permission-based system, institution may be null initially
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  permissions: {
    type: Object,
    default: {
      isSuperAdmin: false,
      canAddAdmin: false,
      canAddUser: false,
      canAddEmployee: false,
      canMessageAllGroups: false,
      canMessageInstitutionGroups: true,
      canReadAllUsers: true,
      canUpdateAllUsers: true,
      canDeleteUsers: true,
      canWriteAllUsers: true,
      canReadOwnInstitutionUsers: true,
      canWriteOwnInstitutionUsers: true,
      canUpdateOwnInstitutionUsers: true,
      canDeleteOwnInstitutionUsers: true,
      canMessageDirect: true
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);