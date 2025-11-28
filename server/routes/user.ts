import { RequestHandler } from "express";

export const handleUser: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({ error: "Supabase configuration missing on server." });
    }

    const id = (req.query.id as string) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: "Missing id" });

    async function tryQueryUserById(idVal: string) {
      const urlA = `${supabaseUrl}/rest/v1/app_users?id=eq.${encodeURIComponent(idVal)}&select=*`;
      const urlB = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(idVal)}&select=*`;
      const doGet = async (url: string) => await fetch(url, { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } });

      let resp = await doGet(urlA);
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        if (txt && (txt.includes("Could not find the table 'public.app_users'") || txt.includes('PGRST205'))) {
          resp = await doGet(urlB);
        } else {
          return resp;
        }
      }
      return resp;
    }

    const resp = await tryQueryUserById(id);
    if (!resp.ok) {
      const dt = await resp.text();
      return res.status(500).json({ error: "Failed to query user", detail: dt });
    }

    const users = await resp.json();
    const user = Array.isArray(users) ? users[0] : users;
    if (!user) return res.status(404).json({ error: "User not found" });
    // don't return sensitive fields
    if (user.password_hash) delete user.password_hash;
    return res.json({ user });
  } catch (error: any) {
    console.error("user route error", error);
    return res.status(500).json({ error: error?.message || "Unknown error" });
  }
};
