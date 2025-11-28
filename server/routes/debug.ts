import { RequestHandler } from "express";

export const handleDebug: RequestHandler = (_req, res) => {
  const url = !!process.env.SUPABASE_URL;
  const service = !!process.env.SUPABASE_SERVICE_ROLE;
  const anon = !!process.env.SUPABASE_ANON_KEY;
  res.json({ SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_set: service, SUPABASE_ANON_KEY_set: anon });
};
