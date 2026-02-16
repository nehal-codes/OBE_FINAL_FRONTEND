import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import facultyApi from '../../apis/faculty';
import { 
  ArrowLeft, 
  BookOpen, 
  Award, 
  Users, 
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await facultyApi.getCourseDetails(courseId);
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
            onClick={() => navigate('/faculty/dashboard')}
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
            onClick={() => navigate('/faculty/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/faculty/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex items-start justify-between">
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${course.type === 'THEORY' ? 'bg-blue-100 text-blue-800' : course.type === 'PRACTICAL' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                    {course.type}
                  </span>
                </div>
              </div>
            </div>
            
            {course.department && (
              <div className="mt-4">
                <p className="text-gray-700">
                  <span className="font-medium">Department:</span> {course.department.name} ({course.department.code})
                </p>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Created by</p>
            <p className="font-medium">{course.createdBy?.name || 'Unknown'}</p>
            <p className="text-sm text-gray-600">{course.createdBy?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Course Info & CLOs */}
        <div className="lg:col-span-2">
          {/* Course Description */}
          {course.description && (
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Course Description
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
              </div>
            </div>
          )}

          {/* CLOs Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Course Learning Outcomes (CLOs)
                </h2>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  {course.clos.length} CLOs
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {course.clos.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-4 text-gray-500">No CLOs defined for this course</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {course.clos.map((clo) => (
                    <div key={clo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="font-mono font-bold text-lg text-blue-600 mr-3">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Assignment History & Details */}
        <div className="space-y-6">
          {/* Assignment History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Your Assignment History
              </h2>
            </div>
            <div className="p-6">
              {course.facultyAssignments?.length > 0 ? (
                <div className="space-y-4">
                  {course.facultyAssignments.map((assignment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {assignment.year} - Semester {assignment.semester}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {assignment.teachingMethodology && (
                          <p>
                            <span className="font-medium">Teaching:</span> {assignment.teachingMethodology}
                          </p>
                        )}
                        {assignment.assessmentMode && (
                          <p>
                            <span className="font-medium">Assessment:</span> {assignment.assessmentMode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No assignment history found</p>
              )}
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Course Details
              </h2>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Course Code</dt>
                  <dd className="mt-1 font-mono">{course.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Course Name</dt>
                  <dd className="mt-1">{course.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Semester</dt>
                  <dd className="mt-1">Semester {course.semester}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Credits</dt>
                  <dd className="mt-1">{course.credits || 0} Credits</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 capitalize">{course.type.toLowerCase()}</dd>
                </div>
                {course.category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1">{course.category}</dd>
                  </div>
                )}
                {course.regulation && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Regulation</dt>
                    <dd className="mt-1">{course.regulation}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Add/Edit CLOs</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                    <span>View Assessment Data</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-3" />
                    <span>Generate Course Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;