## AdminSphere
AdminSphere is a backend-heavy admin management system built to practice and demonstrate real-world backend concepts such as authentication, authorization, session management, security, background jobs, document generation, logs and system design.

The focus of this project is **backend architecture and correctness**. not UI polish.

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- Redis (Upstash)
- JWT Authentication
- Google OAuth 2.0
- Nodemailer
- Socket.IO
- Cloudinary
- Puppeteer
- ExcelJS
- node-cron
- Winston (logging)

## Architecture Overview
The project follows a layered architecture:
- Routes: API endpoints and access control
- Controllers: Request Orchestration
- Services: Business logic and external integrations (Email, Redis, PDF, Excel, Socket, Events) 
- Middlewares: Authentication, validation, ratelimiting
- Cron Jobs: Background scheduled tasks
- Utilities: Reusable helper functions

## Authentication & Authorization
### Authentication
- JWT-based authentication is used for stateless client communication.
- JWTs are stored in HTTP-only cookies for security.
- Redis is used alongside JWTs to enforce *single active session per user*.

Why JWT + Redis?
- JWT alone cannot be revoked.
- Redis allows server-side session invalidation and forced logout.

## Session Management
- Each user can have only one active session at a time.
- On login, a new session ID is generated and stored in Redis.
- Logging in from another device invalidates the previous session.
- Sessions are validated on every request via middleware.

This approach prevents:
- multiple concurrent logins.
- stolen token misuse.

## Security
- Password hashing using bcrypt.
- Rate limiting for login and password reset endpoints.
- Account lock after repeated failed login attempts.
- Email enumeration protection in forgot-password flow.
- Helmet for secure HTTP headers.
- Validation using express-validator.

## File Uploads
- User profile images are uploaded using Multer (memory storage).
- Images are uploaded to Cloudinary using streams.
- Old images are deleted on replacement to avoid orphaned files.
- If no profile image exists, initials-based avatar is used.

## Document Generation

### PDF
- PDFs are generated using Puppeteer.
- EJS templates are used to render HTML before PDF generation.
- PDFs are generated in memory and streamed to the client.

### Excel
- Excel files are generated using ExcelJS.
- Data is written to XLSX format in memory.
- Suitable for admin exports and reports.

## Background Jobs (Cron)
- node-cron is used for scheduled background tasks.
- Cron jobs are centrally registered.
- Implemented jobs:
  - Session cleanup
  - Daily users PDF report via email