import axios from 'axios';

// Create axios instance, consistent with index.ts
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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

// Golden Set API - only keep backend endpoints that actually exist
export const goldenSetApi = {
  // Get available Golden Set templates for specified template ✅
  getAvailableTemplatesForTemplate: (templateId: string) =>
    api.get(`/template/golden-sets/templates/${templateId}/available`),
  
  // Get all Golden Sets for template (using correct backend path) ✅
  getGoldenSetsByTemplateId: (templateId: string) =>
    api.get(`/template/golden-sets/templates/${templateId}/golden-sets`),
  
  // Get available Golden Set templates ✅
  getAvailableTemplates: () =>
    api.get(`/template/golden-sets/available-templates`),
    
  // Import Golden Set template for specified template ✅
  importTemplateForTemplate: (templateId: string, templateKey: string) =>
    api.post(`/template/golden-sets/templates/${templateId}/import/${templateKey}`),
    
  // Upload Golden Set file for specified template ✅
  uploadForTemplate: (templateId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/template/golden-sets/templates/${templateId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Create new Golden Set ✅
  createGoldenSet: (templateId: string, goldenSetData: any) =>
    api.post(`/template/golden-sets/templates/${templateId}/golden-sets`, goldenSetData),

  // Update Golden Set ✅
  updateGoldenSet: (id: number, goldenSetData: any) =>
    api.put(`/template/golden-sets/golden-sets/${id}`, goldenSetData),

  // Delete Golden Set ✅
  deleteGoldenSet: (id: number) =>
    api.delete(`/template/golden-sets/golden-sets/${id}`),

  // Check service status ✅
  ping: () => api.get(`/template/golden-sets/ping`),
  
  // Get service information ✅  
  info: () => api.get(`/template/golden-sets/info`),
};
