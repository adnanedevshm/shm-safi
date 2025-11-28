import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleRegister } from "./routes/register";
import { handleDebug } from "./routes/debug";
import { handleLogin } from "./routes/login";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/register", handleRegister);
  app.get("/api/debug/supabase", handleDebug);
  app.post("/api/login", handleLogin);
  app.get("/api/user", (req, res, next) => {
    const { handleUser } = require("./routes/user");
    return handleUser(req, res, next);
  });

  // Update user (PATCH) - allow editing profile from UI
  app.patch("/api/user", (req, res, next) => {
    const { handleUpdateUser } = require("./routes/updateUser");
    return handleUpdateUser(req, res, next);
  });

  app.post("/api/idees", (req, res, next) => {
    // lazy import to avoid circular issues
    const { handleIdee } = require("./routes/idees");
    return handleIdee(req, res, next);
  });

  app.get("/api/score", (req, res, next) => {
    const { handleScore } = require("./routes/score");
    return handleScore(req, res, next);
  });

  return app;
}
