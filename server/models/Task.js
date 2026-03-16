import mongoose from "mongoose"

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ["todo", "in-progress", "done"],
        default: "todo"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Ye User model se link karega
    }
})

export default mongoose.model("Task", taskSchema)