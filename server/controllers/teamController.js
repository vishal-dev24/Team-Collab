import Team from "../models/Team.js";
import User from "../models/User.js";

// 1. Get all teams (Admin ke liye - with Member Details)
export const getTeams = async (req, res) => {
    try {
        const teams = await Team.find().lean(); // lean() performance ke liye

        const teamsWithMembers = await Promise.all(teams.map(async (team) => {
            const members = await User.find({ teamId: team._id }).select("-password");
            return {
                ...team,
                members: members
            };
        }));

        res.status(200).json(teamsWithMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get Single Team (Member/Manager ke liye)
export const getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id).lean();
        if (!team) return res.status(404).json({ message: "Team not found in Database" });

        const members = await User.find({ teamId: req.params.id }).select("-password");
        res.status(200).json({
            ...team,
            members: members
        });
    } catch (error) {
        res.status(500).json({ message: "Invalid Team ID or Server Error" });
    }
};

// 3. Create Team (Admin auto-assignment logic added ✅)
export const createTeam = async (req, res) => {
    try {
        const { name, description, adminId } = req.body;

        // Nayi team create karein
        const team = new Team({ name, description, adminId });
        const savedTeam = await team.save();

        // 🔥 CRITICAL STEP: Admin ka apna teamId update karein
        // Taaki Admin apni hi banayi team ka member ban sake automatic
        await User.findByIdAndUpdate(adminId, { teamId: savedTeam._id });

        res.status(201).json(savedTeam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Update team
export const updateTeam = async (req, res) => {
    try {
        const { name, description, adminId } = req.body;
        const team = await Team.findByIdAndUpdate(
            req.params.id,
            { name, description, adminId },
            { new: true } // Updated document return karega
        );

        if (!team) return res.status(404).json({ message: "Team not found" });
        res.status(200).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Delete team (Cleanup members logic added ✅)
export const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const team = await Team.findByIdAndDelete(id);

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        // 🔥 CLEANUP: Jin users ke paas ye teamId thi, unhe null kar dein
        // Isse "Team not found" wala 404 error aane ke chances kam ho jayenge
        await User.updateMany({ teamId: id }, { teamId: null });

        res.status(200).json({ message: "Team deleted and members unassigned" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// import Team from "../models/Team.js"
// import User from "../models/User.js" // User model import zaroori hai

// // 1. Get all teams (Admin ke liye - with Member Details)
// export const getTeams = async (req, res) => {
//     try {
//         const teams = await Team.find();

//         // Har team ke liye uske members ko dhoondhein
//         const teamsWithMembers = await Promise.all(teams.map(async (team) => {
//             const members = await User.find({ teamId: team._id }).select("-password");
//             return {
//                 ...team._doc,
//                 members: members // Frontend iska wait kar raha hai ✅
//             };
//         }));

//         res.status(200).json(teamsWithMembers);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // 2. Get Single Team (Member/Manager ke liye)
// export const getTeamById = async (req, res) => {
//     try {
//         const team = await Team.findById(req.params.id);
//         if (!team) return res.status(404).json({ message: "Team not found" });
//         // Is team ke saare members nikalein
//         const members = await User.find({ teamId: req.params.id }).select("-password");
//         res.status(200).json({
//             ...team._doc,
//             members: members // Frontend table isi se chalegi ✅
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Create team
// export const createTeam = async (req, res) => {
//     try {
//         const { name, description, adminId } = req.body
//         const team = new Team({ name, description, adminId })
//         await team.save()
//         res.status(201).json(team)
//     } catch (error) {
//         res.status(500).json({ message: error.message })
//     }
// }

// // Update team
// export const updateTeam = async (req, res) => {
//     try {
//         const team = await Team.findById(req.params.id)
//         if (!team) return res.status(404).json({ message: "Team not found" })

//         const { name, description, adminId } = req.body
//         if (name) team.name = name
//         if (description) team.description = description
//         if (adminId) team.adminId = adminId

//         await team.save()
//         res.status(200).json(team)
//     } catch (error) {
//         res.status(500).json({ message: error.message })
//     }
// }

// // Delete team (Updated with findByIdAndDelete)
// export const deleteTeam = async (req, res) => {
//     try {
//         const { id } = req.params;

//         // Sidha find karke delete karega
//         const team = await Team.findByIdAndDelete(id);

//         if (!team) {
//             return res.status(404).json({ message: "Team not found" });
//         }

//         res.status(200).json({ message: "Team deleted successfully" });
//     } catch (error) {
//         console.error("Delete Team Error:", error.message);
//         res.status(500).json({ message: "Internal Server Error: " + error.message });
//     }
// };