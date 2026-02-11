import React, { useState, useEffect } from 'react';
import HOD_API from "../../apis/HOD";
import {
  FiFilter,
  FiCalendar,
  FiRefreshCw,
  FiBook,
  FiDivide,
  FiX,
  FiBookOpen,
  FiUser,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
} from "react-icons/fi";

const AssignmentsDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    semester: "",
    semesterType: "",
  });

  // Fetch assignments from backend
  const fetchAssignments = async () => {
    try {
      console.log('📡 Fetching assignments with filters:', filters);
      
      const response = await HOD_API.assignments.getAllDepartmentAssignments(filters);
      
      console.log('✅ Assignments API Response:', response.data);
      
      let filteredData = response.data.assignments || [];
      
      if (filters.semesterType) {
        filteredData = filteredData.filter(assignment => {
          if (!assignment.semester) return false;
          const semesterNum = parseInt(assignment.semester);
          if (filters.semesterType === 'even') {
            return semesterNum % 2 === 0;
          } else if (filters.semesterType === 'odd') {
            return semesterNum % 2 === 1;
          }
          return true;
        });
      }
      
      setAssignments(filteredData);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(`Failed to load assignments: ${err.response?.data?.error || err.message}`);
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      console.log('📡 Fetching stats...');
      
      const response = await HOD_API.assignments.getAssignmentsStats();
      
      console.log('✅ Stats API Response:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(`Failed to load statistics: ${err.response?.data?.error || err.message}`);
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchAssignments(),
        fetchStats()
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      fetchAssignments();
    }
  }, [filters.year, filters.semester, filters.semesterType]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear specific filter
  const clearFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: ""
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      semester: "",
      semesterType: "",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FiBook className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Assignments</h1>
                    <p className="text-gray-600 text-sm">
                      Manage and view faculty course assignments across the department
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={loadAllData}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm hover:shadow-sm"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <FiX className="text-red-600" />
                  <h3 className="font-semibold text-gray-900">Error Loading Data</h3>
                </div>
                <p className="text-gray-700 mb-3 text-sm">{error}</p>
                <button
                  onClick={loadAllData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFilter className="text-gray-600" />
              Filter Assignments
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Semester Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester Type
                </label>
                <select
                  name="semesterType"
                  value={filters.semesterType}
                  onChange={handleFilterChange}
                  className="w-full p-3 text-sm border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="even">Even Semesters</option>
                  <option value="odd">Odd Semesters</option>
                </select>
              </div>

              {/* Specific Semester Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Semester
                </label>
                <select
                  name="semester"
                  value={filters.semester}
                  onChange={handleFilterChange}
                  className="w-full p-3 text-sm border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full p-3 text-sm border border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply Button */}
              <div className="flex items-end">
                <button 
                  onClick={loadAllData}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-sm shadow-sm hover:shadow"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filters.semesterType || filters.semester || filters.year !== new Date().getFullYear()) && (
              <div className="mt-6 pt-5 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <FiFilter className="w-4 h-4" />
                  <span className="font-medium text-sm">Active Filters:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {filters.semesterType && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                      {filters.semesterType === "even" ? "Even Semesters" : "Odd Semesters"}
                      <button
                        onClick={() => clearFilter("semesterType")}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.semester && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200">
                      Semester {filters.semester}
                      <button
                        onClick={() => clearFilter("semester")}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.year !== new Date().getFullYear() && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-300">
                      Year: {filters.year}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, year: new Date().getFullYear() }))}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-600 hover:text-gray-800 underline ml-2"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBook className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Course Assignments</h2>
                  <p className="text-sm text-gray-600">
                    List of faculty assignments across the department
                  </p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-900">
                  {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {assignments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-300 mb-4">
                  <FiBook className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Found</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  No faculty assignments found for the selected filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm shadow-sm hover:shadow"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Faculty</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment, index) => (
                    <tr 
                      key={assignment.id || index} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Course Information - Name on top, code below */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {assignment.course?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {assignment.course?.code || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Faculty Information */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-50 to-green-100 flex items-center justify-center border border-green-200">
                            <FiUser className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {assignment.faculty?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <FiMail className="w-3 h-3" />
                              {assignment.faculty?.user?.email || assignment.faculty?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Semester - Only number */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-base">
                          {assignment.semester || 'N/A'}
                        </div>
                      </td>

                      {/* Year */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {assignment.year}
                        </div>
                      </td>

                      {/* Credits - Simple number without decoration */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-base">
                          {assignment.course?.credits || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Table Footer Info */}
        {assignments.length > 0 && (
          <div className="mt-6 px-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {assignments.length} assignments
                {filters.semesterType && ` in ${filters.semesterType === 'even' ? 'Even' : 'Odd'} Semesters`}
                {filters.semester && ` for Semester ${filters.semester}`}
                {filters.year !== new Date().getFullYear() && ` in ${filters.year}`}
              </p>
              
              {/* Simple Pagination */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">1 of 1</span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <FiChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsDashboard;