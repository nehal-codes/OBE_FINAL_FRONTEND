import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";

const CLOCount = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cloCount, setCloCount] = useState(null);
  const [countInput, setCountInput] = useState(1);
  const location = useLocation();
  const courseDraft = location.state?.courseDraft;
  const courseName = location.state?.courseName || courseDraft?.name;
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    // keep placeholder state; no initial fetch required for manual count input
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">CLO Count</h1>
        <button
          className="px-3 py-1 bg-gray-100 rounded"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <p className="text-sm text-gray-600 mb-3">Course ID: {courseId}</p>
        {courseName && (
          <p className="text-sm text-gray-600 mb-3">
            Course Name: {courseName}
          </p>
        )}
        <div className="mb-4">
          <label className="block mb-2">
            <div className="text-sm text-gray-600">
              Enter number of CLOs to create
            </div>
            <input
              type="number"
              min={1}
              value={countInput}
              onChange={(e) =>
                setCountInput(Math.max(1, Number(e.target.value || 0)))
              }
              className="w-24 border px-2 py-1"
            />
          </label>

          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => {
                // generate draft CLOs and go to mapping without saving
                const closDraft = Array.from(
                  { length: countInput },
                  (_, i) => ({
                    cloCode: `CLO${i + 1}`,
                    description: "",
                    bloomLevel: "",
                    version: "",
                    courseId: courseDraft?.id || courseId || "",
                    threshold: 40,
                  })
                );
                navigate(`/hod/courses/${courseId || "draft"}/clo-mapping`, {
                  state: { courseName, courseDraft, closDraft, returnTo },
                });
              }}
            >
              Next
            </button>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={() =>
                navigate(
                  `/hod/courses/${
                    courseId || "draft"
                  }/create-clos/${countInput}`,
                  {
                    state: { courseName, courseDraft, returnTo },
                  }
                )
              }
            >
              Create CLOs
            </button>
            <button
              className="px-3 py-1 bg-gray-100 rounded"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CLOCount;
