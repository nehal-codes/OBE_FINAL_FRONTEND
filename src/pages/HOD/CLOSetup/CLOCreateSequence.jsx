import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import HOD_API from "../../../apis/HOD";
import { useAuth } from "../../../contexts/AuthContext";
import {
  FiArrowLeft,
  FiArrowRight,
  FiSave,
  FiCheckCircle,
  FiInfo,
  FiTarget,
  FiEdit2,
  FiBook,
  FiPercent,
  FiHash,
  FiChevronRight,
  FiChevronLeft,
  FiHelpCircle,
} from "react-icons/fi";

const bloomLevels = [
  { value: "REMEMBER", label: "Remember", description: "Recall facts and basic concepts", color: "bg-blue-100 text-blue-800" },
  { value: "UNDERSTAND", label: "Understand", description: "Explain ideas or concepts", color: "bg-green-100 text-green-800" },
  { value: "APPLY", label: "Apply", description: "Use information in new situations", color: "bg-yellow-100 text-yellow-800" },
  { value: "ANALYZE", label: "Analyze", description: "Draw connections among ideas", color: "bg-orange-100 text-orange-800" },
  { value: "EVALUATE", label: "Evaluate", description: "Justify a stand or decision", color: "bg-purple-100 text-purple-800" },
  { value: "CREATE", label: "Create", description: "Produce new or original work", color: "bg-pink-100 text-pink-800" },
];

const CLOCreateSequence = () => {
  const { courseId, count } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const total = Number(count);
  const [index, setIndex] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    description: "",
    bloomLevel: "",
    version: "1.0",
    threshold: 60, // Default threshold
  });

  const autoCLOCode = `CLO${index}`;
  const courseName = location.state?.courseName;

  // Load draft data if exists
  useEffect(() => {
    const closDraft = location.state?.closDraft;
    if (closDraft && closDraft[index - 1]) {
      const draft = closDraft[index - 1];
      setForm({
        description: draft.description || "",
        bloomLevel: draft.bloomLevel || "",
        version: draft.version || "1.0",
        threshold: draft.threshold || 60,
      });
    }
  }, [index, location.state]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.description.trim()) return "Description is required";
    if (!form.bloomLevel) return "Bloom level is required";
    if (form.threshold < 40 || form.threshold > 100)
      return "Threshold must be between 40% and 100%";
    return null;
  };

  const saveCLO = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSaving(true);
    const payload = {
      cloCode: autoCLOCode,
      description: form.description,
      bloomLevel: form.bloomLevel,
      version: form.version,
      threshold: Number(form.threshold),
      courseId,
    };

    try {
      // Check if we're editing an existing CLO
      const editClo = location.state?.editClo;
      const closDraft = location.state?.closDraft;
      const existingClo = closDraft?.[0];

      if (editClo && existingClo?.id) {
        await HOD_API.clos.updateCLO(existingClo.id, payload);
      } else {
        await HOD_API.clos.createCLO(payload);
      }

      if (index < total) {
        setIndex(index + 1);
        setForm({
          description: "",
          bloomLevel: "",
          version: "1.0",
          threshold: 60,
        });
      } else {
        alert("All CLOs created successfully!");
        navigate(`/hod/courses/${courseId}/clos`);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save CLO");
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (index > 1) {
      setIndex(index - 1);
      // Note: Would need to load previous CLO data in a real implementation
    }
  };

  const progressPercentage = (index / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - Increased size */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg font-medium"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to CLO Count</span>
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiEdit2 className="text-3xl" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {location.state?.editClo ? "Edit CLO" : "Create CLO"} {index} of {total}
                  </h1>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg text-lg">
                    <FiHash className="text-xl" />
                    <span className="font-mono font-bold">{autoCLOCode}</span>
                  </div>
                  {courseName && (
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg text-lg">
                      <FiBook className="text-xl" />
                      <span>{courseName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar - Increased size */}
          <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-800">
                Progress: {index} of {total} CLOs
              </span>
              <span className="text-lg font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Main Form - Increased spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Fields */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              {/* Description - Increased size */}
              <div className="mb-10">
                <label className="block text-xl font-semibold text-gray-900 mb-4">
                  <div className="flex items-center gap-3">
                    <FiEdit2 className="text-gray-600 text-2xl" />
                    CLO Description
                  </div>
                </label>
                <textarea
                  placeholder="Describe what students should be able to do after completing this course. Use clear, measurable action verbs."
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows={5}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
                <div className="flex items-center gap-3 mt-3 text-base text-gray-600">
                  <FiInfo className="text-lg" />
                  <span>Example: "Design and implement efficient algorithms for..."</span>
                </div>
              </div>

              {/* Bloom Level - Increased size */}
              <div className="mb-10">
                <label className="block text-xl font-semibold text-gray-900 mb-4">
                  <div className="flex items-center gap-3">
                    <FiTarget className="text-gray-600 text-2xl" />
                    Bloom's Taxonomy Level
                  </div>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bloomLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange("bloomLevel", level.value)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        form.bloomLevel === level.value
                          ? `${level.color} border-blue-500 border-2`
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-lg mb-2">{level.label}</div>
                      <div className="text-base text-gray-600">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold and Version - Increased size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Threshold */}
                <div>
                  <label className="block text-xl font-semibold text-gray-900 mb-4">
                    <div className="flex items-center gap-3">
                      <FiPercent className="text-gray-600 text-2xl" />
                      Attainment Threshold
                    </div>
                  </label>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <div className="text-5xl font-bold text-gray-900">
                        {form.threshold}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={form.threshold}
                      onChange={(e) => handleChange("threshold", e.target.value)}
                      className="w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-base text-gray-600">
                      <span className="font-medium">40% (Minimum)</span>
                      <span className="font-medium">100% (Maximum)</span>
                    </div>
                    <div className="text-base text-gray-700">
                      Minimum score required for CLO attainment
                    </div>
                  </div>
                </div>

                {/* Version */}
                <div>
                  <label className="block text-xl font-semibold text-gray-900 mb-4">
                    <div className="flex items-center gap-3">
                      <FiHash className="text-gray-600 text-2xl" />
                      Version
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="Version number"
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={form.version}
                    onChange={(e) => handleChange("version", e.target.value)}
                  />
                  <div className="text-base text-gray-600 mt-3">
                    Use semantic versioning (e.g., 1.0, 1.1, 2.0)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Guidelines - Increased size */}
          <div className="space-y-8">
            {/* Writing Guidelines */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-7">
              <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-3">
                <FiHelpCircle className="text-blue-600 text-2xl" />
                Writing Guidelines
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-xl mt-0.5 flex-shrink-0" />
                  <span className="text-base text-gray-700">Start with an action verb</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-xl mt-0.5 flex-shrink-0" />
                  <span className="text-base text-gray-700">Focus on observable behaviors</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-xl mt-0.5 flex-shrink-0" />
                  <span className="text-base text-gray-700">Be specific and measurable</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-xl mt-0.5 flex-shrink-0" />
                  <span className="text-base text-gray-700">Align with course content</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-xl mt-0.5 flex-shrink-0" />
                  <span className="text-base text-gray-700">Consider assessment methods</span>
                </li>
              </ul>
            </div>

            {/* Action Verbs */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 p-7">
              <h3 className="font-bold text-gray-900 text-xl mb-5">Action Verbs</h3>
              <div className="space-y-3">
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Remember:</span> Define, List, Recall
                </div>
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Understand:</span> Explain, Summarize, Paraphrase
                </div>
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Apply:</span> Solve, Use, Demonstrate
                </div>
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Analyze:</span> Compare, Contrast, Differentiate
                </div>
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Evaluate:</span> Critique, Justify, Assess
                </div>
                <div className="text-base">
                  <span className="font-semibold text-emerald-800">Create:</span> Design, Construct, Develop
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-7">
              <div className="flex items-center gap-3 mb-4">
                <FiInfo className="text-amber-600 text-2xl" />
                <h3 className="font-bold text-gray-900 text-xl">Quick Tips</h3>
              </div>
              <p className="text-base text-gray-700">
                Each CLO should represent a distinct learning outcome. Avoid overlapping or redundant outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Increased size */}
        <div className="mt-10 flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              <FiArrowLeft className="text-xl" />
              Cancel
            </button>
            
            {index > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
              >
                <FiChevronLeft className="text-xl" />
                Previous CLO
              </button>
            )}
          </div>

          <button
            onClick={saveCLO}
            disabled={saving}
            className="flex items-center justify-center gap-4 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed font-bold text-xl"
          >
            {saving ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : index < total ? (
              <>
                <span>Save & Continue to CLO {index + 1}</span>
                <FiArrowRight className="text-2xl" />
              </>
            ) : (
              <>
                <FiSave className="text-2xl" />
                <span>Finish & Save All CLOs</span>
              </>
            )}
          </button>
        </div>

        {/* CLO Navigation Dots - Increased size */}
        {total > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="flex gap-3">
              {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setIndex(num)}
                  className={`h-4 rounded-full transition-all ${
                    num === index
                      ? 'bg-blue-600 w-10'
                      : num < index
                      ? 'bg-blue-300 w-6'
                      : 'bg-gray-300 w-6'
                  }`}
                  aria-label={`Go to CLO ${num}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CLOCreateSequence;