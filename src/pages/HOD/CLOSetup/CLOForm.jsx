import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import { saveClosDraft, clearClosDraft } from "../../../utils/draftStorage";

const CLOForm = () => {
  const { courseId, count: countParam } = useParams();
  const location = useLocation();
  const courseDraft = location.state?.courseDraft;
  const returnTo = location.state?.returnTo;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use count from location.state if provided, otherwise take it from the URL params
  const initialCount = Number(location.state?.count ?? countParam ?? 0);
  const [count, setCount] = useState(initialCount);
  const [clos, setClos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const bloomLevels = [
    "REMEMBER",
    "UNDERSTAND",
    "APPLY",
    "ANALYZE",
    "EVALUATE",
    "CREATE",
  ];

  useEffect(() => {
    // fetch existing clos to determine starting index for CLO codes
    const loadExisting = async () => {
      if (!user?.token) return;
      // if working with a draft course or explicit closDraft, skip server fetch
      if (courseId === "draft" || location.state?.closDraft || courseDraft) {
        setExistingCount(0);
        if (location.state?.closDraft) {
          setClos(location.state.closDraft);
        } else {
          setClos(
            Array.from({ length: count }, (_, i) => ({
              cloCode: `CLO${i + 1}`,
              description: "",
              bloomLevel: "",
              version: "",
              courseId: courseDraft?.id || courseId || "",
              threshold: 40,
            }))
          );
        }
        return;
      }

      try {
        const res = await HOD_API.clos.getAll(courseId, user?.token);
        const existing = Array.isArray(res?.data) ? res.data.length : 0;
        setExistingCount(existing);
        // initialize clos array with prefilled cloCode and empty fields
        setClos(
          Array.from({ length: count }, (_, i) => ({
            cloCode: `CLO${existing + i + 1}`,
            description: "",
            bloomLevel: "",
            version: "",
            courseId,
            threshold: 40,
          }))
        );
      } catch (err) {
        // fallback: no existing clo info
        setExistingCount(0);
        // If we have a draft with clos saved, use that
        if (location.state?.closDraft) {
          setClos(location.state.closDraft);
        } else {
          setClos(
            Array.from({ length: count }, (_, i) => ({
              cloCode: `CLO${i + 1}`,
              description: "",
              bloomLevel: "",
              version: "",
              courseId: courseDraft?.id || courseId || "",
              threshold: 40,
            }))
          );
        }
      }
    };

    loadExisting();
  }, [count, courseId, user?.token]);

  const onChangeClo = (index, field, value) => {
    setClos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  // persist clos draft as user edits
  useEffect(() => {
    if (clos && clos.length > 0) saveClosDraft(clos);
  }, [clos]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user?.token) return alert("Not authenticated");

    // Validate thresholds
    for (let i = 0; i < clos.length; i++) {
      const t = Number(clos[i].threshold);
      if (isNaN(t) || t < 40 || t > 70) {
        return alert("Each CLO threshold must be a number between 40 and 70.");
      }
    }

    setLoading(true);

    try {
      // ---------------------------------------------
      // STEP 1 — ENSURE COURSE EXISTS
      // ---------------------------------------------
      let targetCourseId = courseId;

      // if course is still a draft OR missing id → create it now
      if (!targetCourseId || targetCourseId === "draft") {
        if (!courseDraft) {
          throw new Error("Missing course draft — cannot create CLOs");
        }

        const coursePayload = {
          code: courseDraft.code,
          name: courseDraft.name,
          slug: courseDraft.slug, // optional but good
          semester: Number(courseDraft.semester || 1),
          credits: Number(courseDraft.credits || 0),
          programid: courseDraft.programmeId, // 👈 MUST MATCH BACKEND
          departmentId: courseDraft.programmeId, // 👈 allowed fallback
          type: courseDraft.type,
          category: courseDraft.category,
          description: courseDraft.description,
          isActive: courseDraft.isActive,
        };

        const courseRes = await HOD_API.courses.createCourse(
          coursePayload,
          user?.token
        );

        targetCourseId = courseRes?.data?.id || courseRes?.data?.course?.id;

        if (!targetCourseId) throw new Error("Could not resolve courseId");
      }

      // ---------------------------------------------
      // STEP 2 — LOOP & CREATE EACH CLO
      // ---------------------------------------------

      for (let i = 0; i < clos.length; i++) {
        const c = clos[i];

        const cloPayload = {
          code: c.cloCode || `CLO${existingCount + i + 1}`, // REQUIRED
          statement: c.description, // REQUIRED
          bloomLevel: c.bloomLevel, // REQUIRED
          attainmentThreshold: Number(c.threshold || 50), // OPTIONAL
          order: existingCount + i + 1, // OPTIONAL
          version: c.version || null, // OPTIONAL
        };

        await HOD_API.clos.createCLOForCourse(targetCourseId, cloPayload);
      }

      // ---------------------------------------------
      // STEP 3 — CLEANUP & NAVIGATION
      // ---------------------------------------------

      clearClosDraft();

      alert("Course & CLOs created successfully");

      if (returnTo) {
        navigate(returnTo, {
          state: {
            courseDraft: { ...(courseDraft || {}), id: targetCourseId },
            closDraft: clos,
          },
        });
        return;
      }

      navigate(`/hod/courses/${targetCourseId}/clo-mapping`);
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || err.message || "Error creating CLOs"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          Create CLOs for Course {courseId}
        </h1>
        <button
          className="px-3 py-1 bg-gray-100 rounded"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      <form onSubmit={submit} className="bg-white p-6 rounded shadow">
        <label className="block mb-4">
          <div className="text-sm text-gray-600">Course ID</div>
          <input
            value={courseId}
            disabled
            className="w-48 border px-2 py-1 bg-gray-100"
          />
        </label>

        <label className="block mb-4">
          <div className="text-sm text-gray-600">Number of CLOs</div>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value || 0)))}
            className="w-24 border px-2 py-1"
          />
        </label>

        {clos.map((c, idx) => (
          <div key={idx} className="mb-4 border p-3 rounded">
            <div className="font-semibold mb-2">CLO {idx + 1}</div>

            <label className="block mb-2">
              <div className="text-sm text-gray-600">CLO Code</div>
              <input
                name={`cloCode-${idx}`}
                value={c.cloCode}
                disabled
                className="w-full border px-2 py-1 bg-gray-100"
              />
            </label>

            <label className="block mb-2">
              <div className="text-sm text-gray-600">Description</div>
              <textarea
                name={`desc-${idx}`}
                value={c.description}
                onChange={(e) =>
                  onChangeClo(idx, "description", e.target.value)
                }
                rows={2}
                className="w-full border px-2 py-1"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block mb-2">
                <div className="text-sm text-gray-600">Bloom Level</div>
                <select
                  name={`bloom-${idx}`}
                  value={c.bloomLevel}
                  onChange={(e) =>
                    onChangeClo(idx, "bloomLevel", e.target.value)
                  }
                  className="w-full border px-2 py-1"
                  required
                >
                  <option value="">Select Level</option>
                  {bloomLevels.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block mb-2">
                <div className="text-sm text-gray-600">Threshold (%)</div>
                <input
                  type="number"
                  min={40}
                  max={70}
                  step={1}
                  name={`threshold-${idx}`}
                  value={c.threshold}
                  onChange={(e) =>
                    onChangeClo(idx, "threshold", Number(e.target.value))
                  }
                  className="w-full border px-2 py-1"
                  required
                />
              </label>
            </div>

            <label className="block mt-2">
              <div className="text-sm text-gray-600">Version</div>
              <input
                name={`version-${idx}`}
                value={c.version}
                onChange={(e) => onChangeClo(idx, "version", e.target.value)}
                className="w-full border px-2 py-1"
              />
            </label>
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // save draft and navigate to mapping with current clos as draft (do not save)
              saveClosDraft(clos);
              navigate(`/hod/courses/${courseId || "draft"}/clo-mapping`, {
                state: { courseDraft, closDraft: clos, returnTo },
              });
            }}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Next
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Create CLOs"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CLOForm;
