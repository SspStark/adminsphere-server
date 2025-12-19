import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, trim: true },
    role: { type: String, enum: ["super-admin", "admin", "employee"], default: "employee" },
    createdAt: { type: Date, default: Date.now },
    profileImage: {
        url: { type: String, default: ''},
        publicId: { type: String, default: "" }
    }
});

const User = mongoose.model("User", userSchema);
export default User;