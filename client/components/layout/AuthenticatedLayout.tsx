import React from "react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { User as UserIcon, Calendar, Music, Book, Play, FileText, ShoppingCart, Lightbulb } from "lucide-react";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // small inner toggle uses useSidebar and must be rendered inside the provider
  function InnerSidebarToggle() {
    const { toggleSidebar, state } = useSidebar();
    const collapsed = state === "collapsed";
    const logo = "https://cdn.builder.io/api/v1/image/assets%2Fa15df83128b342b488b6310c10175043%2F6f9fe02f72934482afbb265a0adf75ea?format=webp&width=800";
    return (
      <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="flex items-center gap-2">
        {collapsed ? (
          <img src={logo} alt="SHM" style={{ width: 30, height: 30, borderRadius: 6 }} />
        ) : (
          <div className="flex items-center gap-2">
            <img src={logo} alt="SHM" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div className="text-right">
              <p className="text-sm font-semibold">Scoutisme Hassania</p>
              <p className="text-xs opacity-90">SHM Portal</p>
            </div>
          </div>
        )}
      </button>
    );
  }

  return (
    <SidebarProvider
      style={{
        // set the desired sidebar width in the provider so the layout classes work
        // @ts-ignore
        "--sidebar-width": "240px",
        // contracted icon width
        // @ts-ignore
        "--sidebar-width-icon": "30px",
      }}
    >
      <div dir="rtl" className="min-h-screen flex bg-[#F9F4E8] text-[#1E392A]">
        {/* Sidebar (right) */}
        <Sidebar side="right" collapsible="icon" variant="sidebar" className="bg-[#6B3FA0] text-[#F9F4E8]">
          <SidebarHeader className="pt-4 px-3 text-right">
            <div className="flex items-center gap-2 justify-end">
              <div className="h-10 w-10 rounded-full bg-white text-[#6B3FA0] grid place-items-center font-bold">SH</div>
              <div className="text-right">
                <p className="text-sm font-semibold">Scoutisme Hassania</p>
                <p className="text-xs opacity-90">SHM Portal</p>
              </div>
            </div>
          </SidebarHeader>

          {/* small toggle logo when collapsed */}
          <SidebarHeader className="pt-2 px-2 text-right">
            <InnerSidebarToggle />
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/compte" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><UserIcon /> <span>Mon Espace Compte</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/programme" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><Calendar /> <span>Programme</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/anachid" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><Music /> <span>Anachid</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/frida" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><Book /> <span>Founoun Arriyada</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/audio-tracks" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><Play /> <span>Firqa Nohassia</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/rapports" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><FileText /> <span>Rapports de Séance</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="https://shm-safi-marketplace.netlify.app" target="_blank" rel="noreferrer" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><ShoppingCart /> <span>Marketplace</span></span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/idees" className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-3 justify-end"><Lightbulb /> <span>صندوق الأفكار</span></span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main content using SidebarInset so the sidebar layout/padding works */}
        <SidebarInset className="flex-1 p-4 md:p-10 bg-[#F9F4E8]">
          <div className="md:hidden mb-3 flex items-center justify-between">
            <SidebarTrigger />
            <div className="text-sm font-semibold">Scoutisme Hassania</div>
          </div>
          <div className="max-w-6xl mx-auto">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
