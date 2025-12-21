import mongoose from "mongoose";

const authLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    action: {
        type: String,
        enum: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "GOOGLE_LOGIN", "PASSWORD_RESET", "SESSION_REPLACED"],
        required: true,
    },
    provider: {
        type: String,
        enum: ["local", "google"],
        required: true
    },
    ip: String,
    userAgent: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const AuthLog = mongoose.model("AuthLog", authLogSchema);
export default AuthLog;