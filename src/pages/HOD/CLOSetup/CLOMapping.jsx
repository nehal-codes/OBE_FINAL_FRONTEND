import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FiRefreshCw,
} from "react-icons/fi";

const CLOMapping = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clos, setClos] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [actualCourseId, setActualCourseId] = useState(courseId);

  const mappingLevels = [
    {
      value: 0,
      label: "None",
      color: "bg-gray-100 text-gray-600 border-gray-300",
    },
    {
      value: 1,
      label: "Low",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      value: 2,
      label: "Medium",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      value: 3,
      label: "High",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  const ensureCourseAndClosExist = async () => {
    let resolvedCourseId = courseId;
    let savedClos = [];

    const courseDraft = getCourseDraft();
    let closDraft = getClosDraft();

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

        const courseRes = await HOD_API.courses.getCourseById(resolvedCourseId);
        setCourseInfo(courseRes?.data);
        setClos(savedClos);

        const poRes = await HOD_API.popso.getPOPSO(resolvedCourseId, user?.token);
        setPos(poRes?.data?.pos || []);
        setPsos(poRes?.data?.psos || []);

        const init = {};
        savedClos.forEach((c) => {
          init[c.id] = {};
          [...(poRes?.data?.pos || []), ...(poRes?.data?.psos || [])].forEach(
            (o) => (init[c.id][o.id] = 0)
          );
        });

        try {
          const mapRes = await HOD_API.map.getMappings(resolvedCourseId, user?.token);
          const resp = mapRes?.data || {};

          let poMappings = resp.cloPoMappings || resp.clo_po_mappings || resp.cloPo || resp.poMappings || resp.pos || [];
          let psoMappings = resp.cloPsoMappings || resp.clo_pso_mappings || resp.cloPso || resp.psoMappings || resp.psos || [];

          if (Array.isArray(resp) && poMappings.length === 0 && psoMappings.length === 0) {
            resp.forEach((m) => {
              if (m.poId || m.po_id || m.po || m.outcomeType === "po") poMappings.push(m);
              else if (m.psoId || m.pso_id || m.pso || m.outcomeType === "pso") psoMappings.push(m);
            });
          } else if (!poMappings.length && !psoMappings.length && Array.isArray(resp.mappings)) {
            resp.mappings.forEach((m) => {
              if (m.type === "po" || m.outcomeType === "po" || m.poId || m.po_id || m.po) poMappings.push(m);
              if (m.type === "pso" || m.outcomeType === "pso" || m.psoId || m.pso_id || m.pso) psoMappings.push(m);
            });
          }

          const normalizeLevel = (m) => {
            const lvl = m.level ?? m.score ?? m.value ?? m.weight ?? m.levelValue ?? 0;
            return Number(lvl) || 0;
          };
          const getCloId = (m) => m.cloId || m.clo_id || m.clo;
          const getPoId = (m) => m.poId || m.po_id || m.po || m.outcomeId;
          const getPsoId = (m) => m.psoId || m.pso_id || m.pso || m.outcomeId;

          poMappings.forEach((m) => {
            const cloId = getCloId(m);
            const poId = getPoId(m);
            const level = normalizeLevel(m);
            if (cloId && poId && init[cloId] && Object.prototype.hasOwnProperty.call(init[cloId], poId)) {
              init[cloId][poId] = level;
            }
          });

          psoMappings.forEach((m) => {
            const cloId = getCloId(m);
            const psoId = getPsoId(m);
            const level = normalizeLevel(m);
            if (cloId && psoId && init[cloId] && Object.prototype.hasOwnProperty.call(init[cloId], psoId)) {
              init[cloId][psoId] = level;
            }
          });
        } catch (err) {
          console.warn("Could not fetch existing mappings:", err);
        }

        setMatrix(init);
        setActualCourseId(resolvedCourseId);
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
      await HOD_API.map.saveMappings(actualCourseId, { poMappings, psoMappings }, user?.token);
      alert("Mapping saved successfully!");
      navigate(-1);
    } catch (error) {
      alert("Error saving mappings. Please try again.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading mapping matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white px-4 py-2 rounded-lg transition-colors mb-6"
          >
            <FiArrowLeft />
            Back
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg"></div>
                  <h1 className="text-2xl font-bold text-gray-900">CLO-PO/PSO Mapping Matrix</h1>
                </div>
               {courseInfo && (
  <div className="bg-gray-50 px-4 py-3 rounded-lg">
<div className="text-base text-gray-600 font-semibold">
      {courseInfo.code}
    </div>
    <div className="text-lg font-semibold text-gray-900">
      {courseInfo.name}
    </div>
  </div>
)}

              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-4 text-left font-semibold text-gray-700 border-b border-gray-300 min-w-[300px] sticky left-0 bg-inherit z-20">
                    COURSE LEARNING OUTCOMES (CLOs)
                  </th>
                  {pos.length > 0 && (
                    <th colSpan={pos.length} className="py-3 px-2 text-center border-b border-gray-300 bg-blue-50">
                      <div className="font-semibold text-blue-800">Program Outcomes (POs)</div>
                    </th>
                  )}
                  {psos.length > 0 && (
                    <th colSpan={psos.length} className="py-3 px-2 text-center border-b border-gray-300 bg-green-50">
                      <div className="font-semibold text-green-800">Program Specific Outcomes (PSOs)</div>
                    </th>
                  )}
                </tr>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 font-medium text-gray-700 border-b border-gray-300 sticky left-0 bg-inherit z-20">
                    CLO Code / Description
                  </th>
                  {[...pos, ...psos].map((o) => (
                    <th
                      key={o.id}
                      className={`py-3 px-2 text-center border-b border-gray-300 ${
                        pos.includes(o) ? "bg-blue-50/50" : "bg-green-50/50"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900">{o.code}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clos.map((c) => {
                  const cloKey = c.id || c.cloCode;
                  return (
                    <tr key={cloKey} className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="py-4 px-4 sticky left-0 bg-white z-20 min-w-[300px]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-blue-700">{c.cloCode || c.code}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{c.cloCode || c.code}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">{c.description || c.statement}</div>
                          </div>
                        </div>
                      </td>
                      {[...pos, ...psos].map((o) => {
                        const level = matrix[cloKey]?.[o.id] || 0;
                        const levelConfig = mappingLevels.find((l) => l.value === level) || mappingLevels[0];
                        return (
                          <td key={`${cloKey}-${o.id}`} className="py-4 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="3"
                              value={level}
                              onChange={(e) => updateCell(cloKey, o.id, Number(e.target.value))}
                              className={`w-10 h-10 text-center font-semibold rounded-lg border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer ${levelConfig.color}`}
                            />
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

        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FiArrowLeft />
              Back to CLOs
            </button>
            <button
              onClick={() => {
                const resetMatrix = { ...matrix };
                Object.keys(resetMatrix).forEach((cloKey) => {
                  Object.keys(resetMatrix[cloKey]).forEach((outcomeId) => {
                    resetMatrix[cloKey][outcomeId] = 0;
                  });
                });
                setMatrix(resetMatrix);
              }}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <FiRefreshCw />
              Reset All
            </button>
          </div>
          <div>
            <button
              onClick={submit}
              disabled={saving}
              className="flex items-center justify-center gap-3 px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave />
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