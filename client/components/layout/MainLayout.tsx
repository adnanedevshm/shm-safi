import React from "react";
import { Link } from "react-router-dom";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_80%_-200px,rgba(124,58,237,0.08),transparent_60%),linear-gradient(to_bottom_right,#fff7ec,#f6f2ea)] text-slate-800">
      <Header />
      <main className="container py-6 md:py-10">{children}</main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://cdn.builder.io/api/v1/image/assets%2Fa15df83128b342b488b6310c10175043%2F6f9fe02f72934482afbb265a0adf75ea?format=webp&width=800" alt="SHM" className="h-8 w-8 rounded-md object-cover" />
          <div className="leading-tight">
            <p className="text-sm text-slate-500">Scoutisme Hassania Marocain</p>
            <p className="text-base font-semibold">SHM Portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm"></div>
      </div>
    </header>
  );
}
