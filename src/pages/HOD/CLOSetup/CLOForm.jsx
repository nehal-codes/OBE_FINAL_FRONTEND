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
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";

const CLOForm = () => {
  const { courseId, count: countParam } = useParams();
  const location = useLocation();
  const courseDraft = location.state?.courseDraft;
  const returnTo = location.state?.returnTo;
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialCount = Number(location.state?.count ?? countParam ?? 0);
  const [count, setCount] = useState(initialCount);
  const [clos, setClos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [course, setCourse] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedFrom, setCopiedFrom] = useState(null);

  const isEdit = Boolean(
    location.state?.editClo ||
    (location.state?.closDraft &&
      Array.isArray(location.state.closDraft) &&
      location.state.closDraft.length === 1 &&
      (location.state.closDraft[0].id || location.state.closDraft[0]._id)),
  );

  const bloomLevels = [
    {
      value: "REMEMBER",
      label: "Remember",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      value: "UNDERSTAND",
      label: "Understand",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      value: "APPLY",
      label: "Apply",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      value: "ANALYZE",
      label: "Analyze",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      value: "EVALUATE",
      label: "Evaluate",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      value: "CREATE",
      label: "Create",
      color: "bg-pink-50 text-pink-700 border-pink-200",
    },
  ];

  useEffect(() => {
    const loadExisting = async () => {
      if (!user?.token) return;
      if (courseId === "draft" || location.state?.closDraft || courseDraft) {
        setExistingCount(0);
        if (location.state?.closDraft) {
          setClos(location.state.closDraft);
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
            })),
          );
        }
        return;
      }

      try {
        const res = await HOD_API.clos.getAll(courseId, user?.token);
        const existing = Array.isArray(res?.data) ? res.data.length : 0;
        setExistingCount(existing);
        setClos(
          Array.from({ length: count }, (_, i) => ({
            cloCode: `CLO${existing + i + 1}`,
            description: "",
            bloomLevel: "",
            version: "",
            courseId,
            threshold: 60,
          })),
        );
      } catch (err) {
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
              threshold: 60,
            })),
          );
        }
      }
    };

    loadExisting();
  }, [count, courseId, user?.token]);

  useEffect(() => {
    const loadCourseDetails = async () => {
      try {
        if (!courseId || courseId === "draft") {
          setCourse(courseDraft || null);
          return;
        }

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
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const addCLO = () => {
    setClos((prev) => [
      ...prev,
      {
        cloCode: `CLO${prev.length + 1}`,
        description: "",
        bloomLevel: "",
        version: "",
        courseId: courseDraft?.id || courseId || "",
        threshold: 60,
      },
    ]);
    setCount((prev) => prev + 1);
    setActiveIndex(clos.length);
  };

  const removeCLO = (index) => {
    if (clos.length <= 1) {
      alert("At least one CLO is required");
      return;
    }

    setClos((prev) => prev.filter((_, i) => i !== index));
    setCount((prev) => prev - 1);
    if (activeIndex >= index && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const moveCLO = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === clos.length - 1)
    )
      return;

    const newClos = [...clos];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newClos[index], newClos[swapIndex]] = [newClos[swapIndex], newClos[index]];

    const updatedClos = newClos.map((c, i) => ({
      ...c,
      cloCode: `CLO${i + 1}`,
    }));

    setClos(updatedClos);
    setActiveIndex(swapIndex);
  };

  const copyFromCLO = (index) => {
    if (clos.length === 0) return;
    const sourceClo = clos[index];
    setCopiedFrom(index);

    const updatedClos = clos.map((c, i) => {
      if (i === index) return c;
      return {
        ...c,
        description: c.description || sourceClo.description,
        bloomLevel: c.bloomLevel || sourceClo.bloomLevel,
        threshold: sourceClo.threshold,
      };
    });

    setClos(updatedClos);

    setTimeout(() => setCopiedFrom(null), 2000);
  };

  useEffect(() => {
    if (clos && clos.length > 0) saveClosDraft(clos);
  }, [clos]);

  /* ---------------- VALIDATION HELPER ---------------- */
  const isFormComplete = () => {
    if (clos.length === 0) return false;
    return clos.every(
      (clo) => clo.description?.trim() !== "" && clo.bloomLevel?.trim() !== "",
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user?.token) return alert("Not authenticated");

    for (let i = 0; i < clos.length; i++) {
      const t = Number(clos[i].threshold);
      if (isNaN(t) || t < 40 || t > 70) {
        return alert("Each CLO threshold must be a number between 40 and 70.");
      }
    }

    setLoading(true);

    try {
      if (isEdit) {
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
              c.threshold || c.attainmentThreshold || 60,
            ),
            version: c.version || null,
            order: c.order || i + 1,
          };

          await HOD_API.clos.updateCLO(id, cloPayload);
        }

        clearClosDraft();
        alert("CLO updated successfully");
        navigate(`/hod/courses/${courseId}/clos`);
        return;
      }

      let targetCourseId = courseId;

      if (!targetCourseId || targetCourseId === "draft") {
        if (!courseDraft) {
          throw new Error("Missing course draft — cannot create CLOs");
        }

        const coursePayload = {
          code: courseDraft.code,
          name: courseDraft.name,
          slug: courseDraft.slug,
          semester: Number(courseDraft.semester || 1),
          credits: Number(courseDraft.credits || 0),
          programid: courseDraft.programmeId,
          departmentId: courseDraft.programmeId,
          type: courseDraft.type,
          category: courseDraft.category,
          description: courseDraft.description,
          isActive: courseDraft.isActive,
        };

        const courseRes = await HOD_API.courses.createCourse(
          coursePayload,
          user?.token,
        );

        targetCourseId = courseRes?.data?.id || courseRes?.data?.course?.id;

        if (!targetCourseId) throw new Error("Could not resolve courseId");
      }

      for (let i = 0; i < clos.length; i++) {
        const c = clos[i];

        const cloPayload = {
          code: c.cloCode || `CLO${existingCount + i + 1}`,
          statement: c.description,
          bloomLevel: c.bloomLevel,
          attainmentThreshold: Number(c.threshold || 60),
          order: existingCount + i + 1,
        };

        await HOD_API.clos.createCLOForCourse(targetCourseId, cloPayload);
      }

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
        err?.response?.data?.message || err.message || "Error creating CLOs",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-base font-medium mb-6 group transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </button>

          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FiBook className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {isEdit
                        ? "Edit Course Learning Outcome"
                        : "Create Course Learning Outcomes"}
                    </h1>
                    <p className="text-gray-600 text-sm">
                      Define what students should achieve after completing this
                      course
                    </p>
                  </div>
                </div>

                {/* Enhanced Course Details Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 inline-block">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <FiBook className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {course?.name || courseDraft?.name || "Draft Course"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                      <FiHash className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-semibold text-blue-700">
                        {course?.code || courseDraft?.code || "---"}
                      </span>
                    </div>
                    {course?.credits && (
                      <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                        <FiCreditCard className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-700">
                          {course.credits} Credits
                        </span>
                      </div>
                    )}
                    {course?.semester && (
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                        <FiCalendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-700">
                          Semester {course.semester}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isEdit && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <FiTarget className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Creating</div>
                    <div className="font-bold text-gray-900 text-lg">
                      {count} CLO{count !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CLO Navigation Sidebar - Enhanced */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">
                    CLO List
                  </h2>
                  <p className="text-sm text-gray-500">Manage your outcomes</p>
                </div>
                {!isEdit && (
                  <button
                    onClick={addCLO}
                    className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow"
                    title="Add New CLO"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {clos.map((clo, index) => (
                  <div
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                      activeIndex === index
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 shadow-sm"
                        : "hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          activeIndex === index
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                        }`}
                      >
                        <span className="font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-semibold text-base ${
                            activeIndex === index
                              ? "text-blue-800"
                              : "text-gray-900"
                          }`}
                        >
                          {clo.cloCode}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[140px]">
                          {clo.description || "No description yet"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isEdit && index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCLO(index, "up");
                          }}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Move up"
                        >
                          <FiChevronUp className="text-gray-600 w-4 h-4" />
                        </button>
                      )}
                      {!isEdit && index < clos.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveCLO(index, "down");
                          }}
                          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Move down"
                        >
                          <FiChevronDown className="text-gray-600 w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              {!isEdit && clos.length > 1 && (
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <button
                    onClick={() => copyFromCLO(activeIndex)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium border border-gray-200 hover:border-gray-300"
                  >
                    <FiCopy className="w-4 h-4" />
                    Copy values from current CLO
                  </button>
                  {copiedFrom !== null && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-sm text-emerald-600">
                      <FiCheckCircle className="w-4 h-4" />
                      Copied from CLO{copiedFrom + 1}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Form - Enhanced */}
          <div className="lg:col-span-3">
            <form onSubmit={submit}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                {/* Active CLO Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <span className="font-bold text-white text-xl">
                        {clos[activeIndex]?.cloCode || `CLO${activeIndex + 1}`}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-xl">
                        Define Learning Outcome
                      </h2>
                    </div>
                  </div>

                  {!isEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyFromCLO(activeIndex)}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium hover:shadow-sm"
                      >
                        <FiCopy className="inline-block mr-2 w-4 h-4" />
                        Copy Values
                      </button>
                      {clos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCLO(activeIndex)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-sm"
                          title="Remove CLO"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description - Enhanced */}
                <div className="mb-8">
                  <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-5 bg-blue-500 rounded-full"></div>
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Example: 'Design and implement efficient algorithms for solving computational problems'"
                      className="w-full px-4 py-3.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 hover:border-gray-400"
                      rows={4}
                      value={clos[activeIndex]?.description || ""}
                      onChange={(e) =>
                        onChangeClo(activeIndex, "description", e.target.value)
                      }
                      required
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      What should students be able to do? Use clear, measurable
                      action verbs...
                    </div>
                  </div>
                </div>

                {/* Bloom Level - Enhanced */}
                <div className="mb-8">
                  <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-5 bg-green-500 rounded-full"></div>
                    Bloom's Taxonomy Level
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {bloomLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() =>
                          onChangeClo(activeIndex, "bloomLevel", level.value)
                        }
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          clos[activeIndex]?.bloomLevel === level.value
                            ? `${level.color} border-blue-500 shadow-sm transform scale-[1.02]`
                            : "border-gray-200 hover:border-gray-400 hover:shadow-sm hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-semibold text-gray-900 text-base mb-1">
                          {level.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {level.value}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Threshold - Enhanced */}
                <div className="mb-8">
                  <label className="block text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-2 h-5 bg-purple-500 rounded-full"></div>
                    Attainment Threshold
                  </label>
                  <div className="space-y-4">
                    <div className="text-center bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {clos[activeIndex]?.threshold || 60}%
                      </div>
                      <div className="text-gray-600">
                        Minimum score required
                      </div>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="70"
                      step="5"
                      value={clos[activeIndex]?.threshold || 60}
                      onChange={(e) =>
                        onChangeClo(
                          activeIndex,
                          "threshold",
                          Number(e.target.value),
                        )
                      }
                      className="w-full h-2.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-blue-600 [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-sm text-gray-600 px-1">
                      <span className="font-medium">40% Minimum</span>
                      <span className="font-medium">70% Maximum</span>
                    </div>
                    <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <FiInfo className="inline-block mr-2 w-4 h-4 text-blue-500" />
                      This is the minimum score students must achieve to be
                      considered as attaining this learning outcome.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Enhanced */}
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-base hover:shadow-sm"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex gap-3">
                  {!isEdit && activeIndex < clos.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveIndex((prev) => prev + 1)}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-base hover:shadow-sm"
                    >
                      Next CLO
                      <FiArrowRight className="w-5 h-5" />
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || !isFormComplete()}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-base disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isEdit ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5" />
                        <span>{isEdit ? "Update CLO" : "Save All CLOs"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Enhanced Bottom Stats */}
        {!isEdit && clos.length > 0 && (
          <div className="mt-8 space-y-4">
            {!isFormComplete() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <div className="text-amber-600 mt-0.5">
                  <FiInfo className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-amber-900">
                    Incomplete CLOs
                  </div>
                  <div className="text-sm text-amber-800 mt-1">
                    Please fill in the <strong>Description</strong> and{" "}
                    <strong>Bloom's Taxonomy Level</strong> for all CLOs before
                    saving.
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiHash className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total CLOs</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiTarget className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Bloom Levels Used
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {
                        new Set(clos.map((c) => c.bloomLevel).filter(Boolean))
                          .size
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiPercent className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avg Threshold</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {clos.length > 0
                        ? Math.round(
                            clos.reduce(
                              (acc, c) => acc + (c.threshold || 0),
                              0,
                            ) / clos.length,
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CLOForm;
