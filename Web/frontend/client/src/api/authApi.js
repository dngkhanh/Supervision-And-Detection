import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => {
    return axiosClient.post('/user/login', data);
  },

  getProfile: () => {
    return axiosClient.get('/user/profile');
  }
}

export default authApi;