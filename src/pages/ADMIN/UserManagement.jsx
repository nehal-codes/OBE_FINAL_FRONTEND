import React, { useState, useEffect } from 'react';
import { userApi } from '../../apis/admin/userApi';
import UserDeactivationModal from '../../components/UserDeactivationModal';
import {
  Users,
  User,
  UserCog,
  GraduationCap,
  BookOpen,
  Mail,
  ChevronRight,
  Search,
  Briefcase,
  CheckCircle,
  XCircle,
  Loader,
  Filter
} from 'lucide-react';

const UserManagement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [viewMode, setViewMode] = useState('categories');
  
  // Deactivation state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [userDependencies, setUserDependencies] = useState(null);
  const [deactivationLoading, setDeactivationLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsersByCategory();
      console.log('API Response:', response.data);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'ADMIN': return <UserCog className="text-purple-600" />;
      case 'HOD': return <Briefcase className="text-blue-600" />;
      case 'FACULTY': return <BookOpen className="text-green-600" />;
      case 'STUDENT': return <GraduationCap className="text-amber-600" />;
      default: return <User className="text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'HOD': return 'bg-blue-100 text-blue-800';
      case 'FACULTY': return 'bg-green-100 text-green-800';
      case 'STUDENT': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  // Filter users based on search term AND status
  const filterUsers = (users) => {
    if (!users) return [];
    
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.faculty?.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.student?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.isActive === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => user.isActive === false);
    }
    
    return filtered;
  };

  // Get counts for active/inactive users
  const getStatusCounts = (users) => {
    if (!users) return { active: 0, inactive: 0 };
    return {
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
  };

  const handleDeactivateClick = async (user) => {
    try {
      setDeactivationLoading(true);
      setActionInProgress(user.id);
      setSelectedUser(user);
      
      // Check dependencies
      const response = await userApi.checkUserDependencies(user.id);
      setUserDependencies(response.data);
      setShowDeactivationModal(true);
    } catch (err) {
      console.error('Error checking dependencies:', err);
      alert(err.response?.data?.error || 'Failed to check user dependencies');
    } finally {
      setDeactivationLoading(false);
      setActionInProgress(null);
    }
  };

  const handleDeactivateConfirm = async (force) => {
    try {
      setDeactivationLoading(true);
      
      await userApi.toggleUserStatus(selectedUser.id, false, force);
      
      // Refresh user data
      await fetchData();
      
      setShowDeactivationModal(false);
      setSelectedUser(null);
      setUserDependencies(null);
      
      alert('User deactivated successfully');
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to deactivate user');
    } finally {
      setDeactivationLoading(false);
    }
  };

  const handleActivateUser = async (user) => {
    if (!window.confirm(`Are you sure you want to activate ${user.name}?`)) {
      return;
    }
    
    try {
      setActionInProgress(user.id);
      await userApi.toggleUserStatus(user.id, true);
      await fetchData();
      alert('User activated successfully');
    } catch (err) {
      console.error('Error activating user:', err);
      alert(err.response?.data?.error || 'Failed to activate user');
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate overall active/inactive counts
  const allUsers = [
    ...(data?.admins || []),
    ...(data?.usersByRole?.HOD || []),
    ...(data?.usersByRole?.FACULTY || []),
    ...(data?.usersByRole?.STUDENT || [])
  ];
  const activeCount = allUsers.filter(u => u.isActive).length;
  const inactiveCount = allUsers.filter(u => !u.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 mr-3 text-blue-600" />
          User Management
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage all users across departments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.totalUsers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data?.usersByRole?.ADMIN?.length || 0} Admins • {data?.usersByRole?.HOD?.length || 0} HODs • {data?.usersByRole?.FACULTY?.length || 0} Faculty • {data?.usersByRole?.STUDENT?.length || 0} Students
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((activeCount / allUsers.length) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((inactiveCount / allUsers.length) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4 mr-1" />
            All ({allUsers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
              statusFilter === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Inactive ({inactiveCount})
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setViewMode('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'categories'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Department View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          List View
        </button>
      </div>

      {/* Department View */}
      {viewMode === 'categories' && (
        <div className="space-y-8">
          {/* Admins Section - NO DEACTIVATE BUTTONS for System Administrators */}
          {data?.admins && data.admins.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserCog className="h-5 w-5 mr-2 text-purple-600" />
                System Administrators
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({getStatusCounts(data.admins).active} active, {getStatusCounts(data.admins).inactive} inactive)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterUsers(data.admins).map(admin => (
                  <div key={admin.id} className={`bg-white rounded-xl border p-4 ${
                    admin.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
                  }`}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCog className="text-purple-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{admin.name}</p>
                          {getStatusBadge(admin.isActive)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {admin.email}
                        </p>
                      </div>
                    </div>
                    {/* NO DEACTIVATE/ACTIVATE BUTTONS FOR SYSTEM ADMINISTRATORS */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments Section - KEEP DEACTIVATE BUTTONS for faculty/students */}
          {data?.usersByDepartment && data.usersByDepartment.map((dept) => {
            // Filter faculty and students based on search and status
            const filteredFaculty = filterUsers(dept.faculty || []);
            const filteredStudents = filterUsers(dept.students || []);
            
            // Skip if no matches after filtering
            if (filteredFaculty.length === 0 && filteredStudents.length === 0) {
              return null;
            }

            const facultyStatus = getStatusCounts(dept.faculty);
            const studentStatus = getStatusCounts(dept.students);

            return (
              <div key={dept.department.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Department Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {dept.department.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {dept.department.code} • {dept.department.program?.name} ({dept.department.program?.level})
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {dept.counts?.faculty || 0} Faculty ({facultyStatus.active} active)
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        {dept.counts?.students || 0} Students ({studentStatus.active} active)
                      </span>
                    </div>
                  </div>
                  {dept.hod && (
                    <div className="mt-3 flex items-center justify-between text-sm bg-white/50 p-2 rounded-lg">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="font-medium">Head of Department:</span>
                        <span className="ml-2">{dept.hod.name}</span>
                        <span className="ml-2 text-gray-500">({dept.hod.email})</span>
                      </div>
                      {getStatusBadge(dept.hod.isActive)}
                    </div>
                  )}
                </div>

                {/* Faculty Section - KEEP ACTION BUTTONS */}
                {filteredFaculty.length > 0 && (
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-green-600" />
                      Faculty Members ({filteredFaculty.length} shown)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFaculty.map((faculty) => (
                        <div key={faculty.id} className={`border rounded-lg p-3 ${
                          faculty.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <BookOpen className="text-green-600 h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{faculty.name}</p>
                                <p className="text-xs text-gray-500">{faculty.faculty?.designation || 'Faculty'}</p>
                                <p className="text-xs text-gray-400">{faculty.email}</p>
                                <div className="mt-1">
                                  {getStatusBadge(faculty.isActive)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end space-x-2 border-t pt-2">
                            {faculty.isActive ? (
                              <button
                                onClick={() => handleDeactivateClick(faculty)}
                                disabled={actionInProgress === faculty.id}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {actionInProgress === faculty.id ? (
                                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(faculty)}
                                disabled={actionInProgress === faculty.id}
                                className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {actionInProgress === faculty.id ? (
                                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Students Section - KEEP ACTION BUTTONS */}
                {filteredStudents.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-amber-600" />
                      Students ({filteredStudents.length} shown)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.slice(0, 6).map((student) => (
                        <div key={student.id} className={`border rounded-lg p-3 ${
                          student.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                <GraduationCap className="text-amber-600 h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">
                                  Roll: {student.student?.rollNumber || 'N/A'} | Sem: {student.student?.currentSemester || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-400">{student.email}</p>
                                <div className="mt-1">
                                  {getStatusBadge(student.isActive)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end space-x-2 border-t pt-2">
                            {student.isActive ? (
                              <button
                                onClick={() => handleDeactivateClick(student)}
                                disabled={actionInProgress === student.id}
                                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {actionInProgress === student.id ? (
                                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(student)}
                                disabled={actionInProgress === student.id}
                                className="text-xs px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {actionInProgress === student.id ? (
                                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {filteredStudents.length > 6 && (
                      <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        View all {filteredStudents.length} students
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {(!data?.usersByDepartment || data.usersByDepartment.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* List View - KEEP ACTION BUTTONS for all except System Administrators */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Combine and filter all users for list view */}
                {[
                  ...(data?.admins?.map(u => ({ ...u, departmentName: 'System-wide' })) || []),
                  ...(data?.usersByRole?.HOD?.map(u => ({ ...u, departmentName: u.department?.name })) || []),
                  ...(data?.usersByRole?.FACULTY?.map(u => ({ ...u, departmentName: u.department?.name })) || []),
                  ...(data?.usersByRole?.STUDENT?.map(u => ({ ...u, departmentName: u.department?.name })) || [])
                ]
                .filter(user => {
                  // Apply filters
                  if (searchTerm) {
                    const matches = 
                      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.faculty?.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.student?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!matches) return false;
                  }
                  
                  if (statusFilter === 'active') return user.isActive === true;
                  if (statusFilter === 'inactive') return user.isActive === false;
                  return true;
                })
                .map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${
                    !user.isActive ? 'bg-red-50/30' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'ADMIN' ? 'bg-purple-100' :
                          user.role === 'HOD' ? 'bg-blue-100' :
                          user.role === 'FACULTY' ? 'bg-green-100' : 'bg-amber-100'
                        }`}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.departmentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role === 'ADMIN' && 'Admin'}
                      {user.role === 'HOD' && 'Head of Department'}
                      {user.role === 'FACULTY' && (user.faculty?.designation || 'Faculty')}
                      {user.role === 'STUDENT' && `Roll: ${user.student?.rollNumber || 'N/A'}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* Only show action buttons for non-ADMIN users */}
                      {user.role !== 'ADMIN' && (
                        <>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivateClick(user)}
                              disabled={actionInProgress === user.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title="Deactivate user"
                            >
                              {actionInProgress === user.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user)}
                              disabled={actionInProgress === user.id}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title="Activate user"
                            >
                              {actionInProgress === user.id ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                      {/* Empty cell for ADMIN users - no buttons */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deactivation Modal */}
      {showDeactivationModal && (
        <UserDeactivationModal
          user={selectedUser}
          dependencies={userDependencies}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => {
            setShowDeactivationModal(false);
            setSelectedUser(null);
            setUserDependencies(null);
          }}
          loading={deactivationLoading}
        />
      )}
    </div>
  );
};

export default UserManagement;