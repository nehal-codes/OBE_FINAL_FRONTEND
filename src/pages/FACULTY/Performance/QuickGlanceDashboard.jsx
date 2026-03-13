// src/components/faculty/performance/QuickGlanceDashboard.jsx
import React from 'react';
import "./StudentPerformanceAnalysis.css";
import { CheckCircle, TrendingUp, Award, AlertTriangle, Users } from 'lucide-react';

const LEVEL_ICONS = { 3: CheckCircle, 2: TrendingUp, 1: Award, 0: AlertTriangle };
const LEVEL_LABELS = { 3: 'CLOs at Level 3', 2: 'CLOs at Level 2', 1: 'CLOs at Level 1', 0: 'CLOs at Level 0' };
const LEVEL_ATTAIN_LABELS = { 3: 'High', 2: 'Medium', 1: 'Low', 0: 'Not Attained' };
const ICON_COLORS = { 3: 'green', 2: 'yellow', 1: 'orange', 0: 'red' };

const QuickGlanceDashboard = ({ cloList }) => {
  const avg = cloList.length > 0
    ? cloList.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloList.length
    : 0;
  const top = cloList.length > 0
    ? cloList.reduce((mx, c) => c.statistics.classAttainment > mx.statistics.classAttainment ? c : mx)
    : null;
  const bot = cloList.length > 0
    ? cloList.reduce((mn, c) => c.statistics.classAttainment < mn.statistics.classAttainment ? c : mn)
    : null;

  return (
    <div className="quick-glance-dashboard">
      {/* Summary stat cards */}
      <div className="dashboard-stats">
        {[3, 2, 1, 0].map(level => {
          const Icon = LEVEL_ICONS[level];
          const count = cloList.filter(c => c.directAttainment.level === level).length;
          return (
            <div key={level} className="stat-card">
              <div className={`stat-icon ${ICON_COLORS[level]}`}><Icon size={24} /></div>
              <div className="stat-content">
                <span className="stat-label">{LEVEL_LABELS[level]}</span>
                <span className="stat-value">{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="chart-container">
        <h4>CLO Attainment Levels Overview</h4>
        <div className="bar-chart">
          {cloList.map((clo, i) => (
            <div key={clo.id} className="bar-chart-item">
              <div className="bar-label">
                <span className="clo-code">{clo.code}</span>
                <span className={`attainment-badge level-${clo.directAttainment.level}`}>
                  L{clo.directAttainment.level}
                </span>
              </div>
              <div className="bar-wrapper">
                <div
                  className={`attainment-bar level-${clo.directAttainment.level}`}
                  style={{ width: `${clo.statistics.classAttainment}%`, animationDelay: `${i * 0.1}s` }}
                >
                  <span className="bar-percentage">{clo.statistics.classAttainment.toFixed(1)}%</span>
                </div>
              </div>
              <div className="bar-stats">
                <span className="students-count">
                  <Users size={14} /> {clo.statistics.attainedStudents}/{clo.statistics.totalStudents}
                </span>
                <span className="threshold">Threshold: {clo.threshold}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked distribution bar */}
      <div className="distribution-summary">
        <h4>Overall Attainment Distribution</h4>
        <div className="stacked-bar-container">
          {[3, 2, 1, 0].map(lvl => {
            const count = cloList.filter(c => c.directAttainment.level === lvl).length;
            const pct = cloList.length > 0 ? (count / cloList.length) * 100 : 0;
            return (
              <div
                key={lvl}
                className={`stacked-bar-segment level-${lvl}`}
                style={{ width: `${pct}%` }}
              >
                <span className="segment-tooltip">
                  Level {lvl}: {count} CLOs ({pct.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
        <div className="distribution-legend">
          {[3, 2, 1, 0].map(lvl => (
            <div key={lvl} className="legend-item">
              <span className={`legend-color level-${lvl}`} />
              <span>Level {lvl} ({LEVEL_ATTAIN_LABELS[lvl]}) — {cloList.filter(c => c.directAttainment.level === lvl).length} CLOs</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div className="performance-insights">
        <h4>📊 Quick Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content"><strong>Average Attainment</strong><span className="insight-value">{avg.toFixed(1)}%</span></div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">✅</div>
            <div className="insight-content">
              <strong>High Performing CLOs</strong>
              <span className="insight-value success">{cloList.filter(c => c.directAttainment.level === 3).length}/{cloList.length}</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <strong>Needs Improvement</strong>
              <span className="insight-value warning">{cloList.filter(c => c.directAttainment.level === 0).length}/{cloList.length}</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content"><strong>Top CLO</strong><span className="insight-value">{top?.code || '—'}</span></div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📉</div>
            <div className="insight-content"><strong>Lowest CLO</strong><span className="insight-value">{bot?.code || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickGlanceDashboard;