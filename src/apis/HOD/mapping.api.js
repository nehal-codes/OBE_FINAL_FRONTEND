import api from "../../config/axiosConfig";

//Map CLOs to POs and PSOs
const saveMappings = (courseId, data, token) =>
  api.post(`/hod/course/${courseId}/map-clos`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Fetch existing mappings for a course
const getMappings = (courseId, token) =>
  api.get(`/hod/course/${courseId}/map-clos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

const mappingAPI = {
  saveMappings,
  getMappings,
};

export default mappingAPI;
