import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,  // 120 seconds = 2 minutes, supports AI batch processing
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add user info to header for backend use
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          config.headers['X-User-Info'] = userInfoStr;
        }
      } catch (error) {
        console.warn('Failed to set X-User-Info header:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  // User related
  login: (data: { username: string; password: string }) =>
    api.post('/user/login', data),
  
  register: (data: { username: string; password: string; email: string }) =>
    api.post('/user/register', data),

  getProfile: () =>
    api.get('/user/profile'),

  getUserStatistics: () =>
    api.get('/user/statistics'),

  updateProfile: (data: { username?: string; email?: string }) =>
    api.put('/user/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/user/change-password', data),

  manageTwoFactor: (data: { action: 'enable' | 'disable'; code?: string }) =>
    api.post('/user/two-factor', data),

  getAllUsers: () =>
    api.get('/user/all'),

  // Content audit
  auditText: (content: string, templateConfig?: any, forceRefresh?: boolean) =>
    api.post('/content/audit/text', { content, template_config: templateConfig, force_refresh: forceRefresh }),
  
  auditImage: (imageUrl: string) =>
    api.post('/content/audit/image', { image_url: imageUrl }),
  
  auditBatch: (items: Array<{ type: string; content: string }>) =>
    api.post('/content/audit/batch', { items }),



  // Statistics
  getStatistics: () =>
    api.get('/content/statistics'),

  // Dashboard enhanced APIs
  getDashboardSummary: () =>
    api.get('/dashboard/executive-summary'),
  
  getRealTimeMetrics: () =>
    api.get('/dashboard/real-time-metrics'),
  
  getContentAnalytics: () =>
    api.get('/dashboard/content-analytics'),
  
  getSystemHealth: () =>
    api.get('/dashboard/system-health'),
  
  getQueueStatus: () =>
    api.get('/dashboard/queue-status'),

  // Manual Review
  reviewAudit: (auditId: number, decision: { status: 'PASS' | 'REJECT', reason: string }) =>
    api.put(`/content/audit/${auditId}/review`, decision),

  // Template APIs
  getTemplates: () => api.get('/template'),
  getTemplate: (id: number) => api.get(`/template/${id}`),
  createTemplate: (data: any) => api.post('/template', data),
  updateTemplate: (id: number, data: any) => api.put(`/template/${id}`, data),
  deleteTemplate: (id: number) => api.delete(`/template/${id}`),
  setDefaultTemplate: (id: number) => api.post(`/template/${id}/set-default`),

  // Study APIs
  getStudies: () => api.get('/study'),
  getStudy: (id: number) => api.get(`/study/${id}`),
  getStudyRecords: (
    id: number,
    params: { status?: string; contentType?: 'TEXT' | 'IMAGE'; q?: string; page?: number; size?: number } = {}
  ) => api.get(`/study/${id}/records`, { params }),
  createStudy: (data: any) => api.post('/study', data),
  updateStudy: (id: number, data: any) => api.put(`/study/${id}`, data),
  deleteStudy: (id: number) => api.delete(`/study/${id}`),
  updateStudyStatus: (id: number, status: string) => api.put(`/study/${id}/status`, status),
  updateRecordFromAudit: (studyId: number, recordId: number, updateData: any) =>
    api.put(`/study/${studyId}/records/${recordId}/update-from-audit`, updateData),
  updateRecordStatus: (studyId: number, recordId: number, status: string) =>
    api.put(`/study/${studyId}/records/${recordId}/status`, { status }),
  updateRecordConfidence: (studyId: number, recordId: number, confidence: number) =>
    api.put(`/study/${studyId}/records/${recordId}/confidence`, { confidence }),
  updateRecordReason: (studyId: number, recordId: number, reason: string) =>
    api.put(`/study/${studyId}/records/${recordId}/reason`, { reason }),
  addStudyRecordsBatch: (id: number, items: Array<{ content: string; contentType: 'TEXT' | 'IMAGE' }>) =>
    api.post(`/study/${id}/records:batch`, { items }),
  startStudy: (id: number, templateId?: string) =>
    api.post(`/study/${id}/start`, null, { params: templateId ? { templateId } : {} }),
  uploadStudyRecords: (
    id: number,
    file: File,
    params: { format?: string; defaultContentType?: 'TEXT' | 'IMAGE'; startImmediately?: boolean } = {}
  ) => {
    const form = new FormData();
    form.append('file', file);
    const query = new URLSearchParams();
    if (params.format) query.set('format', params.format);
    if (params.defaultContentType) query.set('defaultContentType', params.defaultContentType);
    if (typeof params.startImmediately !== 'undefined') query.set('startImmediately', String(params.startImmediately));
    const qs = query.toString();
    const url = `/study/${id}/records:upload${qs ? `?${qs}` : ''}`;
    return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  lockTemplate: (studyId: number, templateId: number) => 
    api.post(`/study/${studyId}/lock-template?templateId=${templateId}`),
}; 