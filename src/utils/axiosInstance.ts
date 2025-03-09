import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://backend.h7tex.com/api",
    withCredentials: true, // Ensures cookies (if used) are sent with requests
  });

// Add request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("auth_token");

    if (!token) {
      // Try fetching from cookies if applicable (only works for non-httpOnly cookies)
      token = document.cookie.split("; ").find(row => row.startsWith("auth_token="))?.split("=")[1];
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
