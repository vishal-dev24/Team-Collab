import { useState, useEffect, useCallback } from "react";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
interface AssistantResponse {
  success: boolean;
  message: string;
}
interface Project {
  _id: string;
  name: string;
}
function AssistantPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedPid, setSelectedPid] = useState("");
  // 1. User aur Projects load karne ka function
  const initializeData = useCallback(async (email: string) => {
    try {
      const res = await api.post("/users/login", { email });
      const userData = res.data.user || res.data;
      setUser(userData);
      if (userData.teamId) {
        const projRes = await api.get(`/projects?teamId=${userData.teamId}`);
        setProjects(projRes.data);
        // Pehla project default select karein
        if (projRes.data.length > 0) {
          setSelectedPid(projRes.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        initializeData(firebaseUser.email);
      }
    });
    return () => unsubscribe();
  }, [initializeData]);

  // handleSubmit----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPid) return;
    // User validation check
    if (!user || !user.teamId) {
      setResponse({
        success: false,
        message: "User session not found. Please wait or re-login.",
      });
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.post(
        "/assistant",
        {
          message: input,
          teamId: user.teamId,
          projectId: selectedPid,
          senderId: user._id, // Aksar backend ko 'kisne command di' ye chahiye hota hai
        },
        {
          headers: {
            role: user.role,
            userid: user._id, // ChatPage ki tarah headers consistent rakhein
            teamid: user.teamId
          },
        },
      );
      // Agar backend success: true bhejta hai
      setResponse({
        success: true,
        message: res.data.message || `Command executed successfully!`,
      });
      setInput("");
    } catch (err: any) {
      console.error("Assistant Error:", err.response?.data);
      setResponse({
        success: false,
        message:
          err.response?.data?.message ||
          "AI could not process this command. Check if the member name exists.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[85vh] flex flex-col justify-center">
      {/* Header Section */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
            {loading ? "AI is Thinking..." : "NLP Engine Online"}
          </span>
        </div>
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">
          AI Command Center
        </h2>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.2em]">
          Target your project and issue commands
        </p>
      </div>

      {/* Assistant Interface Card */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[60px]" />

        <div className="relative z-10 space-y-8">
          {/* PROJECT SELECTOR DROPDOWN ✅ */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">
              Select Project Context
            </label>
            <select value={selectedPid} onChange={(e) => setSelectedPid(e.target.value)}
              className="bg-gray-950 border-2 border-gray-800 text-white px-6 py-3 rounded-2xl outline-none focus:border-indigo-600 transition-all text-xs font-bold min-w-[280px] shadow-inner appearance-none text-center"
            >
              {projects.length === 0 && (
                <option value="">No Projects Found</option>
              )}
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-gray-900 text-left">
                  {p.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {/* Response Box */}
          <div className="min-h-[160px] bg-gray-950/80 rounded-3xl p-8 border border-gray-800 flex flex-col items-center justify-center text-center transition-all">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-indigo-400 font-black text-xs uppercase tracking-widest animate-pulse italic">
                  Analyzing request...
                </p>
              </div>
            ) : response ? (
              <div className="animate-in zoom-in-95 duration-300">
                <div className="text-4xl mb-4">
                  {response.success ? "✅" : "❌"}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-tighter">
                  {response.success ? "Success" : "Failed"}
                </h3>
                <p className={`text-sm max-w-sm mx-auto font-medium ${response.success ? "text-gray-400" : "text-red-400"}`}
                > {response.message}
                </p>
              </div>
            ) : (
              <div className="space-y-4 opacity-50">
                <div className="text-5xl">🤖</div>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                  Awaiting instructions for project
                </p>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <input type="text" disabled={loading || !selectedPid}
              placeholder={
                selectedPid
                  ? "E.g. Assign a task to den to fix the navbar"
                  : "Please select a project first..."
              }
              className="w-full bg-gray-950 border-2 border-gray-800 px-6 py-5 rounded-2xl text-white placeholder-gray-700 outline-none focus:border-indigo-600 transition-all text-sm font-bold italic"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={loading || !input.trim() || !selectedPid}
              className="absolute right-3 top-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2">
              Execute
            </button>
          </form>
        </div>
      </div>

      {/* Footer Pro Tip */}
      <div className="mt-8 bg-gray-800/20 border border-gray-800 p-4 rounded-2xl">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 text-indigo-400">
          NLP Context
        </p>
        <p className="text-[10px] text-gray-400 leading-relaxed italic">
          The assistant will create the task in the **TODO** column of the selected project.
        </p>
      </div>
    </div>
  );
}
export default AssistantPage;