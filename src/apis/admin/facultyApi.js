import axios from "../../config/axiosConfig";

const getToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

export const adminFacultyApi = {
  // Get all departments for dropdown (using admin department endpoint)
  getDepartmentsForDropdown: async () => {
    try {
      const response = await axios.get('/admin/departments/dropdown', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in getDepartmentsForDropdown:', error);
      throw error;
    }
  },

  // Get all faculty
  getAllFaculty: async () => {
    try {
      const response = await axios.get('/admin/faculty', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in getAllFaculty:', error);
      throw error;
    }
  },

  // Get faculty by department
  getFacultyByDepartment: async (departmentId) => {
    try {
      const response = await axios.get(`/admin/faculty/department/${departmentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in getFacultyByDepartment:', error);
      throw error;
    }
  },

  // Create new faculty
  createFaculty: async (facultyData) => {
    try {
      const response = await axios.post('/admin/faculty', facultyData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in createFaculty:', error);
      throw error;
    }
  },

  // Update faculty
  updateFaculty: async (facultyId, facultyData) => {
    try {
      const response = await axios.put(`/admin/faculty/${facultyId}`, facultyData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in updateFaculty:', error);
      throw error;
    }
  },

  // Delete faculty (soft delete)
  deleteFaculty: async (facultyId) => {
    try {
      const response = await axios.delete(`/admin/faculty/${facultyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in deleteFaculty:', error);
      throw error;
    }
  },

  // Get faculty details
  getFacultyDetails: async (facultyId) => {
    try {
      const response = await axios.get(`/admin/faculty/${facultyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response;
    } catch (error) {
      console.error('API Error in getFacultyDetails:', error);
      throw error;
    }
  }
};

export default adminFacultyApi;