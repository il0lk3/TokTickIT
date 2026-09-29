import { app } from "./app.js";

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`TokTickIT API listening on http://localhost:${PORT}`);
});
