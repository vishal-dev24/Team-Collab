import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  assignedTo:
    | {
        _id: string;
        name: string;
        email: string;
      }
    | any; // Taaki string aur object dono handle ho sakein
  projectId: string;
}

interface Project {
  _id: string;
  name: string;
}

const statusColumns = [
  { id: "todo", label: "To Do", color: "bg-slate-500" },
  { id: "in-progress", label: "In Progress", color: "bg-amber-500" },
  { id: "done", label: "Completed", color: "bg-emerald-500" },
] as const;

function TasksPage() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  // 1. Load User and their Team's Projects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const res = await api.post("/users/login", { email: fbUser.email });
          const userData = res.data.user;
          setUser(userData);

          // Fetch projects for this user's team
          if (userData.teamId) {
            const projRes = await api.get(
              `/projects?teamId=${userData.teamId}`,
            );
            setProjects(projRes.data);
            // Default to first project if available
            if (projRes.data.length > 0)
              setSelectedProjectId(projRes.data[0]._id);
          }
        } catch (err: any) {
          setError("Failed to initialize dashboard");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Tasks whenever Project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  const fetchTasks = async (pid: string) => {
    try {
      // Headers mein token ya user info bhejna zaroori hai
      const res = await api.get<Task[]>(`/tasks?projectId=${pid}`, {
        headers: {
          role: user?.role, // Aapka middleware headers se role le raha hai shayad
          userid: user?._id,
        },
      });

      setTasks(res.data);
      setError("");
    } catch (err: any) {
      console.error("Fetch Tasks Error:", err);
      setError(err.response?.data?.message || "Failed to load tasks");
    }
  };

  // 3. Create Task
  const handleCreateTask = async () => {
    if (!newTask.title || !selectedProjectId || !newTask.assignedTo) {
      setError("Title, Project, and Assignee Email are required.");
      return;
    }

    try {
      const res = await api.post(
        "/tasks",
        { ...newTask, projectId: selectedProjectId },
        { headers: { role: user?.role, userid: user?._id } },
      );

      // Check karein ki response mein assignedTo object aa raha hai ya nahi
      setTasks((prev) => [...prev, res.data]);
      setShowModal(false);
      setNewTask({ title: "", description: "", assignedTo: "" });
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  // 4. handleDeleteTask
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`, {
        headers: { role: user?.role, userid: user?._id },
      });
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err: any) {
      setError("Failed to delete task");
    }
  };

  // 5. handleUpdateTask
  const handleUpdateTask = async (task: Task) => {
    try {
      const payload = {
        title: task.title,
        description: task.description || "",
        status: task.status,
        projectId: task.projectId,
        assignedTo:
          typeof task.assignedTo === "object"
            ? task.assignedTo._id
            : task.assignedTo || user?._id,
      };

      await api.put(`/tasks/${task._id}`, payload, {
        headers: {
          role: user?.role,
          userid: user?._id,
        },
      });

      setEditTaskId(null);
      setError("");
    } catch (err: any) {
      console.error(err.response?.data);
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  // 6. Drag & Drop Logic
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    const movedTask = tasks.find((t) => t._id === draggableId);
    if (!movedTask) return;

    const newStatus = destination.droppableId as Task["status"];

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) =>
        t._id === draggableId ? { ...t, status: newStatus } : t,
      ),
    );

    try {
      // SAFE PAYLOAD LOGIC ✅
      const payload = {
        status: newStatus,
        title: movedTask.title,
        description: movedTask.description || "",
        projectId: movedTask.projectId,
        // Yahan fix hai: Agar AI task mein assignedTo missing hai toh current user ID bhej do
        assignedTo:
          typeof movedTask.assignedTo === "object"
            ? movedTask.assignedTo._id
            : movedTask.assignedTo || user?._id,
      };

      console.log("Updating Task Status with Payload:", payload);

      await api.put(`/tasks/${draggableId}`, payload, {
        headers: {
          role: user?.role,
          userid: user?._id,
        },
      });

      setError("");
    } catch (err: any) {
      console.error("Drag Update Error:", err.response?.data);
      setError(err.response?.data?.message || "Failed to update status.");
      fetchTasks(selectedProjectId); // Revert on failure
    }
  };

  return (
    <div className="p-4 md:p-4 max-w-[1600px] mx-auto min-h-screen">
      {/* Upper Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 bg-gray-800/20 p-6 rounded-3xl border border-gray-800">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight italic uppercase">
            Kanban
          </h2>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Active Project:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-white cursor-pointer hover:text-indigo-400 transition-colors"
            >
              {projects.length === 0 && <option>No Projects Found</option>}
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-gray-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
          <button
            onClick={() => setShowModal(true)}
            disabled={!selectedProjectId}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-95"
          >
            CREATE TASK
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-sm animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {/* Kanban Grid */}
      {!selectedProjectId ? (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl">
          Select a project to start managing tasks.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusColumns.map((col) => (
              <div
                key={col.id}
                className="bg-gray-900/40 rounded-[2rem] border border-gray-800/50 flex flex-col min-h-[500px]"
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${col.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    />
                    <h3 className="font-black text-gray-200 uppercase tracking-tighter">
                      {col.label}
                    </h3>
                  </div>
                  <span className="bg-gray-800 text-indigo-400 text-[10px] px-3 py-1 rounded-full font-black tracking-widest">
                    {tasks.filter((t) => t.status === col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 flex-1 transition-colors duration-300 rounded-b-[2rem] min-h-[150px] ${
                        snapshot.isDraggingOver ? "bg-indigo-500/5" : ""
                      }`}
                    >
                      {tasks
                        .filter((t) => t.status === col.id)
                        .map((task, index) => (
                          <Draggable
                            draggableId={task._id}
                            index={index}
                            key={task._id}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-gray-800 border border-gray-700 p-5 rounded-2xl mb-4 transition-all ${
                                  snapshot.isDragging
                                    ? "rotate-3 shadow-2xl border-indigo-500 ring-2 ring-indigo-500/20"
                                    : "hover:border-gray-500 shadow-sm"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  {/* TITLE */}
                                  {editTaskId === task._id ? (
                                    <input
                                      value={task.title}
                                      onChange={(e) =>
                                        setTasks((prev) =>
                                          prev.map((t) =>
                                            t._id === task._id
                                              ? { ...t, title: e.target.value }
                                              : t,
                                          ),
                                        )
                                      }
                                      className="bg-gray-700 text-white p-1 rounded w-full text-sm"
                                    />
                                  ) : (
                                    <h4 className="font-bold text-white leading-tight">
                                      {task.title}
                                    </h4>
                                  )}

                                  {/* ACTION BUTTONS */}
                                  {(user?.role === "ADMIN" ||
                                    user?.role === "MANAGER") && (
                                    <div className="flex gap-2">
                                      {/* EDIT */}
                                      <button
                                        onClick={() => setEditTaskId(task._id)}
                                        className="text-gray-500 hover:text-blue-400 p-1"
                                      >
                                        ✏️
                                      </button>

                                      {/* DELETE */}
                                      <button
                                        onClick={() =>
                                          handleDeleteTask(task._id)
                                        }
                                        className="text-gray-500 hover:text-red-400 p-1"
                                      >
                                        🗑
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* DESCRIPTION */}
                                {editTaskId === task._id ? (
                                  <textarea
                                    value={task.description}
                                    onChange={(e) =>
                                      setTasks((prev) =>
                                        prev.map((t) =>
                                          t._id === task._id
                                            ? {
                                                ...t,
                                                description: e.target.value,
                                              }
                                            : t,
                                        ),
                                      )
                                    }
                                    className="bg-gray-700 text-white p-2 rounded w-full text-xs mb-3"
                                  />
                                ) : (
                                  <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                                    {task.description ||
                                      "No description provided."}
                                  </p>
                                )}

                                {/* ASSIGNEE */}
                                {editTaskId === task._id ? (
                                  <input
                                    value={
                                      typeof task.assignedTo === "object"
                                        ? task.assignedTo?.email
                                        : task.assignedTo
                                    }
                                    onChange={(e) =>
                                      setTasks((prev) =>
                                        prev.map((t) =>
                                          t._id === task._id
                                            ? {
                                                ...t,
                                                assignedTo: e.target.value,
                                              }
                                            : t,
                                        ),
                                      )
                                    }
                                    placeholder="Assign email"
                                    className="bg-gray-700 text-white p-2 rounded w-full text-xs mb-3"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                      {typeof task.assignedTo === "object"
                                        ? task.assignedTo?.name?.charAt(0)
                                        : "U"}
                                    </div>

                                    <span className="text-[10px] text-gray-300">
                                      {typeof task.assignedTo === "object"
                                        ? task.assignedTo?.name
                                        : "Assigned"}
                                    </span>
                                  </div>
                                )}

                                {/* STATUS */}
                                {editTaskId === task._id && (
                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      setTasks((prev) =>
                                        prev.map((t) =>
                                          t._id === task._id
                                            ? {
                                                ...t,
                                                status: e.target
                                                  .value as Task["status"],
                                              }
                                            : t,
                                        ),
                                      )
                                    }
                                    className="bg-gray-700 text-white p-2 rounded text-xs mb-3"
                                  >
                                    <option value="todo">Todo</option>
                                    <option value="in-progress">
                                      In Progress
                                    </option>
                                    <option value="done">Done</option>
                                  </select>
                                )}

                                {/* SAVE BUTTON */}
                                {editTaskId === task._id && (
                                  <button
                                    onClick={() => handleUpdateTask(task)}
                                    className="text-xs bg-indigo-600 px-3 py-1 rounded text-white hover:bg-indigo-500"
                                  >
                                    Save
                                  </button>
                                )}

                                <span className="text-[9px] block mt-2 text-gray-600 uppercase">
                                  ID: {task._id.slice(-4)}
                                </span>
                              </div>
                            )}
                          </Draggable>
                        ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Modal - same as previous version but with Select Project awareness */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">
              New Task
            </h3>
            <div className="space-y-4">
              <input
                placeholder="What needs to be done?"
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/50 text-white placeholder:text-gray-600"
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
              <textarea
                placeholder="Briefly describe the task..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/50 text-white placeholder:text-gray-600"
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
              <input
                placeholder="Assign to (email)"
                className="w-full bg-gray-800 border border-gray-700 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/50 text-white placeholder:text-gray-600"
                onChange={(e) =>
                  setNewTask({ ...newTask, assignedTo: e.target.value })
                }
              />
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-gray-500 font-bold hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateTask}
                  className="flex-1 bg-indigo-600 py-4 rounded-2xl font-black text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                  CREATE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
