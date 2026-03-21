import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../apis/admin/adminApi';
import {
  FiBook,
  FiGrid,
  FiUsers,
  FiArrowLeft,
  FiLoader,
  FiChevronRight,
  FiHome
} from 'react-icons/fi';

const ProgramsByLevel = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, [level]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProgramsByLevel(level);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (lvl) => {
    switch(lvl) {
      case 'UG': return 'from-emerald-500 to-teal-500';
      case 'PG': return 'from-blue-500 to-indigo-500';
      case 'DIPLOMA': return 'from-amber-500 to-orange-500';
      case 'CERTIFICATE': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getLevelBadgeColor = (lvl) => {
    switch(lvl) {
      case 'UG': return 'bg-emerald-100 text-emerald-700';
      case 'PG': return 'bg-blue-100 text-blue-700';
      case 'DIPLOMA': return 'bg-amber-100 text-amber-700';
      case 'CERTIFICATE': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading programs...</p>
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
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/admin" className="hover:text-blue-600 flex items-center gap-1">
          <FiHome /> Dashboard
        </Link>
        <FiChevronRight className="text-gray-400" />
        <span className="text-gray-900 font-medium">{level} Programs</span>
      </nav>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-gray-600" />
          </button>
          <div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getLevelBadgeColor(level)} mb-2`}>
              {level}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data?.levelInfo?.name || `${level} Programs`}
            </h1>
            {data?.levelInfo?.description && (
              <p className="text-gray-600 mt-1">{data.levelInfo.description}</p>
            )}
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Add New Program
        </button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.programs?.map((program) => (
          <button
            key={program.id}
            onClick={() => navigate(`/admin/program/${program.id}/departments`)}
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all text-left hover:border-blue-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center`}>
                <FiBook className="text-white text-xl" />
              </div>
              <span className="text-xs font-medium text-gray-500">
                {program.code || 'No Code'}
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600">
              {program.name}
            </h3>

            {program.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {program.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <FiGrid className="text-gray-400" />
                <span>{program._count?.departments || 0} Depts</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <FiUsers className="text-gray-400" />
                <span>{program._count?.students || 0} Students</span>
              </div>
            </div>

            {program.duration && (
              <div className="mt-3 text-xs text-gray-500">
                Duration: {program.duration} Years
              </div>
            )}
          </button>
        ))}
      </div>

      {data?.programs?.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <FiBook className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No programs found for {level} level</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add First Program
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgramsByLevel;