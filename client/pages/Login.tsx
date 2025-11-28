import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { t } from "@/lib/i18n";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillId, setPrefillId] = useState<string>("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) setPrefillId(id);
    } catch (e) {}
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const id = String(data.get("id") || "").trim();
    const password = String(data.get("password") || "").trim();

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });

      const txt = await resp.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(txt);
      } catch (e) {
        parsed = null;
      }

      if (!resp.ok) {
        setError(
          (parsed && (parsed.error || parsed.detail)) ||
            txt ||
            `HTTP ${resp.status}`,
        );
        setLoading(false);
        return;
      }

      // success: try to persist returned user info for account page
      try {
        const json = parsed || JSON.parse(txt || "{}");
        const userObj = json.user || json;
        if (userObj && typeof window !== "undefined") {
          try {
            localStorage.setItem("shm_user", JSON.stringify(userObj));
          } catch (e) {
            /* ignore */
          }
        }
      } catch (e) {}

      window.location.href = "/compte";
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <section className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5 p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              {t("login_title")}
            </h1>
            <p className="text-slate-600 mt-1">{t("login_subtitle")}</p>
          </div>

          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <label
                htmlFor="id"
                className="text-sm font-medium text-slate-700"
              >
                {t("id_label")}
              </label>
              <input
                id="id"
                name="id"
                required
                value={prefillId}
                onChange={(e) => setPrefillId(e.target.value)}
                className="h-11 rounded-md border border-slate-200 bg-amber-50/60 px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="prenom"
                  className="text-sm font-medium text-slate-700"
                >
                  {t("first_name")}
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="nom"
                  className="text-sm font-medium text-slate-700"
                >
                  {t("last_name")}
                </label>
                <input
                  id="nom"
                  name="nom"
                  className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                {t("password_label")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="h-11 rounded-md border border-slate-200 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              />
            </div>
            <Button
              className="mt-2 bg-violet-600 hover:bg-violet-700"
              disabled={loading}
            >
              {loading ? t("signing_in") : t("signin_button")}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600 mt-6">
            <p className="mt-2">
              <a className="text-violet-700" href="#">
                {t("forgot_password")}
              </a>
            </p>
            <div className="mt-4">
              <a
                href="/register"
                className="inline-block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                {t("register_button")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
