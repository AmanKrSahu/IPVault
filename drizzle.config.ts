import "dotenv/config"
import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!,
  },
} satisfies Config;
