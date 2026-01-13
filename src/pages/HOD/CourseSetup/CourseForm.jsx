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
    slug: "",
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
        slug: initialData.slug || "",
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
    // ensure departmentId mirrors selected programme before saving draft
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
          user?.token
        );
      } else {
        res = await HOD_API.courses.createCourse(payload, user?.token);
      }

      const courseId =
        res?.data?.id || initialData?.id || res?.data?.course?.id;
      onSaved?.(courseId);
      clearCourseDraft();
      // if called from review flow, return to the review page with saved data
      const returnTo = location.state?.returnTo;
      if (returnTo) {
        navigate(returnTo, {
          state: { courseDraft: res?.data || { id: courseId, ...payload } },
        });
        return;
      }

      // If parent provided an onSaved handler, let parent control navigation
      if (onSaved) {
        return;
      }

      // After saving, navigate to Course Management page
      navigate("/hod/courses");
    } catch (error) {
      console.error("Save error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Error saving course");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      THEORY: "bg-blue-100 text-blue-800",
      PRACTICAL: "bg-green-100 text-green-800",
      BOTH: "bg-purple-100 text-purple-800",
    };
    return colors[type] || colors.THEORY;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Increased max-width from max-w-2xl to max-w-3xl and removed max-height restriction */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[95vh]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FiBook className="text-white text-2xl" />
              </div>
              <div>
                {/* Increased font sizes in header */}
                <h2 className="text-2xl font-bold text-white">
                  {initialData ? "Edit Course" : "Create New Course"}
                </h2>
                <p className="text-blue-100 text-base">
                  {initialData
                    ? "Update course details"
                    : "Add a new course to the programme"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors"
            >
              <FiX className="text-white text-2xl" />
            </button>
          </div>
        </div>

        {/* Form Content - Increased padding and spacing */}
        <form onSubmit={submit} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Course Code */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  <FiHash className="inline mr-3 text-gray-600 text-lg" />
                  Course Code
                </label>
                <div className="relative">
                  <input
                    name="code"
                    value={form.code}
                    onChange={onChange}
                    required
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all pl-12"
                    placeholder="e.g., CSE301"
                  />
                  <FiHash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl" />
                </div>
                {autoGenerating && (
                  <p className="text-sm text-blue-600 mt-2 animate-pulse">
                    Generating course code...
                  </p>
                )}
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  <FiBook className="inline mr-3 text-gray-600 text-lg" />
                  Course Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="e.g., Advanced Algorithms"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  <FiTag className="inline mr-3 text-gray-600 text-lg" />
                  Course Slug
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={onChange}
                  required
                  className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="course-slug-url"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Used for URL identification
                </p>
              </div>

              {/* Programme */}
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  <FiAward className="inline mr-3 text-gray-600 text-lg" />
                  Programme
                </label>
                <div className="relative">
                  <select
                    name="programmeId"
                    value={form.programmeId}
                    onChange={onChange}
                    required
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                  >
                    <option value="" className="text-gray-500">
                      Select Programme
                    </option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Credits & Semester */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    <FiHash className="inline mr-3 text-gray-600 text-lg" />
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
                      className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all pl-12"
                    />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-base">
                      CR
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">0-6 credits</p>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    <FiCalendar className="inline mr-3 text-gray-600 text-lg" />
                    Semester
                  </label>
                  <input
                    type="number"
                    name="semester"
                    min={1}
                    max={12}
                    value={form.semester}
                    onChange={onChange}
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Category & Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    <FiGrid className="inline mr-3 text-gray-600 text-lg" />
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    required
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                  >
                    <option value="" className="text-gray-500">
                      Select Category
                    </option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    <FiType className="inline mr-3 text-gray-600 text-lg" />
                    Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={onChange}
                    required
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                  >
                    <option value="" className="text-gray-500">
                      Select Type
                    </option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Preview */}
              {form.type && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getTypeColor(
                        form.type
                      )}`}
                    >
                      {form.type}
                    </span>
                    <span className="text-base text-gray-700">
                      {form.type === "THEORY"
                        ? "Lecture-based course"
                        : form.type === "PRACTICAL"
                        ? "Lab/Workshop course"
                        : "Combined theory and practical"}
                    </span>
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-start cursor-pointer">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={onChange}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-7 rounded-full transition-colors ${
                        form.isActive ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    ></div>
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                        form.isActive ? "transform translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <div className="ml-4">
                    <span className="block font-semibold text-gray-900 text-base">
                      Active Course
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {form.isActive
                        ? "Course will be available for assignment"
                        : "Course will be hidden from faculty assignment"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <label className="block text-base font-semibold text-gray-800 mb-3">
              <FiFileText className="inline mr-3 text-gray-600 text-lg" />
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Brief description of course objectives, topics, and learning outcomes..."
            />
          </div>

          {/* Action Buttons - Increased size and spacing */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mt-10 pt-8 border-t border-gray-300">
            <div className="flex gap-4">
              <button
                type="button"
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
                className="flex items-center gap-3 px-8 py-4 border-2 border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-base"
              >
                <FiArrowRight className="text-lg" />
                Continue to CLOs
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 border-2 border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-base"
              >
                Cancel
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-base min-w-[200px]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="text-lg" />
                  Save and Exit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;