import api from "../../config/axiosConfig";

//Map CLOs to POs and PSOs
const saveMappings = (courseId, data, token) =>
  api.post(`/hod/course/${courseId}/map-clos`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

const mappingAPI = {
  saveMappings,
};

export default mappingAPI;
