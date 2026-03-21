import axios from "../../config/axiosConfig";

const getToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

export const userApi = {
  // Get users grouped by category (main view)
  getUsersByCategory: () => axios.get('/admin/users/categories', {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get user statistics
  getUserStats: () => axios.get('/admin/users/stats', {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get all users with filters
  getAllUsers: (params) => axios.get('/admin/users', {
    headers: { Authorization: `Bearer ${getToken()}` },
    params
  }),

  // Get single user details
  getUserDetails: (userId) => axios.get(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Check user dependencies
  checkUserDependencies: async (userId) => {
    try {
      const response = await axios.get(`/admin/users/${userId}/dependencies`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in checkUserDependencies:', error);
      throw error;
    }
  },

  // Toggle user status with force option
  toggleUserStatus: async (userId, isActive, force = false) => {
    try {
      const response = await axios.patch(`/admin/users/${userId}/toggle-status`, 
        { isActive, force },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return response;
    } catch (error) {
      console.error('API Error in toggleUserStatus:', error);
      throw error;
    }
  }
};

export default userApi;