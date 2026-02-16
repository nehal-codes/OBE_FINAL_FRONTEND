// src/apis/assessment.js
import api from "../../config/axiosConfig";

export const assessmentApi = {
  // Assessment endpoints
  createAssessment: (data) => api.post('/assessments', data),
  
  getCourseAssessments: (courseId, params) => api.get(`/assessments/course/${courseId}`, { params }),
  
  getAssessment: (assessmentId) => api.get(`/assessments/${assessmentId}`),
  
  updateAssessment: (assessmentId, data) => api.put(`/assessments/${assessmentId}`, data),
  
  deleteAssessment: (assessmentId) => api.delete(`/assessments/${assessmentId}`),
  
  getAvailableMarks: (courseId, params) => api.get(`/assessments/${courseId}/available-marks`, { params }),

  // Assessment-CLO endpoints
  mapClosToAssessment: (assessmentId, data) => api.post(`/assessments/${assessmentId}/clos`, data),
  
  getAssessmentClos: (assessmentId) => api.get(`/assessments/assess/${assessmentId}/clos`),
  
  getCourseClos: (courseId) => api.get(`/assessments/${courseId}/clos`),

  // Marks endpoints
  enterBulkMarks: (assessmentId, data) => api.post(`/assessments/${assessmentId}/marks/bulk`, data),
  
  getAssessmentMarks: (assessmentId) => api.get(`/assessments/${assessmentId}/marks`),
  
  getStudentMarks: (assessmentId, studentId) => api.get(`/assessments/${assessmentId}/students/${studentId}/marks`),
  
  getCourseStudents: (courseId, params) => api.get(`/assessments/${courseId}/students`, { params }),

  // Validation endpoints
  checkPracticalAssessment: (courseId, params) => api.get(`/validation/course/${courseId}/has-practical`, { params }),
  
  validateAssessment: (data) => api.post('/validation/assessment', data),
  
  validateMarksEntry: (data) => api.post('/validation/marks', data),

  // Finalize marks for an assessment
  finalizeAssessmentMarks: (assessmentId) => 
    api.patch(`/assessments/${assessmentId}/finalize-marks`),

  // Get finalization status for an assessment
  getAssessmentFinalizationStatus: (assessmentId) => 
    api.get(`/assessments/${assessmentId}/finalization-status`)
};

export default assessmentApi;