import axios from "../../config/axiosConfig";

export const facultyApi = {
  // Get faculty profile with assignments
  getProfile: () => axios.get('/faculty/profile', {
    headers: { Authorization: `Bearer ${token}` },
  }),
  
  // Get current semester assignments
  getCurrentAssignments: () => axios.get('/faculty/assignments/current'),
  
  // Get all assignments (historical)
  getAllAssignments: (params) => axios.get('/faculty/assignments', { params }),
  
  // Get course details with CLOs
  getCourseDetails: (courseId) => axios.get(`/faculty/courses/${courseId}`),
  
  // Get dashboard statistics
  getDashboardStats: () => axios.get('/faculty/dashboard/stats'),
  
  // Get academic calendar info
  getAcademicCalendar: () => axios.get('/faculty/calendar'),
  
  // Get department info
  getDepartmentInfo: () => axios.get('/faculty/department'),
};

export default facultyApi;