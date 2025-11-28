import { RequestHandler } from "express";

export const handleNiches: RequestHandler = async (_req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Fetch niches from the niches table
    const url = `${supabaseUrl}/rest/v1/niches?select=*`;
    const resp = await fetch(url, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("Failed to fetch niches:", errText);
      // Return empty list if table doesn't exist or query fails
      return res.json([]);
    }

    const niches = await resp.json();
    return res.json(niches);
  } catch (err: any) {
    console.error("niches route error", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
};
