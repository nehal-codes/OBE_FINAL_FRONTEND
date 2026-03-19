import React, { useState } from 'react';
import { AlertTriangle, X, Loader } from 'lucide-react';

const UserDeactivationModal = ({ user, dependencies, onConfirm, onCancel, loading }) => {
  const [force, setForce] = useState(false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onCancel}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Deactivate User</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to deactivate <span className="font-semibold">{user?.name}</span>?
            </p>

            {dependencies?.hasActiveRelations && (
              <div className="mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Active Dependencies Found
                  </h3>
                  <p className="text-sm text-yellow-700 whitespace-pre-line mb-4">
                    {dependencies.warning}
                  </p>
                  
                  <div className="space-y-3">
                    {/* HOD Dependencies */}
                    {dependencies.hodOfDepartments?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Head of Departments:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.hodOfDepartments.map(dept => (
                            <li key={dept.id}>{dept.name} ({dept.code})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Faculty Assignments */}
                    {dependencies.facultyAssignments?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Current Teaching Assignments:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.facultyAssignments.map(assignment => (
                            <li key={assignment.id}>
                              {assignment.course.name} ({assignment.course.code}) - Semester {assignment.semester}, {assignment.year}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Active Assessments */}
                    {dependencies.activeAssessments?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Active Assessments:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.activeAssessments.map(assessment => (
                            <li key={assessment.id}>
                              {assessment.title} - {assessment.course?.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Student Enrollments */}
                    {dependencies.studentEnrollments?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Current Enrollments:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.studentEnrollments.map(enrollment => (
                            <li key={enrollment.id}>
                              {enrollment.course.name} ({enrollment.course.code}) - Semester {enrollment.semester}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Created Courses */}
                    {dependencies.createdCourses?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Created Courses:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.createdCourses.map(course => (
                            <li key={course.id}>{course.name} ({course.code})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Created CLOs */}
                    {dependencies.createdClos?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-800 mb-1">Created CLOs:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {dependencies.createdClos.map(clo => (
                            <li key={clo.id}>{clo.code} - {clo.course?.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dependencies.hasEnteredMarks && (
                      <p className="text-xs text-yellow-700">
                        • Has entered marks for students
                      </p>
                    )}
                  </div>

                  {/* Force Deactivation Option */}
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={force}
                        onChange={(e) => setForce(e.target.checked)}
                        className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium text-red-600">Force deactivation</span> - This will:
                        <ul className="list-disc list-inside mt-1 text-xs text-gray-600">
                          <li>Remove HOD status from departments</li>
                          <li>Deactivate faculty/student records</li>
                          <li>Keep course/assessment history but mark as inactive</li>
                        </ul>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Checkbox for users without dependencies */}
            {!dependencies?.hasActiveRelations && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(e) => setForce(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I understand that deactivating this user will prevent them from accessing the system
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(force)}
              disabled={(!dependencies?.hasActiveRelations && !force) || loading}
              className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center
                ${(!dependencies?.hasActiveRelations && !force) || loading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                'Deactivate User'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDeactivationModal;