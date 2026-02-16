// frontend/src/apis/HOD/index.js
import api from "../../config/axiosConfig";

import programmesAPI from "./programmes.api";
import coursesAPI from "./courses.api";
import cloAPI from "./clo.api";
import popsoAPI from "./popso.api";
import mappingAPI from "./mapping.api";
import assignmentsAPI from "./assignments.api";
import reportsAPI from "./reports.api"; 

const HOD_API = {
  programmes: programmesAPI,
  courses: coursesAPI,
  clos: cloAPI,
  popso: popsoAPI,
  map: mappingAPI,
  assignments: assignmentsAPI, 
  reports: reportsAPI,
  getDashboardStats: {
    getStats: (token) => {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      return api.get("/hod/dashboard/stats", config);
    },
  },
};

export default HOD_API;
