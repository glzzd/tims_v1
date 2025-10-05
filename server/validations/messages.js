const validationMessages = {
  // Auth mesajları
  EMAIL_REQUIRED: 'E-poçt ünvanı tələb olunur',
  EMAIL_INVALID: 'Düzgün e-poçt ünvanı daxil edin',
  PASSWORD_REQUIRED: 'Şifrə tələb olunur',
  PASSWORD_MIN_LENGTH: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır',
  PASSWORD_COMPLEXITY: 'Şifrə ən azı bir kiçik hərf, bir böyük hərf və bir rəqəm ehtiva etməlidir',
  NAME_REQUIRED: 'Ad tələb olunur',
  NAME_LENGTH: 'Ad ən azı 2, ən çox 50 simvoldan ibarət olmalıdır',
  
  // Login mesajları
  LOGIN_SUCCESS: 'Uğurla daxil oldunuz',
  LOGIN_FAILED: 'E-poçt və ya şifrə yanlışdır',
  INVALID_CREDENTIALS: 'E-poçt və ya şifrə yanlışdır',
  
  // Ümumi mesajlar
  VALIDATION_ERROR: 'Məlumatlar düzgün deyil',
  SERVER_ERROR: 'Server xətası baş verdi',
  UNAUTHORIZED: 'Bu əməliyyat üçün icazəniz yoxdur',
  USER_NOT_FOUND: 'İstifadəçi tapılmadı',
  USER_INACTIVE: 'İstifadəçi hesabı deaktivdir',
  
  // Token mesajları
  TOKEN_REQUIRED: 'Token tələb olunur',
  TOKEN_INVALID: 'Token etibarsızdır',
  TOKEN_EXPIRED: 'Token müddəti bitib',
  
  // Qurum mesajları
  INSTITUTION_CREATED: 'Qurum uğurla yaradıldı',
  INSTITUTION_UPDATED: 'Qurum məlumatları yeniləndi',
  INSTITUTION_DELETED: 'Qurum silindi',
  INSTITUTION_NOT_FOUND: 'Qurum tapılmadı',
  INSTITUTION_ALREADY_EXISTS: 'Bu adda Qurum artıq mövcuddur',
  INSTITUTION_INACTIVE: 'Qurum deaktivdir',
  MESSAGE_LIMIT_EXCEEDED: 'Mesaj limiti aşıldı',
  INSUFFICIENT_MESSAGE_LIMIT: 'Mesaj limiti kifayət etmir',
  RESPONSIBLE_PERSON_NOT_FOUND: 'Sorumlu şəxs tapılmadı',
  INSTITUTION_ACCESS_DENIED: 'Bu Quruma giriş icazəniz yoxdur',
  
  // İşçi mesajları
  EMPLOYEE_CREATED: 'İşçi uğurla yaradıldı',
  EMPLOYEE_UPDATED: 'İşçi məlumatları yeniləndi',
  EMPLOYEE_DELETED: 'İşçi silindi',
  EMPLOYEE_NOT_FOUND: 'İşçi tapılmadı',
  EMPLOYEE_ALREADY_EXISTS: 'Bu e-poçt ünvanı ilə işçi artıq mövcuddur',
  EMPLOYEE_INACTIVE: 'İşçi deaktivdir',
  
  // Qrup mesajları
  GROUP_CREATED: 'Qrup uğurla yaradıldı',
  GROUP_UPDATED: 'Qrup məlumatları yeniləndi',
  GROUP_DELETED: 'Qrup silindi',
  GROUP_NOT_FOUND: 'Qrup tapılmadı',
  GROUP_ALREADY_EXISTS: 'Bu adda qrup artıq mövcuddur',
  GROUP_INACTIVE: 'Qrup deaktivdir',
  GROUP_ACCESS_DENIED: 'Bu qrupa giriş icazəniz yoxdur',
  GROUP_MEMBER_LIMIT_EXCEEDED: 'Qrupda maksimum üzv sayına çatılıb',
  GROUP_MEMBER_NOT_FOUND: 'Qrup üzvü tapılmadı',
  GROUP_MEMBER_ALREADY_EXISTS: 'Bu işçi artıq qrup üzvüdür',
  GROUP_ADMIN_NOT_FOUND: 'Qrup admini tapılmadı',
  GROUP_ADMIN_ALREADY_EXISTS: 'Bu işçi artıq qrup adminidir',
  GROUP_MEMBER_ADDED: 'Üzv qrupa əlavə edildi',
  GROUP_MEMBER_REMOVED: 'Üzv qrupdan çıxarıldı',
  GROUP_ADMIN_ADDED: 'Admin qrupa əlavə edildi',
  GROUP_ADMIN_REMOVED: 'Admin qrupdan çıxarıldı',
  
  // Mesaj mesajları
  MESSAGE_SENT: 'Mesaj göndərildi',
  MESSAGE_UPDATED: 'Mesaj yeniləndi',
  MESSAGE_DELETED: 'Mesaj silindi',
  MESSAGE_NOT_FOUND: 'Mesaj tapılmadı',
  MESSAGE_ACCESS_DENIED: 'Bu mesaja giriş icazəniz yoxdur',
  MESSAGE_MARKED_READ: 'Mesaj oxunmuş kimi işarələndi',
  MESSAGE_ENCRYPTION_ERROR: 'Mesaj şifrələmə xətası',
  MESSAGE_DECRYPTION_ERROR: 'Mesaj şifrəsini açma xətası',
  MESSAGE_TOO_LONG: 'Mesaj çox uzundur',
  MESSAGE_EMPTY: 'Mesaj boş ola bilməz'
};

module.exports = validationMessages;