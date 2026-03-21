import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../apis/admin/adminApi';
import {
  FiGrid,
  FiUsers,
  FiBook,
  FiArrowLeft,
  FiLoader,
  FiChevronRight,
  FiHome,
  FiUser
} from 'react-icons/fi';

const DepartmentsByProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, [programId]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDepartmentsByProgram(programId);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 flex-wrap">
        <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1">
          <FiHome /> Dashboard
        </Link>
        <FiChevronRight className="text-gray-400" />
        {data?.breadcrumb?.map((item, index) => (
          <React.Fragment key={index}>
            {item.path ? (
              <Link to={item.path} className="hover:text-blue-600">
                {item.level}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.level}</span>
            )}
            {index < data.breadcrumb.length - 1 && (
              <FiChevronRight className="text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data?.program?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {data?.program?.code} • {data?.program?.level} Program
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Department
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiGrid className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{data?.totalDepartments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FiBook className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.totalCourses}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Faculty</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.totalFaculties}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.departments?.map((dept) => (
          <button
            key={dept.id}
            onClick={() => navigate(`/admin/department/${dept.id}/courses`)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all text-left hover:border-blue-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <FiGrid className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-gray-500">{dept.code}</p>
                </div>
              </div>
            </div>

            {dept.hod && (
              <div className="flex items-center gap-2 mb-4 text-sm bg-gray-50 p-2 rounded-lg">
                <FiUser className="text-gray-500" />
                <span className="text-gray-700">HOD: {dept.hod.name}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-semibold text-gray-900">{dept._count.courses}</p>
                <p className="text-xs text-gray-600">Courses</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-semibold text-gray-900">{dept._count.faculties}</p>
                <p className="text-xs text-gray-600">Faculty</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-semibold text-gray-900">{dept._count.students}</p>
                <p className="text-xs text-gray-600">Students</p>
              </div>
            </div>

            {dept.description && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {dept.description}
              </p>
            )}
          </button>
        ))}
      </div>

      {data?.departments?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <FiGrid className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No departments found for this program</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add First Department
          </button>
        </div>
      )}
    </div>
  );
};

export default DepartmentsByProgram;