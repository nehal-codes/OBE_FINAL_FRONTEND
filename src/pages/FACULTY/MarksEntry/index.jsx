// src/components/faculty/MarksEntry/index.jsx
import React from 'react';
import {
  Search, FileText, AlertCircle,
  CheckCircle, RefreshCw
} from 'lucide-react';
import { useMarksEntry } from './useMarksEntry';
import FinalizationModal from './FinalizationModal';
import AssessmentStatusBar from './AssessmentStatusBar';
import MarksTable from './MarksTable';
import MarksActions from './MarksActions';
import './marksEntry.css';

const MarksEntry = ({
  assessments,
  selectedAssessment: initialSelected,
  course,
  onSelectAssessment,
  onEnterMarks,
}) => {
  const me = useMarksEntry({
    course, assessments, initialSelected, onSelectAssessment, onEnterMarks
  });

  // ── No course ────────────────────────────────────────────────────────────
  if (!course) {
    return (
      <div className="no-course">
        <FileText size={48} />
        <h4>No Course Selected</h4>
        <p>Please select a course from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="marks-entry-tab">

      {/* ── Top bar: assessment picker + filter ─────────────────────────── */}
      <div className="marks-header">
        <div className="assessment-selector">
          <label>Select Assessment</label>
          <select
            className="form-control"
            value={me.selectedAssessment?.id || ''}
            onChange={e => {
              const found = assessments.find(a => a.id === e.target.value);
              me.handleAssessmentSelect(found);
            }}
            disabled={me.loading || me.saving || me.marksLoading || me.isFinalizing}
          >
            <option value="">Select Assessment</option>
            {Array.isArray(assessments) && assessments.map(a => (
              <option key={a.id} value={a.id}>
                {a.title || 'Untitled'} ({a.maxMarks || 0} marks)
              </option>
            ))}
          </select>
        </div>

        <div className="header-actions">
          {me.selectedAssessment && (
            <div className="student-filter">
              <label>Filter Students</label>
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name or roll number"
                  value={me.filter}
                  onChange={e => me.setFilter(e.target.value)}
                  disabled={me.loading || me.saving || me.marksLoading || me.isFinalizing}
                />
              </div>
            </div>
          )}

          <button
            className="me-btn me-btn--secondary refresh-btn"
            onClick={me.initializeComponent}
            disabled={me.loading || me.saving || me.marksLoading || me.isFinalizing}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── No assessment selected ──────────────────────────────────────── */}
      {!me.selectedAssessment ? (
        <div className="no-assessment">
          <FileText size={48} />
          <h4>Select an Assessment</h4>
          <p>Choose an assessment from the dropdown to enter marks</p>
          {assessments?.length === 0 && (
            <div className="me-alert me-alert--info" style={{ marginTop: 8 }}>
              No assessments created yet. Create an assessment first.
            </div>
          )}
          {me.loading && (
            <div className="loading" style={{ padding: 16 }}>
              <div className="spinner" />
              <span>Loading assessments…</span>
            </div>
          )}
        </div>
      ) : (
        <div className="marks-container">

          {/* Status bar */}
          <AssessmentStatusBar
            finalizationStatus={me.finalizationStatus}
            isMarksFinalized={me.isMarksFinalized}
            isFinalizing={me.isFinalizing}
            selectedAssessment={me.selectedAssessment}
            onOpenModal={() => me.setShowFinalizationModal(true)}
            onRefreshStatus={me.checkFinalizationStatus}
          />

          {/* Assessment meta */}
          <div className="assessment-info">
            <div className="assessment-header">
              <h4>{me.selectedAssessment.title || 'Untitled Assessment'}</h4>
              <div className="assessment-status">
                {me.marksLoading && <span className="loading-indicator">Loading marks…</span>}
                {!me.marksLoading && me.stats && (
                  <span className="stats-info">
                    <CheckCircle size={13} /> {me.stats.marksEntered || 0} marks entered
                  </span>
                )}
              </div>
            </div>
            <div className="assessment-details">
              <span className="detail-item">Type: {me.selectedAssessment.type || 'N/A'}</span>
              <span className="detail-item">Max Marks: {me.selectedAssessment.maxMarks || 0}</span>
              <span className="detail-item">
                CLOs: {me.selectedAssessment.assessmentClos?.map(ac => ac.clo?.code).join(', ') || 'No CLOs'}
              </span>
              {me.stats && <span className="detail-item">Students: {me.stats.totalStudents || 0}</span>}
            </div>
          </div>

          {/* Main content area */}
          {me.loading ? (
            <div className="loading">
              <div className="spinner" />
              <p>Loading data…</p>
              <small>Fetching students and marks information</small>
            </div>
          ) : me.hasError ? (
            <div className="error-state">
              <AlertCircle size={48} />
              <h4>Error Loading Data</h4>
              <p>Failed to load student data. Please try again.</p>
              <button className="me-btn me-btn--primary" onClick={me.initializeComponent} disabled={me.loading}>
                Retry
              </button>
            </div>
          ) : me.students.length === 0 ? (
            <div className="no-students">
              <FileText size={48} />
              <h4>No Students Found</h4>
              <p>No students enrolled for the selected semester.</p>
              <button className="me-btn me-btn--secondary" onClick={me.loadStudents} disabled={me.loading}>
                Check Again
              </button>
            </div>
          ) : !me.marksLoading && (
            <>
              <MarksTable
                selectedAssessment={me.selectedAssessment}
                filteredStudents={me.filteredStudents}
                marksData={me.marksData}
                validationErrors={me.validationErrors}
                stats={me.stats}
                isMarksFinalized={me.isMarksFinalized}
                saving={me.saving}
                onMarksChange={me.handleMarksChange}
                calculateStudentTotal={me.calculateStudentTotal}
              />

              <MarksActions
                filteredStudents={me.filteredStudents.length}
                totalStudents={me.students.length}
                filter={me.filter}
                validationErrors={me.validationErrors}
                saving={me.saving}
                isMarksFinalized={me.isMarksFinalized}
                marksLoading={me.marksLoading}
                onSave={me.handleSaveMarks}
              />
            </>
          )}
        </div>
      )}

      {/* Finalization modal */}
      <FinalizationModal
        show={me.showFinalizationModal}
        finalizationStatus={me.finalizationStatus}
        isFinalizing={me.isFinalizing}
        onConfirm={me.handleFinalizeMarks}
        onClose={() => me.setShowFinalizationModal(false)}
      />
    </div>
  );
};

export default MarksEntry;