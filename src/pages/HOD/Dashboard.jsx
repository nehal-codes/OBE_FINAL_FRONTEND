import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import HOD_API from "../../apis/HOD/index.js";

// Enhanced Icons with subtle gradients and better visual weight
const IconBox = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const IconCourses = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M4 4h16v4H4z" />
    <path d="M4 12h16v8H4z" />
  </svg>
);

const IconList = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);

const IconClipboard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);

const IconChart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.75"
  >
    <path d="M4 20V10M10 20V4M16 20v-6M22 20V8" />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCLOs: 0,
    programmeCount: 0,
    programOutcomes: 0,
    pendingReviews: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const token = user?.token || localStorage.getItem("token");
      try {
        const res = await HOD_API.getDashboardStats.getStats(token);

        const payload = res.data?.stats ?? res.data?.data ?? res.data ?? {};

        setStats({
          totalCourses: payload?.totalCourses ?? payload?.total_courses ?? 0,
          activeCLOs: payload?.activeCLOs ?? payload?.active_clos ?? 0,
          programmeCount:
            payload?.programmesCount ??
            payload?.programmeCount ??
            payload?.programmes_count ??
            0,
          programOutcomes:
            payload?.programOutcomes ?? payload?.program_outcomes ?? 0,
          pendingReviews:
            payload?.pendingReviews ?? payload?.pending_reviews ?? 0,
        });
      } catch (err) {
        console.error("Dashboard error:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const cards = [
    {
      title: "Programmes",
      value: stats.programmeCount,
      icon: <IconBox />,
      color: "text-amber-600",
      gradient: "from-amber-50 to-amber-25",
      border: "border-amber-100",
      iconBg: "bg-gradient-to-br from-amber-100 to-amber-50",
    },
    {
      title: "Program Outcomes",
      value: stats.programOutcomes,
      icon: <IconClipboard />,
      color: "text-indigo-600",
      gradient: "from-indigo-50 to-indigo-25",
      border: "border-indigo-100",
      iconBg: "bg-gradient-to-br from-indigo-100 to-indigo-50",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: <IconCourses />,
      color: "text-blue-600",
      gradient: "from-blue-50 to-blue-25",
      border: "border-blue-100",
      iconBg: "bg-gradient-to-br from-blue-100 to-blue-50",
    },
    {
      title: "Active CLOs",
      value: stats.activeCLOs,
      icon: <IconList />,
      color: "text-emerald-600",
      gradient: "from-emerald-50 to-emerald-25",
      border: "border-emerald-100",
      iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-50",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews,
      icon: <IconChart />,
      color: "text-rose-600",
      gradient: "from-rose-50 to-rose-25",
      border: "border-rose-100",
      iconBg: "bg-gradient-to-br from-rose-100 to-rose-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Dashboard
            </h3>
            <p className="text-gray-500 text-sm">
              Fetching your academic insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 bg-gradient-to-b from-gray-50/50 to-white min-h-screen">
      {/* Header Section with Enhanced Visual Hierarchy */}
      <div className="mb-10 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                {user?.role} Dashboard
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Department of{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {user?.department?.name}
              </span>
            </h1>
            {/*
            <p className="text-gray-600 mt-2 text-base md:text-lg">
              Department of <span className="font-semibold text-gray-800">{user?.department?.name}</span>
            </p>
            */}
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Last Updated
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid with Advanced Visual Treatment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-6 mb-10">
        {cards.map((stat, i) => (
          <div
            key={i}
            className={`
              group relative bg-gradient-to-br ${stat.gradient} 
              rounded-2xl p-6 transition-all duration-300 
              hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 
              border ${stat.border} overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/50 before:to-transparent
            `}
          >
            {/* Subtle corner accent */}
            <div
              className={`absolute top-0 right-0 w-16 h-16 ${stat.color.replace("text-", "bg-")} opacity-5 rounded-full -translate-y-8 translate-x-8`}
            ></div>

            <div className="relative flex items-start justify-between z-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${stat.color.replace("text-", "bg-")}`}
                  ></div>
                  <p className="text-gray-600 text-xs font-medium tracking-wider uppercase">
                    {stat.title}
                  </p>
                </div>
                <p className="text-3xl md:text-4xl font-bold text-gray-900">
                  {stat.value}
                  <span className="text-gray-400 text-lg font-normal ml-1">
                    {stat.title.includes("Pending") ? " pending" : ""}
                  </span>
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live data
                </div>
              </div>
              <div
                className={`
                ${stat.iconBg} ${stat.color} 
                p-3 rounded-xl shadow-sm 
                border border-white/50
                group-hover:scale-110 group-hover:shadow-md 
                transition-all duration-300
              `}
              >
                {stat.icon}
              </div>
            </div>

            {/* Progress indicator (subtle) */}
            <div className="relative mt-4 pt-2 border-t border-white/30">
              <div className="h-1 w-full bg-white/50 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stat.color.replace("text-", "bg-")} rounded-full transition-all duration-700`}
                  style={{
                    width: `${Math.min((stat.value / 50) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500 text-center">
          Dashboard updated in real-time • Data refreshes every 5 minutes
          <span className="mx-2">•</span>
          <span className="inline-flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
            System Status: Operational
          </span>
        </p>
      </div>
    </div>
  );
}
