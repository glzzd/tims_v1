export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    profile: "/auth/profile",
    verify: "/auth/verify",
    forgotPassword: "/auth/forgot-password"
  },
  users: {
    list: "/users",
    create: "/users",
    update: (id) => `/users/${id}`,
    delete: (id) => `/users/${id}`,
    updatePermissions: (id) => `/users/${id}/permissions`,
    logs: (id) => `/users/${id}/logs`,
    activity: (id) => `/users/${id}/activity`
  },
  groups: {
    list: "/groups",
    search: "/groups/search",
    byInstitution: (institutionId) => `/groups/institution/${institutionId}`,
    byEmployee: (employeeId) => `/groups/employee/${employeeId}`,
    myGroups: "/groups/my-groups",
    get: (id) => `/groups/${id}`,
    update: (id) => `/groups/${id}`,
    delete: (id) => `/groups/${id}`,
    create: "/groups",
    sendMessage: (groupId) => `/groups/${groupId}/messages`,
    institutionMessage: (institutionId) => `/groups/institution/${institutionId}/messages`,
    institutionMessageCount: (institutionId) => `/groups/institution/${institutionId}/messages/count`,
    directMessage: "/groups/messages/direct",
    directHistory: (employeeId) => `/groups/messages/direct/${employeeId}`,
    messages: (groupId) => `/groups/${groupId}/messages`,
    messagesSearch: (groupId) => `/groups/${groupId}/messages/search`,
    unreadCount: (groupId) => `/groups/${groupId}/messages/unread-count`,
    markMessageRead: (messageId) => `/groups/messages/${messageId}/read`,
    logs: `/groups/messages/logs`,
    addMember: (groupId) => `/groups/${groupId}/members`,
    removeMember: (groupId) => `/groups/${groupId}/members`,
    addAdmin: (groupId) => `/groups/${groupId}/admins`,
    removeAdmin: (groupId) => `/groups/${groupId}/admins`
  },
  employees: {
    list: "/employees",
    search: "/employees/search",
    byInstitution: (institutionId) => `/employees/institution/${institutionId}`,
    get: (id) => `/employees/${id}`,
    update: (id) => `/employees/${id}`,
    delete: (id) => `/employees/${id}`,
    activate: (id) => `/employees/${id}/activate`,
    deactivate: (id) => `/employees/${id}/deactivate`,
    create: "/employees"
  },
  institutions: {
    list: "/institutions",
    my: "/institutions/my",
    get: (id) => `/institutions/${id}`,
    update: (id) => `/institutions/${id}`,
    delete: (id) => `/institutions/${id}`,
    updateMessageLimit: (id) => `/institutions/${id}/message-limit`,
    types: "/institutions/types",
    create: "/institutions"
  }
};