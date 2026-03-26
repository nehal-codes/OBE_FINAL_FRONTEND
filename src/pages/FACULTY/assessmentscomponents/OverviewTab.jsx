import React from 'react';
import { Award, BarChart, TrendingUp, CheckCircle, ClipboardList, Target, BookOpen, Percent, FileCheck } from 'lucide-react';

const OverviewTab = ({ course, clos, stats, assessments, onAnalyzeAll }) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const finalizedCount = safeAssessments.filter(a => a.isMarksFinalized).length;
  const hasAssessments = safeAssessments.length > 0;
  const canAnalyze = finalizedCount > 0;

  // Calculate additional stats
  const totalClos = clos.length;
  const mappedClos = safeAssessments.reduce((count, assessment) => {
    return count + (assessment.cloAllocations?.length || 0);
  }, 0);
  const avgMarksPerClo = totalClos > 0 ? (stats.marksUsed / totalClos).toFixed(1) : 0;

  return (
    <div className="overview-tab" style={{ padding: '24px' }}>
      {/* Summary Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Course CLOs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              background: '#eff6ff',
              padding: '10px',
              borderRadius: '10px',
              color: '#3b82f6'
            }}>
              <Target size={24} />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
              Course Learning Outcomes
            </h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            {totalClos}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {totalClos === 0 ? 'No CLOs defined' : `${totalClos} outcome${totalClos !== 1 ? 's' : ''} to achieve`}
          </div>
        </div>

        {/* Card 2: Assessments Created */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              background: '#fef3c7',
              padding: '10px',
              borderRadius: '10px',
              color: '#f59e0b'
            }}>
              <BookOpen size={24} />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
              Assessments
            </h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            {stats.assessmentsCount}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {stats.assessmentsCount === 0 ? 'No assessments added' : `${stats.assessmentsCount} assessment${stats.assessmentsCount !== 1 ? 's' : ''} created`}
          </div>
        </div>

        {/* Card 3: Marks Allocation */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              background: '#d1fae5',
              padding: '10px',
              borderRadius: '10px',
              color: '#10b981'
            }}>
              <Percent size={24} />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
              Marks Allocation
            </h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            {stats.marksPercentage}%
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {stats.marksUsed} of {stats.maxMarks} marks used
            {totalClos > 0 && ` • ${avgMarksPerClo} avg per CLO`}
          </div>
        </div>

        {/* Card 4: Finalized Assessments */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              background: finalizedCount === safeAssessments.length && safeAssessments.length > 0 ? '#d1fae5' : '#fee2e2',
              padding: '10px',
              borderRadius: '10px',
              color: finalizedCount === safeAssessments.length && safeAssessments.length > 0 ? '#10b981' : '#ef4444'
            }}>
              <FileCheck size={24} />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#6b7280' }}>
              Finalization Status
            </h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
            {finalizedCount}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {safeAssessments.length === 0 
              ? 'No assessments to finalize' 
              : finalizedCount === safeAssessments.length 
                ? 'All assessments finalized ✓' 
                : `${finalizedCount} of ${safeAssessments.length} finalized`}
          </div>
        </div>
      </div>

      {/* CLOs Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Section Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#fafafa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={20} color="#6b7280" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Course Learning Outcomes
            </h3>
            {totalClos > 0 && (
              <span style={{
                background: '#e5e7eb',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#374151'
              }}>
                {totalClos} total
              </span>
            )}
          </div>
          
          {hasAssessments && (
            <button 
              onClick={onAnalyzeAll}
              disabled={!canAnalyze}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: canAnalyze ? '#3b82f6' : '#e5e7eb',
                color: canAnalyze ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: canAnalyze ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
              title={!canAnalyze ? 'At least one assessment needs to be finalized before analysis' : 'Analyze all assessments'}
            >
              <BarChart size={16} />
              Analyze All Assessments
              {finalizedCount > 0 && canAnalyze && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {finalizedCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* CLOs Table or Empty State */}
        {clos.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Award size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 500, color: '#374151' }}>
              No CLOs Defined
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Course Learning Outcomes (CLOs) have not been defined for this course yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <th style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    CLO Code
                  </th>
                  <th style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Statement
                  </th>
                  <th style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    width: '140px'
                  }}>
                    Bloom Level
                  </th>
                  <th style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    width: '100px'
                  }}>
                    Threshold
                  </th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, index) => {
                  const cloAssessments = safeAssessments.filter(a => 
                    a.cloAllocations?.some(ca => ca.cloId === clo.id)
                  );
                  const hasMarks = cloAssessments.some(a => a.isMarksFinalized);
                  
                  // Get bloom level color
                  const bloomColor = {
                    'remember': '#8b5cf6',
                    'understand': '#3b82f6',
                    'apply': '#10b981',
                    'analyze': '#f59e0b',
                    'evaluate': '#ef4444',
                    'create': '#ec489a'
                  }[String(clo.bloomLevel || '').toLowerCase()] || '#6b7280';
                  
                  return (
                    <tr key={clo.id || index} style={{
                      borderBottom: index === clos.length - 1 ? 'none' : '1px solid #f3f4f6',
                      transition: 'background 0.2s'
                    }}>
                      <td style={{
                        padding: '16px 20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#111827'
                      }}>
                        {clo.code}
                      </td>
                      <td style={{
                        padding: '16px 20px',
                        fontSize: '14px',
                        color: '#4b5563',
                        lineHeight: '1.5'
                      }}>
                        {clo.statement || "No description provided"}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${bloomColor}15`,
                          color: bloomColor,
                          textTransform: 'capitalize'
                        }}>
                          {clo.bloomLevel || "Not Set"}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: '#f3f4f6',
                          color: '#374151'
                        }}>
                          {clo.attainmentThreshold || 50}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Attainment Summary */}
        {hasAssessments && clos.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            background: '#fefce8',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <TrendingUp size={18} color="#eab308" />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '13px', fontWeight: 600, color: '#854d0e', display: 'block', marginBottom: '2px' }}>
                Attainment Status
              </strong>
              <p style={{ margin: 0, fontSize: '13px', color: '#a16207' }}>
                {finalizedCount} assessment{finalizedCount !== 1 ? 's' : ''} finalized.
                {canAnalyze 
                  ? ' Click "Analyze All" to view detailed CLO attainment analysis.'
                  : ' Finalize at least one assessment to view attainment analysis.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;