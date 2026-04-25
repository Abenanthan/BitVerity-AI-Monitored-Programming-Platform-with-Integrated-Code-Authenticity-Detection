import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('codeverify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('codeverify_token');
      localStorage.removeItem('codeverify_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data.data; // { token, user }
  },

  async getMe() {
    const response = await apiClient.get('/users/me');
    return response.data.data;
  },

  async getLeaderboard() {
    const response = await apiClient.get('/users/leaderboard');
    return response.data.data;
  },

  async getProblems(filters = {}) {
    const response = await apiClient.get('/problems', { params: filters });
    return response.data.data;
  },

  async getProblem(slug) {
    const response = await apiClient.get(`/problems/${slug}`);
    return response.data.data;
  },

  async submitCode(contestId, problemId, code, language, behaviorLog = [], isRun = false, customInput = null) {
    const payload = {
      problemId,
      code,
      language,
      behaviorLog,
      isRun,
      customInput
    };
    if (contestId && contestId !== 'undefined' && contestId !== 'null') payload.contestId = contestId;

    const response = await apiClient.post('/submissions', payload);
    return response.data.data;
  },

  async getDashboardData() {
    const response = await apiClient.get('/users/dashboard');
    return response.data.data;
  },

  async getResults(id) {
    const response = await apiClient.get(`/submissions/${id}`);
    return response.data.data; // Returns full submission + AI report
  },
};
