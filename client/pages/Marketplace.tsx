import MainLayout from "@/components/layout/MainLayout";

export default function Marketplace() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold mb-2">Marketplace</h1>
          <p className="text-sm text-slate-600 mb-4">Achetez et vendez des ressources pour votre groupe.</p>

          <div className="grid gap-4">
            <div className="p-4 border rounded">Produit 1</div>
            <div className="p-4 border rounded">Produit 2</div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
