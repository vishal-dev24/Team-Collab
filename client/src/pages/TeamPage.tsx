import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";

// 1. Team Interface (API se aane wale data ka structure)
interface Team {
  _id: string;
  name: string;
  description?: string;
  members: {
    _id: string;
    name: string;
    email: string;
    role: string;
  }[];
  adminId: string;
}

// 2. UserContext Interface (useOutletContext ke liye)
interface UserContext {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    teamId: string | null;
  } | null;
}

const TeamsPage = () => {
  const { user } = useOutletContext<UserContext>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Add to TeamsPage component state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");
  const [editingTeamDesc, setEditingTeamDesc] = useState("");

  const fetchTeamsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(""); // Clear previous errors

    try {
      // Role ko uppercase karke check karein taaki admin/ADMIN dono chalein
      const userRole = user.role.toUpperCase();

      if (userRole === "ADMIN") {
        // Admin: Fetch all teams
        const res = await api.get("/teams", { headers: { role: user.role } });
        setTeams(Array.isArray(res.data) ? res.data : [res.data]);
      } else if (user.teamId) {
        // Member/Manager: Fetch assigned team
        const res = await api.get(`/teams/${user.teamId}`, {
          headers: { role: user.role },
        });

        const teamData = res.data;
        setTeams([teamData]);

        // Members list set karein
        if (teamData.members && teamData.members.length > 0) {
          setMembers(teamData.members);
        } else {
          const memberRes = await api.get(`/users/team?teamId=${user.teamId}`);
          setMembers(memberRes.data);
        }
      } else {
        setError("You are not assigned to any team yet.");
        setTeams([]);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err.response?.status);
      if (err.response?.status === 404) {
        setError("Team record not found in Database. Please contact Admin.");
      } else {
        setError("Failed to fetch team data.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeamsData();
  }, [fetchTeamsData]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return setError("Team name is required");
    try {
      setError("");
      await api.post(
        "/teams",
        { name: newTeamName, adminId: user?._id },
        { headers: { role: user?.role } },
      );
      setNewTeamName("");

      // Team banane ke baad page reload/re-fetch taaki nayi ID user state mein reflect ho
      // Kyunki backend ab admin ka teamId update kar raha hai
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create team");
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm("Are you sure? Members will be unassigned.")) return;
    try {
      await api.delete(`/teams/${id}`, { headers: { role: user?.role } });
      fetchTeamsData();
    } catch (err) {
      setError("Delete failed");
    }
  };
  // handleUpdateTeam
  const handleUpdateTeam = async (teamId: string) => {
    if (!editingTeamName.trim()) return setError("Team name cannot be empty");
    try {
      setError("");
      await api.put(
        `/teams/${teamId}`,
        {
          name: editingTeamName,
          description: editingTeamDesc,
          adminId: user?._id, // ✅ Add this
        },
        { headers: { role: user?.role } },
      );
      setEditingTeamId(null);
      setEditingTeamName("");
      setEditingTeamDesc("");
      fetchTeamsData(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update team");
    }
  };
  // Check if role is admin (utility constant)
  const isAdmin = user?.role.toUpperCase() === "ADMIN";

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight italic uppercase">
            {isAdmin ? "Team Management" : "My Squad"}
          </h2>
          <p className="text-gray-400 mt-1">
            {isAdmin
              ? "Oversee all collaboration units."
              : "Collaborate with your team members."}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-2xl border border-gray-700 backdrop-blur-sm shadow-xl w-full md:w-auto">
            <input
              value={newTeamName}
              placeholder="New Team Name..."
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-transparent px-4 py-2 outline-none text-white w-full md:w-60 placeholder:text-gray-600 text-sm"
            />
            <button
              onClick={handleCreateTeam}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {loading ? "..." : "Create"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-400 p-4 rounded-r-xl mb-8 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div
                key={team._id}
                className="bg-gray-800 border border-gray-700 p-4 rounded-3xl hover:border-indigo-500/50 transition-all flex flex-col justify-between h-[280px] shadow-lg"
              >
                {/* Header: Icon + Name + Buttons */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {team.name?.charAt(0)}
                    </div>

                    {editingTeamId === team._id ? (
                      <input
                        className="bg-gray-900 text-white px-2 py-1 rounded-lg outline-none w-36 sm:w-48"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        placeholder="Team Name"
                      />
                    ) : (
                      <h3 className="text-xl font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                        {team.name}
                      </h3>
                    )}
                  </div>

                  {/* Button Group */}
                  <div className="flex gap-2 flex-shrink-0">
                    {editingTeamId === team._id ? (
                      <>
                        <button
                          className="bg-green-600 px-3 py-1 rounded-xl text-white text-xs font-bold"
                          onClick={() => handleUpdateTeam(team._id)}
                        >
                          Save
                        </button>
                        <button
                          className="bg-red-600 px-3 py-1 rounded-xl text-white text-xs font-bold"
                          onClick={() => setEditingTeamId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-indigo-500 px-3 py-1 rounded-xl text-white text-xs font-bold"
                        onClick={() => {
                          setEditingTeamId(team._id);
                          setEditingTeamName(team.name);
                          setEditingTeamDesc(team.description || "");
                        }}
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTeam(team._id)}
                      className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Description + Members */}
                <div className="flex-1 overflow-y-auto">
                  {editingTeamId === team._id ? (
                    <textarea
                      className="w-full bg-gray-900 text-white px-2 py-1 rounded-xl mt-2 outline-none h-20 resize-none"
                      value={editingTeamDesc}
                      onChange={(e) => setEditingTeamDesc(e.target.value)}
                      placeholder="Team description..."
                    />
                  ) : (
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 h-16 overflow-hidden">
                      {team.description || "No description"} •{" "}
                      {team.members?.length || 0} Members
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-10">
              No teams found. Create one!
            </p>
          )}
        </div>
      ) : (
        /* Member View: Member Directory Table ✅ */
        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-gray-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-gray-800">
              <tr>
                <th className="px-8 py-5">Team Member</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr
                    key={member._id}
                    className="hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-8 py-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-black">
                        {member.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {member.name} {member._id === user?._id && "(You)"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold">
                          {member.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`text-[9px] font-black px-2 py-1 rounded-md border ${
                          member.role === "ADMIN"
                            ? "border-rose-500 text-rose-500"
                            : "border-indigo-500 text-indigo-500"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Now
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-500">
                    Loading members...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
