// src/components/faculty/MarksEntry/FinalizationBadge.jsx
import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

const FinalizationBadge = ({ status }) => {
  if (!status) return null;
  const isFinalized = status.assessment?.isMarksFinalized;
  const finalizedAt = status.assessment?.marksFinalizedAt;
  const finalizedBy = status.assessment?.marksFinalizedBy;

  if (isFinalized) {
    return (
      <div className="me-badge me-badge--finalized">
        <Lock size={13} />
        <span>Finalized</span>
        {(finalizedAt || finalizedBy?.name) && (
          <span className="me-badge__detail">
            {finalizedAt ? new Date(finalizedAt).toLocaleDateString() : ''}
            {finalizedBy?.name ? ` by ${finalizedBy.name}` : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="me-badge me-badge--open">
      <LockOpen size={13} />
      <span>Not Finalized</span>
      {status.canFinalize && <span className="me-badge__hint">Ready to finalize</span>}
    </div>
  );
};

export default FinalizationBadge;