import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");

  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");

  const handleSignup = async () => {
    setError(""); // reset error
    if (!name || !email || !password) {
      setError("Name, Email, and Password are required");
      return;
    }

    try {
      // 1️⃣ Firebase signup
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(userCredential.user, { displayName: name });

      // 2️⃣ Backend signup
      // Here backend will create user in MongoDB
      const res = await api.post("/users/signup", {
        name,
        email,
        role,
        teamName: role === "ADMIN" ? teamName : undefined, // Admin ke liye teamName
        teamId: role !== "ADMIN" ? teamId : undefined, // Members ke liye teamId
      });

      // 3️⃣ Store user info locally for dashboard
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // 4️⃣ Redirect to dashboard
      navigate("/dashboard/projects");
    } catch (err: any) {
      console.error("Signup failed:", err.response || err.message);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Signup failed. Try again.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] relative overflow-hidden font-sans py-10">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10 px-6">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 opacity-50" />

          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Join the Squad
            </h2>
            <p className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase mt-2">
              Create your account to collaborate
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-3 rounded-lg mb-6 text-xs font-bold animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                value={name}
                placeholder="Vishal Sharma"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                placeholder="vishal@company.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Your Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="MEMBER">MEMBER (Join Team)</option>
                <option value="MANAGER">MANAGER (Join Team)</option>
                <option value="ADMIN">ADMIN (Create Team)</option>
              </select>
            </div>

            {/* Conditional Input: Team ID or Team Name */}
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {role === "ADMIN" ? (
                <>
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">
                    New Team Name
                  </label>
                  <input
                    value={teamName}
                    placeholder="e.g. Alpha Developers"
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-emerald-900/30 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </>
              ) : (
                <>
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">
                    Paste Team ID
                  </label>
                  <input
                    value={teamId}
                    placeholder="Ask your Admin for Team ID"
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-indigo-900/30 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </>
              )}
            </div>

            <button
              onClick={handleSignup}
              className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Create Account
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-widest mt-6">
              Already a member?{" "}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-white transition-colors border-b border-indigo-400/30"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
