import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";

const CLOList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clos, setClos] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    loadCLOs();
    loadCourse();
  }, [courseId, user?.token]);

  // Change this:
  const loadCLOs = async () => {
    setLoading(true);
    try {
      const res = await HOD_API.clos.getCLOs(courseId, user?.token);
      // API returns an array in res.data
      const data = res?.data || [];
      console.log("Loaded CLOs:", data);
      setClos(data);
    } catch (err) {
      console.error("Error loading CLOs:", err);
      setClos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourse = async () => {
    try {
      const res = await HOD_API.courses.getCourseById(courseId);
      setCourse(res.data);
    } catch (err) {
      console.log("Course load error:", err);
    }
  };
  const handleEdit = (clo) => {
    // Build a draft object compatible with CLOForm
    const draft = {
      id: clo.id || clo._id,
      cloCode: clo.cloCode || clo.code,
      description: clo.description || clo.statement || "",
      bloomLevel: clo.bloomLevel || clo.bloom_level || "",
      version: clo.version || "",
      threshold: clo.threshold || clo.attainmentThreshold || 40,
      courseId: courseId,
    };

    navigate(`/hod/courses/${courseId}/create-clos/1`, {
      state: { closDraft: [draft], editClo: true },
    });
  };

  const handleAddCLO = () => {
    navigate(`/hod/courses/${courseId}/clo-count`);
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">CLOs for Course</h1>
          {course && (
            <p className="text-gray-600 mt-1">
              <strong>{course.code}</strong> — {course.name}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!loading && clos.length === 0 && (
            <button
              onClick={handleAddCLO}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add CLOs
            </button>
          )}

          {!loading && clos.length > 0 && (
            <button
              onClick={() => navigate(`/hod/courses/${courseId}/clo-mapping`)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Map CLOs
            </button>
          )}
        </div>
      </div>

      {/* LIST TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">CLO Code</th>
              <th className="border px-3 py-2">Description</th>
              <th className="border px-3 py-2">Bloom Level</th>
              <th className="border px-3 py-2">Threshold</th>
              <th className="border px-3 py-2">Status</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : clos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No CLOs have been created for this course yet.
                </td>
              </tr>
            ) : null}

            {clos.map((clo) => (
              <tr key={clo.id || clo._id || clo.code}>
                <td className="border px-3 py-2 font-semibold">
                  {clo.cloCode || clo.code}
                </td>
                <td className="border px-3 py-2">
                  {clo.description || clo.statement}
                </td>
                <td className="border px-3 py-2">
                  {clo.bloomLevel || clo.bloom_level || "-"}
                </td>
                <td className="border px-3 py-2">
                  {(clo.threshold || clo.attainmentThreshold || "-") +
                    (clo.threshold || clo.attainmentThreshold ? "%" : "")}
                </td>

                <td className="border px-3 py-2">
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      clo.isActive || clo.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {clo.isActive || clo.active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="border px-3 py-2">
                  <button
                    onClick={() =>
                      navigate(`/hod/courses/${courseId}/clo-mapping`)
                    }
                    className="px-3 py-1 bg-green-600 text-white rounded mr-2"
                  >
                    Map
                  </button>

                  <button
                    onClick={() => handleEdit(clo)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CLOList;
