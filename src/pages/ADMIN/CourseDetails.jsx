import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../apis/admin/adminApi';
import { 
  BookOpen, 
  Award, 
  Users, 
  Calendar,
  FileText,
  BarChart3,
  Home,
  ChevronRight,
  User
} from 'lucide-react';

const AdminCourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, clos, assessments, faculty, students

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCourseDetails(courseId);
      setCourse(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const getBloomLevelColor = (level) => {
    const colors = {
      REMEMBER: 'bg-blue-100 text-blue-800',
      UNDERSTAND: 'bg-green-100 text-green-800',
      APPLY: 'bg-yellow-100 text-yellow-800',
      ANALYZE: 'bg-orange-100 text-orange-800',
      EVALUATE: 'bg-red-100 text-red-800',
      CREATE: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      ENROLLED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      DROPPED: 'bg-red-100 text-red-800',
      FAILED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Course not found</h3>
          <p className="mt-2 text-gray-500">The requested course could not be found.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1">
          <Home className="h-4 w-4" /> Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link to={`/admin/department/${course.department?.id}/courses`} className="hover:text-blue-600">
          {course.department?.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">{course.code}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div>
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
              <div className="flex items-center mt-2 space-x-4">
                <span className="font-mono text-lg bg-blue-100 text-blue-800 px-3 py-1 rounded">
                  {course.code}
                </span>
                <span className="text-gray-600">
                  {course.credits || 0} Credits • Semester {course.semester}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.type === 'THEORY' ? 'bg-blue-100 text-blue-800' : 
                  course.type === 'PRACTICAL' ? 'bg-green-100 text-green-800' : 
                  'bg-purple-100 text-purple-800'
                }`}>
                  {course.type}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-6">
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span className="font-medium">Department:</span>
              <span className="ml-2">{course.department?.name} ({course.department?.code})</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">Created:</span>
              <span className="ml-2">{new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span className="font-medium">Created By:</span>
              <span className="ml-2">{course.createdBy?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total CLOs</p>
              <p className="text-2xl font-bold text-gray-900">{course._count?.clos || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Award className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assessments</p>
              <p className="text-2xl font-bold text-gray-900">{course._count?.assessments || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Faculty Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{course._count?.facultyAssignments || 0}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled Students</p>
              <p className="text-2xl font-bold text-gray-900">{course._count?.enrollments || 0}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Attainment %</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('clos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            CLOs ({course.clos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assessments ({course.assessments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('faculty')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'faculty'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Faculty ({course.facultyAssignments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Students ({course._count?.enrollments || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Description */}
              {course.description && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" />
                      Course Description
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                  </div>
                </div>
              )}

              {/* Recent CLOs Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Recent CLOs
                  </h2>
                  <button 
                    onClick={() => setActiveTab('clos')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className="p-6">
                  {course.clos?.slice(0, 3).map((clo) => (
                    <div key={clo.id} className="mb-4 last:mb-0">
                      <div className="flex items-center mb-1">
                        <span className="font-mono font-semibold text-blue-600 mr-2">{clo.code}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getBloomLevelColor(clo.bloomLevel)}`}>
                          {clo.bloomLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{clo.statement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Course Details */}
            <div className="space-y-6">
              {/* Course Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Course Details</h2>
                </div>
                <div className="p-6">
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Course Code</dt>
                      <dd className="text-sm font-mono text-gray-900">{course.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Semester</dt>
                      <dd className="text-sm text-gray-900">{course.semester}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Credits</dt>
                      <dd className="text-sm text-gray-900">{course.credits || 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Type</dt>
                      <dd className="text-sm text-gray-900 capitalize">{course.type?.toLowerCase()}</dd>
                    </div>
                    {course.category && (
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="text-sm text-gray-900">{course.category}</dd>
                      </div>
                    )}
                    {course.regulation && (
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Regulation</dt>
                        <dd className="text-sm text-gray-900">{course.regulation}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLOs Tab */}
        {activeTab === 'clos' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Course Learning Outcomes (CLOs)</h2>
            </div>
            <div className="p-6">
              {course.clos?.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No CLOs defined for this course</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.clos?.map((clo) => (
                    <div key={clo.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="font-mono font-bold text-blue-600 mr-3">
                          {clo.code}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBloomLevelColor(clo.bloomLevel)}`}>
                          {clo.bloomLevel}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          Threshold: {clo.attainmentThreshold}%
                        </span>
                      </div>
                      <p className="text-gray-700">{clo.statement}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Faculty Tab */}
        {activeTab === 'faculty' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Faculty Assignments</h2>
            </div>
            <div className="p-6">
              {course.facultyAssignments?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No faculty assigned to this course</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.facultyAssignments?.map((assignment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{assignment.faculty?.name}</p>
                            <p className="text-sm text-gray-500">{assignment.faculty?.designation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Semester {assignment.semester}, {assignment.year}</p>
                          <p className="text-xs text-gray-500">Assigned</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {course.enrollments?.map((enrollment) => (
                    <tr key={enrollment.student?.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">
                          {enrollment.student?.rollNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(enrollment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseDetails;