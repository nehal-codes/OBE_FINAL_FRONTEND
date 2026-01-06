// frontend/src/apis/HOD/assignments.api.js
import api from "../../config/axiosConfig";

const assignmentsAPI = {
  // Get all faculties in department
  getDepartmentFaculties: () => api.get("/hod/faculties"),

  // Get available faculties for a course
  getAvailableFacultiesForCourse: (courseId, semester, year) => 
    api.get(`/hod/courses/${courseId}/available-faculties`, {
      params: { semester, year }
    }),

  // Get course assignments
  getCourseAssignments: (courseId, semester, year) => 
    api.get(`/hod/courses/${courseId}/assignments`, {
      params: { semester, year }
    }),

  // Assign faculty to course
  assignFacultyToCourse: (courseId, data) => 
    api.post(`/hod/courses/${courseId}/assign`, data),

  // Update assignment
  updateAssignment: (courseId, facultyId, semester, year, data) =>
    api.put(`/hod/courses/${courseId}/assignments/${facultyId}/${semester}/${year}`, data),

  // Remove assignment
  removeAssignment: (courseId, facultyId, semester, year) =>
    api.delete(`/hod/courses/${courseId}/assignments/${facultyId}/${semester}/${year}`),

  // Get faculty workload
  getFacultyWorkload: (facultyId, year) =>
    api.get(`/hod/faculties/${facultyId}/workload`, {
      params: { year }
    }),
     getAllDepartmentAssignments: (filters = {}) => 
    api.get("/hod/assignments", {
      params: {
        semester: filters.semester,
        year: filters.year,
        facultyId: filters.facultyId,
        courseId: filters.courseId,
        page: filters.page,
        limit: filters.limit,
        status: filters.status
      }
    }),

  // Get assignments statistics (for dashboard)
  getAssignmentsStats: () => 
    api.get("/hod/assignments/stats"),
};




export default assignmentsAPI;