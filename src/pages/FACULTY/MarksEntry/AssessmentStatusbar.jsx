// src/components/faculty/MarksEntry/AssessmentStatusBar.jsx
import React from 'react';
import { Lock, RefreshCw } from 'lucide-react';
import FinalizationBadge from './FinalizationBadge';
import FinalizationStats from './FinalizationStats';

const AssessmentStatusBar = ({
  finalizationStatus,
  isMarksFinalized,
  isFinalizing,
  selectedAssessment,
  onOpenModal,
  onRefreshStatus,
}) => (
  <div className="me-status-bar">
    <FinalizationBadge status={finalizationStatus} />
    <FinalizationStats status={finalizationStatus} />

    {finalizationStatus?.canFinalize && !isMarksFinalized && (
      <div className="me-status-bar__actions">
        <button
          className="me-btn me-btn--primary me-btn--sm"
          onClick={onOpenModal}
          disabled={isFinalizing}
        >
          <Lock size={13} /> Finalize Marks
        </button>
        <button
          className="me-btn me-btn--ghost me-btn--sm"
          onClick={() => onRefreshStatus(selectedAssessment?.id)}
          disabled={isFinalizing}
          title="Refresh status"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    )}

    {isMarksFinalized && (
      <div className="me-finalized-info">
        <Lock size={13} />
        <strong>Marks are finalized and cannot be modified.</strong>
        {finalizationStatus?.assessment?.marksFinalizedBy && (
          <small>
            {' '}Finalized by {finalizationStatus.assessment.marksFinalizedBy.name}
            {finalizationStatus.assessment.marksFinalizedAt
              ? ` on ${new Date(finalizationStatus.assessment.marksFinalizedAt).toLocaleDateString()}`
              : ''}
          </small>
        )}
      </div>
    )}
  </div>
);

export default AssessmentStatusBar;