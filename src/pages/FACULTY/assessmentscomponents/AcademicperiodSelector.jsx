import React from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';

const AcademicPeriodSelector = ({ 
  selectedYear, 
  selectedSemester, 
  onYearChange, 
  onSemesterChange, 
  onRefresh,
  isRefreshing 
}) => {
  const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);
  
  const semesterOptions = [
    { value: 1, label: "Semester 1" },
    { value: 2, label: "Semester 2" },
    { value: 3, label: "Semester 3" },
    { value: 4, label: "Semester 4" },
    { value: 5, label: "Semester 5" },
    { value: 6, label: "Semester 6" },
    { value: 7, label: "Semester 7" },
    { value: 8, label: "Semester 8" },
  ];

  return (
    <div className="academic-period-selector">
      <div className="selector-group">
        <label htmlFor="year-select">
          <Calendar size={14} /> Academic Year
        </label>
        <div className="select-wrapper">
          <select 
            id="year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            disabled={isRefreshing}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown size={16} className="select-arrow" />
        </div>
      </div>
      
      <div className="selector-group">
        <label htmlFor="semester-select">Semester</label>
        <div className="select-wrapper">
          <select 
            id="semester-select"
            value={selectedSemester}
            onChange={(e) => onSemesterChange(parseInt(e.target.value))}
            disabled={isRefreshing}
          >
            {semesterOptions.map(sem => (
              <option key={sem.value} value={sem.value}>
                {sem.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="select-arrow" />
        </div>
      </div>
      
      <button 
        className="btn-refresh" 
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
};

export default AcademicPeriodSelector;