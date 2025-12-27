// frontend/src/apis/HOD/programmes.api.js
import api from "../../config/axiosConfig";

const getAll = (token) =>
  api.get("/hod/programmes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
const getProgrammeById = (id) => api.get(`/hod/programmes/${id}`);
const createProgramme = (data) => api.post("/hod/programmes", data);
const updateProgramme = (id, data) => api.put(`/hod/programmes/${id}`, data);
const deleteProgramme = (id) => api.delete(`/hod/programmes/${id}`);

const programmesAPI = {
  getAll,
  getProgrammeById,
  createProgramme,
  updateProgramme,
  deleteProgramme,
};

export default programmesAPI;
