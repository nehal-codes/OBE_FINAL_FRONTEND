// src/components/faculty/performance/StudentPerformanceTable.jsx
import React, { useState, useMemo } from 'react';
import { Filter, AlertTriangle } from 'lucide-react';
import "./StudentPerformanceAnalysis.css";
import facultyApi from '../../../apis/faculty';
const StudentPerformanceTable = ({ performanceData, cloList, isAllMode, calculateAttainmentLevel }) => {
  const [studentFilter, setStudentFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });

  const sortedStudents = useMemo(() => {
    if (!performanceData?.students) return [];
    return [...performanceData.students].sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortConfig.key === 'rollNumber') { aVal = a.rollNumber; bVal = b.rollNumber; }
      else { aVal = a.totalPercentage; bVal = b.totalPercentage; }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [performanceData, sortConfig]);
console.log("issubmitting", performanceData?.isReportSubmitted);
  const filteredStudents = useMemo(() => {
    if (!studentFilter.trim()) return sortedStudents;
    const f = studentFilter.toLowerCase();
    return sortedStudents.filter(s =>
      s.name.toLowerCase().includes(f) || s.rollNumber.toLowerCase().includes(f)
    );
  }, [sortedStudents, studentFilter]);

  return (
    <div className="student-performance-section">
      <div className="table-controls">
        <div className="search-box">
          <Filter size={18} />
          <input
            type="text"
            placeholder="Search by name or roll number…"
            value={studentFilter}
            onChange={e => setStudentFilter(e.target.value)}
          />
        </div>
        <div className="sort-controls">
          <span>Sort by:</span>
          <select
            value={sortConfig.key}
            onChange={e => setSortConfig({ key: e.target.value, direction: 'desc' })}
          >
            <option value="percentage">Overall %</option>
            <option value="name">Name</option>
            <option value="rollNumber">Roll Number</option>
          </select>
          <button
            className="sort-direction"
            onClick={() => setSortConfig(prev => ({
              ...prev,
              direction: prev.direction === 'asc' ? 'desc' : 'asc'
            }))}
          >
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="student-table-container">
        <table className="student-clo-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Student Name</th>
              {isAllMode && <th>Assessments</th>}
              {cloList.map(clo => (
                <th key={clo.id} colSpan="2">{clo.code}</th>
              ))}
              <th>Overall</th>
            </tr>
            <tr>
              <th /><th />
              {isAllMode && <th />}
              {cloList.map(clo => (
                <React.Fragment key={clo.id}>
                  <th className="sub-header">Score %</th>
                  <th className="sub-header">Level</th>
                </React.Fragment>
              ))}
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.studentId}>
                <td>{student.rollNumber}</td>
                <td>{student.name}</td>
                {isAllMode && (
                  <td><span className="assessment-count">{student.assessmentsAttempted || 0}</span></td>
                )}
                {cloList.map(clo => {
                  const perf = student.cloPerformance[clo.id];
                  const pct = perf?.averagePercentage ?? perf?.percentage ?? 0;
                  const lvl = perf?.attainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
                  return (
                    <React.Fragment key={clo.id}>
                      <td className={pct >= clo.threshold ? 'score-high' : 'score-low'}>
                        {pct.toFixed(1)}%
                      </td>
                      <td>
                        <span className={`level-badge-small level-${lvl}`}>{lvl}</span>
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className={student.totalPercentage >= 50 ? 'score-high' : 'score-low'}>
                  <strong>{student.totalPercentage.toFixed(1)}%</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-results">
          <AlertTriangle size={32} />
          <p>No students match your search</p>
        </div>
      )}
    </div>
  );
};

export default StudentPerformanceTable;