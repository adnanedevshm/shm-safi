import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

type Draft = {
  id: string;
  prenom: string;
  nom: string;
  password: string;
  dob: string;
  cin?: string;
  phone?: string;
  address?: string;
};

function generateRandomNumber() {
  return Math.floor(Math.random() * 9999) + 1;
}

function generateId(prefix?: string) {
  const prefixes = ['Z','A','B','C','D','E','F','G','H','X'];
  let chosen = '';
  if (prefix && typeof prefix === 'string' && /^[A-Z]$/i.test(prefix)) {
    chosen = prefix.toUpperCase();
  } else {
    chosen = prefixes[Math.floor(Math.random() * prefixes.length)];
  }
  return `${chosen}${String(generateRandomNumber()).padStart(4, "0")}`;
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => {
    let id = generateId();
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        if (cat && /^[A-Z]$/i.test(cat)) {
          id = generateId(cat.toUpperCase().slice(0, 1));
        }
      }
    } catch (e) {}
    return { id, prenom: "", nom: "", password: "", dob: "", cin: "" };
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const maxStep = 3; // three steps: compte, perso, tuteur

  function isValidDobRange(dob?: string, minYear?: number, maxYear?: number) {
    if (!dob) return false;
    const parts = dob.split("-");
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const minY = typeof minYear === 'number' ? minYear : 1900;
    const maxY = typeof maxYear === 'number' ? maxYear : currentYear;
    if (year < minY || year > maxY) {
      console.debug('DOB out of range', { year, min: minY, max: maxY });
      return false;
    }
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }

  function next() {
    // visible validation: show messages in UI
    setError(null);
    if (step === 1) {
      const missing = [] as string[];
      if (!draft.prenom) missing.push('Prénom');
      if (!draft.nom) missing.push('Nom');
      if (!draft.password) missing.push('Mot de passe');
      if (missing.length) {
        setError(`Champ(s) obligatoires manquant(s) : ${missing.join(', ')}`);
        return;
      }
    }
    if (step === 2) {
      const now = new Date();
      const currentYear = now.getFullYear();
      // Require birth year > 1940 and < current year
      const minYear = 1941;
      const maxYear = currentYear - 1;
      if (!isValidDobRange(draft.dob, minYear, maxYear)) {
        setError(`${t('dob_invalid')} (${minYear} - ${maxYear})`);
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(maxStep, s + 1));
  }

  function prev() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    // visible validation for required fields (all required except niche_superieure)
    setError(null);
    const missingBasics = [] as string[];
    if (!draft.id) missingBasics.push('ID');
    if (!draft.prenom) missingBasics.push('Prénom');
    if (!draft.nom) missingBasics.push('Nom');
    if (!draft.password) missingBasics.push('Mot de passe');
    // Accept CIN provided either for the member (draft.cin) or the tutor (draft.tutor.cin)
    if (!draft.cin && (!((draft as any).tutor && (draft as any).tutor.cin))) missingBasics.push('CIN');
    if (missingBasics.length) {
      setError(`Informations incomplètes: ${missingBasics.join(', ')}`);
      return;
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const minYear = 1941;
    const maxYear = currentYear - 1;
    if (!isValidDobRange(draft.dob, minYear, maxYear)) {
      setError(`${t('dob_invalid')} (${minYear} - ${maxYear})`);
      return;
    }
    const missingContact = [] as string[];
    if (!draft.phone) missingContact.push('Téléphone');
    if (!draft.address) missingContact.push('Adresse');
    if (missingContact.length) {
      setError(`Veuillez renseigner : ${missingContact.join(', ')}`);
      return;
    }


    try {
      const payload: Record<string, any> = {
        id: draft.id,
        prenom: draft.prenom,
        nom: draft.nom,
        password: draft.password,
        dob: draft.dob || null,
        // members should not send cin; only include if present (some legacy cases)
        cin: (draft as any).cin || null,
        phone: draft.phone || null,
        address: draft.address || null,
      };

      // include tutor information if provided
      if ((draft as any).tutor && typeof (draft as any).tutor === 'object') {
        payload.tutor = (draft as any).tutor;
      }

      setLoading(true);
      let resp: Response | null = null;
      try {
        const base = (import.meta as any).env?.VITE_API_BASE || window.location.origin;
        const url = `${base.replace(/\/$/, '')}/api/register`;
        resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        console.error("Network error while calling /api/register", err);
        setError("Erreur réseau : impossible de joindre le serveur. Vérifiez votre connexion ou réessayez plus tard.");
        setLoading(false);
        return;
      }

      // safe response reader: handle cases where body may already be read
      async function readResp(r: Response) {
        try {
          const txt = await r.text();
          let parsed: any = null;
          try { parsed = JSON.parse(txt); } catch (e) { parsed = null; }
          return { txt, parsed };
        } catch (err: any) {
          // try clone (may work if original stream was read elsewhere)
          try {
            const txt = await r.clone().text();
            let parsed: any = null;
            try { parsed = JSON.parse(txt); } catch (e) { parsed = null; }
            return { txt, parsed };
          } catch (inner) {
            return { txt: null, parsed: null };
          }
        }
      }

      const { txt, parsed } = await readResp(resp);

      if (!resp.ok) {
        const msg = (parsed && (parsed.detail || parsed.error)) || txt || `HTTP ${resp.status}`;
        console.error("Register failed:", msg);
        setError(`Erreur serveur: ${msg}`);
        setLoading(false);
        return;
      }

      // Redirect to ephemeral success page showing the generated id
      window.location.href = `/compte-cree?id=${encodeURIComponent(draft.id)}`;
    } catch (err: any) {
      setError(err?.message || "Erreur réseau");
    }
  }

  return (
    <MainLayout>
      <section className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5 p-6 md:p-8">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t('create_account')}</h1>
              <p className="text-slate-600 mt-1">{t('step_of', { step, total: maxStep })}</p>
            </div>
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          {step === 1 && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Prénom</label>
                <input value={draft.prenom} onChange={(e) => update({ prenom: e.target.value })} className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">Nom</label>
                <input value={draft.nom} onChange={(e) => update({ nom: e.target.value })} className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-700">{t('password_label')}</label>
                <input value={draft.password} type="password" onChange={(e) => update({ password: e.target.value })} className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Informations personnelles</h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Jour" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ dob: `${draft.dob.split('-')[0] || ''}-${draft.dob.split('-')[1] || ''}-${String(e.target.value).padStart(2,'0')}` })} />
                  <select className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ dob: `${draft.dob.split('-')[0] || ''}-${String(e.target.value).padStart(2,'0')}-${draft.dob.split('-')[2] || ''}` })}>
                    <option value="">Mois</option>
                    <option value="01">Janvier</option>
                    <option value="02">Février</option>
                    <option value="03">Mars</option>
                    <option value="04">Avril</option>
                    <option value="05">Mai</option>
                    <option value="06">Juin</option>
                    <option value="07">Juillet</option>
                    <option value="08">Août</option>
                    <option value="09">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                  <input type="number" placeholder="Année" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ dob: `${String(e.target.value)}-${draft.dob.split('-')[1] || ''}-${draft.dob.split('-')[2] || ''}` })} />
                </div>
                <input placeholder="Téléphone personnel" inputMode="tel" type="tel" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ phone: e.target.value })} />
                <input placeholder="Adresse" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ address: e.target.value })} />
                <input placeholder="CIN" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ cin: e.target.value })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Informations du tuteur (si applicable)</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Prénom tuteur" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ tutor: { ...(draft as any).tutor, prenom: e.target.value } })} />
                  <input placeholder="Nom tuteur" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ tutor: { ...(draft as any).tutor, nom: e.target.value } })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="CIN tuteur" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ tutor: { ...(draft as any).tutor, cin: e.target.value } })} />
                  <input placeholder="Téléphone tuteur" className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ tutor: { ...(draft as any).tutor, phone: e.target.value } })} />
                </div>
                <select className="h-11 rounded-md border border-slate-200 bg-white px-3" onChange={(e) => update({ tutor: { ...(draft as any).tutor, type: e.target.value } })}>
                  <option value="">Type tuteur (ex: parent, tuteur)</option>
                  <option value="parent">Parent</option>
                  <option value="tuteur">Tuteur</option>
                </select>
              </div>
            </div>
          )}


          <div className="flex items-center justify-between gap-4 pt-4">
            <a href="/connexion" className="text-slate-600 hover:text-slate-900">Déjà un compte? Se connecter</a>
            <div className="flex items-center gap-3">
              {step > 1 && <Button variant="outline" onClick={prev} disabled={loading}>Précédent</Button>}
              {step < maxStep && <Button onClick={next} className="bg-violet-600 hover:bg-violet-700" disabled={loading}>Suivant</Button>}
              {step === maxStep && <Button onClick={finish} className="bg-violet-600 hover:bg-violet-700" disabled={loading}>{loading ? 'Enregistrement…' : 'Créer mon compte'}</Button>}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
