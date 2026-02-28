import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
});

// Add token to requests if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const register = (data) => API.post("/register", data);
export const login = (data) => API.post("/login", data);
export const getCurrentUser = () => API.get("/users/me");

// News API
export const getNews = () => API.get("/news");
export const getNewsById = (id) => API.get(`/news/${id}`);
export const createNews = (data) => API.post("/news", data);
export const updateNews = (id, data) => API.patch(`/news/${id}`, data);
export const deleteNews = (id) => API.delete(`/news/${id}`);

// Comments API - Updated for FastAPI backend
export const getComments = (newsId) => API.get(`/news/${newsId}/comments`);
export const addComment = (newsId, commentData) => API.post(`/news/${newsId}/comments`, commentData);
export const deleteComment = (commentId) => API.delete(`/comments/${commentId}`);

// Legacy compatibility (if needed)
export const getUsers = () => getCurrentUser();
export const getUser = (id) => getCurrentUser();
