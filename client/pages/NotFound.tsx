import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2">404</h1>
          <p className="text-lg text-slate-600 mb-4">Page introuvable</p>
          <a href="/" className="text-violet-700 hover:underline">Retour à l’accueil</a>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
