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
      niche_id // optional niche id
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
      tutor_id: tutor_id,
      created_at: new Date().toISOString(),
    };

    // Try inserting into app_users; if the table doesn't exist try users as fallback (to handle different DB schemas)
    async function tryInsertUser() {
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
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        // Detect PostgREST missing table error and fallback to users
        if ((txt && txt.includes("Could not find the table 'public.app_users'")) || txt.includes('PGRST205')) {
          // Try inserting into users with the original payload first
          resp = await doPostWithBody(urlB, userPayload);

          if (!resp.ok) {
            const txt2 = await resp.text().catch(() => "");

            // Try to detect missing column error and retry without that column
            // Patterns: "Could not find the column 'address'" or 'column "address" does not exist'
            const m = txt2.match(/Could not find the column '([^']+)'/) || txt2.match(/column "([^"]+)" does not exist/);
            if (m && m[1]) {
              const col = m[1];
              if (col in userPayload) {
                const filtered = { ...userPayload };
                delete filtered[col as keyof typeof filtered];
                // Retry once with filtered payload
                const retryResp = await doPostWithBody(urlB, filtered);
                return retryResp;
              }
            }

            // If we couldn't handle the error specially, return the response we got from users
            return resp;
          }
        } else {
          // For other errors when inserting into app_users, return original response
          return resp;
        }
      }

      return resp;
    }

    const insertUserResp = await tryInsertUser();

    if (!insertUserResp.ok) {
      const errText = await insertUserResp.text();
      return res.status(500).json({ error: "Failed to insert user", detail: errText });
    }

    const insertedUsers = await insertUserResp.json();
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
