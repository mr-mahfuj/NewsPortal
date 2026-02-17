import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
});

export const getUsers = () => API.get("/users");
export const getUser = (id) => API.get(`/users/${id}`);

export const getNews = () => API.get("/news?_expand=author");
export const getNewsById = (id) => API.get(`/news/${id}`);
export const createNews = (data) => API.post("/news", data);
export const updateNews = (id, data) => API.patch(`/news/${id}`, data);
export const deleteNews = (id) => API.delete(`/news/${id}`);
