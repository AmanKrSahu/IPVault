/* eslint-disable import/no-anonymous-default-export */
import { defineConfig } from "drizzle-kit";

export default defineConfig ({
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.NEON_DATABASE_URL!
  },
});