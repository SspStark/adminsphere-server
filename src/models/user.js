import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { 
        type: String, 
        minlength: 6, 
        trim: true,
        required: function () {
            return this.authProvider.includes("local");
        }
     },
    role: { type: String, enum: ["super-admin", "admin", "employee"], default: "employee" },
    createdAt: { type: Date, default: Date.now },
    profileImage: {
        url: { type: String, default: ''},
        publicId: { type: String, default: "" }
    },
    authProvider: { type: [String], enum: ["local", "google"], default: ["local"] },
    googleId: { type: String, unique: true, sparse: true, default: null }
});

const User = mongoose.model("User", userSchema);
export default User;