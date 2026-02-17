import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import {
  FiArrowLeft,
  FiPlus,
  FiBook,
  FiHash,
  FiCpu,
  FiTarget,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const CLOCount = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const courseDraft = location.state?.courseDraft;
  const courseName = location.state?.courseName || courseDraft?.name;
  const returnTo = location.state?.returnTo;

  const [countInput, setCountInput] = useState(1);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [courseId, user?.token]);

  const loadCourse = async () => {
    try {
      if (!courseId || courseId === "draft") {
        setCourse(courseDraft || null);
        return;
      }

      if (!user?.token) return;

      const res = await HOD_API.courses.getCourseById(courseId);
      setCourse(res.data);
    } catch (err) {
      console.log("Course load error:", err);
      setCourse(null);
    }
  };

  const incrementCount = () => setCountInput((p) => Math.min(p + 1, 6));
  const decrementCount = () => setCountInput((p) => Math.max(p - 1, 1));

  const handleCountChange = (val) => {
    const v = Number(val);
    setCountInput(Math.min(Math.max(v, 1), 6));
  };

  const handleCreateCLOs = () => {
    navigate(`/hod/courses/${courseId || "draft"}/create-clos/${countInput}`, {
      state: { courseName, courseDraft, returnTo },
    });
  };

  const handleDirectMapping = () => {
    const closDraft = Array.from({ length: countInput }, (_, i) => ({
      cloCode: `CLO${i + 1}`,
      description: "",
      bloomLevel: "",
      version: "",
      threshold: 40,
    }));

    navigate(`/hod/courses/${courseId || "draft"}/clo-mapping`, {
      state: { courseName, courseDraft, closDraft, returnTo },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Define Learning Outcomes
              </h1>
              <p className="text-lg text-gray-600">
                Specify how many Course Learning Outcomes (CLOs) to create for
                this course
              </p>
            </div>
          </div>
        </div>

        {/* Course Info */}
        {(course || courseDraft) && (
          <div className="bg-white rounded-xl border border-gray-200 p-7 mb-10">
            <div className="flex items-start gap-5">
              <div className="p-4 bg-blue-50 rounded-xl">
                <FiBook className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {course?.name || courseDraft?.name}
                </h2>
                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex items-center gap-3 text-lg text-gray-700">
                    <FiHash className="w-5 h-5" />
                    <span className="font-medium">
                      {course?.code || courseDraft?.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-lg text-gray-700">
                    <FiCpu className="w-5 h-5" />
                    <span className="font-medium">
                      {Math.min(
                        course?.credits || courseDraft?.credits || 0,
                        6,
                      )}{" "}
                      Credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-9">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-8">
              <span className="text-4xl font-bold text-blue-600">
                {countInput}
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Number of CLOs
            </h3>
            <p className="text-lg text-gray-600">
              Select between 1 to 6 CLOs (Maximum 6 allowed)
            </p>
          </div>

          {/* Counter Controls */}
          <div className="max-w-lg mx-auto mb-14">
            {/* Slider */}
            <div className="mb-10">
              <div className="relative pt-2">
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={countInput}
                  onChange={(e) => handleCountChange(e.target.value)}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-4">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <span
                      key={num}
                      className={`text-lg ${countInput >= num ? "text-blue-600 font-bold" : "text-gray-500"}`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons with +/- */}
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={decrementCount}
                disabled={countInput <= 1}
                className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <FiChevronLeft className="w-7 h-7" />
              </button>

              <div className="text-center">
                <div className="text-6xl font-bold text-gray-900 mb-2">
                  {countInput}
                </div>
                <div className="text-lg text-gray-600">CLOs selected</div>
              </div>

              <button
                onClick={incrementCount}
                disabled={countInput >= 6}
                className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <FiChevronRight className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 border-t border-gray-100">
            <button
              onClick={handleCreateCLOs}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
            >
              <FiPlus className="w-6 h-6" />
              Create CLOs
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            <span className="font-semibold">Tip:</span> You can always edit or
            add more CLOs later
          </p>
        </div>
      </div>
    </div>
  );
};

export default CLOCount;
