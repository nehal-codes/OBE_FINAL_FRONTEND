import api from "../../config/axiosConfig";

/**
 * Reports API for HOD module
 * Handles all report-related API calls including program reports and course contributions
 */

const getProgramReport = (programId, token) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return api.get(`/reports/program-report?programId=${programId}`, config);
};

const getCourseContributions = (courseId, token) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return api.get(`/hod/reports/course/${courseId}/contributions`, config);
};

// Export all report API functions
const reportsAPI = {
  getProgramReport,
  getCourseContributions,
};

export default reportsAPI;