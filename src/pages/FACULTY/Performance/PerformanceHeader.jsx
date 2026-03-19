// src/components/faculty/performance/PerformanceHeader.jsx
import React from 'react';
import { Target, Layers, CheckCircle, Send, Download, FileText } from 'lucide-react';
import "./StudentPerformanceAnalysis.css";

const PerformanceHeader = ({
  isAllMode,
  performanceData,
  availableAssessments,
  selectedAssessment,
  submitting,
  onAssessmentSelect,
  onSubmitToHOD,
  onExportCSV,
  onExportPDF,
  onClose,
  isReportSubmitted = false,
  hasIndirectData = false,
}) => {
  const isSubmitDisabled = submitting || isReportSubmitted;

  return (
    <div className="analysis-header">
      <div className="header-title">
        <h2>
          <Target size={24} />
          {isAllMode
            ? <>CLO-wise Analysis: All Assessments ({performanceData?.assessments?.length || 0})</>
            : <>CLO-wise Analysis: {performanceData?.assessment?.title}</>}
        </h2>

        {isAllMode ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="finalized-badge multi-assessment">
              <Layers size={16} /> Combined Analysis
            </span>
            {hasIndirectData && (
              <span className="finalized-badge indirect-badge">
                <CheckCircle size={14} /> + Indirect
              </span>
            )}
          </div>
        ) : (
          <span className="finalized-badge">
            <CheckCircle size={16} /> Finalized Assessment
          </span>
        )}
      </div>

      <div className="header-actions">
        {availableAssessments?.length > 0 && (
          <div className="assessment-selector-header">
            <select
              className="form-control-sm"
              value={isAllMode ? 'all' : (selectedAssessment?.id || '')}
              onChange={e => onAssessmentSelect(e.target.value)}
            >
              <option value="" disabled>Select assessment</option>
              {availableAssessments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
              {availableAssessments.length > 1 && (
                <option value="all">📊 All Assessments Combined</option>
              )}
            </select>
          </div>
        )}

        {isAllMode && (
          <button
            className={`btn-submit-hod ${isReportSubmitted ? 'btn-submitted' : ''}`}
            onClick={onSubmitToHOD}
            disabled={isSubmitDisabled}
            title={isReportSubmitted ? 'Report already submitted to HOD' : 'Submit combined report to HOD'}
          >
            <Send size={16} />
            <span>
              {submitting ? 'Submitting…' : isReportSubmitted ? 'Already Submitted' : 'Submit to HOD'}
            </span>
            {isReportSubmitted && <CheckCircle size={16} className="submitted-check" />}
          </button>
        )}

        <button className="btn-export" onClick={onExportCSV} title="Export to CSV">
          <Download size={16} />
          <span>Export CSV</span>
        </button>

        <button className="btn-export btn-export-pdf" onClick={onExportPDF} title="Export to PDF">
          <FileText size={16} />
          <span>Export PDF</span>
        </button>

        {onClose && (
          <button className="btn-close" onClick={onClose}>×</button>
        )}
      </div>
    </div>
  );
};

export default PerformanceHeader;