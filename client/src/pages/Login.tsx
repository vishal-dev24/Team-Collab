import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        setError("Email and Password are required");
        return;
      }

      // 1️⃣ Firebase login
      await signInWithEmailAndPassword(auth, email, password);

      // 2️⃣ Backend login (fetch user info)
      const res = await api.post("/users/login", { email });
      const backendUser = res.data.user;

      // Save user info in localStorage for dashboard
      localStorage.setItem("user", JSON.stringify(backendUser));

      // 3️⃣ Redirect to dashboard projects page
      navigate("/dashboard/projects");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.response?.data?.message || err.message || "Login failed");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10 px-6">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-50" />

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black italic text-white shadow-lg shadow-indigo-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">
              P
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase mt-2">
              Enter your credentials to access
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 rounded-lg mb-6 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Password
                </label>
                <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-950 border border-gray-800 text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group flex items-center justify-center gap-2"
            >
              Sign In
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mt-8">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-indigo-400 hover:text-white transition-colors border-b border-indigo-400/30 hover:border-white"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em] mt-8 opacity-50">
          &copy; 2024 Projectly Collaboration Suite
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
