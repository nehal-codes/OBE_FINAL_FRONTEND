import api from "../../config/axiosConfig";

// Get CLOs for a course
const getCLOs = (courseId, token) =>
  api.get(`/hod/course/${courseId}/clos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Create a single CLO (new — matches backend route)
const createCLOForCourse = (courseId, data) =>
  api.post(`/hod/clo/createClo/${courseId}`, data);

// Update an existing CLO
const updateCLO = (id, data) => api.put(`/hod/clo/${id}`, data);

// CLO-PO/PSO mapping
const mapCLOToPOPSO = (data) => api.post(`/hod/clo/map`, data);

// Get mapping for a course
const getCLOMappings = (courseId) => api.get(`/hod/clo/mappings/${courseId}`);

// Validate CLO count before creating
const validateCLOCount = (courseId, count) =>
  api.post(`/hod/course/${courseId}/clo-count`, { count });

// Save multiple CLOs (calls backend create one by one)
const createMultipleCLOs = async (courseId, cloArray) => {
  const results = [];
  for (let clo of cloArray) {
    const res = await createCLOForCourse(courseId, clo);
    results.push(res.data);
  }
  return results;
};

const cloAPI = {
  getCLOs,
  createCLOForCourse,
  updateCLO,
  mapCLOToPOPSO,
  getCLOMappings,
  validateCLOCount,
  createMultipleCLOs,
};

export default cloAPI;
