const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Institution = require('../models/Institution');
const connectDB = require('../config/database');


dotenv.config();

const seedUsers = [
  {
    name: 'Full Permission User',
    email: 'root@tims.az',
    password: 'root123456',
    isActive: true,
    permissions: {
      isSuperAdmin: true,
      canReadAllUsers: true,
      canReadOwnInstitutionUsers: true,
      canWriteAllUsers: true,
      canWriteOwnInstitutionUsers: true,
      canUpdateAllUsers: true,
      canUpdateOwnInstitutionUsers: true,
      canDeleteUsers: true,
      canDeleteOwnInstitutionUsers: true
    },
    institution: null
  },
  {
    name: 'Admin İstifadəçi',
    email: 'admin@tims.az',
    password: 'admin123456',
    isActive: true
  },
  {
    name: 'Test İstifadəçi',
    email: 'demo@test.az',
    password: 'test123456',
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Verilənlər bazasına məlumat əlavə edilməsi başladı...');
    
    // Clear existing data
    await User.deleteMany({});
    await Institution.deleteMany({});
    console.log('✅ Mövcud məlumatlar təmizləndi');
    
    // Create new users
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✅ Əlavə edilən istifadəçi: ${user.email}`);
    }
    
    // Create sample institutions
    const adminUser = createdUsers.find(user => user.email === 'admin@tims.az') || createdUsers[0];
    const regularUser = createdUsers.find(user => user.email === 'demo@test.az') || createdUsers[0];
    
    const seedInstitutions = [
      {
        longName: 'Azərbaycan Respublikası Prezidentinin Administrasiyası',
        shortName: 'PA',
        type: 'dövlət',
        responsiblePerson: adminUser._id,
        messageLimit: 5000,
        createdBy: adminUser._id
      },
      {
        longName: 'Azərbaycan Dövlət Neft Şirkəti',
        shortName: 'SOCAR',
        type: 'dövlət',
        responsiblePerson: regularUser._id,
        messageLimit: 3000,
        createdBy: adminUser._id
      },
      {
        longName: 'Bakı Dövlət Universiteti',
        shortName: 'BDU',
        type: 'təhsil',
        messageLimit: 2000,
        createdBy: adminUser._id
      }
    ];
    
    for (const institutionData of seedInstitutions) {
      const institution = new Institution(institutionData);
      await institution.save();
      console.log(`✅ Əlavə edilən Qurum: ${institution.shortName}`);
    }
    
    console.log('🎉 Verilənlər bazasına məlumat əlavə edilməsi uğurla yekunlaşdı!');
    console.log('\n📋 Əlavə edilən istifadəçilər:');
    seedUsers.forEach(user => {
      console.log(`   E-poçt: ${user.email} | Şifrə: ${user.password}`);
    });
    console.log('\n🏢 Əlavə edilən Qurumlar:');
    seedInstitutions.forEach(inst => {
      console.log(`   ${inst.shortName} - ${inst.longName} (${inst.type})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Verilənlər bazasına istifadəçi əlavə edilməsi zamanı xəta baş verdi:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();