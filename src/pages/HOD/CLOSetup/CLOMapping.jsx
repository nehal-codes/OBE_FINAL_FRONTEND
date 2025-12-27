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
const CLOMapping = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clos, setClos] = useState([]);
  const [pos, setPos] = useState([]);
  const [psos, setPsos] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  const ensureCourseAndClosExist = async () => {
    let resolvedCourseId = courseId;
    let savedClos = [];

    const courseDraft = getCourseDraft();
    let closDraft = getClosDraft();

    // ---------------------------------
    // 1️⃣ If course is still a draft → create it now
    // ---------------------------------
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

    // ---------------------------------
    // 2️⃣ Ensure CLOs exist
    // ---------------------------------
    // try DB first
    const dbClos = await HOD_API.clos.getAll(resolvedCourseId, user?.token);

    if (dbClos?.data?.length > 0) {
      savedClos = dbClos.data;
    } else {
      // Create from draft if not in DB
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

      const fresh = await HOD_API.clos.getAll(resolvedCourseId, user?.token);
      savedClos = fresh.data;

      clearClosDraft();
    }

    return { resolvedCourseId, savedClos };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { resolvedCourseId, savedClos } =
          await ensureCourseAndClosExist();

        setClos(savedClos);

        // load POs & PSOs for COURSE PROGRAM
        const poRes = await HOD_API.popso.getPOPSO(
          resolvedCourseId,
          user?.token
        );

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

  // -------------------------
  // UPDATE A MATRIX CELL
  // -------------------------
  const updateCell = (cloKey, outcomeId, value) => {
    if (value < 0 || value > 3) return;
    setMatrix((prev) => ({
      ...prev,
      [cloKey]: { ...prev[cloKey], [outcomeId]: value },
    }));
  };

  // -------------------------
  // SUBMIT MAPPINGS
  // -------------------------
  const submit = async () => {
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

    await HOD_API.map.saveMappings(
      courseId,
      { poMappings, psoMappings },
      user?.token
    );

    alert("Saved successfully");
    navigate(-1);
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 font-semibold">CLO – PO/PSO Mapping</h1>

      <table className="border w-full">
        <thead>
          <tr>
            <th className="border p-2">CLO</th>

            {pos.map((p) => (
              <th key={p.id} className="border p-2">
                {p.code}
              </th>
            ))}

            {psos.map((p) => (
              <th key={p.id} className="border p-2">
                {p.code}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {clos.map((c) => {
            const cloKey = c.id || c.cloCode;

            return (
              <tr key={cloKey}>
                <td className="border p-2">{c.cloCode || c.code}</td>

                {[...pos, ...psos].map((o) => (
                  <td key={o.id} className="border p-1 text-center">
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={matrix[cloKey][o.id]}
                      onChange={(e) =>
                        updateCell(cloKey, o.id, Number(e.target.value))
                      }
                      className="w-12 text-center border"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 border rounded"
        >
          Back
        </button>

        <button
          disabled={loading}
          onClick={submit}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CLOMapping;
