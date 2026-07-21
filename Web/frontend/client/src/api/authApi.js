import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => {
    // Gọi đường dẫn API Login thông qua Gateway
    // Gateway map /user -> User Service
    // User Service map /user/login -> Hàm login
    // => URL đầy đủ: /user/user/login
    return axiosClient.post('/user/user/login', data);
  },
  
  // Sau này bạn có thể thêm register, getProfile... ở đây
  getProfile: () => {
      return axiosClient.get('/user/user/profile');
  }
}

export default authApi;