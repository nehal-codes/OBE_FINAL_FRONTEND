import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import HOD_API from "../../apis/HOD";

import CourseForm from "./CourseSetup/CourseForm";

const CourseManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");

  const { user } = useAuth();

  useEffect(() => {
    // open form if navigated here with state (edit from review flow)
    if (location.state?.openCourseForm || location.state?.courseDraft) {
      setEditCourse(location.state?.courseDraft || null);
      setOpenForm(true);
      // clear the navigation state
      navigate(location.pathname, { replace: true });
    }
    if (!user) return;
    loadProgrammes();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, [user, selectedProgramme]);

  const loadCourses = async () => {
    try {
      const res = await HOD_API.courses.getAll(user?.token);

      let fetched = Array.isArray(res?.data) ? res.data : [];

      if (selectedProgramme) {
        fetched = fetched.filter(
          (c) =>
            String(c?.department?.program?.id || "") ===
            String(selectedProgramme)
        );
      }

      setCourses(fetched);
    } catch (err) {
      console.log("Error loading courses", err);
      setCourses([]); // 👈 prevent undefined crash
    }
  };

  const loadProgrammes = async () => {
    try {
      const res = await HOD_API.programmes.getAll(user?.token);
      if (res?.data && Array.isArray(res.data)) {
        setProgrammes(res.data);
        return;
      }
    } catch (err) {
      console.warn(
        "Could not fetch programmes from API; falling back to program codes from courses.",
        err
      );
    }

    try {
      const res = await HOD_API.courses.getAll(user?.token);
      const unique = Array.from(
        new Map(
          (res.data || []).map((c) => [
            String(c?.department?.program?.id),
            c?.department?.program,
          ])
        ).values()
      ).filter(Boolean);
      setProgrammes(unique);
    } catch (err) {
      console.log("Error fetching programmes fallback", err);
    }
  };

  const handleAddCourse = () => {
    setEditCourse(null);
    setOpenForm(true);
  };

  const handleEdit = (course) => {
    setEditCourse(course);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to deactivate this course?")) return;

    try {
      await HOD_API.courses.delete(id, user?.token);
      loadCourses();
    } catch (err) {
      alert("Error deleting course");
    }
  };

  const handleCourseSaved = (courseId) => {
    navigate(`/hod/courses/${courseId}/clo-count`);
    loadCourses();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold">Course Management</h1>

        <div className="flex items-center gap-3">
          <select
            value={selectedProgramme}
            onChange={(e) => setSelectedProgramme(e.target.value)}
            className="border px-2 py-1 rounded mr-2"
          >
            <option value="">All Programmes</option>
            {(programmes || []).map((p) => (
              <option key={p?.id} value={p?.id}>
                {p?.code || p?.id} {p?.name ? `- ${p.name}` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Course
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Code</th>
            <th className="border px-3 py-2 text-left">Name</th>
            <th className="border px-3 py-2 text-left">Credits</th>
            <th className="border px-3 py-2 text-left">Programme</th>
            <th className="border px-3 py-2 text-left">Category</th>
            <th className="border px-3 py-2 text-left">Status</th>
            <th className="border px-3 py-2 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {(courses || []).map((c) => (
            <tr key={c.id}>
              <td className="border px-3 py-2">{c.code}</td>
              <td className="border px-3 py-2">{c.name}</td>
              <td className="border px-3 py-2">{c.credits}</td>

              <td className="border px-3 py-2">
                {c?.department?.program?.code || "—"}
              </td>

              <td className="border px-3 py-2">{c.category}</td>

              <td className="border px-3 py-2">
                {c.isActive ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </td>

              <td className="border px-3 py-2 text-center">
                <button
                  className="px-2 py-1 bg-yellow-400 text-black rounded mr-2"
                  onClick={() => handleEdit(c)}
                >
                  Edit
                </button>

                <button
                  className="px-2 py-1 bg-red-600 text-white rounded"
                  onClick={() => handleDelete(c.id)}
                >
                  Delete
                </button>

                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
                  onClick={() => navigate(`/hod/courses/${c.id}/clos`)}
                >
                  CLOs
                </button>
              </td>
            </tr>
          ))}

          {courses.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-5 text-gray-500">
                No courses available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <CourseForm
        open={openForm}
        initialData={editCourse}
        defaultProgrammeId={selectedProgramme}
        programmes={programmes}
        onClose={() => setOpenForm(false)}
        onSaved={handleCourseSaved}
      />
    </div>
  );
};

export default CourseManagement;
