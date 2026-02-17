import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HOD_API from "../../../apis/HOD";
import { saveCourseDraft, clearCourseDraft } from "../../../utils/draftStorage";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FiX,
  FiSave,
  FiArrowRight,
  FiHash,
  FiBook,
  FiFileText,
  FiCalendar,
  FiTag,
  FiType,
  FiCheckSquare,
  FiGrid,
  FiInfo,
  FiAward,
  FiCreditCard,
  FiLayers,
  FiGlobe,
} from "react-icons/fi";

const CourseForm = ({
  open = false,
  initialData = null,
  defaultProgrammeId = "",
  programmes = [],
  onClose,
  onSaved,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [form, setForm] = useState({
    code: "",
    name: "",
    semester: 1,
    credits: 0,
    programmeId: defaultProgrammeId || "",
    departmentId: defaultProgrammeId || "",
    type: "THEORY",
    category: "",
    description: "",
    version: "",
    isActive: true,
  });

  const [categories, setCategories] = useState([
    "MAD",
    "VAC",
    "SEC",
    "CORE",
    "VOCATIONAL",
  ]);
  const types = ["THEORY", "PRACTICAL", "BOTH"];
  const [loading, setLoading] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  /* ---------------- EDIT MODE ---------------- */
  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || "",
        name: initialData.name || "",
        semester: initialData.semester || 1,
        credits: initialData.credits || 0,
        programmeId: initialData.programme?.id || defaultProgrammeId || "",
        departmentId:
          initialData.departmentId ||
          initialData.programme?.id ||
          defaultProgrammeId ||
          "",
        type: initialData.type || "THEORY",
        category: initialData.category || "",
        description: initialData.description || "",
        version: initialData.version || "",
        isActive: initialData.isActive ?? true,
      });
    } else if (defaultProgrammeId) {
      setForm((f) => ({ ...f, programmeId: defaultProgrammeId }));
    }
  }, [initialData, defaultProgrammeId]);

  // persist draft as user types so review can pick it up
  useEffect(() => {
    saveCourseDraft({ ...form, departmentId: form.programmeId });
  }, [form]);

  /* ---------------- AUTO-GENERATE COURSE CODE ---------------- */
  useEffect(() => {
    if (!form.programmeId || initialData || !user?.token) return;

    setAutoGenerating(true);
    HOD_API.courses
      .getAutoCode(form.programmeId, user?.token)
      .then((res) => {
        setForm((f) => ({ ...f, code: res.data.code }));
      })
      .catch(() => {})
      .finally(() => setAutoGenerating(false));
  }, [form.programmeId, user?.token]);

  if (!open) return null;

  /* ---------------- VALIDATION HELPER ---------------- */
  const isFormValid = () => {
    return (
      form.code.trim() !== "" &&
      form.name.trim() !== "" &&
      form.category.trim() !== "" &&
      form.type.trim() !== "" &&
      form.semester >= 1 &&
      form.semester <= 12 &&
      form.credits >= 0 &&
      form.credits <= 6
    );
  };

  /* ---------------- INPUT HANDLER ---------------- */
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "credits") {
      const val = Math.max(0, Math.min(6, Number(value)));
      setForm((f) => ({ ...f, credits: val }));
      return;
    }

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        credits: Number(form.credits),
        semester: Number(form.semester),
        departmentId: form.programmeId || form.departmentId,
      };

      let res;
      if (initialData?.id) {
        res = await HOD_API.courses.updateCourse(
          initialData.id,
          payload,
          user?.token,
        );
      } else {
        res = await HOD_API.courses.createCourse(payload, user?.token);
      }

      const courseId =
        res?.data?.id || initialData?.id || res?.data?.course?.id;
      onSaved?.(courseId);
      clearCourseDraft();

      const returnTo = location.state?.returnTo;
      if (returnTo) {
        navigate(returnTo, {
          state: { courseDraft: res?.data || { id: courseId, ...payload } },
        });
        return;
      }

      if (onSaved) {
        return;
      }

      navigate("/hod/courses");
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Error saving course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-y-auto max-h-[95vh] border border-gray-200">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white px-8 py-6 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FiBook className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {initialData ? "Edit Course" : "Create New Course"}
                </h2>
                <p className="text-gray-600 text-base mt-1">
                  {initialData
                    ? "Update course details below"
                    : "Fill in the course information to add to programme"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <FiX className="text-gray-500 text-xl" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={submit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Course Code */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Course Code
                </label>
                <div className="relative">
                  <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    name="code"
                    value={form.code}
                    onChange={onChange}
                    required
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="e.g., CSE301"
                  />
                  {autoGenerating && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600">
                      Generating...
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Code will be auto-generated based on programme
                </p>
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="e.g., Advanced Algorithms and Data Structures"
                />
              </div>

              {/* Credits & Semester */}
              <div className="grid grid-cols-2 gap-4">
                {/* Credits */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="credits"
                      min={0}
                      max={6}
                      value={form.credits}
                      onChange={onChange}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      0-6
                    </span>
                  </div>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="semester"
                      min={1}
                      max={12}
                      value={form.semester}
                      onChange={onChange}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      1-12
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Category & Type */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    required
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="" className="text-gray-400">
                      Select Category
                    </option>
                    {categories.map((c) => (
                      <option key={c} value={c} className="text-gray-700">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={onChange}
                    required
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    {types.map((t) => (
                      <option key={t} value={t} className="text-gray-700">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Preview */}
              {form.type && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${
                        form.type === "THEORY"
                          ? "bg-blue-50"
                          : form.type === "PRACTICAL"
                            ? "bg-emerald-50"
                            : "bg-purple-50"
                      }`}
                    >
                      <FiLayers
                        className={
                          form.type === "THEORY"
                            ? "text-blue-600"
                            : form.type === "PRACTICAL"
                              ? "text-emerald-600"
                              : "text-purple-600"
                        }
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {form.type}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {form.type === "THEORY"
                          ? "Lecture-based course with theoretical focus"
                          : form.type === "PRACTICAL"
                            ? "Hands-on lab sessions and workshops"
                            : "Combined theory lectures and practical sessions"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={onChange}
                      className="sr-only"
                      id="activeToggle"
                    />
                    <label
                      htmlFor="activeToggle"
                      className="block cursor-pointer"
                    >
                      <div className="relative w-12 h-6">
                        <div
                          className={`w-full h-full rounded-full transition-colors ${
                            form.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transform transition-transform ${
                            form.isActive ? "translate-x-6" : ""
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        Course Status
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          form.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {form.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {form.isActive
                        ? "Course is visible and available for faculty assignment"
                        : "Course is archived and hidden from faculty assignment"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <label className="block text-base font-medium text-gray-700 mb-2">
              Course Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white resize-y"
              placeholder="Describe the course objectives, topics covered, learning outcomes, and assessment methods..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                Optional: Provide detailed course description
              </p>
              <span className="text-sm text-gray-500">
                {form.description.length}/500
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mt-10 pt-8 border-t border-gray-200">
            <div className="flex gap-4 w-full lg:w-auto">
              <button
                type="button"
                disabled={!isFormValid()}
                onClick={() => {
                  saveCourseDraft({ ...form, departmentId: form.programmeId });
                  const returnTo = location.state?.returnTo;
                  if (initialData?.id) {
                    navigate(`/hod/courses/${initialData.id}/clo-count`, {
                      state: {
                        courseName: form.name,
                        courseDraft: { ...form, id: initialData.id },
                        returnTo,
                      },
                    });
                    return;
                  }
                  navigate(`/hod/courses/draft/clo-count`, {
                    state: {
                      courseName: form.name,
                      courseDraft: form,
                      returnTo,
                    },
                  });
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <FiArrowRight />
                Continue to CLOs
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base w-full lg:w-auto"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base w-full lg:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Course</span>
                </>
              )}
            </button>
          </div>

          {/* Form Status Indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              All changes are auto-saved as draft
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
