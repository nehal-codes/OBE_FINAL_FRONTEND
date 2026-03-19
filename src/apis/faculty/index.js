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
   
  submitReportToHOD: (reportData) => axios.post('/faculty/reports/submit-to-hod', reportData),
 checkReportSubmission: (params) => axios.get('/faculty/reports/check-submission', { params }),
 // Add these to facultyApi object:

// Indirect Assessment (CLO Ratings)
importIndirectAssessments: (courseId, payload) =>
  axios.post(`/${courseId}/indirect-assessments/import`, payload),

getIndirectAssessments: (courseId, params) =>
  axios.get(`/${courseId}/indirect-assessments`, { params }),

getIndirectAssessmentMetadata: (courseId) =>
  axios.get(`/${courseId}/indirect-assessments/metadata`),

deleteIndirectAssessments: (courseId, payload) =>
  axios.delete(`${courseId}/indirect-assessments`, { data: payload }),

getIndirectAssessmentTemplate: (courseId) =>
  axios.get(`${courseId}/indirect-assessments/template`),
  
};

export default facultyApi;