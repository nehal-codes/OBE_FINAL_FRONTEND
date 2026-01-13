import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiMenu,
  FiBook,
  FiLogOut,
  FiUser,
  FiSettings,
  FiGrid,
  FiClipboard,
  FiCheckCircle,
  FiFileText,
  FiBarChart2,
  FiChevronRight,
  FiHome,
  FiX,
} from "react-icons/fi";

const menuItems = [
  {
    text: "Dashboard",
    icon: <FiGrid />,
    path: "/dashboard",
    roles: ["HOD", "FACULTY", "ADMIN"],
  },
  {
    text: "Course Management",
    icon: <FiBook />,
    path: "/hod/courses",
    roles: ["HOD", "ADMIN"],
  },
  {
    text: "Faculty Assignment",
    icon: <FiClipboard />,
    path: "/faculty-assignment",
    roles: ["HOD"],
  },
  {
    text: "Attainment Review",
    icon: <FiCheckCircle />,
    path: "/attainment-review",
    roles: ["HOD"],
  },
  {
    text: "Question Bank",
    icon: <FiFileText />,
    path: "/question-bank",
    roles: ["HOD"],
  },
  {
    text: "Reports",
    icon: <FiBarChart2 />,
    path: "/reports",
    roles: ["HOD", "FACULTY", "ADMIN"],
  },
  {
    text: "Settings",
    icon: <FiSettings />,
    path: "/settings",
    roles: ["HOD", "FACULTY", "ADMIN"],
  },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start with sidebar open
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  useEffect(() => {
    const currentItem = menuItems.find(item => location.pathname.startsWith(item.path));
    setActiveItem(currentItem?.text || "");
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 768 && !event.target.closest('aside') && !event.target.closest('button[aria-label="Open sidebar"]')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* SIDEBAR OVERLAY (mobile only) */}
      <div
        className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-all duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-gradient-to-b from-white to-gray-50/80 shadow-xl
          transition-all duration-300 ease-in-out transform
          ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-20'}
          border-r border-gray-200/60 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className={`p-6 pb-4 border-b border-gray-200/60 ${!sidebarOpen ? 'px-4' : ''}`}>
          <div className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}>
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <FiHome className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">OBE System</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Academic Dashboard</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <FiHome className="text-white text-lg" />
              </div>
            )}
            
            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Close sidebar"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="px-6 py-4 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center">
                <FiUser className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${!sidebarOpen ? 'px-2' : ''}`}>
          {sidebarOpen && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Navigation
            </p>
          )}
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <button
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} 
                  px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700 shadow-sm border border-blue-100/50" 
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                title={!sidebarOpen ? item.text : ''}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"}`}>
                    <div className="text-lg">{item.icon}</div>
                  </div>
                  {sidebarOpen && (
                    <span className="font-medium text-sm">{item.text}</span>
                  )}
                </div>
                {sidebarOpen && isActive && (
                  <FiChevronRight className="text-blue-500 ml-2" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200/50 bg-white/50">
            <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg">
              <p className="text-xs text-gray-600 text-center truncate">
                {user?.department?.name || "Department"}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'md:ml-72' : 'md:ml-20'
      }`}>
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <FiMenu className="text-xl text-gray-700" />
              </button>
              
              <div className="hidden md:flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600"></div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Outcome-Based Education System
                </h1>
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                  v2.1
                </span>
              </div>
              
              {activeItem && sidebarOpen && (
                <div className="hidden md:flex items-center text-gray-500">
                  <FiChevronRight className="mx-2" />
                  <span className="text-sm font-medium text-gray-700">{activeItem}</span>
                </div>
              )}
            </div>

            {/* Right Section - User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-gray-600">
                <div className="font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-sm flex items-center justify-center">
                    <FiUser className="text-blue-600" />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                <div className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200/60 z-50 overflow-hidden transition-all duration-200 ${
                  menuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}>
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <FiUser className="text-gray-500" />
                      Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <FiSettings className="text-gray-500" />
                      Account Settings
                    </button>
                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiLogOut />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-[1920px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Close dropdown when clicking outside */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;