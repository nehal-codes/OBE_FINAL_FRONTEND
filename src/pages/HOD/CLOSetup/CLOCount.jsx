import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import {
  FiArrowLeft,
  FiArrowRight,
  FiPlus,
  FiEdit,
  FiBook,
  FiHash,
  FiInfo,
  FiCheckCircle,
  FiTarget,
  FiCpu,
} from "react-icons/fi";

const CLOCount = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cloCount, setCloCount] = useState(null);
  const [countInput, setCountInput] = useState(1);
  const [course, setCourse] = useState(null);
  const location = useLocation();
  const courseDraft = location.state?.courseDraft;
  const courseName = location.state?.courseName || courseDraft?.name;
  const returnTo = location.state?.returnTo;

  useEffect(() => {
    setLoading(false);
    loadCourse();
  }, [courseId, user?.token]);

  const loadCourse = async () => {
    try {
      if (!courseId || courseId === "draft") {
        setCourse(courseDraft || null);
        return;
      }

      if (!user?.token) {
        setCourse(null);
        return;
      }

      const res = await HOD_API.courses.getCourseById(courseId);
      setCourse(res.data);
    } catch (err) {
      console.log("Course load error:", err);
      setCourse(null);
    }
  };

  const incrementCount = () => {
    setCountInput(prev => Math.min(prev + 1, 15));
  };

  const decrementCount = () => {
    setCountInput(prev => Math.max(prev - 1, 1));
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
      courseId: courseDraft?.id || courseId || "",
      threshold: 40,
    }));
    navigate(`/hod/courses/${courseId || "draft"}/clo-mapping`, {
      state: { courseName, courseDraft, closDraft, returnTo },
    });
  };

  const recommendedCounts = [
    { value: 3, label: "Basic", description: "3-4 CLOs for introductory courses" },
    { value: 5, label: "Standard", description: "5-6 CLOs for core courses" },
    { value: 7, label: "Advanced", description: "7+ CLOs for advanced/project courses" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header - Increased size */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg"
          >
            <FiArrowLeft className="text-xl" />
            <span className="font-semibold">Back to Course</span>
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiTarget className="text-3xl" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">Define Course Learning Outcomes</h1>
                </div>
                <p className="text-blue-100 text-xl">
                  Specify how many learning outcomes you want to create for this course
                </p>
              </div>
            </div>
            
            {/* Course Info - Increased size */}
            {(course || courseDraft) && (
              <div className="mt-8 p-5 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <FiBook className="text-2xl" />
                  <div>
                    <h3 className="font-semibold text-xl">{course?.name || courseDraft?.name}</h3>
                    <div className="flex items-center gap-6 mt-2 text-blue-100 text-lg">
                      <span className="flex items-center gap-2">
                        <FiHash className="text-lg" />
                        {course?.code || courseDraft?.code}
                      </span>
                      {course?.credits && (
                        <span className="flex items-center gap-2">
                          <FiCpu className="text-lg" />
                          {course.credits} credits
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Increased spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Count Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Number of CLOs</h2>
                </div>
                <p className="text-gray-600 text-lg mb-8">
                  Select how many Course Learning Outcomes you want to define. 
                  Typically, courses have 3-7 CLOs covering different cognitive levels.
                </p>
                
                {/* Counter Input - Increased size */}
                <div className="flex flex-col items-center justify-center mb-10">
                  <div className="text-7xl md:text-8xl font-bold text-gray-900 mb-6">
                    {countInput}
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <button
                      onClick={decrementCount}
                      className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={countInput <= 1}
                    >
                      <span className="text-3xl">−</span>
                    </button>
                    
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={countInput}
                        onChange={(e) => setCountInput(Number(e.target.value))}
                        className="w-72 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    <button
                      onClick={incrementCount}
                      className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={countInput >= 15}
                    >
                      <span className="text-3xl">+</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600 text-lg">
                    <span className="font-semibold">1</span>
                    <div className="w-40 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                    <span className="font-semibold">15</span>
                  </div>
                </div>
                
                {/* Recommended Counts - Increased size */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommended Guidelines</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendedCounts.map((rec) => (
                      <button
                        key={rec.value}
                        onClick={() => setCountInput(rec.value)}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          countInput === rec.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-3xl text-gray-900">{rec.value}</span>
                          <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-100 text-blue-700">
                            {rec.label}
                          </span>
                        </div>
                        <p className="text-base text-gray-600">{rec.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons - Increased size */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={handleCreateCLOs}
                    className="flex-1 flex items-center justify-center gap-4 px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl text-lg"
                  >
                    <FiPlus className="text-2xl" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-xl">Create CLOs</div>
                      <div className="text-base text-blue-100">Define detailed outcomes</div>
                    </div>
                    <FiArrowRight className="text-2xl" />
                  </button>
                  
                  <button
                    onClick={handleDirectMapping}
                    className="flex-1 flex items-center justify-center gap-4 px-8 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl hover:shadow-2xl text-lg"
                  >
                    <FiTarget className="text-2xl" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-xl">Quick Map</div>
                      <div className="text-base text-emerald-100">Map with placeholders</div>
                    </div>
                    <FiArrowRight className="text-2xl" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Guidelines - Removed Need Help card */}
          <div className="space-y-8">
            {/* Best Practices - Increased size */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-7">
              <div className="flex items-center gap-3 mb-5">
                <FiInfo className="text-blue-600 text-2xl" />
                <h3 className="font-bold text-gray-900 text-xl">Best Practices</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-lg mt-1 flex-shrink-0" />
                  <span className="text-base text-gray-600">Keep CLOs clear and measurable</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-lg mt-1 flex-shrink-0" />
                  <span className="text-base text-gray-600">Cover different cognitive levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-lg mt-1 flex-shrink-0" />
                  <span className="text-base text-gray-600">Align with program outcomes</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="text-emerald-500 text-lg mt-1 flex-shrink-0" />
                  <span className="text-base text-gray-600">Use action verbs for clarity</span>
                </li>
              </ul>
            </div>

            {/* Bloom's Taxonomy Guide - Increased size */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-7">
              <h3 className="font-bold text-gray-900 text-xl mb-5">Bloom's Taxonomy Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Remember</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 font-semibold">Basic</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Understand</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-green-100 text-green-700 font-semibold">Low</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Apply</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-amber-100 text-amber-700 font-semibold">Medium</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Analyze</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-orange-100 text-orange-700 font-semibold">High</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Evaluate</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-purple-100 text-purple-700 font-semibold">Advanced</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-800 font-medium">Create</span>
                  <span className="px-3 py-1.5 text-sm rounded-full bg-pink-100 text-pink-700 font-semibold">Expert</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation - Increased size */}
        <div className="mt-10 flex flex-col sm:flex-row justify-between gap-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
          >
            <FiArrowLeft className="text-xl" />
            Back to Course
          </button>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(`/hod/courses/${courseId || "draft"}/clos`)}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              View Existing CLOs
            </button>
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default CLOCount;