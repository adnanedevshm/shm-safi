import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterChef from "./pages/RegisterChef";
import Categories from "./pages/Categories";
import ResetPassword from "./pages/ResetPassword";

// Authenticated pages
import Compte from "./pages/Compte";
import CompteChef from "./pages/CompteChef";
import CompteCree from "./pages/CompteCree";
import Programme from "./pages/Programme";
import Anachid from "./pages/Anachid";
import Frida from "./pages/Frida";
import AudioTracks from "./pages/AudioTracks";
import Rapports from "./pages/Rapports";
import Marketplace from "./pages/Marketplace";
import Idees from "./pages/Idees";
import Membres from "./pages/Membres";
import Activites from "./pages/Activites";
import Support from "./pages/Support";
import Chefs from "./pages/Chefs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-chef" element={<RegisterChef />} />
          <Route path="/creer-un-compte" element={<Register />} />
          <Route path="/creer-un-chef" element={<RegisterChef />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated area */}
          <Route path="/compte" element={<Compte />} />
          <Route path="/compte-cree" element={<CompteCree />} />
          <Route path="/programme" element={<Programme />} />
          <Route path="/anachid" element={<Anachid />} />
          <Route path="/frida" element={<Frida />} />
          <Route path="/audio-tracks" element={<AudioTracks />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/idees" element={<Idees />} />
          <Route path="/membres" element={<Membres />} />
          <Route path="/chefs" element={<Chefs />} />
          <Route path="/activites" element={<Activites />} />
          <Route path="/support" element={<Support />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent createRoot being called multiple times during HMR by reusing existing root
const container = document.getElementById("root");
if (container) {
  const g: any = globalThis as any;
  try {
    if (g.__REACT_ROOT__ && typeof g.__REACT_ROOT__.render === "function") {
      console.debug("Reusing existing React root");
      g.__REACT_ROOT__.render(<App />);
    } else {
      console.debug("Creating new React root");
      g.__REACT_ROOT__ = createRoot(container);
      g.__REACT_ROOT__.render(<App />);
    }
  } catch (err) {
    console.warn("Error rendering with existing root, recreating", err);
    try {
      g.__REACT_ROOT__ = createRoot(container);
      g.__REACT_ROOT__.render(<App />);
    } catch (inner) {
      console.error("Failed to initialize React root:", inner);
    }
  }
}
