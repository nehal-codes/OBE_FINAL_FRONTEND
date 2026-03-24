// frontend/src/apis/HOD/courses.api.js
import api from "../../config/axiosConfig";

const getCourses = () => api.get("/hod/all-courses");

const getAll = () => api.get("/hod/all-courses");

const getCourseById = (id) => api.get(`/hod/course/${id}`);

const createCourse = (data) => {
  // data must contain: code, name, description, credits, category, version, programmeId
  return api.post("/hod/course", data);
};

const updateCourse = (id, data) => api.put(`/hod/course/${id}`, data);

const deleteCourse = (id) => api.delete(`/hod/course/${id}`);

const getAutoCode = (programmeId, token) =>
  api.get(`/hod/program/${programmeId}/auto-code`, {
    headers: { Authorization: `Bearer ${token}` },
  });

const getCoursesByAcademicPeriod = (year, semester, token) => {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return api.get(`/hod/courses?year=${year}&semester=${semester}`, config);
};

const coursesAPI = {
  getCourses,
  getAll,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAutoCode,
  getCoursesByAcademicPeriod,
};

export default coursesAPI;
