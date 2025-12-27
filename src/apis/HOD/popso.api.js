import api from "../../config/axiosConfig";

// Get all POs and PSOs in HOD's department
const getPOPSO = (courseId, token) =>
  api.get(`/hod/course/${courseId}/po-pso`, {
    headers: { Authorization: `Bearer ${token}` },
  });
const popsoAPI = {
  getPOPSO,
};

export default popsoAPI;
