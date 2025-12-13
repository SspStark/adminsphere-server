import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../services/mailService.js";

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, username, password, role } = req.body;

        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists)  return res.status(400).json({ success: false, message: "Email already exists" });

        const usernameExists = await User.findOne({ username: new RegExp("^" + username + "$", "i") });
        if (usernameExists) return res.status(400).json({ success: false, message: "Username already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({ 
            firstName, lastName, email, username, password: hashedPassword, role
        });

        const emailSent = await sendWelcomeEmail({ firstName, lastName, email, username, password, role });

        res.status(201).json({ 
            success: true, 
            message: emailSent ? "User created successfully and email sent" : "User created successfully but welcome email failed", 
            user: { username, email, role } });
    } catch (error) {
        console.error("Create user error", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const actingUser = req.user;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Protect super-admin
        if (targetUser.role === "super-admin" && actingUser.role !== "super-admin") {
            return res.status(403).json({ success: false, message: "Only super-admin can modify super-admin user" });
        }

        // Role change validations
        if (req.body.role === "super-admin" && actingUser.role !== "super-admin") {
            return res.status(403).json({ success: false, message: "Only super-admin can assign super-admin role" });
        }

        // Username uniqueness if changing username
        if (req.body.username) {
            const exists = await User.findOne({ username: new RegExp("^" + req.body.username + "$", "i") });
            if (exists && exists._id.toString() !== id) {
                return res.status(400).json({ success: false, message: "Username already exists" });
            }
        }

        const allowedFields = ["firstName", "lastName", "username", "role"];
        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        await User.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error("Admin update user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const resetUserPasswordByAdmin = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { id } = req.params;
        const actingUser = req.user;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Protect super-admin
        if (user.role === "super-admin" && actingUser.role !== "super-admin") {
            return res.status(403).json({ success: false, message: "Only super-admin can update super-admin password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Admin reset password error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user){
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Protect super-admin
        if (user.role === "super-admin") {
            return res.status(403).json({ success: false, message: "Access denied. Cannot delete a super admin." });
        }

        await User.findByIdAndDelete(id);

        // Clean Redis sessions
        const redisClient = getRedisClient();
        await redisClient.del(`session:${id}`);
        await redisClient.del(`password_reset:${id}`);

        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select("-password");
  
      return res.status(200).json({
        success: true,
        count: users.length,
        users
      });
  
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Server error"
      });
    }
  };
  