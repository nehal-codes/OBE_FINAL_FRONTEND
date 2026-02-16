import React, { useState, useEffect } from 'react';
import facultyApi from '../../apis/faculty';
import { ArrowLeft, Calendar, Filter, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AssessmentDashboard from './Assessmentdashboard';

const FacultyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: null,
    semester: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadAssignments();
  }, [filters.year, filters.semester]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await facultyApi.getAllAssignments(filters);
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : null
    }));
  };

  const clearFilters = () => {
    setFilters({ year: null, semester: null });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/faculty/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Course Assignments</h1>
            <p className="text-gray-600 mt-2">View all your course assignments across semesters</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-800">Filters</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              name="year"
              value={filters.year || ''}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Years</option>
              {[2022, 2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              name="semester"
              value={filters.semester || ''}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
          {(filters.year || filters.semester) && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No assignments found</h3>
            <p className="mt-2 text-gray-500">
              {filters.year || filters.semester
                ? 'No assignments match the selected filters'
                : 'You have not been assigned to any courses yet'}
            </p>
            {(filters.year || filters.semester) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester & Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={`${assignment.courseId}-${assignment.semester}-${assignment.year}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center">
                          <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded mr-3">
                            {assignment.course.code}
                          </span>
                          <span className="font-medium text-gray-900">{assignment.course.name}</span>
                        </div>
                        {assignment.course.department && (
                          <p className="text-sm text-gray-500 mt-1">
                            {assignment.course.department.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <span className="block">Semester {assignment.semester}</span>
                          <span className="text-sm text-gray-500">{assignment.year}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {assignment.course.credits || 0} Credits
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assignment.course.type === 'THEORY' 
                          ? 'bg-blue-100 text-blue-800' 
                          : assignment.course.type === 'PRACTICAL'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {assignment.course.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/faculty/courses/${assignment.course.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {assignments.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Assignments</h3>
            <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Credits</h3>
            <p className="text-3xl font-bold text-green-600">
              {assignments.reduce((sum, assignment) => sum + (assignment.course.credits || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unique Courses</h3>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(assignments.map(a => a.courseId)).size}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyAssignments;