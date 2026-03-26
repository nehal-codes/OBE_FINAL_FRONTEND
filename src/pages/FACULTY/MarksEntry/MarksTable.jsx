// src/components/faculty/MarksEntry/MarksTable.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

// Helper function to sort CLOs by numeric order
const sortCLOsByCode = (clos) => {
  if (!clos || !Array.isArray(clos)) return [];
  
  return [...clos].sort((a, b) => {
    const codeA = a.clo?.code || a.code || '';
    const codeB = b.clo?.code || b.code || '';
    
    // Extract numeric part from CLO code (e.g., CLO1 -> 1, CLO10 -> 10)
    const numA = parseInt(codeA.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(codeB.replace(/\D/g, ''), 10) || 0;
    
    if (numA !== numB) return numA - numB;
    
    // Fallback to string comparison if numbers are equal
    return codeA.localeCompare(codeB);
  });
};

const MarksTable = ({
  selectedAssessment,
  filteredStudents,
  marksData,
  validationErrors,
  stats,
  isMarksFinalized,
  saving,
  onMarksChange,
  calculateStudentTotal,
}) => {
  // Sort CLOs before rendering
  const sortedClos = sortCLOsByCode(selectedAssessment.assessmentClos);

  return (
    <div className={`me-table-wrap ${isMarksFinalized ? 'me-table-wrap--locked' : ''}`}>
      <div className="me-table-scroll">
        <table className="me-table">
          <thead>
            <tr>
              <th className="me-th--roll">Roll No</th>
              <th className="me-th--name">Student Name</th>
              {sortedClos.map(ac => (
                <th key={ac.cloId} className="me-th--clo">
                  <div className="me-clo-header">
                    <span className="me-clo-code">{ac.clo?.code || 'CLO'}</span>
                    <span className="me-clo-max">/{ac.marksAllocated || 0}</span>
                    {stats?.cloAverages?.[ac.cloId] != null && (
                      <span className="me-clo-avg">avg {stats.cloAverages[ac.cloId].toFixed(1)}</span>
                    )}
                  </div>
                </th>
              ))}
              <th className="me-th--total" align="left" padding="0 8px">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={(sortedClos.length || 0) + 3}
                  className="me-empty-row"
                >
                  No students match your search
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => {
                const total = calculateStudentTotal(student.id);
                const pct = selectedAssessment.maxMarks > 0
                  ? (total / selectedAssessment.maxMarks) * 100 : 0;

                return (
                  <tr key={student.id} className={isMarksFinalized ? 'me-row--locked' : ''}>
                    <td className="me-td--roll">{student.rollNumber || 'N/A'}</td>
                    <td className="me-td--name">{student.name || 'Unknown'}</td>

                    {sortedClos.map(ac => {
                      const currentMarks = marksData[student.id]?.[ac.cloId] || 0;
                      const errorKey = `${student.id}-${ac.cloId}`;
                      const errorMsg = validationErrors[errorKey];

                      return (
                        <td key={ac.cloId} className={errorMsg ? 'me-td--error' : ''} align="center">
                          <input
                            type="number"
                            className={`me-marks-input ${errorMsg ? 'me-marks-input--invalid' : ''} ${isMarksFinalized ? 'me-marks-input--locked' : ''}`}
                            value={currentMarks}
                            onChange={e => onMarksChange(student.id, ac.cloId, e.target.value)}
                            min="0"
                            max={ac.marksAllocated || 0}
                            step="0.5"
                            disabled={saving || isMarksFinalized}
                            title={isMarksFinalized ? 'Marks are finalized' : ''}
                          />
                          {errorMsg && (
                            <div className="me-input-error">
                              <AlertCircle size={11} /> {errorMsg}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="me-td--total" align="center">
                      <div className="me-total-value">{total.toFixed(1)}</div>
                      <div className={`me-total-pct ${pct >= 50 ? 'me-total-pct--pass' : 'me-total-pct--fail'}`}>
                        {pct.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksTable;