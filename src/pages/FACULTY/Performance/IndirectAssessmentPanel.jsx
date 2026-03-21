// src/components/faculty/Performance/IndirectAssessmentPanel.jsx
import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, Info, AlertTriangle, ChevronDown, ChevronUp, Users, Star, TrendingUp, Award, CheckCircle } from 'lucide-react';

const XLSX_COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Level helpers ────────────────────────────────────────────────────────────
const classAttainmentToLevel = (pct) => {
  if (pct >= 60) return 3;
  if (pct >= 50) return 2;
  if (pct >= 40) return 1;
  return 0;
};
const levelLabel = (l) => ['Not Attained', 'Low', 'Medium', 'High'][l] ?? 'N/A';
const levelColor = (l) => ['#ef4444', '#f97316', '#eab308', '#22c55e'][l] ?? '#94a3b8';
const levelBg   = (l) => ['#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4'][l] ?? '#f8fafc';

// ─── Rating distribution helper ──────────────────────────────────────────────
const buildDistribution = (ratings) => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => { if (r >= 1 && r <= 5) dist[Math.round(r)]++; });
  return dist;
};

// ─── Inline mini bar ─────────────────────────────────────────────────────────
const MiniBar = ({ value, max, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
    </div>
    <span style={{ fontSize: 11, color: '#64748b', minWidth: 20, textAlign: 'right' }}>{value}</span>
  </div>
);

// ─── CLO Card ─────────────────────────────────────────────────────────────────
const CLOCard = ({ cloData, index }) => {
  const [expanded, setExpanded] = useState(false);
  const { code, statement, bloomLevel, threshold, statistics, indirectAttainment } = cloData;
  const { totalStudents, attainedStudents, classAttainment, averageRating, studentRatings } = statistics;
  const dist = useMemo(() => buildDistribution((studentRatings || []).map(r => r.rating)), [studentRatings]);
  const maxDistVal = Math.max(...Object.values(dist), 1);
  const level = indirectAttainment.level;

  return (
    <div className="iap-clo-card" style={{ '--level-color': levelColor(level), '--level-bg': levelBg(level) }}>
      {/* Card header */}
      <div className="iap-clo-header" onClick={() => setExpanded(p => !p)}>
        <div className="iap-clo-index">{index + 1}</div>
        <div className="iap-clo-meta">
          <div className="iap-clo-top">
            <span className="iap-clo-code">{code}</span>
            {bloomLevel && <span className="iap-bloom-tag">{bloomLevel}</span>}
          </div>
          <p className="iap-clo-stmt">{statement}</p>
        </div>
        <div className="iap-clo-stats">
          <div className="iap-stat-chip">
            <span className="iap-stat-num">{averageRating.toFixed(2)}</span>
            <span className="iap-stat-lbl">/ 5 avg</span>
          </div>
          <div className="iap-stat-chip">
            <span className="iap-stat-num">{classAttainment.toFixed(1)}%</span>
            <span className="iap-stat-lbl">attained</span>
          </div>
          <div className="iap-level-pill" style={{ background: levelBg(level), color: levelColor(level), border: `1px solid ${levelColor(level)}30` }}>
            L{level} · {levelLabel(level)}
          </div>
        </div>
        <button className="iap-expand-btn">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Attainment progress bar */}
      <div className="iap-progress-track">
        <div className="iap-progress-fill" style={{ width: `${classAttainment}%`, background: levelColor(level) }} />
        <div className="iap-threshold-marker" style={{ left: `${threshold}%` }}>
          <span className="iap-threshold-label">Threshold {threshold}%</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="iap-clo-detail">
          <div className="iap-detail-grid">

            {/* Rating distribution */}
            <div className="iap-detail-card">
              <h5 className="iap-detail-heading">Rating Distribution</h5>
              <div className="iap-dist-bars">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="iap-dist-row">
                    <span className="iap-star-label">{star} ★</span>
                    <MiniBar value={dist[star]} max={maxDistVal} color={star >= 3 ? '#22c55e' : '#ef4444'} />
                    <span className="iap-dist-pct">{totalStudents > 0 ? ((dist[star] / totalStudents) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attainment calculation */}
            <div className="iap-detail-card">
              <h5 className="iap-detail-heading">Attainment Calculation</h5>
              <div className="iap-calc-block">
                <div className="iap-calc-row">
                  <span className="iap-calc-lbl">Attain threshold rating</span>
                  <span className="iap-calc-val">≥ {((threshold / 100) * 5).toFixed(1)} / 5</span>
                </div>
                <div className="iap-calc-row">
                  <span className="iap-calc-lbl">Students who attained</span>
                  <span className="iap-calc-val">{attainedStudents} / {totalStudents}</span>
                </div>
                <div className="iap-calc-row">
                  <span className="iap-calc-lbl">Class attainment</span>
                  <span className="iap-calc-val iap-calc-primary">{classAttainment.toFixed(1)}%</span>
                </div>
                <div className="iap-calc-divider" />
                <div className="iap-level-thresholds">
                  {[
                    { range: '≥ 60%', level: 3 },
                    { range: '50–59%', level: 2 },
                    { range: '40–49%', level: 1 },
                    { range: '< 40%', level: 0 },
                  ].map(({ range, level: l }) => (
                    <div key={l} className={`iap-thresh-row ${l === level ? 'iap-thresh-active' : ''}`} style={l === level ? { background: levelBg(l), borderLeft: `3px solid ${levelColor(l)}` } : {}}>
                      <span>{range}</span>
                      <span style={{ color: levelColor(l), fontWeight: l === level ? 700 : 400 }}>Level {l} · {levelLabel(l)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student ratings table */}
            <div className="iap-detail-card iap-detail-wide">
              <h5 className="iap-detail-heading">Student Ratings</h5>
              <div className="iap-student-table-wrap">
                <table className="iap-student-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student</th>
                      <th>Rating</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(studentRatings || []).map((s, i) => {
                      const attained = s.rating >= (threshold / 100) * 5;
                      return (
                        <tr key={i}>
                          <td>{s.rollNumber}</td>
                          <td>{s.name}</td>
                          <td>
                            <span className="iap-rating-badge" style={{ background: s.rating >= 3 ? '#f0fdf4' : '#fef2f2', color: s.rating >= 3 ? '#16a34a' : '#dc2626' }}>
                              {'★'.repeat(Math.round(s.rating))}{'☆'.repeat(5 - Math.round(s.rating))} {s.rating}
                            </span>
                          </td>
                          <td>
                            <span className="iap-status-dot" style={{ background: attained ? '#22c55e' : '#ef4444' }} />
                            {attained ? 'Attained' : 'Not Attained'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Summary strip ────────────────────────────────────────────────────────────
const SummaryStrip = ({ indirectCloAnalysis }) => {
  const clos = Object.values(indirectCloAnalysis);
  const avgAttainment = clos.reduce((s, c) => s + c.statistics.classAttainment, 0) / clos.length;
  const byLevel = [0, 1, 2, 3].map(l => clos.filter(c => c.indirectAttainment.level === l).length);

  return (
    <div className="iap-summary-strip">
      <div className="iap-summary-card">
        <div className="iap-summary-icon" style={{ background: '#eff6ff' }}><Users size={20} color="#3b82f6" /></div>
        <div>
          <div className="iap-summary-num">{clos.length}</div>
          <div className="iap-summary-lbl">CLOs Assessed</div>
        </div>
      </div>
      <div className="iap-summary-card">
        <div className="iap-summary-icon" style={{ background: '#f0fdf4' }}><TrendingUp size={20} color="#22c55e" /></div>
        <div>
          <div className="iap-summary-num">{avgAttainment.toFixed(1)}%</div>
          <div className="iap-summary-lbl">Avg Attainment</div>
        </div>
      </div>
      {[3, 2, 1, 0].map(l => (
        <div key={l} className="iap-summary-card">
          <div className="iap-summary-icon" style={{ background: levelBg(l) }}>
            <Award size={20} color={levelColor(l)} />
          </div>
          <div>
            <div className="iap-summary-num" style={{ color: levelColor(l) }}>{byLevel[l]}</div>
            <div className="iap-summary-lbl">Level {l} CLOs</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Upload panel ─────────────────────────────────────────────────────────────
const UploadPanel = ({ course, closData, semester, year, onUploaded, facultyApi }) => {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rollNoCol, setRollNoCol] = useState('');
  const [cloColumnMap, setCloColumnMap] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!json.length) { setError('Empty file'); return; }
      const detectedCols = json[0].map((h, i) => ({
        letter: XLSX_COLS[i] || `COL${i}`,
        label: h ? `${XLSX_COLS[i] || i} — ${h}` : XLSX_COLS[i] || `Col ${i}`
      }));
      setColumns(detectedCols);
      const rows = json.slice(1).map(row => {
        const obj = {};
        detectedCols.forEach((col, i) => { obj[col.letter] = row[i] !== undefined ? String(row[i]) : ''; });
        return obj;
      }).filter(r => Object.values(r).some(v => v.trim() !== ''));
      setParsedRows(rows);
    };
    reader.readAsBinaryString(f);
  };

  const canSubmit = file && rollNoCol && Object.keys(cloColumnMap).length > 0 && Object.values(cloColumnMap).every(v => v);

const handleImport = async () => {
  if (!canSubmit) return;
  setUploading(true); setError('');
  try {
    const activeCloEntries = Object.entries(cloColumnMap).filter(([, col]) => col && col !== 'skip');

    const cleanedRows = parsedRows
      .filter(row => row[rollNoCol]?.toString().trim().length > 0)
      .map(row => {
        const out = { ...row };
        activeCloEntries.forEach(([, col]) => {
          const raw = out[col]?.toString().trim() || '';
          // Only normalize "Option N" style — touch nothing else
          if (raw.toLowerCase().includes('option')) {
            const m = raw.match(/option\s*(\d)/i);
            out[col] = m ? m[1] : raw;
          }
        });
        return out;
      });

    if (!cleanedRows.length) {
      setError('No valid rows found after cleaning.');
      setUploading(false);
      return;
    }

    await facultyApi.importIndirectAssessments(course.id, {
      year: year || course.year,
      semester: semester || course.semester,
      mappings: { rollNoColumn: rollNoCol, cloColumns: cloColumnMap },
      data: cleanedRows
    });
    await onUploaded();
  } catch (err) {
    setError(err.response?.data?.message || 'Import failed. Check column mappings.');
  } finally {
    setUploading(false);
  }
};
  return (
    <div className="iap-upload-panel">
      {!file ? (
        <div className="iap-drop-zone" onClick={() => fileRef.current?.click()}>
          <div className="iap-drop-icon"><Upload size={28} /></div>
          <p className="iap-drop-title">Upload Feedback Excel / CSV</p>
          <p className="iap-drop-sub">Ratings on a 1–5 scale · One row per student</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <div className="iap-mapper">
          <div className="iap-mapper-header">
            <span className="iap-file-name">📄 {file.name}</span>
            <span className="iap-row-count">{parsedRows.length} rows</span>
            <button className="iap-clear-btn" onClick={() => { setFile(null); setParsedRows([]); setRollNoCol(''); setCloColumnMap({}); }}>
              <X size={14} /> Clear
            </button>
          </div>

          <div className="iap-mapper-body">
            <div className="iap-mapper-row">
              <label className="iap-mapper-label">Roll Number Column <span className="iap-req">*</span></label>
              <select className="iap-mapper-select" value={rollNoCol} onChange={e => setRollNoCol(e.target.value)}>
                <option value="">— Select —</option>
                {columns.map(c => <option key={c.letter} value={c.letter}>{c.label}</option>)}
              </select>
            </div>

            <div className="iap-mapper-section-title">Map CLO Columns</div>

            {closData.map(clo => (
              <div key={clo.id} className="iap-mapper-row">
                <label className="iap-mapper-label">
                  <strong>{clo.code}</strong>
                  <span className="iap-clo-hint">{clo.statement?.substring(0, 55)}{clo.statement?.length > 55 ? '…' : ''}</span>
                </label>
                <select
                  className="iap-mapper-select"
                  value={cloColumnMap[clo.code] || ''}
                  onChange={e => setCloColumnMap(p => ({ ...p, [clo.code]: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  <option value="skip">Skip</option>
                  {columns.map(c => <option key={c.letter} value={c.letter}>{c.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {rollNoCol && parsedRows.length > 0 && (
            <div className="iap-preview">
              <p className="iap-preview-title">Preview (first 3 rows)</p>
              <table className="iap-preview-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    {Object.entries(cloColumnMap).filter(([, v]) => v && v !== 'skip').map(([code, col]) => <th key={code}>{code} ({col})</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      <td>{row[rollNoCol]}</td>
                      {Object.entries(cloColumnMap).filter(([, v]) => v && v !== 'skip').map(([code, col]) => <td key={code}>{row[col]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <div className="iap-error"><AlertTriangle size={14} /> {error}</div>}

          <div className="iap-mapper-footer">
            <button className="iap-import-btn" onClick={handleImport} disabled={!canSubmit || uploading}>
              {uploading ? 'Importing…' : `Import ${parsedRows.filter(r => r[rollNoCol]?.toString().trim()).length} rows`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Final Attainment Summary Table ──────────────────────────────────────────
const FinalAttainmentTable = ({ cloListWithFinal }) => {
  const hasIndirect = cloListWithFinal.some(c => c.indirectAttainment);
  const overallDirect = cloListWithFinal.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloListWithFinal.length;
  const overallIndirect = hasIndirect
    ? cloListWithFinal.filter(c => c.indirectAttainment).reduce((s, c) => s + c.indirectAttainment.percentage, 0) / cloListWithFinal.filter(c => c.indirectAttainment).length
    : null;
  const overallFinal = hasIndirect ? 0.8 * overallDirect + 0.2 * overallIndirect : overallDirect;
  const overallFinalLevel = Math.round(
    cloListWithFinal.reduce((s, c) => s + (c.finalAttainment?.level ?? c.directAttainment.level), 0) / cloListWithFinal.length
  );

  return (
    <div className="iap-final-table-wrap">
      <div className="iap-final-formula">
        <div className="iap-formula-box">
          <span className="iap-formula-label">Final Attainment Formula</span>
          <span className="iap-formula-text">
            {hasIndirect
              ? '0.8 × Direct Attainment % + 0.2 × Indirect Attainment %'
              : 'Direct Attainment % (no indirect data)'}
          </span>
        </div>
        {hasIndirect && (
          <div className="iap-course-final">
            <div className="iap-course-final-row">
              <span>Course Direct (avg)</span>
              <strong>{overallDirect.toFixed(1)}%</strong>
            </div>
            <div className="iap-course-final-row">
              <span>Course Indirect (avg)</span>
              <strong>{overallIndirect.toFixed(1)}%</strong>
            </div>
            <div className="iap-course-final-row iap-course-final-result">
              <span>Course Final Attainment</span>
              <strong style={{ color: levelColor(overallFinalLevel) }}>{overallFinal.toFixed(1)}% · Level {overallFinalLevel} ({levelLabel(overallFinalLevel)})</strong>
            </div>
          </div>
        )}
      </div>

      <table className="iap-final-table">
        <thead>
          <tr>
            <th>CLO</th>
            <th>Direct % (80%)</th>
            <th>Direct Level</th>
            {hasIndirect && <th>Indirect % (20%)</th>}
            {hasIndirect && <th>Indirect Level</th>}
            <th>Final %</th>
            <th>Final Level</th>
          </tr>
        </thead>
        <tbody>
          {cloListWithFinal.map(clo => {
            const finalLevel = clo.finalAttainment?.level ?? clo.directAttainment.level;
            const finalPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
            return (
              <tr key={clo.id}>
                <td><strong>{clo.code}</strong></td>
                <td>{clo.statistics.classAttainment.toFixed(1)}%</td>
                <td>
                  <span className="iap-tbl-level" style={{ color: levelColor(clo.directAttainment.level), background: levelBg(clo.directAttainment.level) }}>
                    L{clo.directAttainment.level} {levelLabel(clo.directAttainment.level)}
                  </span>
                </td>
                {hasIndirect && (
                  <td>{clo.indirectAttainment ? `${clo.indirectAttainment.percentage.toFixed(1)}%` : '—'}</td>
                )}
                {hasIndirect && (
                  <td>
                    {clo.indirectAttainment ? (
                      <span className="iap-tbl-level" style={{ color: levelColor(clo.indirectAttainment.level), background: levelBg(clo.indirectAttainment.level) }}>
                        L{clo.indirectAttainment.level} {levelLabel(clo.indirectAttainment.level)}
                      </span>
                    ) : '—'}
                  </td>
                )}
                <td><strong>{finalPct.toFixed(1)}%</strong></td>
                <td>
                  <span className="iap-tbl-level iap-tbl-level-final" style={{ color: levelColor(finalLevel), background: levelBg(finalLevel), border: `1px solid ${levelColor(finalLevel)}40` }}>
                    L{finalLevel} {levelLabel(finalLevel)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const IndirectAssessmentPanel = ({
  indirectData,        // raw array or null
  indirectCloAnalysis, // computed object or null
  cloListWithFinal,    // merged CLO list
  closData,
  course,
  semester,
  year,
  indirectLoading,
  onUploaded,
  facultyApi
}) => {
  const [tab, setTab] = useState('overview'); // 'overview' | 'clos' | 'final'

  const hasData = Array.isArray(indirectData) && indirectData.length > 0;
  const totalStudents = hasData ? new Set(indirectData.map(e => e.student?.rollNumber)).size : 0;
  const totalRatings = hasData ? indirectData.length : 0;

  if (indirectLoading) {
    return (
      <div className="iap-loading">
        <div className="iap-spinner" />
        <span>Loading indirect assessment data…</span>
      </div>
    );
  }

  return (
    <div className="iap-root">
      {/* Info ribbon */}
      <div className="iap-info-ribbon">
        <Info size={15} />
        <span>
          Indirect assessment contributes <strong>20%</strong> to the final CLO attainment score.
          Students rate their own learning experience for each CLO on a given scale.
        </span>
      </div>

      {!hasData ? (
        <UploadPanel
          course={course} closData={closData}
          semester={semester} year={year}
          onUploaded={onUploaded} facultyApi={facultyApi}
        />
      ) : (
        <>
          {/* Status bar */}
          <div className="iap-status-bar">
            <div className="iap-status-left">
              <CheckCircle size={16} color="#16a34a" />
              <span className="iap-status-text">
                {totalStudents} students · {indirectData ? [...new Set(indirectData.map(e => e.cloId))].length : 0} CLOs · {totalRatings} ratings collected
              </span>
            </div>
            <div className="iap-tab-pills">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'clos', label: 'CLO Breakdown' },
                { key: 'final', label: 'Final Attainment' },
              ].map(t => (
                <button
                  key={t.key}
                  className={`iap-tab-pill ${tab === t.key ? 'iap-tab-active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab: Overview */}
          {tab === 'overview' && indirectCloAnalysis && (
            <div className="iap-tab-content">
              <SummaryStrip indirectCloAnalysis={indirectCloAnalysis} />

              {/* Horizontal bar chart */}
              <div className="iap-chart-section">
                <h4 className="iap-section-heading">Indirect Attainment by CLO</h4>
                <div className="iap-chart-bars">
                  {Object.values(indirectCloAnalysis).map((ic, i) => (
                    <div key={ic.id} className="iap-chart-row">
                      <span className="iap-chart-code">{ic.code}</span>
                      <div className="iap-chart-track">
                        <div
                          className="iap-chart-fill"
                          style={{
                            width: `${ic.statistics.classAttainment}%`,
                            background: levelColor(ic.indirectAttainment.level),
                            animationDelay: `${i * 0.08}s`
                          }}
                        />
                        <div className="iap-chart-threshold" style={{ left: `${ic.threshold}%` }} />
                      </div>
                      <span className="iap-chart-pct">{ic.statistics.classAttainment.toFixed(1)}%</span>
                      <span className="iap-chart-level" style={{ color: levelColor(ic.indirectAttainment.level) }}>
                        L{ic.indirectAttainment.level}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="iap-chart-legend">
                  <span><span className="iap-legend-dot" style={{ background: '#94a3b8' }} /> Threshold marker</span>
                  {[3, 2, 1, 0].map(l => (
                    <span key={l}><span className="iap-legend-dot" style={{ background: levelColor(l) }} /> L{l} {levelLabel(l)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: CLO Breakdown */}
          {tab === 'clos' && indirectCloAnalysis && (
            <div className="iap-tab-content">
              <div className="iap-clo-list">
                {Object.values(indirectCloAnalysis).map((cloData, i) => (
                  <CLOCard key={cloData.id} cloData={cloData} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Tab: Final Attainment */}
          {tab === 'final' && cloListWithFinal.length > 0 && (
            <div className="iap-tab-content">
              <FinalAttainmentTable cloListWithFinal={cloListWithFinal} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndirectAssessmentPanel;
export { classAttainmentToLevel, levelLabel, levelColor, levelBg };