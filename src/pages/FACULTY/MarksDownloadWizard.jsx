import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import assessmentApi from "../../apis/assessments/assessment";
import HODAPI from '../../apis/HOD';
import './MarksDownloadWizard.css';

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────────────────────── */
const CORE_COLS = ['sr', 'rollNumber'];
const isAbsentValue = v => typeof v === 'string' && v.trim().toUpperCase() === 'A';

const buildColId = (type, payload) => {
  if (type === 'assessment') return `assessment__${payload.assessmentId}`;
  if (type === 'clo')        return `clo__${payload.assessmentId}__${payload.cloId}`;
  if (type === 'total')      return `total__${payload.key}`;
  return `col__${Math.random()}`;
};

/* ─────────────────────────────────────────────────────────────────────────────
   COLUMN HEADER
───────────────────────────────────────────────────────────────────────────── */
const ColHeader = ({ col, onRemove, totalTooltip }) => {
  const [hover, setHover] = useState(false);
  const canRemove = !CORE_COLS.includes(col.id);

  return (
    <th
      className={`mdw-th ${col.type === 'clo' ? 'mdw-th--clo' : ''} ${col.isAssessmentTotal ? 'mdw-th--atotal' : ''} ${col.type === 'total' ? 'mdw-th--gtotal' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="mdw-th-label" title={totalTooltip || col.label}>
        {col.shortLabel || col.label}
      </span>
      {canRemove && hover && (
        <button className="mdw-remove-col" onClick={() => onRemove(col.id)}>×</button>
      )}
      {totalTooltip && hover && (
        <div className="mdw-tooltip">{totalTooltip}</div>
      )}
    </th>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   ADD COLUMN MODAL — large overlay
───────────────────────────────────────────────────────────────────────────── */
const AddColumnModal = ({ assessments, existingColIds, onAdd, onClose }) => {
  const [tab, setTab]                     = useState('assessment');
  const [selectedAssId, setSelectedAssId] = useState('');
  const [totalSelIds, setTotalSelIds]     = useState([]);
  const [totalLabel, setTotalLabel]       = useState('Total');

  const addedAssessmentIds = existingColIds
    .filter(id => id.startsWith('assessment__'))
    .map(id => id.replace('assessment__', ''));

  const availableAssessments = assessments.filter(a => !addedAssessmentIds.includes(a.id));
  const summableAssessments  = assessments.filter(a =>  addedAssessmentIds.includes(a.id));

  const selectedAssessment = assessments.find(a => a.id === selectedAssId);

  const handleAddAssessment = () => {
    const a = assessments.find(a => a.id === selectedAssId);
    if (!a) return;
    onAdd('assessment', a);
    onClose();
  };

  const handleAddTotal = () => {
    if (totalSelIds.length === 0) return;
    onAdd('total', { ids: totalSelIds, label: totalLabel || 'Total' });
    onClose();
  };

  const toggleTotal = id =>
    setTotalSelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const totalMax = totalSelIds.reduce(
    (s, id) => s + (assessments.find(a => a.id === id)?.maxMarks || 0), 0
  );

  return (
    <div className="mdw-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mdw-modal">

        {/* Header */}
        <div className="mdw-modal-header">
          <h2 className="mdw-modal-title">Add Column</h2>
          <button className="mdw-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="mdw-modal-tabs">
          <button
            className={`mdw-modal-tab ${tab === 'assessment' ? 'active' : ''}`}
            onClick={() => setTab('assessment')}
          >
            📋 Assessment Column
          </button>
          <button
            className={`mdw-modal-tab ${tab === 'total' ? 'active' : ''}`}
            onClick={() => setTab('total')}
          >
            ∑ Total Column
          </button>
        </div>

        {/* Body */}
        <div className="mdw-modal-body">

          {/* ── Assessment Tab ── */}
          {tab === 'assessment' && (
            <>
              {availableAssessments.length === 0 ? (
                <div className="mdw-modal-empty">
                  <span className="mdw-modal-empty-icon">✓</span>
                  <p>All finalized assessments have already been added to the table.</p>
                </div>
              ) : (
                <>
                  <p className="mdw-modal-desc">
                    Choose an assessment. Its individual CLO columns will be inserted, followed by the assessment total column. CLO columns can be removed individually afterwards.
                  </p>

                  <div className="mdw-assessment-cards">
                    {availableAssessments.map(a => (
                      <div
                        key={a.id}
                        className={`mdw-assessment-card ${selectedAssId === a.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAssId(a.id)}
                      >
                        <div className={`mdw-radio ${selectedAssId === a.id ? 'checked' : ''}`} />
                        <div className="mdw-acard-info">
                          <div className="mdw-acard-title">{a.title}</div>
                          <div className="mdw-acard-meta">
                            <span className="mdw-badge mdw-badge-type">{a.type || 'Assessment'}</span>
                            <span className="mdw-badge mdw-badge-marks">{a.maxMarks} marks</span>
                            <span className="mdw-badge mdw-badge-mode">{a.mode || 'Written'}</span>
                          </div>
                          {a.assessmentClos?.length > 0 && (
                            <div className="mdw-acard-clos">
                              <span className="mdw-acard-clos-label">CLOs:</span>
                              {a.assessmentClos.map((ac, i) => (
                                <span key={i} className="mdw-clo-pill">
                                  {ac.clo?.code || `CLO${i+1}`} ({ac.marksAllocated}m)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedAssessment && (
                    <div className="mdw-modal-preview">
                      <div className="mdw-preview-label">Columns that will be inserted:</div>
                      <div className="mdw-preview-cols">
                        {selectedAssessment.assessmentClos?.map((ac, i) => (
                          <span key={i} className="mdw-preview-col mdw-preview-col--clo">
                            {ac.clo?.code || `CLO${i+1}`}
                          </span>
                        ))}
                        <span className="mdw-preview-col mdw-preview-col--atotal">
                          {selectedAssessment.title}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Total Tab ── */}
          {tab === 'total' && (
            <>
              {summableAssessments.length === 0 ? (
                <div className="mdw-modal-empty">
                  <span className="mdw-modal-empty-icon">⚠</span>
                  <p>Add at least one assessment column to the table first before creating a Total column.</p>
                </div>
              ) : (
                <>
                  <p className="mdw-modal-desc">
                    Create a read-only column that sums totals across selected assessments. Hover the column header to see the formula.
                  </p>

                  <div className="mdw-total-config">
                    <div className="mdw-field-row">
                      <label className="mdw-field-label">Column Label</label>
                      <input
                        className="mdw-field-input"
                        value={totalLabel}
                        onChange={e => setTotalLabel(e.target.value)}
                        placeholder="e.g. Grand Total, Semester Total…"
                      />
                    </div>

                    <div className="mdw-field-row" style={{ marginTop: 20 }}>
                      <label className="mdw-field-label">
                        Assessments to Sum
                        {totalSelIds.length > 0 && (
                          <span className="mdw-field-sub"> · {totalSelIds.length} selected · {totalMax} max marks</span>
                        )}
                      </label>
                      <div className="mdw-total-checks">
                        {summableAssessments.map(a => (
                          <label
                            key={a.id}
                            className={`mdw-total-check-card ${totalSelIds.includes(a.id) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={totalSelIds.includes(a.id)}
                              onChange={() => toggleTotal(a.id)}
                            />
                            <div className="mdw-total-check-info">
                              <span className="mdw-total-check-name">{a.title}</span>
                              <span className="mdw-total-check-marks">/{a.maxMarks} marks</span>
                            </div>
                            {totalSelIds.includes(a.id) && <span className="mdw-total-tick">✓</span>}
                          </label>
                        ))}
                      </div>
                    </div>

                    {totalSelIds.length > 0 && (
                      <div className="mdw-total-formula">
                        <span className="mdw-formula-label">Formula:</span>
                        <span className="mdw-formula-text">
                          <strong>{totalLabel || 'Total'}</strong>
                          {' = '}
                          {totalSelIds.map(id => assessments.find(a => a.id === id)?.title || id).join(' + ')}
                        </span>
                        <span className="mdw-formula-max">/{totalMax} max marks</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mdw-modal-footer">
          <button className="mdw-modal-cancel" onClick={onClose}>Cancel</button>
          {tab === 'assessment' ? (
            <button
              className="mdw-modal-confirm"
              disabled={!selectedAssId}
              onClick={handleAddAssessment}
            >
              Add Assessment Columns →
            </button>
          ) : (
            <button
              className="mdw-modal-confirm"
              disabled={totalSelIds.length === 0}
              onClick={handleAddTotal}
            >
              Add Total Column →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   EDITABLE CELL
   CLO cells   → numeric only (allowAbsent=false)
   Assess total → numeric OR 'A'  (allowAbsent=true)
───────────────────────────────────────────────────────────────────────────── */
const EditableCell = ({ value, onChange, isAbsent, allowAbsent }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef              = useRef(null);

  const displayVal = isAbsent ? 'A' : (value === null || value === undefined ? '—' : value);

  const startEdit = () => {
    setDraft(isAbsent ? 'A' : (value ?? ''));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (allowAbsent && t.toUpperCase() === 'A') {
      onChange('A');
    } else {
      const n = parseFloat(t);
      onChange(isNaN(n) ? (value ?? 0) : n);
    }
  };

  return editing ? (
    <input
      ref={inputRef}
      className={`mdw-cell-input ${isAbsent ? 'mdw-cell-input--absent' : ''}`}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      placeholder={allowAbsent ? '# or A' : ''}
    />
  ) : (
    <span
      className={`mdw-cell-val mdw-cell-editable ${isAbsent ? 'mdw-cell-absent-tag' : ''}`}
      onClick={startEdit}
      title={allowAbsent ? 'Click to edit · type A for absent' : 'Click to edit'}
    >
      {displayVal}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const MarksDownloadWizard = ({ course, onClose, className = '' }) => {
  const [assessments, setAssessments] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [marksData,   setMarksData]   = useState({});
  const [courseInfo,  setCourseInfo]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [columns, setColumns] = useState([
    { id: 'sr',         label: 'Sr.No.', type: 'fixed' },
    { id: 'rollNumber', label: 'Roll No', type: 'fixed' },
    { id: 'name',       label: 'Name',   type: 'base'  },
  ]);

  // { assessmentId: { studentId: { cloId: number|'A', _totalOverride?: number } } }
  const [editOverrides, setEditOverrides] = useState({});
  const [showModal, setShowModal]         = useState(false);
  const [assignedFaculties, setAssignedFaculties] = useState([]);

  /* ── Load initial data ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!course) return;
    (async () => {
      try {
        setLoading(true);
        const [assRes, stuRes] = await Promise.all([
          assessmentApi.getCourseAssessments(course.id, { semester: course.semester, year: course.year }),
          assessmentApi.getCourseStudents(course.id,    { semester: course.semester, year: course.year }),
        ]);
        const finalized = (assRes.data?.data?.assessments || []).filter(a => a.isMarksFinalized);
        if (assRes.data?.data?.course) setCourseInfo(assRes.data.data.course);
        setAssessments(finalized);
        setStudents(stuRes.data?.data?.students || []);

        // Fetch assigned faculties — same pattern as AssignFaculty component
        try {
          const facRes = await HODAPI.assignments.getCourseAssignments(
            course.id,
            String(course.semester),
            String(course.year)
          );
          let assignmentsData = [];
          if (Array.isArray(facRes.data)) {
            assignmentsData = facRes.data;
          } else if (facRes.data?.assignments && Array.isArray(facRes.data.assignments)) {
            assignmentsData = facRes.data.assignments;
          } else if (facRes.data?.data?.assignments && Array.isArray(facRes.data.data.assignments)) {
            assignmentsData = facRes.data.data.assignments;
          }
          setAssignedFaculties(assignmentsData);
        } catch (facErr) {
          if (facErr.response?.status === 404) {
            setAssignedFaculties([]);
          } else {
            console.error('Error fetching assignments:', facErr);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [course]);

  /* ── Load marks lazily when assessment added ────────────────────────────── */
  const loadMarksForAssessment = useCallback(async (assessmentId) => {
    if (marksData[assessmentId]) return;
    try {
      const res = await assessmentApi.getAssessmentMarks(assessmentId);
      setMarksData(prev => ({ ...prev, [assessmentId]: res.data?.data || {} }));
    } catch (err) {
      console.error('Failed to load marks for', assessmentId, err);
    }
  }, [marksData]);

  /* ── Get original API marks for a CLO ──────────────────────────────────── */
  const getMarks = useCallback((studentId, assessmentId, cloId) => {
    const edited = editOverrides[assessmentId]?.[studentId]?.[cloId];
    if (edited !== undefined) return edited;
    const stu = (marksData[assessmentId]?.students || []).find(s => s.studentId === studentId);
    if (!stu) return null;
    const d = stu.marksByClo?.[cloId];
    if (d === undefined) return null;
    return typeof d === 'object' ? d.marksObtained : d;
  }, [editOverrides, marksData]);

  /* ── CLO numeric edit ───────────────────────────────────────────────────── */
  const handleCloEdit = useCallback((assessmentId, studentId, cloId, value) => {
    setEditOverrides(prev => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        [studentId]: {
          ...prev[assessmentId]?.[studentId],
          [cloId]: value,
          _totalOverride: undefined, // clear total override when CLO edited
        },
      },
    }));
  }, []);

  /* ── Assessment total edit (A → all CLOs absent, number → _totalOverride) ── */
  const handleAssessmentTotalEdit = useCallback((assessmentId, studentId, clos, value) => {
    if (isAbsentValue(value)) {
      const updates = {};
      clos.forEach(ac => { updates[ac.cloId] = 'A'; });
      setEditOverrides(prev => ({
        ...prev,
        [assessmentId]: {
          ...prev[assessmentId],
          [studentId]: { ...prev[assessmentId]?.[studentId], ...updates, _totalOverride: undefined },
        },
      }));
    } else {
      setEditOverrides(prev => ({
        ...prev,
        [assessmentId]: {
          ...prev[assessmentId],
          [studentId]: { ...prev[assessmentId]?.[studentId], _totalOverride: parseFloat(value) || 0 },
        },
      }));
    }
  }, []);

  /* ── Compute assessment total for a student ──────────────────────────────── */
  const getAssessmentTotal = useCallback((studentId, assessmentId, clos) => {
    const ov = editOverrides[assessmentId]?.[studentId] || {};
    // _totalOverride wins if set (and is a number)
    if (ov._totalOverride !== undefined) return ov._totalOverride;
    let sum = 0; let anyAbsent = false;
    clos.forEach(ac => {
      const v = getMarks(studentId, assessmentId, ac.cloId);
      if (isAbsentValue(v)) anyAbsent = true;
      else sum += (typeof v === 'number' ? v : 0);
    });
    if (anyAbsent && clos.length > 0) return 'A';
    return sum;
  }, [editOverrides, getMarks]);

  /* ── Add column ─────────────────────────────────────────────────────────── */
  const handleAddColumn = useCallback(async (type, payload) => {
    if (type === 'assessment') {
      const a = payload;
      await loadMarksForAssessment(a.id);
      const cloColumns = (a.assessmentClos || []).map(ac => ({
        id:                 buildColId('clo', { assessmentId: a.id, cloId: ac.cloId }),
        label:              `${ac.clo?.code || 'CLO'} (/${ac.marksAllocated})`,
        shortLabel:         ac.clo?.code || 'CLO',
        type:               'clo',
        assessmentId:       a.id,
        cloId:              ac.cloId,
        maxMarks:           ac.marksAllocated,
        parentAssessmentId: a.id,
      }));
      const totalCol = {
        id:                 buildColId('assessment', { assessmentId: a.id }),
        label:              `${a.title} (/${a.maxMarks})`,
        shortLabel:         a.title,
        type:               'assessmentTotal',
        isAssessmentTotal:  true,
        assessmentId:       a.id,
        maxMarks:           a.maxMarks,
        clos:               a.assessmentClos || [],
        parentAssessmentId: a.id,
      };
      setColumns(prev => [...prev, ...cloColumns, totalCol]);
    }
    if (type === 'total') {
      const { ids, label } = payload;
      // Snapshot clos for each assessment NOW so the total column can
      // compute independently even if assessment columns are later removed.
      const closByAssessment = {};
      ids.forEach(aid => {
        const a = assessments.find(a => a.id === aid);
        if (a) closByAssessment[aid] = a.assessmentClos || [];
      });
      setColumns(prev => [...prev, {
        id:               buildColId('total', { key: ids.join('_') }),
        label,
        type:             'total',
        assessmentIds:    ids,
        closByAssessment,
      }]);
    }
  }, [loadMarksForAssessment, assessments]);

  /* ── Remove column ──────────────────────────────────────────────────────── */
  const handleRemoveColumn = useCallback((colId) => {
    setColumns(prev => {
      const col = prev.find(c => c.id === colId);
      if (col?.isAssessmentTotal) {
        // Remove the assessment total col + its sibling CLO cols,
        // but NEVER remove Total (grand total) columns — they keep
        // their snapshotted clos and continue computing correctly.
        return prev.filter(c =>
          c.id !== colId &&
          !(c.type === 'clo' && c.parentAssessmentId === col.assessmentId)
        );
      }
      return prev.filter(c => c.id !== colId);
    });
  }, []);

  /* ── Build rows ──────────────────────────────────────────────────────────── */
  const rows = useMemo(() => students.map((student, idx) => {
    const cells = {
      sr:         idx + 1,
      rollNumber: student.rollNumber,
      name:       student.name,
    };
    columns.forEach(col => {
      if (col.type === 'clo') {
        cells[col.id] = getMarks(student.id, col.assessmentId, col.cloId);
      }
      if (col.isAssessmentTotal) {
        cells[col.id] = getAssessmentTotal(student.id, col.assessmentId, col.clos);
      }
      if (col.type === 'total') {
        let sum = 0; let anyAbsent = false;
        col.assessmentIds.forEach(aid => {
          // Use snapshotted clos — works even if assessment col was removed
          const clos = col.closByAssessment?.[aid]
            || columns.find(c => c.isAssessmentTotal && c.assessmentId === aid)?.clos
            || [];
          const v = getAssessmentTotal(student.id, aid, clos);
          if (isAbsentValue(v)) anyAbsent = true;
          else sum += (typeof v === 'number' ? v : 0);
        });
        cells[col.id] = anyAbsent ? 'A' : sum;
      }
    });
    return { student, cells };
  }), [students, columns, getMarks, getAssessmentTotal]);

  /* ── Print PDF (B&W, with logo) ─────────────────────────────────────────── */
  const handlePrint = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 30;

    // ── College logo (top-centre) ──
    const logoUrl = 'https://www.chowgules.ac.in/resources/images/logo/college%20logo-%20June%202023.png';
    const logoH = 60;
    const logoW = 160;
    try {
      doc.addImage(logoUrl, 'PNG', (pageW - logoW) / 2, y, logoW, logoH);
    } catch (_) { /* logo load may fail in some envs, skip gracefully */ }
    y += logoH + 10;

    // ── Thin divider ──
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(40, y, pageW - 40, y);
    y += 10;

    // ── Course details ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    const code = courseInfo?.code || course?.code || '';
    const name = courseInfo?.name || course?.name || '';
    const credits = courseInfo?.credits ? ` · ${courseInfo.credits} Credits` : '';
    doc.text(`${code}  —  ${name}${credits}`, pageW / 2, y, { align: 'center' });
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Semester: ${course?.semester || ''}  ·  Academic Year: ${course?.year || ''}`, pageW / 2, y, { align: 'center' });
    y += 14;

    // ── Faculty details ──
    if (assignedFaculties.length > 0) {
      const facNames = assignedFaculties
        .map(f => f.faculty?.name || f.facultyName || '')
        .filter(Boolean)
        .join('  |  ');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Faculty: ', 40, y);
      doc.setFont('helvetica', 'normal');
      doc.text(facNames, 40 + doc.getTextWidth('Faculty: '), y);
      y += 14;
    }

    // ── Generated timestamp ──
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 40, y, { align: 'right' });
    doc.setTextColor(0);
    y += 10;

    // ── Thin divider ──
    doc.setDrawColor(0);
    doc.line(40, y, pageW - 40, y);
    y += 8;

    // ── Marks table — strict black & white ──
    doc.autoTable({
      head:    [columns.map(c => c.shortLabel || c.label)],
      body:    rows.map(({ cells }) =>
        columns.map(c => { const v = cells[c.id]; return v === null || v === undefined ? '' : String(v); })
      ),
      startY:  y,
      styles: {
        fontSize:    7.5,
        cellPadding: 4,
        textColor:   [0, 0, 0],
        fillColor:   false,
        lineColor:   [0, 0, 0],
        lineWidth:   0.3,
      },
      headStyles: {
        fillColor:   [0, 0, 0],
        textColor:   [255, 255, 255],
        fontStyle:   'bold',
        lineColor:   [0, 0, 0],
        lineWidth:   0.3,
      },
      alternateRowStyles: {
        fillColor: [235, 235, 235],
      },
      didParseCell: (data) => {
        if (data.cell.raw === 'A') {
          data.cell.styles.fontStyle = 'bold';
          // underline effect via border-bottom trick is not available; bold is enough for B&W
        }
      },
    });

    doc.save(`${code || 'marks'}_sheet.pdf`);
  };

  /* ── Export Excel (with header rows: logo placeholder, course, faculty) ──── */
  const handleExcel = () => {
    const code    = courseInfo?.code || course?.code || '';
    const name    = courseInfo?.name || course?.name || '';
    const credits = courseInfo?.credits ? `${courseInfo.credits} Credits` : '';
    const sem     = `Semester: ${course?.semester || ''}  |  Year: ${course?.year || ''}`;
    const facLine = assignedFaculties.length > 0
      ? assignedFaculties.map(f => f.faculty?.name || f.facultyName || '').filter(Boolean).join('  |  ')
      : '';

    const headers = columns.map(c => c.shortLabel || c.label);
    const dataRows = rows.map(({ cells }) => columns.map(c => cells[c.id] ?? ''));

    // Build sheet with metadata rows above the table
    const sheetData = [
      ['Chowgule College of Arts & Science (Autonomous)'],  // logo placeholder row
      [`${code}  —  ${name}${credits ? '  |  ' + credits : ''}`],
      [sem],
      ...(facLine ? [['Faculty: ' + facLine]] : []),
      [`Generated: ${new Date().toLocaleString()}`],
      [],          // blank separator
      headers,
      ...dataRows,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths
    ws['!cols'] = headers.map(() => ({ wch: 16 }));

    // Merge header rows across all columns for a clean look
    const colCount = headers.length;
    if (!ws['!merges']) ws['!merges'] = [];
    [0, 1, 2, 3, 4].forEach(r => {
      if (sheetData[r] && sheetData[r][0]) {
        ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: Math.max(0, colCount - 1) } });
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Marks');
    XLSX.writeFile(wb, `${code || 'marks'}_sheet.xlsx`);
  };

  const getTotalTooltip = col => col.type !== 'total' ? null :
    `${col.label} = ${col.assessmentIds.map(id => assessments.find(a => a.id === id)?.title || id).join(' + ')}`;

  const hasEdits    = Object.keys(editOverrides).length > 0;
  const absentCount = rows.filter(({ cells }) =>
    columns.some(c => c.isAssessmentTotal && isAbsentValue(cells[c.id]))
  ).length;

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (!course)  return <div className="mdw-root mdw-error">No course selected.</div>;
  if (loading)  return <div className="mdw-root mdw-loading"><div className="mdw-spinner" /><span>Loading marks data…</span></div>;
  if (error)    return <div className="mdw-root mdw-error"><p>⚠ {error}</p></div>;

  return (
    <div className={`mdw-root ${className}`}>

      {showModal && (
        <AddColumnModal
          assessments={assessments}
          existingColIds={columns.map(c => c.id)}
          onAdd={handleAddColumn}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Header */}
      <div className="mdw-header">
        <div className="mdw-header-left">
          <div className="mdw-course-badge">
            <span className="mdw-course-code">{courseInfo?.code || course.code}</span>
            <span className="mdw-course-sep">—</span>
            <span className="mdw-course-name">{courseInfo?.name || course.name}</span>
          </div>
          <div className="mdw-sem-tag">Sem {course.semester} · {course.year}</div>
        </div>
        <div className="mdw-header-actions">
          {hasEdits && <button className="mdw-btn mdw-btn-ghost" onClick={() => setEditOverrides({})}>↺ Reset</button>}
          <button className="mdw-btn mdw-btn-secondary" onClick={handleExcel}>⬇ Excel</button>
          <button className="mdw-btn mdw-btn-primary"   onClick={handlePrint}>⎙ Print PDF</button>
          {onClose && <button className="mdw-btn mdw-btn-close" onClick={onClose}>×</button>}
        </div>
      </div>

      {/* Faculty strip */}
      {assignedFaculties.length > 0 && (
        <div className="mdw-faculty-strip">
          <span className="mdw-faculty-strip-label">Faculty:</span>
          <div className="mdw-faculty-chips">
            {assignedFaculties.map((assignment) => (
              <span
                key={`${assignment.facultyId}-${assignment.semester}-${assignment.year}`}
                className="mdw-faculty-chip"
                title={assignment.faculty?.user?.email || ''}
              >
                {assignment.faculty?.name || assignment.facultyName || 'Unknown'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hint Bar */}
      <div className="mdw-hint-bar">
        <span>
          💡 Edit <strong>CLO cells</strong> for numeric marks · Edit <strong>assessment total cells</strong> and type <kbd>A</kbd> to mark student absent
        </span>
        <div className="mdw-hint-stats">
          <span>{students.length} students</span>
          {absentCount > 0 && <span className="mdw-hint-absent">{absentCount} absent</span>}
          {hasEdits && <span className="mdw-hint-edited">✎ Local edits active</span>}
        </div>
      </div>

      {/* Table */}
      <div className="mdw-table-wrap">
        <table className="mdw-table">
          <thead>
            <tr>
              {columns.map(col => (
                <ColHeader key={col.id} col={col} onRemove={handleRemoveColumn} totalTooltip={getTotalTooltip(col)} />
              ))}
              <th className="mdw-th mdw-th-add">
                <button className="mdw-add-col-btn" onClick={() => setShowModal(true)}>+ Add Column</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="mdw-empty-row">No students enrolled.</td></tr>
            ) : rows.map(({ student, cells }) => {
              const rowAbsent = columns.some(c => c.isAssessmentTotal && isAbsentValue(cells[c.id]));
              return (
                <tr key={student.id} className={rowAbsent ? 'mdw-row-absent' : ''}>
                  {columns.map(col => {
                    const value  = cells[col.id];
                    const absent = isAbsentValue(value);

                    if (col.type === 'fixed' || col.id === 'name') return (
                      <td key={col.id} className="mdw-td mdw-td-fixed">
                        <span className="mdw-cell-val">{value}</span>
                      </td>
                    );

                    if (col.type === 'clo') return (
                      <td key={col.id} className="mdw-td mdw-td-clo">
                        <EditableCell
                          value={typeof value === 'number' ? +value.toFixed(2) : value}
                          isAbsent={false}
                          allowAbsent={false}
                          onChange={v => handleCloEdit(col.assessmentId, student.id, col.cloId, v)}
                        />
                      </td>
                    );

                    if (col.isAssessmentTotal) return (
                      <td key={col.id} className={`mdw-td mdw-td-atotal ${absent ? 'mdw-td-absent' : ''}`}>
                        <EditableCell
                          value={typeof value === 'number' ? +value.toFixed(1) : value}
                          isAbsent={absent}
                          allowAbsent={true}
                          onChange={v => handleAssessmentTotalEdit(col.assessmentId, student.id, col.clos, v)}
                        />
                      </td>
                    );

                    if (col.type === 'total') return (
                      <td key={col.id} className={`mdw-td mdw-td-gtotal ${absent ? 'mdw-td-absent' : ''}`}>
                        <span className={`mdw-cell-val mdw-cell-total ${absent ? 'mdw-cell-absent-tag' : ''}`}>
                          {absent ? 'A' : (value === null || value === undefined ? '—' : (typeof value === 'number' ? +value.toFixed(1) : value))}
                        </span>
                      </td>
                    );

                    return <td key={col.id} className="mdw-td"><span className="mdw-cell-val">—</span></td>;
                  })}
                  <td className="mdw-td mdw-td-spacer" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mdw-footer">
        <div className="mdw-legend">
          <span className="mdw-legend-item"><span className="mdw-dot mdw-dot-clo" />CLO (numeric edit)</span>
          <span className="mdw-legend-item"><span className="mdw-dot mdw-dot-atotal" />Assessment total (edit · A = absent)</span>
          <span className="mdw-legend-item"><span className="mdw-dot mdw-dot-gtotal" />Grand total (auto)</span>
          <span className="mdw-legend-item"><span className="mdw-dot mdw-dot-absent" />Absent row</span>
        </div>
        <span className="mdw-footer-note">{students.length} students · {assessments.length} finalized assessments</span>
      </div>
    </div>
  );
};

export default MarksDownloadWizard;