// src/components/faculty/MarksEntry/FinalizationModal.jsx
import React from 'react';
import { Lock, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import FinalizationStats from './FinalizationStats';

const FinalizationModal = ({ show, finalizationStatus, isFinalizing, onConfirm, onClose }) => {
  if (!show || !finalizationStatus) return null;

  const stats = finalizationStatus.statistics || {};
  const canFinalize = finalizationStatus.canFinalize;
  const missingMarks = stats.missingMarks || 0;
  const percentageEntered = parseFloat(stats.percentageEntered) || 0;

  return (
    <div className="me-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="me-modal">
        <div className="me-modal__header">
          <h3><Lock size={18} /> Finalize Marks</h3>
          <button className="me-modal__close" onClick={onClose} disabled={isFinalizing}>×</button>
        </div>

        <div className="me-modal__body">
          <div className="me-modal__warning-box">
            <AlertTriangle size={22} className="me-modal__warning-icon" />
            <div>
              <strong>Once marks are finalized, they cannot be modified in any way.</strong>
              <p>Please ensure all marks are correctly entered before proceeding.</p>
            </div>
          </div>

          <div className="me-modal__summary">
            <h4>Summary</h4>
            <FinalizationStats status={finalizationStatus} />

            {missingMarks > 0 && (
              <div className="me-alert me-alert--warn">
                <AlertCircle size={15} />
                <span><strong>{missingMarks} students are missing marks.</strong></span>
              </div>
            )}
            {percentageEntered === 100 && (
              <div className="me-alert me-alert--success">
                <CheckCircle size={15} />
                <span>All marks entered — ready for finalization.</span>
              </div>
            )}
            {percentageEntered < 100 && percentageEntered > 0 && (
              <div className="me-alert me-alert--info">
                <Info size={15} />
                <span>Only {percentageEntered}% of marks entered.</span>
              </div>
            )}
          </div>
        </div>

        <div className="me-modal__footer">
          <button className="me-btn me-btn--secondary" onClick={onClose} disabled={isFinalizing}>
            Cancel
          </button>
          <button
            className={`me-btn ${missingMarks > 0 ? 'me-btn--warn' : 'me-btn--primary'}`}
            onClick={onConfirm}
            disabled={isFinalizing || !canFinalize}
          >
            {isFinalizing ? (
              <><span className="me-spinner-sm" /> Finalizing…</>
            ) : missingMarks > 0 ? (
              <><AlertTriangle size={15} /> Finalize Anyway ({missingMarks} missing)</>
            ) : (
              <><Lock size={15} /> Finalize Marks</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizationModal;