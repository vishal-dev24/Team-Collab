import User from "../models/User.js";
import Team from "../models/Team.js"; // Team model import karo

export const signupUser = async (req, res) => {
    try {
        const { name, email, role = "MEMBER", teamId: inputTeamId } = req.body;
        // ... (existing validation)

        let finalTeamId = inputTeamId;

        if (role === "ADMIN") {
            // 1. Pehle user create karo bina teamId ke
            const user = new User({ name, email, role });
            const savedUser = await user.save();

            // 2. Ab is Admin ke liye ek default Team banao
            const newTeam = new Team({
                name: `${name}'s Team`,
                adminId: savedUser._id
            });
            const savedTeam = await newTeam.save();

            // 3. User ko update karo nayi Team ID ke saath
            savedUser.teamId = savedTeam._id;
            await savedUser.save();

            return res.status(201).json({ message: "Admin & Team created", user: savedUser });
        }

        // Members ke liye normal flow...
        const user = new User({ name, email, role, teamId: finalTeamId });
        await user.save();
        res.status(201).json({ message: "User created", user });

    } catch (err) {
        console.error("Signup error:", err);
        // Agar Team ID invalid format mein hai toh error handle karein
        res.status(500).json({ message: "Signup failed. Check if Team ID is valid." });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            message: "Login successful",
            user: { _id: user._id, name: user.name, email: user.email, role: user.role, teamId: user.teamId },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: err.message });
    }
};