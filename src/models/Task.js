import mongoose, { mongo } from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
      
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        dueDate: { type: Date, default: null },
        completedAt: { type: Date, default: null },
        attachments: [{ url: String, publicId: String, fileName: String, fileType: String, resourceType: String }],
        comments: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            message: String,
            createdAt: { type: Date, default: Date.now },
          }],
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// INDEXES
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });

// PRE SAVE HOOK
taskSchema.pre("save", function () {
    if (!this.isModified("status")) return;

    if (this.status === "completed") {
        this.completedAt = new Date();
    } else {
        this.completedAt = null;
    }
});

const Task = mongoose.model("Task", taskSchema);
export default Task;