import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import LoginPage from "./pages/Login";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import TeamsPage from "./pages/TeamPage";
import ChatPage from "./pages/ChatPage";
import AssistantPage from "./pages/AssistantPage";

function AppRoutes() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={user ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route index element={<Navigate to="projects" />} />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard/projects" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
