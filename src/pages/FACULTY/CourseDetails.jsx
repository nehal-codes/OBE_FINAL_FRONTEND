import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import facultyApi from '../../apis/faculty';
import {
  ArrowLeft,
  BookOpen,
  Award,
  Calendar,
  FileText,
  BarChart3,
} from 'lucide-react';

const BLOOM_STYLES = {
  REMEMBER:   { badge: 'bg-sky-100 text-sky-700 border border-sky-200',              dot: 'bg-sky-400' },
  UNDERSTAND: { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-400' },
  APPLY:      { badge: 'bg-amber-100 text-amber-700 border border-amber-200',        dot: 'bg-amber-400' },
  ANALYZE:    { badge: 'bg-orange-100 text-orange-700 border border-orange-200',     dot: 'bg-orange-400' },
  EVALUATE:   { badge: 'bg-rose-100 text-rose-700 border border-rose-200',           dot: 'bg-rose-400' },
  CREATE:     { badge: 'bg-violet-100 text-violet-700 border border-violet-200',     dot: 'bg-violet-400' },
};

const TYPE_STYLES = {
  THEORY:     'bg-blue-50 text-blue-700 border border-blue-200',
  PRACTICAL:  'bg-green-50 text-green-700 border border-green-200',
  INTEGRATED: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const SectionCard = ({ icon: Icon, title, badge, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        {title}
      </h2>
      {badge !== undefined && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-sm text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
  </div>
);

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await facultyApi.getCourseDetails(courseId);
        setCourse(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const goBack = () => navigate('/faculty/dashboard');

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Loading course details…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">{error}</p>
      <button onClick={goBack} className="text-sm text-blue-600 hover:underline">← Back to Dashboard</button>
    </div>
  );

  if (!course) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Course not found.</p>
      <button onClick={goBack} className="mt-3 text-sm text-blue-600 hover:underline">← Back to Dashboard</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{course.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md">
                    {course.code}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${TYPE_STYLES[course.type] || 'bg-gray-100 text-gray-600'}`}>
                    {course.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {course.credits || 0} Credits • Semester {course.semester}
                  </span>
                  {course.department && (
                    <span className="text-xs text-gray-400">• {course.department.name}</span>
                  )}
                </div>
              </div>
            </div>

            {course.createdBy && (
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400 mb-0.5">Created by</p>
                <p className="text-sm font-medium text-gray-700">{course.createdBy.name}</p>
                <p className="text-xs text-gray-400">{course.createdBy.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Description + CLOs */}
          <div className="lg:col-span-2 space-y-6">
            {course.description && (
              <SectionCard icon={FileText} title="Description">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{course.description}</p>
              </SectionCard>
            )}

            <SectionCard
              icon={Award}
              title="Course Learning Outcomes"
              badge={`${course.clos.length} CLO${course.clos.length !== 1 ? 's' : ''}`}
            >
              {course.clos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No CLOs defined for this course.</p>
              ) : (
                <div className="space-y-3">
                  {course.clos.map((clo) => {
                    const style = BLOOM_STYLES[clo.bloomLevel] || {
                      badge: 'bg-gray-100 text-gray-600 border border-gray-200',
                      dot: 'bg-gray-400',
                    };
                    return (
                      <div key={clo.id} className="flex gap-3 p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-bold text-blue-600">{clo.code}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                              {clo.bloomLevel}
                            </span>
                            <span className="text-xs text-gray-400">Threshold: {clo.attainmentThreshold}%</span>
                          </div>
                          <p className="text-sm text-gray-700">{clo.statement}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right: Course Info + Assignment History */}
          <div className="space-y-6">
            <SectionCard icon={BarChart3} title="Course Info">
              <DetailRow label="Code" value={<span className="font-mono">{course.code}</span>} />
              <DetailRow label="Semester" value={`Semester ${course.semester}`} />
              <DetailRow label="Credits" value={`${course.credits || 0} Credits`} />
              <DetailRow label="Type" value={course.type.charAt(0) + course.type.slice(1).toLowerCase()} />
              {course.category && <DetailRow label="Category" value={course.category} />}
              {course.regulation && <DetailRow label="Regulation" value={course.regulation} />}
              {course.department && (
                <DetailRow
                  label="Department"
                  value={`${course.department.name} (${course.department.code})`}
                />
              )}
            </SectionCard>

            <SectionCard
              icon={Calendar}
              title="Assignment History"
              badge={course.facultyAssignments?.length || 0}
            >
              {course.facultyAssignments?.length > 0 ? (
                <div className="space-y-3">
                  {course.facultyAssignments.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800 mb-1.5">
                        {a.year} — Semester {a.semester}
                      </p>
                      {a.teachingMethodology && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-600">Teaching:</span> {a.teachingMethodology}
                        </p>
                      )}
                      {a.assessmentMode && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium text-gray-600">Assessment:</span> {a.assessmentMode}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No assignment history found.</p>
              )}
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}