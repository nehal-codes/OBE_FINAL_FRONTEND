import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import HOD_API from "../../../apis/HOD";
import { saveCourseDraft, clearCourseDraft } from "../../../utils/draftStorage";
import { useAuth } from "../../../contexts/AuthContext";

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

    HOD_API.courses
      .getAutoCode(form.programmeId, user?.token)
      .then((res) => {
        setForm((f) => ({ ...f, code: res.data.code }));
      })
      .catch(() => {});
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center overflow-auto py-10 px-4">
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-md p-6 rounded shadow max-h-[85vh] overflow-auto"
      >
        <h3 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Course" : "Add Course"}
        </h3>

        {/* CODE */}
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Course Code</div>
          <input
            name="code"
            value={form.code}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
            placeholder="eg. DS101"
          />
        </label>

        <label className="block mb-2">
          <div className="text-sm text-gray-600">Slug</div>
          <input
            name="slug"
            value={form.slug}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
            placeholder="course-slug"
          />
        </label>

        {/* NAME */}
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Name</div>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
          />
        </label>

        {/* CREDITS */}
        {/* DESCRIPTION */}
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Description</div>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            className="w-full border px-2 py-1"
            placeholder="Brief description of the course"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <label className="block">
            <div className="text-sm text-gray-600">Credits (0–6)</div>
            <input
              type="number"
              name="credits"
              min={0}
              max={6}
              value={form.credits}
              onChange={onChange}
              className="w-full border px-2 py-1"
            />
          </label>

          <label className="block">
            <div className="text-sm text-gray-600">Semester</div>
            <input
              type="number"
              name="semester"
              min={1}
              max={12}
              value={form.semester}
              onChange={onChange}
              className="w-full border px-2 py-1"
            />
          </label>
        </div>

        {/* PROGRAMME */}
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Programme</div>
          <select
            name="programmeId"
            value={form.programmeId}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
          >
            <option value="">Select Programme</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </label>

        {/* CATEGORY */}
        <label className="block mb-2">
          <div className="text-sm text-gray-600">Category</div>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-2">
          <div className="text-sm text-gray-600">Type</div>
          <select
            name="type"
            value={form.type}
            onChange={onChange}
            required
            className="w-full border px-2 py-1"
          >
            <option value="">Select Type</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* ACTIVE */}
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
          />
          <span>Active</span>
        </label>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              // Next: persist draft and navigate to CLOCount without saving; pass course name (not only draft)
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
                state: { courseName: form.name, courseDraft: form, returnTo },
              });
            }}
            className="px-3 py-1 border rounded"
          >
            Next
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save and Exit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
