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