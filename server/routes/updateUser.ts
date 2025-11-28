import { RequestHandler } from "express";

export const handleUpdateUser: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceRole) {
      return res
        .status(500)
        .json({ error: "Supabase configuration missing on server." });
    }

    const body = req.body as Record<string, any>;
    const id = body.id as string;
    if (!id) return res.status(400).json({ error: "Missing id" });

    // Allowed user fields to update
    const allowed = [
      "prenom",
      "nom",
      "dob",
      "phone",
      "address",
      "role",
      "niche_id",
      "cin",
    ];

    const userPayload: Record<string, any> = {};
    for (const k of allowed) {
      if (k in body) userPayload[k] = body[k] ?? null;
    }

    // If tutor provided, try to find existing tutor by CIN and update it, otherwise create a new tutor and attach tutor_id
    let tutor_id: number | null = null;
    if (body.tutor && typeof body.tutor === "object") {
      const tutorPayload = {
        type: body.tutor.type || null,
        prenom: body.tutor.prenom || null,
        nom: body.tutor.nom || null,
        cin: body.tutor.cin || null,
        phone: body.tutor.phone || null,
        created_at: new Date().toISOString(),
      };

      try {
        // If CIN provided, try to find existing tutor
        if (tutorPayload.cin) {
          const q = `${supabaseUrl}/rest/v1/tutors?cin=eq.${encodeURIComponent(tutorPayload.cin)}&select=*`;
          const findResp = await fetch(q, {
            headers: {
              apikey: serviceRole,
              Authorization: `Bearer ${serviceRole}`,
            },
          });
          if (findResp.ok) {
            const arr = await findResp.json();
            const existing =
              Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
            if (existing && existing.id) {
              // update existing tutor
              const tutorId = existing.id;
              const patchUrl = `${supabaseUrl}/rest/v1/tutors?id=eq.${encodeURIComponent(tutorId)}`;
              const patchResp = await fetch(patchUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  apikey: serviceRole,
                  Authorization: `Bearer ${serviceRole}`,
                  Prefer: "return=representation",
                },
                body: JSON.stringify(tutorPayload),
              });
              if (patchResp.ok) {
                const updated = await patchResp.json();
                const t = Array.isArray(updated) ? updated[0] : updated;
                tutor_id = t?.id ?? tutorId;
                userPayload.tutor_id = tutor_id;
              }
            }
          }
        }

        // If no existing tutor updated, create a new one
        if (!tutor_id) {
          const insertTutorResp = await fetch(`${supabaseUrl}/rest/v1/tutors`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceRole,
              Authorization: `Bearer ${serviceRole}`,
              Prefer: "return=representation",
            },
            body: JSON.stringify(tutorPayload),
          });

          if (insertTutorResp.ok) {
            const tutorInserted = await insertTutorResp.json();
            const t = Array.isArray(tutorInserted)
              ? tutorInserted[0]
              : tutorInserted;
            tutor_id = t?.id ?? null;
            userPayload.tutor_id = tutor_id;
          } else {
            const dt = await insertTutorResp.text().catch(() => "");
            console.warn("Failed to create tutor during update:", dt);
          }
        }
      } catch (err) {
        console.warn(
          "Failed to create/update tutor during update (network):",
          err,
        );
      }
    }

    // Patch user row by id. Try app_users first then users
    const urlA = `${supabaseUrl}/rest/v1/app_users?id=eq.${encodeURIComponent(id)}`;
    const urlB = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}`;

    const doPatch = async (url: string, payload: Record<string, any>) => {
      return await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });
    };

    // First try app_users
    try {
      let resp = await doPatch(urlA, userPayload);
      if (!resp.ok) {
        // fallback to users
        resp = await doPatch(urlB, userPayload);
        if (!resp.ok) {
          // attempt to detect missing columns in the error message and retry without them
          let errTxt = await resp.text().catch(() => "");
          let attempts = 0;
          let currentPayload: Record<string, any> = { ...userPayload };

          while (attempts < 5) {
            // find quoted identifiers in error text
            const singleQuoted = Array.from(errTxt.matchAll(/'([^']+)'/g)).map(
              (m) => m[1],
            );
            const doubleQuoted = Array.from(errTxt.matchAll(/"([^"]+)"/g)).map(
              (m) => m[1],
            );
            const candidates = [...singleQuoted, ...doubleQuoted];

            let removed = false;
            for (const token of candidates) {
              if (token in currentPayload) {
                delete currentPayload[token as keyof typeof currentPayload];
                removed = true;
                break;
              }
            }

            if (!removed) {
              const m2 = errTxt.match(/column\s+([A-Za-z0-9_]+)/i);
              if (m2 && m2[1] && m2[1] in currentPayload) {
                delete currentPayload[m2[1] as keyof typeof currentPayload];
                removed = true;
              }
            }

            if (!removed) break;

            const retry = await doPatch(urlB, currentPayload);
            if (retry.ok) {
              const updated = await retry.json();
              return res.json({
                user: Array.isArray(updated) ? updated[0] : updated,
              });
            }
            errTxt = await retry.text().catch(() => "");
            attempts++;
          }

          // Could not recover
          return res
            .status(500)
            .json({ error: "Failed to update user", detail: errTxt });
        }
      }

      const updated = await resp.json();
      // After patch, try to retrieve full user record to ensure we return all fields (including role/niche)
      try {
        const getUrlA = `${supabaseUrl}/rest/v1/app_users?id=eq.${encodeURIComponent(id)}&select=*`;
        const getUrlB = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}&select=*`;
        let getResp = await fetch(getUrlA, {
          headers: {
            apikey: serviceRole,
            Authorization: `Bearer ${serviceRole}`,
          },
        });
        if (!getResp.ok) {
          getResp = await fetch(getUrlB, {
            headers: {
              apikey: serviceRole,
              Authorization: `Bearer ${serviceRole}`,
            },
          });
        }
        if (getResp.ok) {
          const users = await getResp.json();
          const fullUser = Array.isArray(users) ? users[0] : users;
          return res.json({ user: fullUser });
        }
      } catch (e) {
        // ignore and fallback to returning updated
        console.warn("Failed to fetch full user after update", e);
      }

      return res.json({ user: Array.isArray(updated) ? updated[0] : updated });
    } catch (err: any) {
      console.error("updateUser network error", err);
      return res.status(500).json({ error: err?.message || "Network error" });
    }
  } catch (error: any) {
    console.error("updateUser error", error);
    return res.status(500).json({ error: error?.message || "Unknown error" });
  }
};
