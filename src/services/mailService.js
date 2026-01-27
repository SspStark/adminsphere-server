import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_EMAIL_PASSWORD
    }
});

export const sendWelcomeEmail = async ({ firstName, lastName, email, username, password, role }) => {
    try {
        const mailOptions = {
            from: `AdminSphere <${process.env.APP_EMAIL}>`,
            to: email,
            subject: "Welcome to AdminSphere",
            html: `
                <h2>Welcome to AdminSphere</h2>
                <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p>Your account has been created successfully.</p>
    
                <h3>Login Details:</h3>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Role:</strong> ${role}</p>
    
                <p>Please log in and change your password immediately.</p>
    
                <br>
                <p>Regards,</p>
                <p><strong>AdminSphere Team</strong></p>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        return false;
    }

};

export const sendPasswordResetEmail = async (email, token) => {
    try {
        const resetLink = `http://localhost:5173/reset-password/${token}`;

        const mailOptions = {
            from: `AdminSphere <${process.env.APP_EMAIL}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <h2>Password Reset Requested</h2>
                <p>If you requested a password reset, click the link below:</p>
                <a href="${resetLink}">Reset Password</a>
                <br/><br/>
                <p>If you did NOT request this, ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (err) {
        console.error("Failed to send password reset email:", err);
        return false;
    }
};

export const sendEmailWithAttachment = async ({ to, subject, html, attachments }) => {
    try {
        await transporter.sendMail({
            from: `AdminSphere <${process.env.APP_EMAIL}>`,
            to,
            subject,
            html,
            attachments
        });
    } catch (error) {
        console.error("Failed to send users report:", error);
    }
}
