import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.APP_EMAIL,
        password: process.env.APP_EMAIL_PASSWORD
    }
});

export const sendWelcomeEmail = async ({ firstName, lastName, email, username, password, role }) => {
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
};