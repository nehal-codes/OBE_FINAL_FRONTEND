import React, { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  ComposedChart,
  Area
} from "recharts";
import {
  Download,
  Filter,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Eye,
  Layers,
  Grid,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
  Info,
  FileText,
  Award,
  GraduationCap,
  Radar as RadarIcon,
  Percent
} from "lucide-react";
import { toast } from "react-hot-toast";
import HOD_API from "../../apis/HOD";

// More distinguishable color palette
const COURSE_COLORS = [
  "#FF6B6B", // Coral Red
  "#4ECDC4", // Medium Turquoise
  "#FFB347", // Orange
  "#A06AB4", // Purple
  "#5D9B9B", // Cadet Blue
  "#F4A2A2", // Light Pink
  "#6A4C9C", // Royal Purple
  "#3B9E6B", // Sea Green
  "#E67E22", // Pumpkin
  "#3498DB", // Bright Blue
  "#E84342", // Bright Red
  "#27AE60", // Emerald
  "#F39C12", // Orange Yellow
  "#8E44AD", // Wisteria
  "#16A085", // Green Sea
  "#D35400", // Pumpkin Orange
  "#2C3E50", // Dark Blue
  "#C0392B", // Crimson
  "#7F8C8D", // Gray
  "#2980B9"  // Ocean Blue
];

const COLORS = {
  PO: ["#3B82F6", "#60A5FA", "#93C5FD", "#2563EB", "#1D4ED8"],
  PSO: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#7C3AED", "#6D28D9"],
  BLOOM: {
    REMEMBER: "#EF4444",
    UNDERSTAND: "#F59E0B",
    APPLY: "#10B981",
    ANALYZE: "#3B82F6",
    EVALUATE: "#8B5CF6",
    CREATE: "#EC4899"
  }
};

const ProgramReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [programs, setPrograms] = useState([]);
  const [viewMode, setViewMode] = useState("radar");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPODetails, setShowPODetails] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoursesForRadar, setSelectedCoursesForRadar] = useState([]);

  useEffect(() => {
    console.log("Component mounted");
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      console.log("Selected program changed to:", selectedProgram);
      fetchReportData();
    } else {
      console.log("No program selected yet");
    }
  }, [selectedProgram, dateRange]);

  const fetchPrograms = async () => {
    console.log("Fetching programs...");
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token ? "Token exists" : "No token found");
      
      const response = await HOD_API.programmes.getAll(token);
      console.log("Programs response:", response);
      
      if (response.data) {
        console.log("Programs data:", response.data);
        setPrograms(response.data);
        if (response.data.length > 0) {
          console.log("Setting selected program to:", response.data[0].id);
          setSelectedProgram(response.data[0].id);
        } else {
          console.log("No programs found");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      toast.error("Failed to fetch programs");
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (!selectedProgram) {
      console.log("No program selected, skipping report fetch");
      return;
    }
    
    console.log("Fetching report data for program:", selectedProgram);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token ? "Token exists" : "No token found");
      
      const response = await HOD_API.reports.getProgramReport(selectedProgram, token);
      console.log("Report response:", response);
      
      if (response.data.success) {
        console.log("Report data:", response.data.data);
        setReportData(response.data.data);
        // Auto-select first 3 courses for radar
        if (response.data.data.courses?.length > 0) {
          setSelectedCoursesForRadar(response.data.data.courses.slice(0, 3).map(c => c.id));
        }
      } else {
        console.log("Report fetch unsuccessful:", response.data);
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    console.log("Fetching course details for:", courseId);
    try {
      const token = localStorage.getItem("token");
      const response = await HOD_API.reports.getCourseContributions(courseId, token);
      console.log("Course details response:", response);
      if (response.data.success) {
        setCourseDetails(response.data.data);
        setShowCourseModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      toast.error("Failed to fetch course details");
    }
  };

  const getContributionColor = (value) => {
    if (value >= 2.5) return "bg-green-500";
    if (value >= 1.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getContributionBadge = (value) => {
    if (value >= 2.5) return "bg-green-100 text-green-800 border-green-200";
    if (value >= 1.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getContributionIcon = (value) => {
    if (value >= 2.5) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (value >= 1.5) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <ArrowDownRight className="w-4 h-4 text-red-600" />;
  };

  // Format value as percentage (0-3 scale to percentage)
  const formatAsPercentage = (value) => {
    const percentage = (value / 3) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ["Course Code", "Course Name", "Semester", ...reportData.pos.map(p => p.code), ...reportData.psos.map(p => p.code)];
    
    const rows = reportData.radarData.map(course => {
      return [
        course.courseCode,
        course.courseName,
        course.semester,
        ...reportData.pos.map(p => course[p.code] || 0),
        ...reportData.psos.map(p => course[p.code] || 0)
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `program_report_${reportData.program?.code}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getBloomDistribution = () => {
    if (!reportData?.cloDetails) return [];
    
    const distribution = {};
    reportData.cloDetails.forEach(clo => {
      distribution[clo.bloomLevel] = (distribution[clo.bloomLevel] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: COLORS.BLOOM[name] || "#6B7280",
      percentage: ((value / reportData.cloDetails.length) * 100).toFixed(1)
    }));
  };

  const getPOContributions = () => {
    if (!reportData?.pos || !reportData?.courses) return [];
    
    return reportData.pos.map(po => {
      let total = 0;
      let count = 0;
      
      reportData.courses.forEach(course => {
        const contribution = reportData.coursePOContributions[course.id]?.[po.id];
        if (contribution?.averageLevel > 0) {
          total += contribution.averageLevel;
          count++;
        }
      });
      
      const average = count > 0 ? (total / count) : 0;
      return {
        code: po.code,
        name: po.statement?.substring(0, 30) + "...",
        average: average.toFixed(2),
        percentage: formatAsPercentage(average),
        count
      };
    });
  };

  // Transform radar data for recharts format
  const getRadarChartData = () => {
    if (!reportData?.pos || !reportData?.psos || !reportData?.courses) return [];
    
    // Create an array of all outcomes (POs + PSOs)
    const allOutcomes = [
      ...reportData.pos.map(po => ({ id: po.id, code: po.code, type: 'PO' })),
      ...reportData.psos.map(pso => ({ id: pso.id, code: pso.code, type: 'PSO' }))
    ];
    
    // Create data for radar chart - each object is an outcome with values from selected courses
    const radarData = allOutcomes.map(outcome => {
      const dataPoint = {
        subject: outcome.code,
        fullName: outcome.code,
        type: outcome.type
      };
      
      // Add values for each selected course
      selectedCoursesForRadar.forEach(courseId => {
        const course = reportData.courses.find(c => c.id === courseId);
        if (course) {
          let value = 0;
          if (outcome.type === 'PO') {
            value = reportData.coursePOContributions[courseId]?.[outcome.id]?.averageLevel || 0;
          } else {
            value = reportData.coursePSOContributions[courseId]?.[outcome.id]?.averageLevel || 0;
          }
          // Use course name as the key instead of course code
          dataPoint[course.name] = value;
        }
      });
      
      return dataPoint;
    });
    
    return radarData;
  };

  // Toggle course selection for radar chart
  const toggleCourseForRadar = (courseId) => {
    setSelectedCoursesForRadar(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        if (prev.length < 6) { // Limit to 6 courses max for readability
          return [...prev, courseId];
        } else {
          toast.error("You can select up to 6 courses for comparison");
          return prev;
        }
      }
    });
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = reportData?.courses?.find(c => c.id === courseId);
    return course ? course.name : '';
  };

  // Get course code by ID
  const getCourseCode = (courseId) => {
    const course = reportData?.courses?.find(c => c.id === courseId);
    return course ? course.code : '';
  };

  // ============ FIXED: Calculate outcome coverage percentage for a course ============
  // Calculate outcome coverage percentage for a course - ONLY COUNT MAPPINGS WITH LEVEL > 0
const getOutcomeCoveragePercentage = (courseId) => {
  if (!reportData || !courseId) return 0;
  
  // Track unique outcomes covered (only those with level > 0)
  const uniqueOutcomesCovered = new Set();
  
  // Get all CLO details for this specific course from cloDetails array
  const courseCloDetails = reportData.cloDetails?.filter(clo => clo.courseId === courseId) || [];
  
  // If no CLO details found, return 0
  if (courseCloDetails.length === 0) return 0;
  
  // Iterate through all CLOs for this course
  courseCloDetails.forEach(clo => {
    // Add PO codes that this CLO maps to with level > 0
    if (clo.poMappings && clo.poMappings.length > 0) {
      clo.poMappings.forEach(m => {
        if (m.poCode && m.level > 0) {  // ONLY count if level > 0
          uniqueOutcomesCovered.add(`PO-${m.poCode}`);
        }
      });
    }
    
    // Add PSO codes that this CLO maps to with level > 0
    if (clo.psoMappings && clo.psoMappings.length > 0) {
      clo.psoMappings.forEach(m => {
        if (m.psoCode && m.level > 0) {  // ONLY count if level > 0
          uniqueOutcomesCovered.add(`PSO-${m.psoCode}`);
        }
      });
    }
  });
  
  // Total possible outcomes (POs + PSOs)
  const totalOutcomes = (reportData.pos?.length || 0) + (reportData.psos?.length || 0);
  
  // Calculate percentage
  const percentage = totalOutcomes > 0 
    ? ((uniqueOutcomesCovered.size / totalOutcomes) * 100).toFixed(0)
    : 0;
  
  return percentage;
};
  // ============================================================================

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="mt-4 text-gray-600 font-medium">Loading report data...</div>
          <div className="mt-2 text-sm text-gray-400">
            {selectedProgram ? "Fetching program data..." : "Initializing..."}
          </div>
        </div>
      </div>
    );
  }

  // Show message if no programs
  if (programs.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No Programs Found</h2>
          <p className="mt-2 text-gray-600">Please contact your administrator to add programs.</p>
        </div>
      </div>
    );
  }

  // Show message if no report data
  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No Data Available</h2>
          <p className="mt-2 text-gray-600">No report data found for the selected program.</p>
          <button
            onClick={fetchReportData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const radarChartData = getRadarChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Program Outcome Report</h1>
                  <p className="text-gray-600 mt-1">
                    Analyze course contributions to Program Outcomes (POs) and Program Specific Outcomes (PSOs)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-medium"
              >
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 font-medium"
              >
                <option value="all">All Time</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>

              <button
                onClick={fetchReportData}
                className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards with Percentages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.courses?.length || 0}</p>
                <p className="text-sm text-green-600 mt-2">
                  {reportData.courses?.length > 0 
                    ? ((reportData.courses?.filter(c => c.clos?.length > 0).length / reportData.courses?.length) * 100).toFixed(0) 
                    : 0}% with CLOs
                </p>
              </div>
              <div className="p-4 bg-blue-100 rounded-2xl">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Program Outcomes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.pos?.length || 0}</p>
                <p className="text-sm text-blue-600 mt-2">Active POs</p>
              </div>
              <div className="p-4 bg-green-100 rounded-2xl">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Program Specific Outcomes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.psos?.length || 0}</p>
                <p className="text-sm text-purple-600 mt-2">Active PSOs</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-2xl">
                <Layers className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total CLOs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.cloDetails?.length || 0}</p>
                <p className="text-sm text-orange-600 mt-2">
                  {reportData.cloDetails?.length > 0
                    ? ((reportData.cloDetails?.filter(c => 
                        // Check if CLO has any PO mappings with level > 0 OR any PSO mappings with level > 0
                        (c.poMappings?.some(m => m.level > 0) || c.psoMappings?.some(m => m.level > 0))
                      ).length / reportData.cloDetails?.length) * 100).toFixed(0)
                    : 0}% Mapped
                </p>
              </div>
              <div className="p-4 bg-orange-100 rounded-2xl">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl p-2 shadow-lg inline-flex">
          <button
            onClick={() => setViewMode("radar")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "radar" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <RadarIcon className="w-5 h-5" />
            Radar Chart
          </button>
          <button
            onClick={() => setViewMode("single-course")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "single-course" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Single Course View
          </button>
          <button
            onClick={() => setViewMode("heatmap")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "heatmap" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="w-5 h-5" />
            Heat Map
          </button>
          <button
            onClick={() => setViewMode("analytics")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              viewMode === "analytics" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Radar Chart View - Course Comparison - WITHOUT COURSE CODES AND MARKERS */}
          {viewMode === "radar" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                Course Comparison - Radar Chart
              </h2>
              
              {/* Course Selection - Show course names */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Courses to Compare (max 6)
                </label>
                <div className="flex flex-wrap gap-2">
                  {reportData.courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => toggleCourseForRadar(course.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedCoursesForRadar.includes(course.id)
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={course.name}
                    >
                      {course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name}
                    </button>
                  ))}
                </div>
                {selectedCoursesForRadar.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Please select at least one course to view the radar chart
                  </p>
                )}
              </div>

              {selectedCoursesForRadar.length > 0 && radarChartData.length > 0 ? (
                <div className="h-[600px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 3]} 
                        tick={{ fill: '#4B5563' }}
                        tickCount={4}
                        tickFormatter={(value) => `${((value / 3) * 100).toFixed(0)}%`}
                      />
                      
                      {/* Create a radar for each selected course - using course name as key */}
                      {selectedCoursesForRadar.map((courseId, index) => {
                        const course = reportData.courses.find(c => c.id === courseId);
                        if (!course) return null;
                        
                        return (
                          <Radar
                            key={courseId}
                            name={course.name} // Use course name only, no code
                            dataKey={course.name} // Use course name as dataKey
                            stroke={COURSE_COLORS[index % COURSE_COLORS.length]}
                            fill={COURSE_COLORS[index % COURSE_COLORS.length]}
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        );
                      })}
                      
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '12px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }}
                        formatter={(value, name, props) => {
                          return [
                            <div className="flex flex-col">
                              <span className="font-medium">Level: {value.toFixed(2)} / 3</span>
                              <span className="text-xs text-gray-500">{formatAsPercentage(value)} attainment</span>
                            </div>,
                            name
                          ];
                        }}
                        labelFormatter={(label) => `Outcome: ${label}`}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px'
                        }}
                        formatter={(value) => {
                          // Truncate long course names in legend
                          return value.length > 30 ? value.substring(0, 30) + '...' : value;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  {selectedCoursesForRadar.length === 0 
                    ? "Select courses above to view radar chart" 
                    : "No radar chart data available"}
                </div>
              )}

              {/* Legend/Color Guide with Course Names Only */}
              {selectedCoursesForRadar.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Color Guide:</p>
                  <div className="flex flex-wrap gap-4">
                    {selectedCoursesForRadar.map((courseId, index) => {
                      const course = reportData.courses.find(c => c.id === courseId);
                      return (
                        <div key={courseId} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COURSE_COLORS[index % COURSE_COLORS.length] }}></div>
                          <span className="text-sm text-gray-600">{course?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Course View - With Percentages */}
          {viewMode === "single-course" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                Course Contribution to POs/PSOs
              </h2>
              
              {/* Course Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Course to View</label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => {
                    const course = reportData.courses.find(c => c.id === e.target.value);
                    setSelectedCourse(e.target.value);
                    if (course) fetchCourseDetails(course.id);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-md"
                >
                  <option value="">Select a course...</option>
                  {reportData.courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourse && reportData.coursePOContributions[selectedCourse] ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PO Contributions with Percentages */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">PO Contributions</h3>
                    <div className="space-y-4">
                      {reportData.pos.map(po => {
                        const contribution = reportData.coursePOContributions[selectedCourse]?.[po.id];
                        const value = contribution?.averageLevel || 0;
                        const percentage = (value / 3) * 100;
                        return (
                          <div key={po.id} className="flex items-center gap-4">
                            <div className="w-16 text-sm font-medium text-gray-600">{po.code}</div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full ${
                                    value >= 2.5 ? 'bg-green-500' :
                                    value >= 1.5 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-24 text-right">
                              <span className="font-semibold">{value.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PSO Contributions with Percentages */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-4">PSO Contributions</h3>
                    <div className="space-y-4">
                      {reportData.psos.map(pso => {
                        const contribution = reportData.coursePSOContributions[selectedCourse]?.[pso.id];
                        const value = contribution?.averageLevel || 0;
                        const percentage = (value / 3) * 100;
                        return (
                          <div key={pso.id} className="flex items-center gap-4">
                            <div className="w-16 text-sm font-medium text-gray-600">{pso.code}</div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    value >= 2.5 ? 'bg-purple-500' :
                                    value >= 1.5 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="w-24 text-right">
                              <span className="font-semibold">{value.toFixed(1)}</span>
                              <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CLO Details Table */}
                  <div className="lg:col-span-2 mt-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">CLO Details</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CLO</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bloom Level</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Mappings</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PSO Mappings</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.courses
                            .find(c => c.id === selectedCourse)
                            ?.clos?.map(clo => (
                              <tr key={clo.id}>
                                <td className="px-4 py-2 whitespace-nowrap font-medium">{clo.code}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    clo.bloomLevel === 'REMEMBER' ? 'bg-red-100 text-red-800' :
                                    clo.bloomLevel === 'UNDERSTAND' ? 'bg-yellow-100 text-yellow-800' :
                                    clo.bloomLevel === 'APPLY' ? 'bg-green-100 text-green-800' :
                                    clo.bloomLevel === 'ANALYZE' ? 'bg-blue-100 text-blue-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {clo.bloomLevel}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {clo.poMappings?.map(m => (
                                      <span key={m.poId} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                        {m.po?.code}: {m.level} ({((m.level / 3) * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {clo.psoMappings?.map(m => (
                                      <span key={m.psoId} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                        {m.pso?.code}: {m.level} ({((m.level / 3) * 100).toFixed(0)}%)
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Select a course to view its contribution details
                </div>
              )}
            </div>
          )}

          {/* Heat Map View - With Percentages in Tooltips */}
          {viewMode === "heatmap" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                Course-PO/PSO Contribution Matrix
              </h2>
              
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {reportData.heatmapData?.courses?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        {reportData.pos?.map(po => (
                          <th 
                            key={po.id} 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600"
                            onClick={() => {
                              setSelectedPO(po);
                              setShowPODetails(true);
                            }}
                          >
                            {po.code}
                          </th>
                        ))}
                        {reportData.psos?.map(pso => (
                          <th 
                            key={pso.id} 
                            className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider"
                          >
                            {pso.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.heatmapData.courses
                        .filter(course => 
                          course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(course => (
                        <tr 
                          key={course.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCourse(course.id);
                            fetchCourseDetails(course.id);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                            <div className="text-xs text-gray-500">{course.code} • Sem {course.semester}</div>
                          </td>
                          {reportData.pos?.map(po => {
                            const value = reportData.heatmapData.matrix[course.id]?.[po.id]?.value || 0;
                            const percentage = (value / 3) * 100;
                            return (
                              <td key={po.id} className="px-6 py-4 group relative">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`px-3 py-2 rounded-lg text-center font-medium min-w-[60px] ${
                                      value >= 2.5 ? 'bg-green-100 text-green-800' :
                                      value >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {value.toFixed(1)}
                                  </div>
                                  {getContributionIcon(value)}
                                </div>
                                {/* Tooltip with percentage */}
                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-8 ml-2">
                                  {percentage.toFixed(0)}% attainment
                                </div>
                              </td>
                            );
                          })}
                          {reportData.psos?.map(pso => {
                            const value = reportData.heatmapData.matrix[course.id]?.[pso.id]?.value || 0;
                            const percentage = (value / 3) * 100;
                            return (
                              <td key={pso.id} className="px-6 py-4 group relative">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className={`px-3 py-2 rounded-lg text-center font-medium min-w-[60px] ${
                                      value >= 2.5 ? 'bg-purple-100 text-purple-800' :
                                      value >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {value.toFixed(1)}
                                  </div>
                                  {getContributionIcon(value)}
                                </div>
                                {/* Tooltip with percentage */}
                                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-8 ml-2">
                                  {percentage.toFixed(0)}% attainment
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No heatmap data available
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Click on any row to view detailed CLO contributions for that course
              </p>
            </div>
          )}

          {/* Analytics View with Corrected Mapped Percentage */}
          {viewMode === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bloom's Level Distribution */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                  CLO Distribution by Bloom's Taxonomy
                </h2>
                {getBloomDistribution().length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getBloomDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {getBloomDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const entry = props.payload;
                            return [`${value} CLOs (${entry.percentage}%)`, name];
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {getBloomDistribution().map((item) => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name}:</span>
                          <span className="font-medium">{item.value} ({item.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No Bloom's distribution data available
                  </div>
                )}
              </div>

              {/* PO Contribution Analysis with Percentages */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                  PO Contribution Analysis
                </h2>
                {getPOContributions().length > 0 ? (
                  <div className="space-y-4">
                    {getPOContributions().map((po, index) => (
                      <div key={po.code} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium text-gray-600">{po.code}</div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                po.average >= 2.5 ? 'bg-green-500' :
                                po.average >= 1.5 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${(po.average / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-32 text-right">
                          <span className="font-semibold">{po.average}</span>
                          <span className="text-xs text-gray-500 ml-1">({((po.average / 3) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No PO contribution data available
                  </div>
                )}
              </div>

              {/* Top Contributing Courses - FIXED VERSION */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-600 rounded-full"></div>
                  Top Contributing Courses
                </h2>
                {reportData.courses?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.courses
                      .sort((a, b) => (b.clos?.length || 0) - (a.clos?.length || 0))
                      .slice(0, 6)
                      .map(course => {
                        // FIXED: Use course.id to get the correct coverage percentage
                        const coveragePercentage = getOutcomeCoveragePercentage(course.id);
                        
                        return (
                          <div 
                            key={course.id}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedCourse(course.id);
                              fetchCourseDetails(course.id);
                            }}
                          >
                            <div className="font-medium text-gray-900">{course.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{course.code} • Sem {course.semester}</div>
                            <div className="flex gap-2 mt-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
                                {course.clos?.length || 0} CLOs
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs ${
                                coveragePercentage >= 70 ? 'bg-green-100 text-green-800' :
                                coveragePercentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                coveragePercentage > 0 ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {coveragePercentage}% outcomes covered
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No course data available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Details Modal with Percentages */}
      {showCourseModal && courseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {courseDetails.course.name}
                </h2>
                <p className="text-blue-100 mt-1">
                  {courseDetails.course.code} • Semester {courseDetails.course.semester} • {courseDetails.course.credits} Credits
                </p>
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Cards with Percentages */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Total CLOs</p>
                  <p className="text-2xl font-bold text-gray-900">{courseDetails.summary?.totalClos || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">PO Mappings</p>
                  <p className="text-2xl font-bold text-gray-900">{courseDetails.summary?.totalPoMappings || 0}</p>
                  <p className="text-xs text-gray-500">
                    {courseDetails.summary?.totalClos && reportData.pos?.length > 0
                      ? ((courseDetails.summary?.totalPoMappings / (courseDetails.summary?.totalClos * reportData.pos.length)) * 100).toFixed(0)
                      : 0}% mapping density
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">PSO Mappings</p>
                  <p className="text-2xl font-bold text-gray-900">{courseDetails.summary?.totalPsoMappings || 0}</p>
                  <p className="text-xs text-gray-500">
                    {courseDetails.summary?.totalClos && reportData.psos?.length > 0
                      ? ((courseDetails.summary?.totalPsoMappings / (courseDetails.summary?.totalClos * reportData.psos.length)) * 100).toFixed(0)
                      : 0}% mapping density
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600">Avg PO Level</p>
                  <p className={`text-2xl font-bold ${
                    courseDetails.summary?.avgPoLevel >= 2.5 ? 'text-green-600' :
                    courseDetails.summary?.avgPoLevel >= 1.5 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {courseDetails.summary?.avgPoLevel || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((courseDetails.summary?.avgPoLevel / 3) * 100).toFixed(0)}% attainment
                  </p>
                </div>
              </div>

              {/* CLO Contribution Table with Percentages */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CLO Contributions</h3>
              <div className="space-y-4">
                {courseDetails.cloContributions?.map((clo) => (
                  <div key={clo.cloId} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg text-gray-900">{clo.cloCode}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            clo.bloomLevel === 'REMEMBER' ? 'bg-red-100 text-red-800' :
                            clo.bloomLevel === 'UNDERSTAND' ? 'bg-yellow-100 text-yellow-800' :
                            clo.bloomLevel === 'APPLY' ? 'bg-green-100 text-green-800' :
                            clo.bloomLevel === 'ANALYZE' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {clo.bloomLevel}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{clo.cloStatement}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                          {Object.keys(clo.poMappings || {}).length} POs
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm">
                          {Object.keys(clo.psoMappings || {}).length} PSOs
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* PO Mappings with Percentages */}
                      {Object.keys(clo.poMappings || {}).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">PO Mappings:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(clo.poMappings).map(([code, data]) => (
                              <div
                                key={code}
                                className={`px-3 py-1.5 rounded-lg text-sm border ${
                                  data.level >= 2.5 ? 'bg-green-50 border-green-200 text-green-800' :
                                  data.level >= 1.5 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                  'bg-red-50 border-red-200 text-red-800'
                                }`}
                                title={`${data.statement} - ${((data.level / 3) * 100).toFixed(0)}% attainment`}
                              >
                                {code}: {data.level} ({((data.level / 3) * 100).toFixed(0)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PSO Mappings with Percentages */}
                      {Object.keys(clo.psoMappings || {}).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">PSO Mappings:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(clo.psoMappings).map(([code, data]) => (
                              <div
                                key={code}
                                className={`px-3 py-1.5 rounded-lg text-sm border ${
                                  data.level >= 2.5 ? 'bg-purple-50 border-purple-200 text-purple-800' :
                                  data.level >= 1.5 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                                  'bg-red-50 border-red-200 text-red-800'
                                }`}
                                title={`${data.statement} - ${((data.level / 3) * 100).toFixed(0)}% attainment`}
                              >
                                {code}: {data.level} ({((data.level / 3) * 100).toFixed(0)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Details Modal with Percentages */}
      {showPODetails && selectedPO && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPO.code}</h2>
                <p className="text-gray-600 mt-1">{selectedPO.statement}</p>
              </div>
              <button
                onClick={() => setShowPODetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Contributing Courses</h3>
              <div className="space-y-3">
                {reportData.courses
                  ?.filter(course => 
                    reportData.coursePOContributions?.[course.id]?.[selectedPO.id]?.averageLevel > 0
                  )
                  .map(course => {
                    const contribution = reportData.coursePOContributions?.[course.id]?.[selectedPO.id];
                    const percentage = contribution ? ((contribution.averageLevel / 3) * 100).toFixed(0) : 0;
                    return (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{course.name}</div>
                          <div className="text-xs text-gray-500">{course.code}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg font-medium ${
                          contribution?.averageLevel >= 2.5 ? 'bg-green-100 text-green-800' :
                          contribution?.averageLevel >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Level: {contribution?.averageLevel || 0} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                {(!reportData.courses?.filter(course => 
                    reportData.coursePOContributions?.[course.id]?.[selectedPO.id]?.averageLevel > 0
                  ).length) && (
                  <div className="text-center py-4 text-gray-500">
                    No courses contributing to this PO
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramReports;