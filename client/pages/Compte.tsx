import React, { useEffect, useState } from "react";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";

export default function Compte() {
  const { user } = useAuth();
  const [remoteUser, setRemoteUser] = useState<any | null>(null);
  const [score, setScore] = useState<number | null>(user.monthly_score ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchRemoteUser() {
      try {
        let id = user.external_code || (user as any).id;
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("shm_user");
            if (stored) {
              const parsed = JSON.parse(stored);
              id =
                parsed.external_code || parsed.externalCode || parsed.id || id;
            }
          } catch (e) {}
        }
        if (!id) return;
        if (
          typeof window !== "undefined" &&
          "onLine" in navigator &&
          !navigator.onLine
        ) {
          // offline - skip
          return;
        }
        const base =
          (import.meta as any).env?.VITE_API_BASE || window.location.origin;
        const url = `${base.replace(/\/$/, "")}/api/user?id=${encodeURIComponent(id)}`;
        const resp = await fetch(url, { credentials: "same-origin" });
        if (!resp.ok) {
          console.warn("Non-ok response from /api/user", resp.status);
          return;
        }
        const data = await resp.json();
        if (!mounted) return;
        setRemoteUser(data.user || null);
      } catch (e) {
        console.warn("Failed loading remote user", e);
      }
    }

    async function fetchScore() {
      setLoading(true);
      if (
        typeof window !== "undefined" &&
        "onLine" in navigator &&
        !navigator.onLine
      ) {
        setLoading(false);
        return;
      }
      try {
        const base =
          (import.meta as any).env?.VITE_API_BASE || window.location.origin;
        const url = `${base.replace(/\/$/, "")}/api/score`;
        const resp = await fetch(url, { credentials: "same-origin" });
        if (!resp.ok) {
          console.warn("Non-ok response from /api/score", resp.status);
          setLoading(false);
          return;
        }
        const data = await resp.json();
        if (!mounted) return;
        if (data && typeof data.score === "number") setScore(data.score);
      } catch (e) {
        console.warn("Failed loading score", e);
      } finally {
        setLoading(false);
      }
    }

    fetchRemoteUser();
    fetchScore();
    return () => {
      mounted = false;
    };
  }, [user.external_code]);

  const displayUser = remoteUser || user;

  // Edit states
  const [editingBasic, setEditingBasic] = React.useState(false);
  const [editingTutor, setEditingTutor] = React.useState(false);
  const [form, setForm] = React.useState<any>({});
  const [tutorForm, setTutorForm] = React.useState<any>({});

  React.useEffect(() => {
    setForm({
      prenom: displayUser?.prenom || "",
      nom: displayUser?.nom || "",
      dob: displayUser?.dob || "",
      phone: displayUser?.phone || "",
      address: displayUser?.address || "",
      cin: (displayUser as any)?.cin || "",
    });
    setTutorForm({
      prenom: (displayUser as any)?.tutor?.prenom || "",
      nom: (displayUser as any)?.tutor?.nom || "",
      type: (displayUser as any)?.tutor?.type || "",
      cin: (displayUser as any)?.tutor?.cin || "",
      phone: (displayUser as any)?.tutor?.phone || "",
    });
  }, [remoteUser?.id, user.external_code]);

  function computeAgeFromDob(dob?: string) {
    if (!dob) return undefined;
    const b = new Date(dob);
    if (isNaN(b.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }

  const firstName =
    (displayUser as any).prenom || (displayUser.name || "").split(" ")[0] || "";
  const lastName =
    (displayUser as any).nom ||
    (displayUser.name || "").split(" ").slice(1).join(" ") ||
    "";
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : displayUser.name || "";
  const isChef =
    String(displayUser.role || "")
      .toLowerCase()
      .includes("chef") ||
    String(displayUser.niche_id || "")
      .toLowerCase()
      .includes("chef") ||
    (typeof window !== "undefined" &&
      window.location.pathname.includes("compte-chef"));

  async function saveBasic() {
    try {
      const id = displayUser.external_code || (displayUser as any).id;
      const payload: Record<string, any> = { id };
      // only include fields that changed and are non-empty (avoid sending columns that may not exist)
      const candidateFields = ["prenom", "nom", "dob", "phone", "cin"];
      for (const k of candidateFields) {
        const newVal = (form as any)[k];
        const oldVal = (displayUser as any)[k] ?? "";
        if (
          typeof newVal !== "undefined" &&
          newVal !== "" &&
          String(newVal) !== String(oldVal)
        ) {
          payload[k] = newVal;
        }
      }

      // nothing to update
      if (Object.keys(payload).length <= 1) {
        setEditingBasic(false);
        return;
      }

      const base =
        (import.meta as any).env?.VITE_API_BASE || window.location.origin;
      const url = `${base.replace(/\/$/, "")}/api/user`;
      const resp = await fetch(url, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.warn("Save basic failed response", resp.status, txt);
        throw new Error("Failed to save");
      }
      const json = await resp.json();
      try {
        localStorage.setItem("shm_user", JSON.stringify(json.user));
      } catch (e) {}
      setEditingBasic(false);
      const newUser = json.user || remoteUser;
      setRemoteUser(newUser);
      setForm({
        prenom: newUser?.prenom || "",
        nom: newUser?.nom || "",
        dob: newUser?.dob || "",
        phone: newUser?.phone || "",
        address: newUser?.address || "",
        cin: newUser?.cin || "",
      });
    } catch (e: any) {
      console.warn("Save basic failed", e);
      alert("Échec de l’enregistrement");
    }
  }

  async function saveTutor() {
    try {
      const id = displayUser.external_code || (displayUser as any).id;
      const tutorPayload: Record<string, any> = {};
      const keys = ["prenom", "nom", "type", "cin", "phone"];
      for (const k of keys) {
        const v = (tutorForm as any)[k];
        if (typeof v !== "undefined" && v !== "") tutorPayload[k] = v;
      }

      if (Object.keys(tutorPayload).length === 0) {
        setEditingTutor(false);
        return;
      }

      const payload = { id, tutor: tutorPayload };
      const base =
        (import.meta as any).env?.VITE_API_BASE || window.location.origin;
      const url = `${base.replace(/\/$/, "")}/api/user`;
      const resp = await fetch(url, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.warn("Save tutor failed response", resp.status, txt);
        throw new Error("Failed to save tutor");
      }
      const json = await resp.json();
      try {
        localStorage.setItem("shm_user", JSON.stringify(json.user));
      } catch (e) {}
      setEditingTutor(false);
      const newUser = json.user || remoteUser;
      setRemoteUser(newUser);
      setTutorForm({
        prenom: newUser?.tutor?.prenom || "",
        nom: newUser?.tutor?.nom || "",
        type: newUser?.tutor?.type || "",
        cin: newUser?.tutor?.cin || "",
        phone: newUser?.tutor?.phone || "",
      });
    } catch (e: any) {
      console.warn("Save tutor failed", e);
      alert("Échec de l’enregistrement du tuteur");
    }
  }

  return (
    <AuthenticatedLayout>
      <section>
        <h1 className="text-2xl font-bold">Mon Espace Compte</h1>
        <p className="mt-2 text-sm text-slate-700">Bienvenue, {displayName}</p>

        {/* Full profile card */}
        <div className="mt-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Détails du compte
              <div>
                {!editingBasic ? (
                  <button
                    onClick={() => setEditingBasic(true)}
                    className="text-sm text-violet-600"
                  >
                    ✏️ Modifier
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveBasic}
                      className="text-sm text-white bg-violet-600 px-3 py-1 rounded"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        setEditingBasic(false);
                        setForm({ ...form });
                      }}
                      className="ml-2 text-sm"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500">Prénom</p>
                {!editingBasic ? (
                  <p className="font-medium">
                    {(displayUser as any).prenom || firstName || "—"}
                  </p>
                ) : (
                  <input
                    value={form.prenom}
                    onChange={(e) =>
                      setForm((s: any) => ({ ...s, prenom: e.target.value }))
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                  />
                )}

                <p className="text-sm text-slate-500 mt-3">Nom</p>
                {!editingBasic ? (
                  <p className="font-medium">
                    {(displayUser as any).nom || lastName || "—"}
                  </p>
                ) : (
                  <input
                    value={form.nom}
                    onChange={(e) =>
                      setForm((s: any) => ({ ...s, nom: e.target.value }))
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                  />
                )}

                <p className="text-sm text-slate-500 mt-3">ID</p>
                <p className="font-medium">
                  {displayUser.external_code || "—"}
                </p>

                <p className="text-sm text-slate-500 mt-3">R��le</p>
                <p className="font-medium">{displayUser.role || "—"}</p>

                <p className="text-sm text-slate-500 mt-3">Niche</p>
                <p className="font-medium">{displayUser.niche_id || "—"}</p>

                <p className="text-sm text-slate-500 mt-3">CIN</p>
                {!editingBasic ? (
                  <p className="font-medium">
                    {(displayUser as any).cin || "—"}
                  </p>
                ) : (
                  <input
                    value={form.cin}
                    onChange={(e) =>
                      setForm((s: any) => ({ ...s, cin: e.target.value }))
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                  />
                )}

                <p className="text-sm text-slate-500 mt-3">Âge</p>
                <p className="font-medium">
                  {computeAgeFromDob((displayUser as any).dob) ?? "—"}
                </p>

                <p className="text-sm text-slate-500 mt-3">
                  Téléphone (membre)
                </p>
                {!editingBasic ? (
                  <p className="font-medium">
                    {(displayUser as any).phone || "—"}
                  </p>
                ) : (
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((s: any) => ({ ...s, phone: e.target.value }))
                    }
                    className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                  />
                )}
              </div>

              {!isChef && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm text-slate-500">Tuteur</h3>
                    {!editingTutor ? (
                      <button
                        onClick={() => setEditingTutor(true)}
                        className="text-sm text-violet-600"
                      >
                        ✏️ Modifier le tuteur
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={saveTutor}
                          className="text-sm text-white bg-violet-600 px-3 py-1 rounded"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingTutor(false)}
                          className="ml-2 text-sm"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-slate-500">Prénom</p>
                    {!editingTutor ? (
                      <p className="font-medium">
                        {(displayUser as any).tutor?.prenom || "—"}
                      </p>
                    ) : (
                      <input
                        value={tutorForm.prenom}
                        onChange={(e) =>
                          setTutorForm((s: any) => ({
                            ...s,
                            prenom: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                      />
                    )}

                    <p className="text-sm text-slate-500 mt-3">Nom</p>
                    {!editingTutor ? (
                      <p className="font-medium">
                        {(displayUser as any).tutor?.nom || "—"}
                      </p>
                    ) : (
                      <input
                        value={tutorForm.nom}
                        onChange={(e) =>
                          setTutorForm((s: any) => ({
                            ...s,
                            nom: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                      />
                    )}

                    <p className="text-sm text-slate-500 mt-3">Type</p>
                    {!editingTutor ? (
                      <p className="font-medium">
                        {(displayUser as any).tutor?.type || "—"}
                      </p>
                    ) : (
                      <input
                        value={tutorForm.type}
                        onChange={(e) =>
                          setTutorForm((s: any) => ({
                            ...s,
                            type: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                      />
                    )}

                    <p className="text-sm text-slate-500 mt-3">
                      Téléphone (tuteur)
                    </p>
                    {!editingTutor ? (
                      <p className="font-medium">
                        {(displayUser as any).tutor?.phone || "—"}
                      </p>
                    ) : (
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={tutorForm.phone}
                        onChange={(e) =>
                          setTutorForm((s: any) => ({
                            ...s,
                            phone: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sections - support temporarily hidden */}
        <div className="mt-6 space-y-2">
          <h2 className="font-semibold">Sections</h2>
          <ul className="grid md:grid-cols-3 gap-2">
            <li className="p-3 bg-white rounded shadow">
              <Link to="/activites">Mes activités</Link>
            </li>
            <li className="p-3 bg-white rounded shadow">
              <Link to="/membres">Mes évaluations</Link>
            </li>
            <li className="p-3 bg-white rounded shadow">
              <Link to="/marketplace">Mes achats</Link>
            </li>
            <li className="p-3 bg-white rounded shadow">Notifications</li>
          </ul>
        </div>
      </section>
    </AuthenticatedLayout>
  );
}
