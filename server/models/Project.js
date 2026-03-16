import mongoose from "mongoose"

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team"
    }
})

export default mongoose.model("Project", projectSchema)