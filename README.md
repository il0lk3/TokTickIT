# TokTickIT

## Project Setup

### 1. Prerequisites
- Node.js (v20 or higher)
- Docker (for PostgreSQL database)

### 2. Database Setup
This project uses PostgreSQL and Prisma for database management.

Start the database using Docker:
```bash
docker compose up -d
```

To create the database tables and insert initial seed data (Categories), navigate to the `server/` directory and run:
```bash
cd server
npx prisma migrate dev
npx prisma db seed
cd ..
```

### 3. Install Dependencies
You need to install packages for both the backend (server) and frontend (client):
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Running the Application

Open two separate terminals to run both the server and the client:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```
*(Server will start on http://localhost:3000)*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*(Client will start on Vite's default port)*