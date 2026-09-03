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

Copy the example environment file in the `server` directory:
```bash
cd server
cp .env.example .env
```

To create the database tables and insert initial seed data (Categories), ensure you are in the `server/` directory and run:
```bash
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

### 5. Running Tests

This project includes automated tests for both the backend (API/Unit tests) and the frontend (UI/Component tests).

**Run Backend Tests:**
```bash
cd server
npm run test
```

**Run Frontend Tests:**
```bash
cd client
npm run test
```