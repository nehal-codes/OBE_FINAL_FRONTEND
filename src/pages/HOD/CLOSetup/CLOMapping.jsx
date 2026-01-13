import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import HOD_API from "../../../apis/HOD";
import {
  getCourseDraft,
  getClosDraft,
  clearCourseDraft,
  clearClosDraft,
} from "../../../utils/draftStorage";
import {
  FiArrowLeft,
  FiSave,
  FiGrid,
  FiTarget,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiFilter,
  FiMaximize2,
  FiMinimize2,
  FiChevronRight,
  FiBook,
} from "react-icons/fi";

const CLOMapping = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [clos, setClos] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(true);
  const [filterLevel, setFilterLevel] = useState("all");
  const [courseInfo, setCourseInfo] = useState(null);

  const mappingLevels = [
    { value: 0, label: "None", color: "bg-gray-100 text-gray-600", description: "No correlation" },
    { value: 1, label: "Low", color: "bg-blue-100 text-blue-700", description: "Indirect/partial coverage" },
    { value: 2, label: "Medium", color: "bg-green-100 text-green-700", description: "Moderate coverage" },
    { value: 3, label: "High", color: "bg-emerald-100 text-emerald-700", description: "Strong/complete coverage" },
  ];

  const ensureCourseAndClosExist = async () => {
    let resolvedCourseId = courseId;
    let savedClos = [];

    const courseDraft = getCourseDraft();
    let closDraft = getClosDraft();

    // If course is still a draft → create it now
    if (!resolvedCourseId || resolvedCourseId === "draft") {
      if (!courseDraft) throw new Error("Missing course draft.");

      const payload = {
        code: courseDraft.code,
        name: courseDraft.name,
        slug: courseDraft.slug,
        semester: Number(courseDraft.semester || 1),
        credits: Number(courseDraft.credits || 0),
        departmentId: courseDraft.programmeId,
        type: courseDraft.type,
        category: courseDraft.category,
        description: courseDraft.description,
        isActive: true,
      };

      const res = await HOD_API.courses.createCourse(payload, user?.token);
      resolvedCourseId = res?.data?.id;
      clearCourseDraft();
    }

    // Ensure CLOs exist
    const dbClos = await HOD_API.clos.getCLOs(resolvedCourseId, user?.token);

    if (dbClos?.data?.length > 0) {
      savedClos = dbClos.data;
    } else {
      if (!closDraft || closDraft.length === 0)
        throw new Error("No CLOs found in draft or DB");

      for (let i = 0; i < closDraft.length; i++) {
        const c = closDraft[i];
        const payload = {
          code: c.cloCode,
          statement: c.description,
          bloomLevel: c.bloomLevel,
          attainmentThreshold: Number(c.threshold || 50),
          order: i + 1,
          version: c.version || null,
        };
        await HOD_API.clos.createCLOForCourse(resolvedCourseId, payload);
      }

      const fresh = await HOD_API.clos.getCLOs(resolvedCourseId, user?.token);
      savedClos = fresh.data;
      clearClosDraft();
    }

    return { resolvedCourseId, savedClos };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { resolvedCourseId, savedClos } = await ensureCourseAndClosExist();

        // Load course info
        const courseRes = await HOD_API.courses.getCourseById(resolvedCourseId);
        setCourseInfo(courseRes?.data);

        setClos(savedClos);

        // load POs & PSOs
        const poRes = await HOD_API.popso.getPOPSO(resolvedCourseId, user?.token);
        setPos(poRes?.data?.pos || []);
        setPsos(poRes?.data?.psos || []);

        // build matrix
        const init = {};
        savedClos.forEach((c) => {
          init[c.id] = {};
          [...(poRes?.data?.pos || []), ...(poRes?.data?.psos || [])].forEach(
            (o) => (init[c.id][o.id] = 0)
          );
        });

        setMatrix(init);
      } catch (e) {
        console.error(e);
        alert("Could not initialize mapping. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user?.token]);

  const updateCell = (cloKey, outcomeId, value) => {
    if (value < 0 || value > 3) return;
    setMatrix((prev) => ({
      ...prev,
      [cloKey]: { ...prev[cloKey], [outcomeId]: value },
    }));
  };

  const quickSetRow = (cloKey, value) => {
    const newRow = {};
    [...pos, ...psos].forEach(o => {
      newRow[o.id] = value;
    });
    setMatrix(prev => ({
      ...prev,
      [cloKey]: newRow
    }));
  };

  const quickSetColumn = (outcomeId, value) => {
    const newMatrix = { ...matrix };
    clos.forEach(c => {
      newMatrix[c.id] = {
        ...newMatrix[c.id],
        [outcomeId]: value
      };
    });
    setMatrix(newMatrix);
  };

  const submit = async () => {
    setSaving(true);
    const poMappings = [];
    const psoMappings = [];

    clos.forEach((c) => {
      pos.forEach((p) =>
        poMappings.push({
          cloId: c.id,
          poId: p.id,
          level: matrix[c.id][p.id],
        })
      );

      psos.forEach((pso) =>
        psoMappings.push({
          cloId: c.id,
          psoId: pso.id,
          level: matrix[c.id][pso.id],
        })
      );
    });

    try {
      await HOD_API.map.saveMappings(
        courseId,
        { poMappings, psoMappings },
        user?.token
      );
      alert("Mapping saved successfully!");
      navigate(-1);
    } catch (error) {
      alert("Error saving mappings. Please try again.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getCoverageStats = () => {
    let totalCells = 0;
    let filledCells = 0;
    let totalStrength = 0;

    clos.forEach(c => {
      [...pos, ...psos].forEach(o => {
        totalCells++;
        const level = matrix[c.id]?.[o.id] || 0;
        if (level > 0) {
          filledCells++;
          totalStrength += level;
        }
      });
    });

    const coveragePercentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0;
    const avgStrength = filledCells > 0 ? (totalStrength / filledCells).toFixed(1) : 0;

    return { coveragePercentage, avgStrength, filledCells, totalCells };
  };

  const stats = getCoverageStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-3 border-blue-600 mb-6"></div>
          <p className="text-gray-600 text-lg">Loading mapping matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 md:p-8">
      <div className="max-w-[2000px] mx-auto">
        {/* Header - Increased size */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg font-medium"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to CLOs</span>
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiGrid className="text-3xl" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">CLO-PO/PSO Mapping Matrix</h1>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  {courseInfo && (
                    <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                      <FiBook className="text-xl" />
                      <span className="font-semibold">{courseInfo.code} - {courseInfo.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                    <FiTarget className="text-xl" />
                    <span>{clos.length} CLOs × {pos.length + psos.length} Outcomes</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setExpandedView(!expandedView)}
                  className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-lg"
                >
                  {expandedView ? <FiMinimize2 className="text-xl" /> : <FiMaximize2 className="text-xl" />}
                  {expandedView ? "Compact View" : "Expand View"}
                </button>
                <button
                  onClick={() => setShowLevelInfo(!showLevelInfo)}
                  className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-lg"
                >
                  <FiInfo className="text-xl" />
                  {showLevelInfo ? "Hide Guide" : "Show Guide"}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar - Increased size */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
              <div className="text-lg text-gray-600 mb-2">Mapping Coverage</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.coveragePercentage}%
              </div>
              <div className="h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  style={{ width: `${stats.coveragePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
              <div className="text-lg text-gray-600 mb-2">Average Strength</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.avgStrength}/3
              </div>
              <div className="text-base text-gray-500 mt-2">
                {stats.filledCells} of {stats.totalCells} cells filled
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
              <div className="text-lg text-gray-600 mb-2">Program Outcomes</div>
              <div className="text-3xl font-bold text-gray-900">
                {pos.length} POs
              </div>
              <div className="text-base text-gray-500 mt-2">
                {psos.length} PSOs
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
              <div className="text-lg text-gray-600 mb-2">Course CLOs</div>
              <div className="text-3xl font-bold text-gray-900">
                {clos.length}
              </div>
              <div className="text-base text-gray-500 mt-2">
                Learning outcomes
              </div>
            </div>
          </div>
        </div>

        {/* Mapping Level Guide - Increased size */}
        {showLevelInfo && (
          <div className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-7 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-xl flex items-center gap-3">
                <FiInfo className="text-blue-600 text-2xl" />
                Mapping Levels Guide
              </h3>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-300 rounded-xl text-base"
              >
                <option value="all">Show All Levels</option>
                <option value="0">Show None (0)</option>
                <option value="1">Show Low (1)</option>
                <option value="2">Show Medium (2)</option>
                <option value="3">Show High (3)</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {mappingLevels.map(level => (
                <div key={level.value} className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${level.color}`}>
                    {level.value}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{level.label}</div>
                    <div className="text-base text-gray-600">{level.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Mapping Matrix - Increased size */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="py-5 px-6 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300 min-w-[300px] sticky left-0 bg-inherit z-20">
                    <div className="flex items-center gap-3">
                      <FiTarget className="text-gray-600 text-xl" />
                      Course Learning Outcomes (CLOs)
                    </div>
                  </th>
                  
                  {/* POs Header - Increased size */}
                  {pos.length > 0 && (
                    <th colSpan={pos.length} className="py-4 px-3 text-center border-b-2 border-gray-300 bg-gradient-to-r from-blue-50 to-blue-100/50">
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-bold text-blue-800 text-xl">Program Outcomes (POs)</span>
                        <span className="text-lg font-normal text-blue-700">({pos.length})</span>
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        {mappingLevels.map(level => (
                          <button
                            key={`po-${level.value}`}
                            onClick={() => pos.forEach(p => quickSetColumn(p.id, level.value))}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${level.color} hover:opacity-90 transition-opacity`}
                            title={`Set all POs to ${level.label}`}
                          >
                            Set All POs
                          </button>
                        ))}
                      </div>
                    </th>
                  )}
                  
                  {/* PSOs Header - Increased size */}
                  {psos.length > 0 && (
                    <th colSpan={psos.length} className="py-4 px-3 text-center border-b-2 border-gray-300 bg-gradient-to-r from-green-50 to-green-100/50">
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-bold text-green-800 text-xl">Program Specific Outcomes (PSOs)</span>
                        <span className="text-lg font-normal text-green-700">({psos.length})</span>
                      </div>
                      <div className="flex justify-center gap-2 mt-2">
                        {mappingLevels.map(level => (
                          <button
                            key={`pso-${level.value}`}
                            onClick={() => psos.forEach(p => quickSetColumn(p.id, level.value))}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${level.color} hover:opacity-90 transition-opacity`}
                            title={`Set all PSOs to ${level.label}`}
                          >
                            Set All PSOs
                          </button>
                        ))}
                      </div>
                    </th>
                  )}
                </tr>
                
                {/* Outcome Codes Row - Increased size */}
                <tr className="bg-gray-50">
                  <th className="py-4 px-6 text-base font-semibold text-gray-700 border-b-2 border-gray-300 sticky left-0 bg-inherit z-20">
                    CLO Code / Description
                  </th>
                  {[...pos, ...psos].map(o => (
                    <th key={o.id} className={`py-4 px-3 text-center border-b-2 border-gray-300 ${
                      pos.includes(o) ? 'bg-blue-50/30' : 'bg-green-50/30'
                    }`}>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-lg">{o.code}</span>
                        <div className="flex gap-2 mt-2">
                          {mappingLevels.map(level => (
                            <button
                              key={`${o.id}-${level.value}`}
                              onClick={() => quickSetColumn(o.id, level.value)}
                              className={`w-6 h-6 text-xs rounded-lg font-bold ${level.color} hover:scale-110 transition-transform`}
                              title={`Set column to ${level.label}`}
                            >
                              {level.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {clos.map((c) => {
                  const cloKey = c.id || c.cloCode;
                  const shouldShowRow = filterLevel === "all" || 
                    [...pos, ...psos].some(o => matrix[cloKey]?.[o.id] == filterLevel);

                  if (!shouldShowRow) return null;

                  return (
                    <tr key={cloKey} className="border-b border-gray-200 hover:bg-gray-50/30 transition-colors">
                      <td className="py-6 px-6 sticky left-0 bg-white z-20 min-w-[300px]">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-blue-800 text-lg">{c.cloCode || c.code}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-lg mb-2">{c.cloCode || c.code}</div>
                            <div className="text-base text-gray-600 line-clamp-2">{c.description || c.statement}</div>
                            <div className="flex gap-2 mt-3">
                              {/* Replaced "Set Row" buttons with number buttons 0,1,2,3 */}
                              {mappingLevels.map(level => (
                                <button
                                  key={`row-${cloKey}-${level.value}`}
                                  onClick={() => quickSetRow(cloKey, level.value)}
                                  className={`w-8 h-8 rounded-lg font-bold text-lg ${level.color} hover:scale-110 transition-transform flex items-center justify-center`}
                                  title={`Set entire row to ${level.label}`}
                                >
                                  {level.value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {[...pos, ...psos].map(o => {
                        const level = matrix[cloKey]?.[o.id] || 0;
                        const levelConfig = mappingLevels.find(l => l.value === level) || mappingLevels[0];
                        const isHighlighted = filterLevel !== "all" && level == filterLevel;
                        
                        return (
                          <td key={`${cloKey}-${o.id}`} className={`py-5 px-3 text-center ${
                            pos.includes(o) ? 'bg-blue-50/10' : 'bg-green-50/10'
                          } ${isHighlighted ? 'ring-3 ring-blue-500 ring-inset' : ''}`}>
                            <div className="flex flex-col items-center">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="3"
                                  value={level}
                                  onChange={(e) => updateCell(cloKey, o.id, Number(e.target.value))}
                                  className={`w-14 h-14 text-center text-xl font-bold rounded-2xl border-3 focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer ${levelConfig.color}`}
                                />
                                {expandedView && level > 0 && (
                                  <div className="mt-2 text-sm text-gray-600 font-medium">
                                    {levelConfig.label}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons - Increased size */}
        <div className="mt-10 flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              <FiArrowLeft className="text-xl" />
              Back to CLOs
            </button>
            <button
              onClick={() => {
                // Reset all mappings to 0
                const resetMatrix = { ...matrix };
                Object.keys(resetMatrix).forEach(cloKey => {
                  Object.keys(resetMatrix[cloKey]).forEach(outcomeId => {
                    resetMatrix[cloKey][outcomeId] = 0;
                  });
                });
                setMatrix(resetMatrix);
              }}
              className="flex items-center gap-3 px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
            >
              <FiRefreshCw className="text-xl" />
              Reset All
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={submit}
              disabled={saving}
              className="flex items-center justify-center gap-4 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed font-bold text-xl"
            >
              {saving ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="text-2xl" />
                  <span>Save All Mappings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CLOMapping;