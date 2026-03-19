import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../apis/admin/adminApi';
import { adminFacultyApi } from '../../apis/admin/facultyApi';
import AddFacultyModal from '../../components/AddFacultyModal';
import {
  FiBook,
  FiGrid,
  FiUsers,
  FiBookOpen,
  FiArrowRight,
  FiTrendingUp,
  FiLoader,
  FiHome,
  FiUserPlus
} from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [programTypes, setProgramTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      setStats(response.data.totalStats);
      setProgramTypes(response.data.programTypes);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacultyClick = async () => {
    try {
      setLoadingDepartments(true);
      const response = await adminFacultyApi.getDepartmentsForDropdown();
      setDepartments(response.data);
      setShowAddFacultyModal(true);
    } catch (err) {
      console.error('Error fetching departments:', err);
      alert('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleFacultyAdded = () => {
    // Refresh dashboard stats if needed
    fetchDashboardData();
    alert('Faculty added successfully!');
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'UG': return 'from-emerald-500 to-teal-500';
      case 'PG': return 'from-blue-500 to-indigo-500';
      case 'DIPLOMA': return 'from-amber-500 to-orange-500';
      case 'CERTIFICATE': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage programs, departments, and courses</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Programs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.programs || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiBookOpen className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Total Departments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.departments || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FiGrid className="text-2xl text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.courses || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FiBook className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Program Types Grid - Main Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-blue-600" />
          Program Levels - Click to Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {programTypes.map((type) => (
            <button
              key={type.level}
              onClick={() => navigate(`/admin/programs/${type.level}`)}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${getLevelColor(type.level)} p-1 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 h-full hover:bg-white/95 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl mb-2 block">{type.icon}</span>
                    <h3 className="font-bold text-gray-900 text-lg">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.count} Programs</p>
                  </div>
                  <FiArrowRight className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={handleAddFacultyClick}
            disabled={loadingDepartments}
            className="p-4 border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FiUserPlus className="text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {loadingDepartments ? 'Loading...' : 'Add Faculty'}
            </span>
          </button>
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-center"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FiUsers className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Manage Users</span>
          </button>
        </div>
      </div>

      {/* Add Faculty Modal */}
      <AddFacultyModal
        isOpen={showAddFacultyModal}
        onClose={() => setShowAddFacultyModal(false)}
        onSuccess={handleFacultyAdded}
        departments={departments}
      />
    </div>
  );
};

export default Dashboard;