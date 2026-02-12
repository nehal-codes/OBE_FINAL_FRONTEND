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
  { value: "REMEMBER", label: "Remember", description: "Recall facts and basic concepts", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "UNDERSTAND", label: "Understand", description: "Explain ideas or concepts", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "APPLY", label: "Apply", description: "Use information in new situations", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "ANALYZE", label: "Analyze", description: "Draw connections among ideas", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "EVALUATE", label: "Evaluate", description: "Justify a stand or decision", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "CREATE", label: "Create", description: "Produce new or original work", color: "bg-pink-50 text-pink-700 border-pink-200" },
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
    threshold: 60,
  });

  const autoCLOCode = `CLO${index}`;
  const courseName = location.state?.courseName;

  useEffect(() => {
    const closDraft = location.state?.closDraft;
    if (closDraft && closDraft[index - 1]) {
      const draft = closDraft[index - 1];
      const draftThreshold = draft.threshold || 60;
      const clampedThreshold = Math.min(70, Math.max(40, Number(draftThreshold)));
      
      setForm({
        description: draft.description || "",
        bloomLevel: draft.bloomLevel || "",
        version: draft.version || "1.0",
        threshold: clampedThreshold,
      });
    }
  }, [index, location.state]);

  const handleChange = (field, value) => {
    if (field === "threshold") {
      const numValue = Number(value);
      const clampedValue = Math.min(70, Math.max(40, numValue));
      setForm((prev) => ({ ...prev, [field]: clampedValue }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validate = () => {
    if (!form.description.trim()) return "Description is required";
    if (!form.bloomLevel) return "Bloom level is required";
    if (form.threshold < 40 || form.threshold > 70)
      return "Threshold must be between 40% and 70%";
    return null;
  };

  const saveCLO = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSaving(true);
    
    const clampedThreshold = Math.min(70, Math.max(40, Number(form.threshold)));
    
    const payload = {
      cloCode: autoCLOCode,
      description: form.description,
      bloomLevel: form.bloomLevel,
      version: form.version,
      threshold: clampedThreshold,
      courseId,
    };

    try {
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
    }
  };

  const progressPercentage = (index / total) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-base font-medium mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Course
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {location.state?.editClo ? "Edit CLO" : "Create CLO"} {index} of {total}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiHash className="w-5 h-5" />
                    <span className="font-medium">{autoCLOCode}</span>
                  </div>
                  {courseName && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <FiBook className="w-5 h-5" />
                      <span>{courseName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-medium text-gray-700">
                  Progress: {index} of {total} CLOs
                </span>
                <span className="text-base font-medium text-blue-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Description */}
              <div className="mb-8">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  CLO Description
                </label>
                <textarea
                  placeholder="Describe what students should be able to do after completing this course. Use clear, measurable action verbs."
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={5}
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
                <p className="text-gray-600 text-sm mt-2">
                  Example: "Design and implement efficient algorithms for..."
                </p>
              </div>

              {/* Bloom's Taxonomy */}
              <div className="mb-8">
                <label className="block text-lg font-medium text-gray-700 mb-3">
                  Bloom's Taxonomy Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bloomLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange("bloomLevel", level.value)}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        form.bloomLevel === level.value
                          ? `${level.color} border-blue-500`
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-base mb-1">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold & Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Attainment Threshold
                  </label>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {form.threshold}%
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Minimum score required for CLO attainment
                      </p>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="70"
                      step="5"
                      value={form.threshold}
                      onChange={(e) => handleChange("threshold", Number(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>40% (Minimum)</span>
                      <span>70% (Maximum)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Version
                  </label>
                  <input
                    type="text"
                    placeholder="Version number"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.version}
                    onChange={(e) => handleChange("version", e.target.value)}
                  />
                  <p className="text-gray-600 text-sm mt-2">
                    Use semantic versioning (e.g., 1.0, 1.1, 2.0)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Writing Guidelines */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 text-lg mb-4">
                Writing Guidelines
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-base">Start with an action verb</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-base">Focus on observable behaviors</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-base">Be specific and measurable</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-base">Align with course content</span>
                </li>
                <li className="flex items-start gap-2">
                  <FiCheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-base">Consider assessment methods</span>
                </li>
              </ul>
            </div>

            {/* Action Verbs */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-medium text-gray-900 text-lg mb-3">
                Action Verbs
              </h3>
              <div className="space-y-2">
                <div className="text-base">
                  <span className="font-medium text-gray-900">Remember:</span> Define, List, Recall
                </div>
                <div className="text-base">
                  <span className="font-medium text-gray-900">Understand:</span> Explain, Summarize, Paraphrase
                </div>
                <div className="text-base">
                  <span className="font-medium text-gray-900">Apply:</span> Solve, Use, Demonstrate
                </div>
                <div className="text-base">
                  <span className="font-medium text-gray-900">Analyze:</span> Compare, Contrast, Differentiate
                </div>
                <div className="text-base">
                  <span className="font-medium text-gray-900">Evaluate:</span> Critique, Justify, Assess
                </div>
                <div className="text-base">
                  <span className="font-medium text-gray-900">Create:</span> Design, Construct, Develop
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-2">
                <FiInfo className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 text-lg mb-1">Quick Tips</h3>
                  <p className="text-gray-700 text-base">
                    Each CLO should represent a distinct learning outcome. Avoid overlapping or redundant outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
            >
              Cancel
            </button>
            
            {index > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
              >
                <FiChevronLeft className="w-5 h-5" />
                Previous
              </button>
            )}
          </div>

          <button
            onClick={saveCLO}
            disabled={saving}
            className="flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : index < total ? (
              <>
                <span>Save & Continue</span>
                <FiArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <FiSave className="w-5 h-5" />
                <span>Finish & Save All</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Dots */}
        {total > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              {Array.from({ length: total }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setIndex(num)}
                  className={`h-2 rounded-full transition-all ${
                    num === index
                      ? 'bg-blue-600 w-8'
                      : num < index
                      ? 'bg-blue-300 w-4'
                      : 'bg-gray-300 w-4'
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