import axios from "axios";
import { endpoints } from "../const/endpoints";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", 
  headers: {
    "Content-Type": "application/json"
  }
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Prefer SPA navigation to avoid full page reloads
      try {
        if (typeof window.__navigate === 'function') {
          window.__navigate('/login', { replace: true });
        } else {
          window.location.href = '/login';
        }
      } catch (_) {
        window.location.href = '/login';
      }
    }
    // Global hata bildirimi
    const msg = error?.response?.data?.message || error?.message || 'İstək xətası';
    try { window.__showToast && window.__showToast({ type: 'error', title: 'Xəta', message: msg }); } catch (_) {}
    return Promise.reject(error);
  }
);

export const postRequests = {
  login: (data) => apiClient.post(endpoints.auth.login, data),
  logout: (data) => apiClient.post(endpoints.auth.logout, data),
  forgotPassword: (data) => apiClient.post(endpoints.auth.forgotPassword, data),
  // Users
  createUser: (data) => apiClient.post(endpoints.users.create, data),
  updateUserPermissions: (id, data) => apiClient.patch(endpoints.users.updatePermissions(id), data),
  updateUser: (id, data) => apiClient.put(endpoints.users.update(id), data),
  deleteUser: (id) => apiClient.delete(endpoints.users.delete(id)),
  // Messaging
  sendInstitutionMessage: (institutionId, data) => apiClient.post(endpoints.groups.institutionMessage(institutionId), data),
  sendDirectMessage: (data) => apiClient.post(endpoints.groups.directMessage, data),
  sendGroupMessage: (groupId, data) => apiClient.post(endpoints.groups.sendMessage(groupId), data),
  // Employees
  createEmployee: (data) => apiClient.post(endpoints.employees.create, data),
  updateEmployee: (id, data) => apiClient.put(endpoints.employees.update(id), data),
  deleteEmployee: (id) => apiClient.delete(endpoints.employees.delete(id)),
  activateEmployee: (id) => apiClient.put(endpoints.employees.activate(id)),
  deactivateEmployee: (id) => apiClient.put(endpoints.employees.deactivate(id)),
  // Institutions
  createInstitution: (data) => apiClient.post(endpoints.institutions.create, data),
  updateInstitution: (id, data) => apiClient.put(endpoints.institutions.update(id), data),
  deleteInstitution: (id) => apiClient.delete(endpoints.institutions.delete(id)),
  updateMessageLimit: (id, data) => apiClient.patch(endpoints.institutions.updateMessageLimit(id), data),
  // Groups
  createGroup: (data) => apiClient.post(endpoints.groups.create, data),
  updateGroup: (id, data) => apiClient.put(endpoints.groups.update(id), data),
  deleteGroup: (id) => apiClient.delete(endpoints.groups.delete(id)),
  addGroupMember: (groupId, data) => apiClient.post(endpoints.groups.addMember(groupId), data),
  removeGroupMember: (groupId, data) => apiClient.delete(endpoints.groups.removeMember(groupId), { data }),
  addGroupAdmin: (groupId, data) => apiClient.post(endpoints.groups.addAdmin(groupId), data),
  removeGroupAdmin: (groupId, data) => apiClient.delete(endpoints.groups.removeAdmin(groupId), { data }),
  markMessageAsRead: (messageId) => apiClient.put(endpoints.groups.markMessageRead(messageId))
};