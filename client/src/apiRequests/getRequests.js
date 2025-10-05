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
    const msg = error?.response?.data?.message || error?.message || 'İstək xətası';
    try { window.__showToast && window.__showToast({ type: 'error', title: 'Xəta', message: msg }); } catch (_) {}
    return Promise.reject(error);
  }
);

export const getRequests = {
  getProfile: () => apiClient.get(endpoints.auth.profile),
  verifyToken: () => apiClient.get(endpoints.auth.verify),
  // Lists
  getUsers: (params) => apiClient.get(endpoints.users.list, { params }),
  getEmployees: (params) => apiClient.get(endpoints.employees.list, { params }),
  getInstitutions: (params) => apiClient.get(endpoints.institutions.list, { params }),
  getGroups: (params) => apiClient.get(endpoints.groups.list, { params }),
  getGroupsByInstitution: (institutionId) => apiClient.get(endpoints.groups.byInstitution(institutionId)),
  getGroupsByEmployee: (employeeId) => apiClient.get(endpoints.groups.byEmployee(employeeId)),
  getDirectHistory: (employeeId, params) => apiClient.get(endpoints.groups.directHistory(employeeId), { params }),
  getMyGroups: () => apiClient.get(endpoints.groups.myGroups),
  searchGroups: (params) => apiClient.get(endpoints.groups.search, { params }),
  getGroup: (id) => apiClient.get(endpoints.groups.get(id)),
  getGroupMessages: (groupId, params) => apiClient.get(endpoints.groups.messages(groupId), { params }),
  searchGroupMessages: (groupId, params) => apiClient.get(endpoints.groups.messagesSearch(groupId), { params }),
  getUnreadCount: (groupId) => apiClient.get(endpoints.groups.unreadCount(groupId)),
  getInstitutionMessageCount: (institutionId) => apiClient.get(endpoints.groups.institutionMessageCount(institutionId)),
  getMessageLogs: (params) => apiClient.get(endpoints.groups.logs, { params }),
  // Employees
  getEmployeesByInstitution: (institutionId) => apiClient.get(endpoints.employees.byInstitution(institutionId)),
  searchEmployees: (params) => apiClient.get(endpoints.employees.search, { params }),
  getEmployee: (id) => apiClient.get(endpoints.employees.get(id)),
  // User logs
  getUserLogs: (id, params) => apiClient.get(endpoints.users.logs(id), { params }),
  // User activity (actions performed by the user)
  getUserActivity: (id, params) => apiClient.get(endpoints.users.activity(id), { params }),
  // Institutions
  getMyInstitutions: () => apiClient.get(endpoints.institutions.my),
  getInstitutionTypes: () => apiClient.get(endpoints.institutions.types),
  getInstitution: (id) => apiClient.get(endpoints.institutions.get(id))
};