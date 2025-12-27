// frontend/src/apis/HOD/index.js
import api from "../../config/axiosConfig";

import programmesAPI from "./programmes.api";
import coursesAPI from "./courses.api";
import cloAPI from "./clo.api";
import popsoAPI from "./popso.api";
import mappingAPI from "./mapping.api";

// Unified HOD API Wrapper
const HOD_API = {
  programmes: programmesAPI,
  courses: coursesAPI,
  clos: cloAPI,
  popso: popsoAPI,
  map: mappingAPI,

  // 🔥 Dashboard API
  getDashboardStats: {
    // Accept an optional token and include it in headers if provided.
    getStats: (token) => {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      return api.get("/hod/dashboard/stats", config);
    },
  },
};

export default HOD_API;
