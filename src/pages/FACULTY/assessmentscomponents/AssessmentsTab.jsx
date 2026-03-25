import React from 'react';
import { Plus, Edit, Trash2, FileText, BarChart, Download, AlertCircle } from 'lucide-react';

const AssessmentsTab = ({
  assessments,
  course,
  onOpenModal,
  onEditAssessment,
  onDeleteAssessment,
  onViewMarks,
  onAnalyzeAssessment,
  onOpenDownloadWizard,
}) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const maxMarks = (course?.credits || 0) * 25;
  const usedMarks = safeAssessments.reduce(
    (sum, a) => sum + (a.maxMarks || 0),
    0
  );
  const remaining = maxMarks - usedMarks;
  const hasFinalized = safeAssessments.some(a => a.isMarksFinalized);

  return (
    <div className="assessments-tab">
      <div className="section-title">
        <h3>Course Assessments</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-success" 
            onClick={onOpenDownloadWizard}
            disabled={!hasFinalized}
            title={!hasFinalized ? "No finalized assessments available" : "Download marks sheet"}
          >
            <Download size={16} /> Download Marks
          </button>
          <button className="btn btn-primary" onClick={onOpenModal}>
            <Plus size={16} /> Create Assessment
          </button>
        </div>
      </div>

      <div className={`alert ${remaining <= 0 ? "alert-danger" : "alert-warning"}`}>
        <AlertCircle size={20} />
        <div className="alert-content">
          <strong>Note:</strong> Total marks for all assessments cannot exceed 25 × credits ={" "}
          <strong>{maxMarks}</strong> marks.
          {remaining <= 0 && " All marks have been allocated!"}
          {!hasFinalized && (
            <span style={{ marginLeft: '10px', color: '#e53e3e' }}>
              ⚠️ No finalized assessments yet. Finalize marks to enable download.
            </span>
          )}
        </div>
      </div>

      <div className="assessments-list">
        {safeAssessments.length === 0 ? (
          <div className="no-assessments">
            <FileText size={48} />
            <h4>No Assessments Created</h4>
            <p>Create your first assessment to get started.</p>
          </div>
        ) : (
          safeAssessments.map((assessment, index) => (
            <div
              key={assessment.id || `assessment-${index}`}
              className={`assessment-card ${assessment.type || "theory"} ${assessment.isMarksFinalized ? 'finalized' : ''}`}
            >
              <div className="assessment-header">
                <div className="assessment-title">
                  {assessment.title || `Assessment ${index + 1}`}
                  {assessment.isMarksFinalized && (
                    <span className="finalized-badge-small">Finalized</span>
                  )}
                </div>
                <span className={`assessment-type type-${assessment.type || "theory"}`}>
                  {(assessment.type || "theory").charAt(0).toUpperCase() +
                    (assessment.type || "theory").slice(1)}
                </span>
              </div>
              <div className="assessment-details">
                <div className="detail-row">
                  <span className="detail-label">Mode:</span>
                  <span className="detail-value">{assessment.mode || "Written"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Max Marks:</span>
                  <span className="detail-value">{assessment.maxMarks || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Scheduled:</span>
                  <span className="detail-value">
                    {assessment.scheduledDate
                      ? new Date(assessment.scheduledDate).toLocaleDateString()
                      : "Not scheduled"}
                  </span>
                </div>
              </div>

              {assessment.assessmentClos && assessment.assessmentClos.length > 0 && (
                <div className="clo-tags">
                  {assessment.assessmentClos.map((ac, idx) => (
                    <span key={idx} className="clo-tag">
                      {ac.clo?.code || "CLO"} ({ac.marksAllocated || 0}m)
                    </span>
                  ))}
                </div>
              )}

              <div className="assessment-actions">
              {!assessment.isMarksFinalized &&  <button
                  className="btn btn-outline"
                  onClick={() => onEditAssessment(assessment)}
                  disabled={assessment.isMarksFinalized}
                >
                  <Edit size={14} /> Edit
                </button>}
                <button
                  className="btn btn-outline"
                  onClick={() => onViewMarks(assessment)}
                >
                  <FileText size={14} />
                  {assessment._count?.marks > 0 || assessment.marksCount > 0
                    ? "View Marks"
                    : "Enter Marks"}
                </button>
                
                {assessment.isMarksFinalized && (
                  <button
                    className="btn btn-outline btn-analyze"
                    onClick={() => onAnalyzeAssessment(assessment.id)}
                    title="Analyze student performance"
                  >
                    <BarChart size={14} /> Analyze
                  </button>
                )}
                
                {!(assessment._count?.marks > 0 || assessment.marksCount > 0) && !assessment.isMarksFinalized && (
                  <button
                    className="btn btn-outline btn-danger"
                    onClick={() => onDeleteAssessment(assessment.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentsTab;