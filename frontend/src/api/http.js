import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const http = axios.create({
  baseURL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname.replace(/\/$/, "") || "/";
      if (path !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default http;
