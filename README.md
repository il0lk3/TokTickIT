## Database Setup
This project uses PostgreSQL and Prisma for database management.

### 1. Start the Database
We have provided a `docker-compose.yml` file to quickly spin up a local PostgreSQL database.
Run the following command in the root directory:
```bash
docker compose up -d
```

### 2. Run Migrations & Seed
To create the database tables and insert initial seed data (Categories), navigate to the `server/` directory and run:
```bash
cd server
npx prisma migrate dev
npx prisma db seed
```
This will apply migrations and explicitly run the seed script to populate initial Categories.