import { RequestHandler } from "express";
import crypto from "crypto";

// Helper: produce a password hash using pbkdf2
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$310000$${salt}$${derived}`;
}

export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    // Ensure supabase config present
    if (!supabaseUrl || !serviceRole) {
      console.error("Supabase configuration missing. SUPABASE_URL or SUPABASE_SERVICE_ROLE is not set.");
      return res.status(500).json({ error: "Supabase configuration missing on server." });
    }

    let {
      id,
      prenom,
      nom,
      password,
      dob,
      phone,
      address,
      category, // optional category code, e.g. 'C' or 'D'
      role, // optional role code string
      niche_id, // optional niche id
      niche_superieur // optional flag for upper niche
    } = req.body as Record<string, any>;

    // If id not provided, generate one server-side and ensure uniqueness across app_users/users
    function randomNumber() {
      return Math.floor(Math.random() * 9999) + 1;
    }
    function genId() {
      const prefixes = ['Z','A','B','C','D','E','F','G','H','X'];
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      return `${p}${String(randomNumber()).padStart(4, '0')}`;
    }

    async function idExists(idVal: string) {
      const urlA = `${supabaseUrl}/rest/v1/app_users?id=eq.${encodeURIComponent(idVal)}&select=id`;
      const urlB = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(idVal)}&select=id`;
      const doGet = async (url: string) => await fetch(url, { headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` } });
      try {
        let resp = await doGet(urlA);
        if (resp.ok) {
          const arr = await resp.json();
          if (Array.isArray(arr) && arr.length > 0) return true;
        }
        resp = await doGet(urlB);
        if (resp.ok) {
          const arr = await resp.json();
          if (Array.isArray(arr) && arr.length > 0) return true;
        }
      } catch (e) {
        // ignore and assume not exists if error
      }
      return false;
    }

    if (!id) {
      // try to produce a unique id up to N attempts
      const MAX_ATTEMPTS = 20;
      let attempts = 0;
      let candidate = null;
      while (attempts < MAX_ATTEMPTS) {
        candidate = genId();
        // eslint-disable-next-line no-await-in-loop
        const exists = await idExists(candidate);
        if (!exists) break;
        attempts++;
      }
      if (!candidate) return res.status(500).json({ error: 'Failed generating user id' });
      id = candidate as string;
    }

    if (!id || !prenom || !nom || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Hash the password
    const password_hash = hashPassword(password);

    // If tutor provided, create tutor first to get tutor_id
    let tutor_id: number | null = null;
    if (req.body.tutor && typeof req.body.tutor === 'object') {
      const tutorPayload = {
        type: req.body.tutor.type || null,
        prenom: req.body.tutor.prenom || null,
        nom: req.body.tutor.nom || null,
        cin: req.body.tutor.cin || null,
        phone: req.body.tutor.phone || null,
        created_at: new Date().toISOString(),
      };

      const insertTutorResp = await fetch(`${supabaseUrl}/rest/v1/tutors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(tutorPayload),
      });

      if (!insertTutorResp.ok) {
        const dt = await insertTutorResp.text();
        console.warn('Failed to create tutor:', dt);
      } else {
        const tutorInserted = await insertTutorResp.json();
        const t = Array.isArray(tutorInserted) ? tutorInserted[0] : tutorInserted;
        tutor_id = t?.id ?? null;
      }
    }

    // Insert into app_users via Supabase REST API
    const userPayload: Record<string, any> = {
      id,
      prenom,
      nom,
      password_hash,
      dob: dob || null,
      phone: phone || null,
      address: address || null,
      role: role || null,
      niche_id: niche_id || null,
      niche_superieur: niche_superieur || false,
      tutor_id: tutor_id,
      created_at: new Date().toISOString(),
    };

    // Try inserting into app_users; if the table doesn't exist try users as fallback (to handle different DB schemas)
    async function tryInsertUser(): Promise<{ ok: boolean; data?: any; error?: string }> {
      const urlA = `${supabaseUrl}/rest/v1/app_users`;
      const urlB = `${supabaseUrl}/rest/v1/users`;

      const doPostWithBody = async (url: string, bodyPayload: Record<string, any>) => {
        return await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceRole,
            Authorization: `Bearer ${serviceRole}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(bodyPayload),
        });
      };

      // First try app_users
      let resp = await doPostWithBody(urlA, userPayload);
      let respBody = await resp.text().catch(() => "");

      if (!resp.ok) {
        // Detect PostgREST missing table error and fallback to users
        if ((respBody && respBody.includes("Could not find the table 'public.app_users'")) || respBody.includes('PGRST205')) {
          // Try inserting into users, removing problematic columns if needed
          let currentPayload = { ...userPayload };
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            resp = await doPostWithBody(urlB, currentPayload);
            respBody = await resp.text().catch(() => "");

            if (resp.ok) {
              const data = respBody ? JSON.parse(respBody) : null;
              return { ok: true, data };
            }

            // Try to detect missing column error and remove it
            // Patterns: "Could not find the column 'address'" or 'column "address" does not exist'
            const m = respBody.match(/Could not find the column '([^']+)'/) ||
                      respBody.match(/column "([^"]+)" does not exist/) ||
                      respBody.match(/Unexpected key in JSON: '([^']+)'/) ||
                      respBody.match(/Unexpected key in JSON: "([^"]+)"/);

            if (m && m[1]) {
              const col = m[1];
              if (col in currentPayload) {
                delete currentPayload[col];
                attempts++;
                continue;
              }
            }

            // If we couldn't handle the error, return the error
            return { ok: false, error: respBody };
          }

          return { ok: false, error: respBody };
        } else {
          // For other errors when inserting into app_users, return error
          return { ok: false, error: respBody };
        }
      }

      // Success case: parse the response body
      const data = respBody ? JSON.parse(respBody) : null;
      return { ok: true, data };
    }

    const insertUserResult = await tryInsertUser();

    if (!insertUserResult.ok) {
      return res.status(500).json({ error: "Failed to insert user", detail: insertUserResult.error });
    }

    const insertedUsers = insertUserResult.data;
    const insertedUser = Array.isArray(insertedUsers) ? insertedUsers[0] : insertedUsers;

    // If category provided, assign
    if (category) {
      const catPayload = { user_id: id, category_code: category };
      const insertCat = await fetch(`${supabaseUrl}/rest/v1/user_categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(catPayload),
      });

      if (!insertCat.ok) {
        // Not fatal for user creation; return warning
        const detail = await insertCat.text();
        return res.status(201).json({ user: insertedUser, warning: "User created but failed to assign category", detail });
      }
    }

    return res.status(201).json({ user: insertedUser });
  } catch (error: any) {
    console.error("register error", error);
    return res.status(500).json({ error: error?.message || "Unknown error" });
  }
};
