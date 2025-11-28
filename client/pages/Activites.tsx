import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

export default function Activites() {
  const [open, setOpen] = useState(false);

  return (
    <MainLayout>
      <section className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Activités</h1>
          <p className="text-sm text-slate-600 mb-4">Consultez et gérez les activités auxquelles vous participez.</p>

          <div className="grid gap-4">
            <div className="p-4 border rounded">Activité 1: Date, lieu</div>
            <div className="p-4 border rounded">Activité 2: Date, lieu</div>
            <div className="p-4 border rounded">Activité 3: Date, lieu</div>
          </div>
        </div>

        {/* Purple deployable bar */}
        <div className="fixed right-6 bottom-6 z-50">
          <div className="flex flex-col items-end gap-2">
            {open && (
              <div className="w-56 p-3 bg-white rounded shadow-lg">
                <button className="w-full text-left px-3 py-2 rounded hover:bg-violet-50">Créer activité</button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-violet-50">Mes inscriptions</button>
              </div>
            )}
            <button onClick={() => setOpen((s) => !s)} className="bg-violet-600 text-white rounded-full p-4 shadow-lg hover:bg-violet-700">
              {open ? '×' : '+'}
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
