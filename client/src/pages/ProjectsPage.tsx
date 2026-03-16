import { useEffect, useState } from "react";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

interface Project {
  _id: string;
  name: string;
  description: string;
  teamId: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

function ProjectsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState({ name: "", description: "" });

  // Clear error when user types or triggers a new action
  const clearError = () => setError("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) return setUser(null);

        try {
          const res = await api.post("/users/login", {
            email: firebaseUser.email,
          });
          setUser(res.data.user);
        } catch (err: any) {
          console.error(
            "Failed to fetch user:",
            err.response?.data || err.message,
          );
          setError("Failed to fetch user info");
        }
      },
    );

    return () => unsubscribe();
  }, []);

  // Fetch projects for user's team
  const fetchProjects = async () => {
    if (!user?.teamId) return;
    try {
      const res = await api.get(`/projects?teamId=${user.teamId}`);
      setProjects(res.data);
    } catch (err: any) {
      console.error("Fetch Projects error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to fetch projects");
    }
  };

  useEffect(() => {
    if (user?.teamId) fetchProjects();
  }, [user]);

  // Create new project
  const handleCreate = async () => {
    if (!newProject.name || !newProject.description) {
      setError("Project name and description are required");
      return;
    }
    if (!user) return setError("User not loaded");

    try {
      await api.post(
        "/projects",
        { name: newProject.name, description: newProject.description },
        {
          headers: { role: user?.role, userid: user?._id }, // ✅ send userId
        },
      );
      setNewProject({ name: "", description: "" });
      fetchProjects();
      clearError(); // clear previous error
    } catch (err: any) {
      console.error("Create Project error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  // Delete project
  const handleDelete = async (projectId: string) => {
    if (!user) return setError("User not loaded");

    try {
      await api.delete(`/projects/${projectId}`, {
        headers: { role: user.role, "user-id": user._id },
      });
      fetchProjects();
    } catch (err: any) {
      console.error("Delete Project error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  // UPDATE project
  const handleUpdate = async (projectId: string) => {
    if (!editProject.name || !editProject.description) {
      setError("Project name and description are required");
      return;
    }
    if (!user) return setError("User not loaded");

    try {
      await api.put(
        `/projects/${projectId}`,
        {
          name: editProject.name,
          description: editProject.description,
        },
        {
          headers: { role: user.role, "user-id": user._id },
        },
      );

      setEditingProjectId(null);
      fetchProjects();
      clearError();
    } catch (err: any) {
      console.error("Update Project error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update project");
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen">
      {/* Dashboard ya Projects page ke header mein ye add karo */}
      {user?.role === "ADMIN" && (
        <div className="bg-indigo-900/30 overflow-hidden border border-indigo-500/50 p-4 rounded-2xl mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Your Team ID (Share with members)
            </p>
            <code className="text-white font-mono text-sm">{user.teamId}</code>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user.teamId || "");
              alert("Team ID Copied!");
            }}
            className="bg-indigo-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all"
          >
            Copy ID
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col overflow-hidden md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Projects
          </h2>
          <p className="text-gray-400 mt-2 text-lg">
            Track and manage your workspace initiatives.
          </p>
        </div>

        {/* Create Project Form (Admin/Manager only) */}
        {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
          <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700 backdrop-blur-md flex flex-col sm:flex-row gap-3 shadow-2xl">
            <input
              value={newProject.name}
              placeholder="Project Name"
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              className="bg-gray-900/50 border border-gray-600 px-4 py-2 rounded-xl text-white outline-none focus:border-emerald-500 transition-all w-full sm:w-48"
            />
            <input
              value={newProject.description}
              placeholder="Short description..."
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              className="bg-gray-900/50 border border-gray-600 px-4 py-2 rounded-xl text-white outline-none focus:border-emerald-500 transition-all w-full sm:w-64"
            />
            <button
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-900/20"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 rounded-r-lg mb-8 animate-in fade-in slide-in-from-top-4">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-24 bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-700">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-gray-500 text-xl">
            No projects found. Time to start something new!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project._id}
              className="group flex flex-col bg-gray-800/80 border border-gray-700 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 shadow-xl hover:shadow-emerald-500/5"
            >
              {/* Card Top Accent */}
              <div className="h-2 w-full bg-gradient-to-r from-emerald-600 to-teal-500 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors truncate pr-2">
                    {project.name}
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest bg-gray-700 px-2 py-1 rounded-md text-gray-400 font-bold">
                    Active
                  </span>
                </div>

                {/* EDIT PROJECT  */}
                {editingProjectId === project._id && (
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      value={editProject.name}
                      onChange={(e) =>
                        setEditProject({ ...editProject, name: e.target.value })
                      }
                      className="bg-gray-900 border border-gray-600 px-3 py-2 rounded text-white"
                      placeholder="Project name"
                    />

                    <input
                      value={editProject.description}
                      onChange={(e) =>
                        setEditProject({
                          ...editProject,
                          description: e.target.value,
                        })
                      }
                      className="bg-gray-900 border border-gray-600 px-3 py-2 rounded text-white"
                      placeholder="Description"
                    />

                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-emerald-600 px-4 py-1 rounded text-xs"
                        onClick={() => handleUpdate(project._id)}
                      >
                        Save
                      </button>

                      <button
                        className="bg-gray-600 px-4 py-1 rounded text-xs"
                        onClick={() => setEditingProjectId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 leading-relaxed text-sm line-clamp-3 mb-6 flex-grow">
                  {project.description ||
                    "No description provided for this project."}
                </p>

                {user?.role === "ADMIN" && (
                  <div className="mt-auto pt-4 border-t border-gray-700/50 flex justify-end gap-3">
                    {" "}
                    <button
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                      onClick={() => {
                        setEditingProjectId(project._id);
                        setEditProject({
                          name: project.name,
                          description: project.description,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          "Are you sure you want to delete this project?",
                        );
                        if (confirmDelete) {
                          handleDelete(project._id);
                        }
                      }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ProjectsPage;
