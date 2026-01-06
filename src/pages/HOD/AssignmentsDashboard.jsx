import React, { useState, useEffect } from 'react';
import HOD_API from "../../apis/HOD";

const AssignmentsDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    semester: 1
  });

  // Fetch assignments from backend
  const fetchAssignments = async () => {
    try {
      console.log('📡 Fetching assignments with filters:', filters);
      
      const response = await HOD_API.assignments.getAllDepartmentAssignments(filters);
      
      console.log('✅ Assignments API Response:', response.data);
      setAssignments(response.data.assignments || []);
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
  }, [filters.year, filters.semester]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check endpoints for debugging
  const checkEndpoints = async () => {
    console.log('🔍 Checking HOD API endpoints...');
    
    try {
      const assignmentsTest = await HOD_API.assignments.getAllDepartmentAssignments(filters);
      console.log('✅ Assignments endpoint OK:', assignmentsTest.status);
      
      const statsTest = await HOD_API.assignments.getAssignmentsStats();
      console.log('✅ Stats endpoint OK:', statsTest.status);
      
      alert('✅ Both endpoints are working!');
      
    } catch (error) {
      console.error('❌ Endpoint check failed:', error);
      alert(`❌ Endpoint check failed: ${error.message}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
          <button onClick={checkEndpoints} className="btn btn-secondary">
            Check API Endpoints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="header">
        <h1>
          <span className="header-icon">📊</span>
          Course Assignments Dashboard
        </h1>
        
        <p className="subtitle">
          Manage and view faculty course assignments across the department
        </p>
        
        <div className="header-actions">
          <div className="filters">
            <div className="form-group">
              <label>Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {[2022, 2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Semester</label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="filter-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={loadAllData}
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <h3>Error</h3>
          <p>{error}</p>
          <div className="alert-actions">
            <button onClick={loadAllData} className="btn btn-primary">
              Retry
            </button>
            <button onClick={checkEndpoints} className="btn btn-secondary">
              Check Endpoints
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <h3>Total Assignments</h3>
          </div>
          <div className="stats-content">
            <div className="stats-icon">
              <div className="icon-circle">
                {stats.overview?.totalAssignments || 0}
              </div>
            </div>
            <div className="stats-info">
              <p className="stats-title">All Time</p>
              <p className="stats-subtitle">
                Across all semesters and years
              </p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-header">
            <h3>Current Year ({stats.overview?.currentYear || new Date().getFullYear()})</h3>
          </div>
          <div className="stats-content">
            <div className="stats-icon">
              <div className="icon-circle">
                {stats.overview?.currentYearAssignments || 0}
              </div>
            </div>
            <div className="stats-info">
              <p className="stats-title">This Year</p>
              <p className="stats-subtitle">
                Assignments in current academic year
              </p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-header">
            <h3>Semester {filters.semester}</h3>
          </div>
          <div className="stats-content">
            <div className="stats-icon">
              <div className="icon-circle">
                {stats.bySemester?.find(s => s.semester === parseInt(filters.semester))?.count || 0}
              </div>
            </div>
            <div className="stats-info">
              <p className="stats-title">Current Semester</p>
              <p className="stats-subtitle">
                For selected semester {filters.semester}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card">
        <div className="card-header">
          <h2>
            Current Assignments ({assignments.length})
          </h2>
        </div>
        
        <div className="card-body">
          {assignments.length === 0 ? (
            <div className="alert alert-info">
              <h3>No Assignments Found</h3>
              <p>
                No faculty assignments found for the selected filters.
              </p>
              <p>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => setFilters({ year: new Date().getFullYear(), semester: 1 })}
                >
                  Reset Filters
                </button>
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Faculty</th>
                    <th>Semester</th>
                    <th>Year</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, index) => (
                    <tr key={assignment.id || index}>
                      <td>
                        <div className="faculty-info">
                          <span className="icon">📚</span>
                          <span>{assignment.course?.code || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{assignment.course?.name || 'N/A'}</td>
                      <td>
                        <div className="faculty-info">
                          <span className="icon">👤</span>
                          <span>{assignment.faculty?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-primary">
                          Semester {assignment.semester}
                        </span>
                      </td>
                      <td>{assignment.year}</td>
                      <td>
                        <span className="chip chip-secondary">
                          {assignment.course?.credits || 'N/A'} credits
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top Sections */}
      <div className="stats-grid">
        {/* Top Faculties */}
        {stats.topFaculties && stats.topFaculties.length > 0 && (
          <div className="stats-card">
            <div className="stats-header">
              <h3>Top Faculties by Assignments</h3>
            </div>
            <div className="stats-content">
              <div className="top-list">
                {stats.topFaculties.map((faculty, index) => (
                  <div key={faculty.facultyId} className="top-item">
                    <span className="rank">{index + 1}</span>
                    <div className="item-details">
                      <strong>{faculty.name}</strong>
                      <span>{faculty.designation || 'Faculty'}</span>
                    </div>
                    <div className="item-count">
                      {faculty.assignmentCount} assignment(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Courses */}
        {stats.topCourses && stats.topCourses.length > 0 && (
          <div className="stats-card">
            <div className="stats-header">
              <h3>Courses with Most Faculty</h3>
            </div>
            <div className="stats-content">
              <div className="top-list">
                {stats.topCourses.map((course, index) => (
                  <div key={course.courseId} className="top-item">
                    <span className="rank">{index + 1}</span>
                    <div className="item-details">
                      <strong>{course.code}</strong>
                      <span>{course.name}</span>
                    </div>
                    <div className="item-count">
                      {course.facultyCount} faculty
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add CSS styles
const styles = `
.dashboard-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #2c3e50;
}

.header-icon {
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
  margin-top: 20px;
}

.filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-left: auto;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* Form Elements */
.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
  background-color: white;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Cards */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.card-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.card-body {
  padding: 24px;
}

/* Alerts */
.alert {
  padding: 16px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid;
}

.alert-info {
  background-color: #e8f4fd;
  border-color: #3498db;
  color: #2c3e50;
}

.alert-error {
  background-color: #fdeaea;
  border-color: #e74c3c;
  color: #c0392b;
}

.alert h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 18px;
}

.alert-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* Table */
.table-responsive {
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  background-color: #f8f9fa;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
}

.table tr:hover {
  background-color: #f8f9fa;
}

.faculty-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  font-size: 16px;
  opacity: 0.7;
}

/* Chips */
.chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.chip-primary {
  background-color: #e8f4fd;
  color: #2980b9;
  border: 1px solid #b3d7ff;
}

.chip-secondary {
  background-color: #f0e8ff;
  color: #6c3483;
  border: 1px solid #d2b4de;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.stats-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stats-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stats-icon {
  flex-shrink: 0;
}

.icon-circle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.stats-info {
  flex: 1;
}

.stats-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.stats-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

/* Top Lists */
.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  gap: 15px;
}

.rank {
  background: #0366d6;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-details strong {
  display: block;
  margin-bottom: 2px;
  color: #24292e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details span {
  font-size: 12px;
  color: #586069;
}

.item-count {
  font-weight: 600;
  color: #24292e;
  flex-shrink: 0;
}

/* Loading */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .header h1 {
    font-size: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filters {
    margin-left: 0;
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
  
  .filters .form-group {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stats-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .icon-circle {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .table-responsive {
    font-size: 13px;
  }
  
  .table th,
  .table td {
    padding: 10px 12px;
  }
  
  .top-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .item-details {
    min-width: 150px;
  }
  
  .item-count {
    width: 100%;
    text-align: right;
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default AssignmentsDashboard;