// src/components/faculty/MarksEntry/MarksActions.jsx
import React from 'react';
import { Save, AlertCircle } from 'lucide-react';

const MarksActions = ({
  filteredStudents,
  totalStudents,
  filter,
  validationErrors,
  saving,
  isMarksFinalized,
  marksLoading,
  onSave,
}) => (
  <div className="me-actions-bar">
    <div className="me-actions-bar__info">
      <span className="me-count">
        Showing {filteredStudents} of {totalStudents} students
      </span>
      {filter && (
        <span className="me-filter-tag">Filter: "{filter}"</span>
      )}
      {Object.keys(validationErrors).length > 0 && (
        <span className="me-validation-warn">
          <AlertCircle size={13} /> {Object.keys(validationErrors).length} validation error{Object.keys(validationErrors).length !== 1 ? 's' : ''}
        </span>
      )}
    </div>

    <button
      className="me-btn me-btn--save"
      onClick={onSave}
      disabled={saving || totalStudents === 0 || marksLoading || isMarksFinalized}
      title={isMarksFinalized ? 'Marks are finalized' : ''}
    >
      {saving ? (
        <><span className="me-spinner-sm" /> Saving…</>
      ) : (
        <><Save size={15} /> Save All Marks</>
      )}
    </button>
  </div>
);

export default MarksActions;