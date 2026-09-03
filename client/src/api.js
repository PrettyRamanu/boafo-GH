import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((config) => { const token = localStorage.getItem('boafo_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((res) => res, (err) => { if (err.response?.status === 401) { localStorage.removeItem('boafo_token'); localStorage.removeItem('boafo_user'); localStorage.removeItem('boafo_role'); } return Promise.reject(err); });
export default api;
