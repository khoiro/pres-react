import axios from "axios";

const api = axios.create({
  baseURL: "https://apipresensi.sidoarjokab.go.id/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Saat mengirim FormData (upload foto dll), biarkan browser yang
    // menentukan Content-Type (multipart/form-data; boundary=...)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
