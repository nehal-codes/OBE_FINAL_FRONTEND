import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import {
  FiPlus,
  FiEdit2,
  FiMap,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiBarChart2,
  FiEye,
  FiTrash2,
  FiAward,
  FiTarget,
  FiPercent,
} from "react-icons/fi";

const CLOList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clos, setClos] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloom, setSelectedBloom] = useState("");

  useEffect(() => {
    if (!courseId) return;
    loadCLOs();
    loadCourse();
  }, [courseId, user?.token]);

  const loadCLOs = async () => {
    setLoading(true);
    try {
      const res = await HOD_API.clos.getCLOs(courseId, user?.token);
      const data = res?.data || [];
      setClos(data);
    } catch (err) {
      console.error("Error loading CLOs:", err);
      setClos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourse = async () => {
    try {
      const res = await HOD_API.courses.getCourseById(courseId);
      setCourse(res.data);
    } catch (err) {
      console.log("Course load error:", err);
    }
  };

  const handleEdit = (clo) => {
    const draft = {
      id: clo.id || clo._id,
      cloCode: clo.cloCode || clo.code,
      description: clo.description || clo.statement || "",
      bloomLevel: clo.bloomLevel || clo.bloom_level || "",
      version: clo.version || "",
      threshold: clo.threshold || clo.attainmentThreshold || 40,
      courseId: courseId,
    };

    navigate(`/hod/courses/${courseId}/create-clos/1`, {
      state: { closDraft: [draft], editClo: true },
    });
  };

  const handleAddCLO = () => {
    navigate(`/hod/courses/${courseId}/clo-count`);
  };

  const handleRefresh = () => {
    loadCLOs();
  };

  const handleViewDetails = (clo) => {
    navigate(`/hod/courses/${courseId}/clos/${clo.id || clo._id}/details`);
  };

  // Filter CLOs based on search and bloom level
  const filteredClos = clos.filter(clo => {
    const matchesSearch = clo.cloCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clo.statement?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBloom = !selectedBloom || 
                        clo.bloomLevel?.toLowerCase() === selectedBloom.toLowerCase() ||
                        clo.bloom_level?.toLowerCase() === selectedBloom.toLowerCase();
    
    return matchesSearch && matchesBloom;
  });

  // Get unique bloom levels for filter
  const bloomLevels = [...new Set(clos.map(clo => clo.bloomLevel || clo.bloom_level).filter(Boolean))];

  const getBloomColor = (bloomLevel) => {
    const colors = {
      'remember': 'bg-blue-100 text-blue-800',
      'understand': 'bg-green-100 text-green-800',
      'apply': 'bg-yellow-100 text-yellow-800',
      'analyze': 'bg-orange-100 text-orange-800',
      'evaluate': 'bg-purple-100 text-purple-800',
      'create': 'bg-pink-100 text-pink-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    const level = bloomLevel?.toLowerCase();
    for (const [key, value] of Object.entries(colors)) {
      if (level?.includes(key)) return value;
    }
    return colors.default;
  };

  const getThresholdColor = (threshold) => {
    if (!threshold) return 'text-gray-600';
    if (threshold >= 70) return 'text-emerald-600';
    if (threshold >= 60) return 'text-blue-600';
    if (threshold >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <FiBookOpen className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Course Learning Outcomes (CLOs)
                </h1>
                {course && (
                  <p className="text-gray-600 mt-1">
                    <span className="font-semibold text-gray-900">{course.code}</span> • {course.name}
                    <span className="mx-2">•</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                      {course.credits || 0} credits
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!loading && clos.length === 0 && (
              <button
                onClick={handleAddCLO}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiPlus className="text-lg" />
                <span className="font-semibold">Create CLOs</span>
              </button>
            )}

            {!loading && clos.length > 0 && (
              <button
                onClick={() => navigate(`/hod/courses/${courseId}/clo-mapping`)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiMap className="text-lg" />
                <span className="font-semibold">Map CLOs</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {clos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total CLOs</p>
                  <p className="text-2xl font-bold text-gray-900">{clos.length}</p>
                </div>
                <FiAward className="text-blue-600 text-2xl" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Active CLOs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clos.filter(c => c.isActive || c.active).length}
                  </p>
                </div>
                <FiCheckCircle className="text-emerald-600 text-2xl" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Avg Threshold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {clos.length > 0 
                      ? Math.round(clos.reduce((acc, clo) => acc + (clo.threshold || clo.attainmentThreshold || 0), 0) / clos.length) 
                      : 0}%
                  </p>
                </div>
                <FiTarget className="text-amber-600 text-2xl" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Bloom Levels</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(clos.map(c => c.bloomLevel || c.bloom_level).filter(Boolean)).size}
                  </p>
                </div>
                <FiBarChart2 className="text-purple-600 text-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiSearch className="inline mr-2" />
                Search CLOs
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by CLO code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Bloom Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiFilter className="inline mr-2" />
                Filter by Bloom Level
              </label>
              <div className="relative">
                <select
                  value={selectedBloom}
                  onChange={(e) => setSelectedBloom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="">All Bloom Levels</option>
                  {bloomLevels.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLOs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading CLOs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    CLO Code
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Description
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Bloom Level
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Threshold
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClos.map((clo, index) => (
                  <tr key={clo.id || clo._id || clo.code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <span className="font-bold text-blue-700 text-lg">
                            {clo.cloCode || clo.code}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{clo.cloCode || clo.code}</div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 max-w-md">
                        {clo.description || clo.statement}
                      </div>
                      {clo.version && (
                        <div className="text-xs text-gray-500 mt-1">v{clo.version}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {clo.bloomLevel || clo.bloom_level ? (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getBloomColor(clo.bloomLevel || clo.bloom_level)}`}>
                          {clo.bloomLevel || clo.bloom_level}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not specified</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className={`text-lg font-bold ${getThresholdColor(clo.threshold || clo.attainmentThreshold)}`}>
                          {clo.threshold || clo.attainmentThreshold || "-"}
                          {(clo.threshold || clo.attainmentThreshold) && "%"}
                        </div>
                        <FiPercent className="text-gray-400 ml-1" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {clo.isActive || clo.active ? (
                          <>
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                              <FiCheckCircle className="text-emerald-600 text-lg" />
                            </div>
                            <span className="font-semibold text-emerald-700">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <FiXCircle className="text-gray-500 text-lg" />
                            </div>
                            <span className="font-semibold text-gray-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(clo)}
                          className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center justify-center"
                          title="View Details"
                        >
                          <FiEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleEdit(clo)}
                          className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center"
                          title="Edit CLO"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => navigate(`/hod/courses/${courseId}/clo-mapping`)}
                          className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center"
                          title="Map CLO"
                        >
                          <FiMap className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredClos.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {clos.length === 0 ? "No CLOs Created" : "No Matching CLOs"}
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {clos.length === 0 
                          ? "Create Course Learning Outcomes to define what students should achieve."
                          : "No CLOs match your search criteria. Try different filters."}
                      </p>
                      {clos.length === 0 && (
                        <button
                          onClick={handleAddCLO}
                          className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                          <FiPlus />
                          <span className="font-semibold">Create First CLO</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Count */}
        {filteredClos.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredClos.length}</span> of <span className="font-semibold text-gray-900">{clos.length}</span> CLOs
                {(searchTerm || selectedBloom) && " • Filtered results"}
              </p>
              <div className="flex items-center gap-4">
                {(searchTerm || selectedBloom) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedBloom("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Clear filters
                  </button>
                )}
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                  <FiBarChart2 />
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CLOList;