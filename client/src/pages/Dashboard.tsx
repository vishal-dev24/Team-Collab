import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import {
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import api from "../api/api";

function DashboardLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    teamId: string | null;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        // 1. Agar Firebase user hi nahi hai toh turant login pe bhejo
        if (!firebaseUser) {
          setTimeout(() => navigate("/login"), 1500);
          return setUser(null);
        }

        try {
          const res = await api.post("/users/login", {
            email: firebaseUser.email,
          });
          setUser(res.data.user);
        } catch (err: any) {
          // 2. Agar API se user nahi mila (404/500), toh error hide karke redirect karo
          console.error("User not found in DB, redirecting...");

          setTimeout(() => {
            navigate("/login");
          }, 2000); // 2 second ka wait
        }
      },
    );

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const sidebarItems = [
    { name: "Projects", path: "/dashboard/projects" },
    { name: "Tasks", path: "/dashboard/tasks" },
    { name: "Teams", path: "/dashboard/teams" },
    { name: "Messages", path: "/dashboard/messages" },
    { name: "Assistant", path: "/dashboard/assistant" },
  ];

  return (
    <div
      className={`flex h-screen overflow-hidden ${darkMode ? "bg-[#0B1120] text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Sidebar */}
      <aside
        className={`relative z-20 flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out shadow-2xl ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center gap-3 p-6 h-20 border-b border-gray-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white italic">
            P
          </div>
          {sidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-white">
              Projectly
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {/* Icon Placeholder (Yaha aap HeroIcons ya Lucide use kar sakte hain) */}
              <div className="w-6 h-6 flex-shrink-0 bg-gray-700/50 rounded group-hover:bg-indigo-500/20 transition-colors" />

              {sidebarOpen && (
                <span className="font-medium whitespace-nowrap">
                  {item.name}
                </span>
              )}

              {!sidebarOpen && (
                <div className="absolute left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                  {item.name}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer / User Quick Info */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3 p-2 bg-gray-800/40 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">
                  {user?.name}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header
          className={`h-20 flex items-center justify-between px-8 border-b transition-colors ${
            darkMode
              ? "bg-[#0B1120]/80 border-gray-800"
              : "bg-white/80 border-gray-200"
          } backdrop-blur-md sticky top-0 z-10`}
        >
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className={`w-6 h-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold hidden md:block">
              Welcome back, {user?.name.split(" ")[0]}! 👋
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-yellow-400"
                  : "bg-gray-100 border-gray-200 text-gray-600"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="h-8 w-[1px] bg-gray-700/30 mx-2" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all font-semibold text-sm border border-red-500/20"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
