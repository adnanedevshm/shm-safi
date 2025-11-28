import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [id, setId] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [dob, setDob] = useState("");
  const [newPass, setNewPass] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function verifyAndSet(e: React.FormEvent) {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("shm_users") || "{}");
    if (!users[id]) return setMessage("Utilisateur introuvable");
    const u = users[id];
    // compare prenom, nom, dob
    if (
      (u.prenom || "").toLowerCase() !== prenom.toLowerCase() ||
      (u.nom || "").toLowerCase() !== nom.toLowerCase() ||
      (u.dob || "") !== dob
    ) {
      return setMessage("Les informations ne correspondent pas");
    }
    users[id].password = newPass;
    localStorage.setItem("shm_users", JSON.stringify(users));
    setMessage("Mot de passe mis à jour avec succès (local)");
  }

  return (
    <MainLayout>
      <section className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5 p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-slate-600 mb-4">
            Pour des raisons de sécurité, saisissez votre ID, prénom, nom et
            date de naissance
          </p>

          <form className="grid gap-3" onSubmit={verifyAndSet}>
            <input
              placeholder="ID (ex: E0001)"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="h-11 rounded-md border border-slate-200 bg-white px-3"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3"
              />
              <input
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-white px-3"
              />
            </div>
            <input
              placeholder="Date de naissance (JJ-MM-AAAA)"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="h-11 rounded-md border border-slate-200 bg-white px-3"
            />
            <input
              placeholder="Nouveau mot de passe"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              type="password"
              className="h-11 rounded-md border border-slate-200 bg-white px-3"
            />
            <Button className="bg-violet-600 hover:bg-violet-700">
              Valider
            </Button>
          </form>

          {message && (
            <div className="mt-4 text-sm text-slate-700">{message}</div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
