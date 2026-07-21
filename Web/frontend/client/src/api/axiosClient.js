// src/api/axiosClient.js
import axios from "axios";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:3000";

const axiosClient = axios.create({
  baseURL: API_URL, 
  withCredentials: false,
});

/* ================= REQUEST INTERCEPTOR ================= */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Access token hết hạn
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // 🔥 Gọi API refresh-token
        const res = await axios.post(
          `${API_URL}/user/user/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;

        // 🔥 Lưu token mới
        localStorage.setItem("accessToken", newAccessToken);

        // 🔥 Gắn lại token mới cho request cũ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // 🔥 Gửi lại request ban đầu
        return axiosClient(originalRequest);
      } catch (err) {
        console.error("❌ Refresh token thất bại", err);

        // clear storage & đá về login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
