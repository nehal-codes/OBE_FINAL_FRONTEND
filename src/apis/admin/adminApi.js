import axios from "../../config/axiosConfig";

const getToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

export const adminApi = {
  // Dashboard - Get program types with counts
  getDashboardStats: () => axios.get('/admin/dashboard', {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get all program levels
  getProgramLevels: () => axios.get('/admin/program-levels', {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get programs by level (UG, PG, etc.)
  getProgramsByLevel: (level) => axios.get(`/admin/programs/level/${level}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get departments under a program
  getDepartmentsByProgram: (programId) => axios.get(`/admin/programs/${programId}/departments`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get courses under a department
  getCoursesByDepartment: (departmentId) => axios.get(`/admin/departments/${departmentId}/courses`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get single program details
  getProgramDetails: (programId) => axios.get(`/admin/programs/${programId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get single department details
  getDepartmentDetails: (departmentId) => axios.get(`/admin/departments/${departmentId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),

  // Get single course details
  getCourseDetails: (courseId) => axios.get(`/admin/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
};

export default adminApi;