// src/components/faculty/performance/AttainmentSummary.jsx
import React from 'react';
import "./StudentPerformanceAnalysis.css";

const levelColor = (l) => ['#ef4444', '#f97316', '#eab308', '#22c55e'][l] ?? '#94a3b8';
const levelBg   = (l) => ['#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4'][l] ?? '#f8fafc';

const classAttainmentToLevel = (pct) => {
  if (pct >= 60) return 3;
  if (pct >= 50) return 2;
  if (pct >= 40) return 1;
  return 0;
};
const levelLabel = (l) => ['Not Attained', 'Low', 'Medium', 'High'][l] ?? 'N/A';

const AttainmentSummary = ({ cloList, hasIndirectData = false }) => {
  // ── Course-level averages ──────────────────────────────────────────────────
  const avgDirectPct = cloList.length
    ? cloList.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloList.length
    : 0;

  const closWithIndirect = cloList.filter(c => c.indirectAttainment);
  const avgIndirectPct = closWithIndirect.length
    ? closWithIndirect.reduce((s, c) => s + c.indirectAttainment.percentage, 0) / closWithIndirect.length
    : null;

  const finalPct = hasIndirectData && avgIndirectPct !== null
    ? 0.8 * avgDirectPct + 0.2 * avgIndirectPct
    : avgDirectPct;

  const finalLevel = classAttainmentToLevel(finalPct);

  return (
    <div className="attainment-summary">

      {/* ── Per-CLO table ──────────────────────────────────────────────────── */}
      <table className="attainment-summary-table">
        <thead>
          <tr>
            <th>CLO Code</th>
            <th>Bloom's Level</th>
            <th>Threshold</th>
            <th>Students Attained</th>
            <th>Class Attainment %</th>
            <th>Direct Level (80%)</th>
            {hasIndirectData && <th>Indirect Level (20%)</th>}
            <th>{hasIndirectData ? 'Final Level' : 'Attainment Level'}</th>
          </tr>
        </thead>
        <tbody>
          {cloList.map(clo => {
            const displayLevel = clo.finalAttainment ?? clo.directAttainment;
            return (
              <tr key={clo.id}>
                <td><strong>{clo.code}</strong></td>
                <td>{clo.bloomLevel || 'N/A'}</td>
                <td>{clo.threshold}%</td>
                <td>{clo.statistics.attainedStudents}/{clo.statistics.totalStudents}</td>
                <td>{clo.statistics.classAttainment.toFixed(1)}%</td>
                <td>
                  <span className={`level-badge level-${clo.directAttainment.level}`}>
                    Level {clo.directAttainment.level} ({clo.directAttainment.label})
                  </span>
                </td>
                {hasIndirectData && (
                  <td>
                    {clo.indirectAttainment ? (
                      <span className={`level-badge level-${clo.indirectAttainment.level}`}>
                        Level {clo.indirectAttainment.level} ({clo.indirectAttainment.label})
                      </span>
                    ) : (
                      <span className="level-badge level-na">N/A</span>
                    )}
                  </td>
                )}
                <td>
                  <span className={`level-badge level-${displayLevel.level} ${hasIndirectData ? 'final-level' : ''}`}>
                    Level {displayLevel.level} ({displayLevel.label})
                    {hasIndirectData && clo.finalAttainment?.hasIndirect && (
                      <span className="final-pct"> — {clo.finalAttainment.percentage.toFixed(1)}%</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Course-level final attainment result ───────────────────────────── */}
      {hasIndirectData && avgIndirectPct !== null && (
      <div className="course-final-attainment-card">
        <div className="cfa-header">
          <span className="cfa-title">Course-Level Final Attainment</span>
          <span className="cfa-sub">Averaged across all {cloList.length} CLOs</span>
        </div>

        <div className="cfa-calculation">
          {/* Direct block */}
          <div className="cfa-block">
            <span className="cfa-block-label">Avg Direct Attainment</span>
            <span className="cfa-block-pct">{avgDirectPct.toFixed(1)}%</span>
            <span className="cfa-block-weight">× 80%</span>
            <span className="cfa-block-result">= {(avgDirectPct * 0.8).toFixed(1)}%</span>
          </div>

          {hasIndirectData && avgIndirectPct !== null && (
            <>
              <div className="cfa-plus">+</div>
              {/* Indirect block */}
              <div className="cfa-block">
                <span className="cfa-block-label">Avg Indirect Attainment</span>
                <span className="cfa-block-pct">{avgIndirectPct.toFixed(1)}%</span>
                <span className="cfa-block-weight">× 20%</span>
                <span className="cfa-block-result">= {(avgIndirectPct * 0.2).toFixed(1)}%</span>
              </div>
            </>
          )}

          <div className="cfa-equals">=</div>

          {/* Final result */}
          <div
            className="cfa-final"
            style={{ background: levelBg(finalLevel), borderColor: levelColor(finalLevel) + '60' }}
          >
            <span
              className="cfa-final-pct"
              style={{ color: levelColor(finalLevel) }}
            >
              {finalPct.toFixed(1)}%
            </span>
            <span
              className="cfa-final-level"
              style={{ color: levelColor(finalLevel) }}
            >
              Level {finalLevel} — {levelLabel(finalLevel)}
            </span>
            {hasIndirectData && (
              <span className="cfa-formula-note">
                0.8 × {avgDirectPct.toFixed(1)}%{avgIndirectPct !== null ? ` + 0.2 × ${avgIndirectPct.toFixed(1)}%` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Mini gauge */}
        <div className="cfa-gauge-wrap">
          <div className="cfa-gauge-track">
            {/* threshold markers */}
            {[40, 50, 60].map(t => (
              <div key={t} className="cfa-gauge-marker" style={{ left: `${t}%` }}>
                <span className="cfa-gauge-marker-label">{t}%</span>
              </div>
            ))}
            {/* fill */}
            <div
              className="cfa-gauge-fill"
              style={{ width: `${Math.min(finalPct, 100)}%`, background: levelColor(finalLevel) }}
            />
          </div>
          <div className="cfa-gauge-zones">
            <span style={{ color: levelColor(0) }}>L0</span>
            <span style={{ color: levelColor(1) }}>L1</span>
            <span style={{ color: levelColor(2) }}>L2</span>
            <span style={{ color: levelColor(3) }}>L3</span>
          </div>
        </div>
      </div>)}

      {/* ── Per-CLO bar chart ───────────────────────────────────────────────── */}
      <div className="summary-chart">
        <h4>CLO Attainment Levels {hasIndirectData ? '(Final)' : ''}</h4>
        <div className="chart-bars">
          {cloList.map(clo => {
            const displayLevel = clo.finalAttainment ?? clo.directAttainment;
            const displayPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
            return (
              <div key={clo.id} className="chart-bar-item">
                <span className="clo-code">{clo.code}</span>
                <div className="bar-wrapper">
                  <div
                    className={`attainment-bar level-${displayLevel.level}`}
                    style={{ width: `${displayPct}%` }}
                  >
                    <span className="bar-percentage">{displayPct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AttainmentSummary;