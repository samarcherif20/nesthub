import { defineConfig } from "prisma/config";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config();

export default defineConfig({
  migrations: {
    seed: "ts-node prisma/seed.js",
  },
});
