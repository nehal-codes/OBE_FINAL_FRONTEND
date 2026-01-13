import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import { saveClosDraft, clearClosDraft } from "../../../utils/draftStorage";
import {
  FiArrowLeft,
  FiArrowRight,
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiBook,
  FiTarget,
  FiPercent,
  FiInfo,
  FiCheckCircle,
  FiHash,
  FiEye,
  FiChevronUp,
  FiChevronDown,
  FiCopy,
} from "react-icons/fi";

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
  const [course, setCourse] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedFrom, setCopiedFrom] = useState(null);

  // determine if editing a single existing CLO
  const isEdit = Boolean(
    location.state?.editClo ||
      (location.state?.closDraft &&
        Array.isArray(location.state.closDraft) &&
        location.state.closDraft.length === 1 &&
        (location.state.closDraft[0].id || location.state.closDraft[0]._id))
  );

  const bloomLevels = [
    { value: "REMEMBER", label: "Remember", color: "bg-blue-100 text-blue-800" },
    { value: "UNDERSTAND", label: "Understand", color: "bg-green-100 text-green-800" },
    { value: "APPLY", label: "Apply", color: "bg-yellow-100 text-yellow-800" },
    { value: "ANALYZE", label: "Analyze", color: "bg-orange-100 text-orange-800" },
    { value: "EVALUATE", label: "Evaluate", color: "bg-purple-100 text-purple-800" },
    { value: "CREATE", label: "Create", color: "bg-pink-100 text-pink-800" },
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
          // If we are editing an existing CLO, ensure the count is 1 and keep form compact
          if (isEdit) setCount(1);
        } else {
          setClos(
            Array.from({ length: count }, (_, i) => ({
              cloCode: `CLO${i + 1}`,
              description: "",
              bloomLevel: "",
              version: "",
              courseId: courseDraft?.id || courseId || "",
              threshold: 60,
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
            threshold: 60,
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
              threshold: 60,
            }))
          );
        }
      }
    };

    loadExisting();
  }, [count, courseId, user?.token]);

  // Load course details (use draft if course is a draft)
  useEffect(() => {
    const loadCourseDetails = async () => {
      try {
        if (!courseId || courseId === "draft") {
          setCourse(courseDraft || null);
          return;
        }

        // Ensure we have token for protected routes
        if (!user?.token) return;

        const res = await HOD_API.courses.getCourseById(courseId);
        setCourse(res?.data || null);
      } catch (err) {
        console.error("Error loading course:", err);
        setCourse(null);
      }
    };

    loadCourseDetails();
  }, [courseId, user?.token, courseDraft]);

  const onChangeClo = (index, field, value) => {
    setClos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addCLO = () => {
    setClos(prev => [
      ...prev,
      {
        cloCode: `CLO${prev.length + 1}`,
        description: "",
        bloomLevel: "",
        version: "",
        courseId: courseDraft?.id || courseId || "",
        threshold: 60,
      }
    ]);
    setCount(prev => prev + 1);
    setActiveIndex(clos.length);
  };

  const removeCLO = (index) => {
    if (clos.length <= 1) {
      alert("At least one CLO is required");
      return;
    }
    
    setClos(prev => prev.filter((_, i) => i !== index));
    setCount(prev => prev - 1);
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
  };

  const moveCLO = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === clos.length - 1)
    ) return;

    const newClos = [...clos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newClos[index], newClos[swapIndex]] = [newClos[swapIndex], newClos[index]];
    
    // Update CLO codes based on new order
    const updatedClos = newClos.map((c, i) => ({
      ...c,
      cloCode: `CLO${i + 1}`
    }));
    
    setClos(updatedClos);
    setActiveIndex(swapIndex);
  };

  const copyFromCLO = (index) => {
    if (clos.length === 0) return;
    const sourceClo = clos[index];
    setCopiedFrom(index);
    
    // Update all empty CLOs with the source values
    const updatedClos = clos.map((c, i) => {
      if (i === index) return c; // Don't copy to itself
      return {
        ...c,
        description: c.description || sourceClo.description,
        bloomLevel: c.bloomLevel || sourceClo.bloomLevel,
        threshold: sourceClo.threshold,
      };
    });
    
    setClos(updatedClos);
    
    // Clear copied indicator after 2 seconds
    setTimeout(() => setCopiedFrom(null), 2000);
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
      if (isNaN(t) || t < 40 || t > 100) {
        return alert("Each CLO threshold must be a number between 40 and 100.");
      }
    }

    setLoading(true);

    try {
      // If editing a single CLO → perform update flow
      if (isEdit) {
        // Ensure we have course id
        const targetCourseId = courseId;
        if (!targetCourseId || targetCourseId === "draft") {
          throw new Error("Cannot update CLO without a valid course id");
        }

        for (let i = 0; i < clos.length; i++) {
          const c = clos[i];
          const id = c.id || c._id;
          if (!id) throw new Error("Missing CLO id for update");

          const cloPayload = {
            code: c.cloCode || c.code,
            statement: c.description || c.statement,
            bloomLevel: c.bloomLevel,
            attainmentThreshold: Number(
              c.threshold || c.attainmentThreshold || 60
            ),
            version: c.version || null,
            order: c.order || i + 1,
          };

          await HOD_API.clos.updateCLO(id, cloPayload);
        }

        clearClosDraft();
        alert("CLO updated successfully");
        // After save, go back to CLO list
        navigate(`/hod/courses/${courseId}/clos`);
        return;
      }

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
          attainmentThreshold: Number(c.threshold || 60), // OPTIONAL
          order: existingCount + i + 1, // OPTIONAL
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

  const handleQuickMapping = () => {
    saveClosDraft(clos);
    navigate(`/hod/courses/${courseId || "draft"}/clo-mapping`, {
      state: { courseDraft, closDraft: clos, returnTo },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Increased size */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg font-medium"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to {isEdit ? "CLO List" : "CLO Count"}</span>
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiEdit2 className="text-3xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {isEdit ? "Edit CLO" : "Create Course Learning Outcomes"}
                    </h1>
                    <p className="text-blue-100 text-xl mt-2">
                      {isEdit 
                        ? "Update the learning outcome details"
                        : "Define what students should achieve after completing this course"}
                    </p>
                  </div>
                </div>
                
                {/* Course Info - Increased size */}
                <div className="flex flex-wrap items-center gap-6 mt-6">
                  <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                    <FiBook className="text-xl" />
                    <span className="font-semibold">{course?.name || courseDraft?.name || courseId || "Draft Course"}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                    <FiHash className="text-xl" />
                    <span className="font-mono">{course?.code || courseDraft?.code || "---"}</span>
                  </div>
                  {!isEdit && (
                    <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                      <FiTarget className="text-xl" />
                      <span className="font-semibold">{count} CLO{count !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* CLO Navigation Sidebar - Increased size */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-7 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 text-xl">CLO List</h2>
                {!isEdit && (
                  <button
                    onClick={addCLO}
                    className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                    title="Add New CLO"
                  >
                    <FiPlus className="text-xl" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3 max-h-[550px] overflow-y-auto">
                {clos.map((clo, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      activeIndex === index
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
                        : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        activeIndex === index 
                          ? 'bg-gradient-to-br from-blue-100 to-indigo-100'
                          : 'bg-gray-100'
                      }`}>
                        <span className={`font-bold text-lg ${
                          activeIndex === index ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-lg">{clo.cloCode}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[160px]">
                          {clo.description || "No description yet"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!isEdit && index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCLO(index, 'up');
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="Move up"
                        >
                          <FiChevronUp className="text-gray-600 text-lg" />
                        </button>
                      )}
                      {!isEdit && index < clos.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCLO(index, 'down');
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="Move down"
                        >
                          <FiChevronDown className="text-gray-600 text-lg" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Quick Actions - Increased size */}
              {!isEdit && clos.length > 1 && (
                <div className="mt-8 pt-7 border-t-2 border-gray-200">
                  <button
                    onClick={() => copyFromCLO(activeIndex)}
                    className="w-full flex items-center justify-center gap-3 py-3 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                  >
                    <FiCopy className="text-lg" />
                    Copy values from current CLO
                  </button>
                  {copiedFrom !== null && (
                    <div className="mt-3 text-base text-emerald-600 text-center font-medium">
                      ✓ Copied from CLO{copiedFrom + 1}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Form - Increased size */}
          <div className="lg:col-span-3">
            <form onSubmit={submit}>
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
                {/* Active CLO Header - Increased size */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="font-bold text-blue-700 text-2xl">
                          {clos[activeIndex]?.cloCode || `CLO${activeIndex + 1}`}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          CLO {activeIndex + 1} of {count}
                        </h2>
                        <p className="text-gray-600 text-lg">Define this learning outcome</p>
                      </div>
                    </div>
                  </div>
                  
                  {!isEdit && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => copyFromCLO(activeIndex)}
                        className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-base font-medium"
                      >
                        Copy Values
                      </button>
                      {clos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCLO(activeIndex)}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Remove CLO"
                        >
                          <FiTrash2 className="text-xl" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description - Increased size */}
                <div className="mb-10">
                  <label className="block text-xl font-semibold text-gray-900 mb-4">
                    Description
                  </label>
                  <textarea
                    placeholder="What should students be able to do? Use clear, measurable action verbs..."
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows={5}
                    value={clos[activeIndex]?.description || ""}
                    onChange={(e) => onChangeClo(activeIndex, "description", e.target.value)}
                    required
                  />
                  <div className="flex items-center gap-3 mt-3 text-base text-gray-600">
                    <FiInfo className="text-lg" />
                    <span>Example: "Design and implement efficient algorithms for solving computational problems"</span>
                  </div>
                </div>

                {/* Bloom Level - Increased size */}
                <div className="mb-10">
                  <label className="block text-xl font-semibold text-gray-900 mb-4">
                    Bloom's Taxonomy Level
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {bloomLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => onChangeClo(activeIndex, "bloomLevel", level.value)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                          clos[activeIndex]?.bloomLevel === level.value
                            ? `${level.color} border-blue-500 border-2`
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold text-gray-900 text-lg mb-2">{level.label}</div>
                        <div className="text-base text-gray-600">{level.value}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Threshold - Increased size */}
                <div className="mb-10">
                  <label className="block text-xl font-semibold text-gray-900 mb-4">
                    <div className="flex items-center gap-3">
                      <FiPercent className="text-xl" />
                      Attainment Threshold
                    </div>
                  </label>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="text-5xl font-bold text-gray-900">
                        {clos[activeIndex]?.threshold || 60}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={clos[activeIndex]?.threshold || 60}
                      onChange={(e) => onChangeClo(activeIndex, "threshold", Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-base text-gray-600">
                      <span className="font-medium">40% (Minimum)</span>
                      <span className="font-medium">100% (Maximum)</span>
                    </div>
                    <div className="text-base text-gray-700">
                      Minimum score required for students to achieve this CLO
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Increased size */}
              <div className="mt-10 flex flex-col sm:flex-row justify-between gap-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
                  >
                    <FiArrowLeft className="text-xl" />
                    Cancel
                  </button>
                  
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={handleQuickMapping}
                      className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
                    >
                      <FiEye className="text-xl" />
                      Preview Mapping
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!isEdit && activeIndex < clos.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveIndex(prev => prev + 1)}
                      className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
                    >
                      Next CLO
                      <FiArrowRight className="text-xl" />
                    </button>
                  ) : null}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-4 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed font-bold text-xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isEdit ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <FiSave className="text-2xl" />
                        <span>{isEdit ? "Update CLO" : "Save All CLOs"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Stats - Increased size */}
        {!isEdit && clos.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-lg text-gray-600 mb-2">Total CLOs</div>
              <div className="text-3xl font-bold text-gray-900">{count}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-lg text-gray-600 mb-2">Bloom Levels Used</div>
              <div className="text-3xl font-bold text-gray-900">
                {new Set(clos.map(c => c.bloomLevel).filter(Boolean)).size}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="text-lg text-gray-600 mb-2">Avg Threshold</div>
              <div className="text-3xl font-bold text-gray-900">
                {clos.length > 0 
                  ? Math.round(clos.reduce((acc, c) => acc + (c.threshold || 0), 0) / clos.length)
                  : 0}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CLOForm;