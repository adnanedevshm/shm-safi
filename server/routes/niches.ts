import { RequestHandler } from "express";

// Default niches if table is empty or doesn't exist
const DEFAULT_NICHES = [
  { id: "actualites", name: "Actualités" },
  { id: "organisation", name: "Organisation" },
  { id: "projet", name: "Projet" },
  { id: "rapports", name: "Rapports" },
  { id: "lois", name: "Lois" },
];

export const handleNiches: RequestHandler = async (_req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !serviceRole) {
      console.warn("Supabase not configured, returning default niches");
      return res.json(DEFAULT_NICHES);
    }

    // Try to fetch niches from the niches table
    const url = `${supabaseUrl}/rest/v1/niches?select=*`;
    const resp = await fetch(url, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("Failed to fetch niches from database:", errText);
      // Return default niches if table doesn't exist or query fails
      return res.json(DEFAULT_NICHES);
    }

    const niches = await resp.json();

    // If database is empty, return default niches
    if (!Array.isArray(niches) || niches.length === 0) {
      console.warn("Niches table is empty, returning default niches");
      return res.json(DEFAULT_NICHES);
    }

    return res.json(niches);
  } catch (err: any) {
    console.error("niches route error", err);
    // Return default niches on any error
    return res.json(DEFAULT_NICHES);
  }
};
