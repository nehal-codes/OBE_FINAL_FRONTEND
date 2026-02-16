import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import facultyApi from '../../apis/faculty';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  BarChart3, 
  ChevronRight,
  AlertCircle,
  Clock,
  Award,
  TrendingUp,
  CreditCard,
  FileText,
  PieChart,
  Building,
  Mail,
  Briefcase,
  ClipboardCheck // Added icon for assessments
} from 'lucide-react';

const FacultyDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: null,
    semester: null
  });
  const [fac, setFac] = useState('');
  
  const navigate = useNavigate();

  // Load assignments and department info
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [assignmentsRes, deptRes] = await Promise.all([
        facultyApi.getAllAssignments(filters),
        facultyApi.getDepartmentInfo()
      ]);
      console.log(assignmentsRes.data.faculty.name);
      setFac(assignmentsRes.data.faculty.name);
      setAssignments(assignmentsRes.data.assignments || []);
      setDepartmentInfo(deptRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters.year, filters.semester]);

  // Calculate dynamic statistics from assignments
  const calculateStats = () => {
    if (assignments.length === 0) {
      return {
        totalAssignments: 0,
        totalCredits: 0,
        uniqueCourses: 0,
        averageCreditsPerCourse: 0,
        courseTypeBreakdown: { THEORY: 0, PRACTICAL: 0, BOTH: 0 },
        semesterBreakdown: {},
        yearBreakdown: {},
        topCourses: []
      };
    }

    // Calculate total credits
    const totalCredits = assignments.reduce((sum, assignment) => {
      return sum + (assignment.course.credits || 0);
    }, 0);

    // Count unique courses
    const uniqueCourseIds = [...new Set(assignments.map(a => a.courseId))];
    const uniqueCourses = uniqueCourseIds.length;

    // Course type breakdown
    const courseTypeBreakdown = {
      THEORY: 0,
      PRACTICAL: 0,
      BOTH: 0
    };

    assignments.forEach(assignment => {
      const type = assignment.course.type;
      if (courseTypeBreakdown[type] !== undefined) {
        courseTypeBreakdown[type]++;
      }
    });

    // Semester breakdown
    const semesterBreakdown = {};
    assignments.forEach(assignment => {
      const key = `Year ${assignment.year} - Sem ${assignment.semester}`;
      semesterBreakdown[key] = (semesterBreakdown[key] || 0) + 1;
    });

    // Year breakdown
    const yearBreakdown = {};
    assignments.forEach(assignment => {
      yearBreakdown[assignment.year] = (yearBreakdown[assignment.year] || 0) + 1;
    });

    // Find most frequently taught courses
    const courseFrequency = {};
    assignments.forEach(assignment => {
      const key = `${assignment.course.code} - ${assignment.course.name}`;
      courseFrequency[key] = (courseFrequency[key] || 0) + 1;
    });

    const topCourses = Object.entries(courseFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([courseName, count]) => ({ courseName, count }));
   
    // Calculate current semester assignments (most recent year/semester)
    const sortedAssignments = [...assignments].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.semester - a.semester;
    });

    const mostRecentYear = sortedAssignments[0]?.year;
    const mostRecentSemester = sortedAssignments[0]?.semester;
    
    const currentSemesterAssignments = assignments.filter(assignment => 
      assignment.year === mostRecentYear && assignment.semester === mostRecentSemester
    );

    // Calculate credits per year
    const creditsByYear = {};
    assignments.forEach(assignment => {
      creditsByYear[assignment.year] = (creditsByYear[assignment.year] || 0) + (assignment.course.credits || 0);
    });
    console.log(departmentInfo);

    return {
      totalAssignments: assignments.length,
      totalCredits,
      uniqueCourses,
      averageCreditsPerCourse: assignments.length > 0 ? (totalCredits / assignments.length).toFixed(1) : 0,
      averageCreditsPerSemester: Object.values(creditsByYear).length > 0 
        ? (totalCredits / Object.values(creditsByYear).length).toFixed(1) 
        : 0,
      courseTypeBreakdown,
      semesterBreakdown,
      yearBreakdown,
      topCourses,
      currentSemesterAssignments: currentSemesterAssignments.length,
      currentSemesterCredits: currentSemesterAssignments.reduce((sum, a) => sum + (a.course.credits || 0), 0),
      mostRecentYear,
      mostRecentSemester,
      creditsByYear
    };
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : null
    }));
  };

  const handleViewCourseDetails = (courseId) => {
    navigate(`/faculty/courses/${courseId}`);
  };

  const handleClearFilters = () => {
    setFilters({ year: null, semester: null });
  };

  const handleNavigateToAssessmentsDashboard = (courseId) => {
    navigate(`/faculty/courses/${courseId}/assessments`);
  };

  const stats = calculateStats();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentSemester = currentMonth >= 1 && currentMonth <= 6 ? 2 : 1;

  // Get unique years from assignments for filter dropdown
  const uniqueYears = [...new Set(assignments.map(a => a.year))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faculty dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {fac|| 'Faculty Member'}
            </h1>
            <p className="text-gray-600 mt-2">
              {fac|| 'Faculty'} • {departmentInfo?.name || 'Department'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-right">
              <p className="text-sm text-gray-500">Showing</p>
              <p className="text-lg font-semibold">
                {filters.year ? `${filters.year}` : 'All Years'} 
                {filters.semester ? `, Sem ${filters.semester}` : ', All Semesters'}
              </p>
              <p className="text-sm text-gray-600">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {(filters.year || filters.semester) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Assessments Dashboard Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardCheck className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Assessment Management Dashboard</h2>
              <p className="text-gray-600">
                Create, manage, and track assessments for your assigned courses. Set up CLO mappings, track student performance, and generate detailed assessment reports.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Navigate to the first assigned course's assessments dashboard if available
              if (assignments.length > 0) {
                handleNavigateToAssessmentsDashboard(assignments[0].courseId);
              } else {
                navigate('/faculty/courses');
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2 shadow-sm"
          >
            <ClipboardCheck className="h-5 w-5" />
            Go to Assessments Dashboard
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {assignments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignments.slice(0, 3).map((assignment, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleNavigateToAssessmentsDashboard(assignment.courseId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold text-blue-700">
                    {assignment.course.code}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1 truncate">{assignment.course.name}</h3>
                <div className="flex items-center text-sm text-gray-500 gap-3">
                  <span className="flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {assignment.course.credits || 0} Credits
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {assignment.year} • Sem {assignment.semester}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.uniqueCourses} unique courses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCredits}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg {stats.averageCreditsPerCourse} per course
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Current Semester</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.currentSemesterAssignments}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.currentSemesterCredits} credits • {stats.mostRecentYear} Sem {stats.mostRecentSemester}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Workload Trend</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageCreditsPerSemester}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg credits per semester
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Assignments List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Assignments Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Course Assignments ({assignments.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  <select
                    name="year"
                    value={filters.year || ''}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[120px]"
                  >
                    <option value="">All Years</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    name="semester"
                    value={filters.semester || ''}
                    onChange={handleFilterChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No course assignments found</p>
                  <p className="text-sm text-gray-400">
                    {filters.year || filters.semester 
                      ? 'No assignments match the selected filters' 
                      : 'You have not been assigned to any courses yet'}
                  </p>
                  {(filters.year || filters.semester) && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={`${assignment.courseId}-${assignment.semester}-${assignment.year}`}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewCourseDetails(assignment.course.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {assignment.course.code}
                            </span>
                            <h3 className="font-medium text-gray-900">{assignment.course.name}</h3>
                            <span className="ml-auto px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {assignment.course.type}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                            <span className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-1" />
                              {assignment.course.credits || 0} Credits
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {assignment.year} • Sem {assignment.semester}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Course Sem: {assignment.course.semester}
                            </span>
                          </div>
                          {assignment.course.department && (
                            <p className="mt-2 text-sm text-gray-500">
                              {assignment.course.department.name} ({assignment.course.department.code})
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Details Section - Same width as assignments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Department Information
              </h2>
            </div>
            <div className="p-6">
              {departmentInfo ? (
                <div className="space-y-6">
                  {/* Department Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Department Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-700 w-24">Name:</span>
                          <span className="text-sm text-gray-900">{departmentInfo.name}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-medium text-gray-700 w-24">Code:</span>
                          <span className="text-sm text-gray-900">{departmentInfo.code}</span>
                        </div>
                        {departmentInfo.program && (
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-gray-700 w-24">Program:</span>
                            <span className="text-sm text-gray-900">{departmentInfo.program.name} ({departmentInfo.program.code})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* HOD Information */}
                    {departmentInfo.hod && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Head of Department
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-gray-700 w-24">Name:</span>
                            <span className="text-sm text-gray-900">{departmentInfo.hod.name}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-sm font-medium text-gray-700 w-24">Email:</span>
                            <span className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {departmentInfo.hod.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Department Colleagues */}
                  {departmentInfo.faculties && departmentInfo.faculties.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Department Colleagues ({departmentInfo.faculties.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {departmentInfo.faculties.slice(0, 6).map((faculty) => (
                          <div key={faculty.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{faculty.name}</p>
                              <p className="text-xs text-gray-500 truncate">{faculty.designation || 'Faculty Member'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {departmentInfo.faculties.length > 6 && (
                        <p className="text-sm text-gray-500 text-center mt-4">
                          +{departmentInfo.faculties.length - 6} more colleagues in the department
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No department information available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Quick Links */}
        <div className="space-y-6">
          {/* Course Type Distribution */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Course Type Distribution
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(stats.courseTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full ${
                            type === 'THEORY' ? 'bg-blue-500' :
                            type === 'PRACTICAL' ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{
                            width: `${(count / Math.max(1, assignments.length)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Taught Courses */}
          {stats.topCourses.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Most Taught Courses
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.topCourses.map((course, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {course.courseName.split(' - ')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {course.courseName.split(' - ')[1]}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {course.count} time{course.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions - Below Most Taught Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/faculty/assignments')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <span>View All Assignments</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/faculty/courses')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-green-600 mr-3" />
                    <span>Browse Courses</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/faculty/clos')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-purple-600 mr-3" />
                    <span>Manage CLOs</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button
                  onClick={() => navigate('/faculty/profile')}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-orange-600 mr-3" />
                    <span>Update Profile</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;