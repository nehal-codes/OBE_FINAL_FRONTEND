// src/components/faculty/MarksEntry/FinalizationStats.jsx
import React from 'react';

const FinalizationStats = ({ status }) => {
  if (!status?.statistics) return null;
  const { totalStudents = 0, missingMarks = 0, percentageEntered = '0' } = status.statistics;

  return (
    <div className="me-fin-stats">
      <div className="me-fin-stat">
        <span className="me-fin-stat__label">Students</span>
        <span className="me-fin-stat__value">{totalStudents}</span>
      </div>
      <div className="me-fin-stat">
        <span className="me-fin-stat__label">Missing</span>
        <span className={`me-fin-stat__value ${missingMarks > 0 ? 'me-fin-stat__value--warn' : ''}`}>
          {missingMarks}
        </span>
      </div>
      <div className="me-fin-stat">
        <span className="me-fin-stat__label">Completion</span>
        <span className="me-fin-stat__value">{percentageEntered}%</span>
      </div>
    </div>
  );
};

export default FinalizationStats;