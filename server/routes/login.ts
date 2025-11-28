import crypto from "crypto";

function verifyPassword(password: string, stored: string) {
  // stored format: pbkdf2_sha256$iterations$salt$derived
  try {
    const parts = stored.split("$");
    if (parts.length !== 4) return false;
    const [algo, iterStr, salt, derived] = parts;
    const iterations = parseInt(iterStr, 10);
    const computed = crypto.pbkdf2Sync(password, salt, iterations, Buffer.from(derived, "hex").length, "sha256").toString("hex");
    return computed === derived;
  } catch (e) {
    return false;
  }
}

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceRole) {
      return res.status(500).json({ error: "Supabase configuration missing on server." });
    }

    const { id, password } = req.body as { id?: string; password?: string };
    if (!id || !password) return res.status(400).json({ error: "Missing id or password" });

    // Fetch user by id
    // Try querying app_users first, fallback to users if table missing
    async function tryQueryUserById(idVal: string) {
      const urlA = `${supabaseUrl}/rest/v1/app_users?id=eq.${encodeURIComponent(idVal)}&select=*`;
      const urlB = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(idVal)}&select=*`;

      const doGet = async (url: string) => await fetch(url, { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } });

      let resp = await doGet(urlA);
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        if (txt && txt.includes("Could not find the table 'public.app_users'") || txt.includes('PGRST205')) {
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
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const stored = user.password_hash as string | undefined;
    if (!stored) return res.status(401).json({ error: "Invalid credentials" });

    const ok = verifyPassword(password, stored);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // Remove sensitive fields
    delete user.password_hash;

    return res.json({ user });
  } catch (error: any) {
    console.error("login error", error);
    return res.status(500).json({ error: error?.message || "Unknown error" });
  }
};
