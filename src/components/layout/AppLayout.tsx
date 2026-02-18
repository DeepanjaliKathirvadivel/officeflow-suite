import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Package,
  Box,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Main",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Bills",
    items: [
      { path: "/bills", label: "All Bills", icon: FileText },
      { path: "/bills/new", label: "New Bill", icon: PlusCircle },
    ],
  },
  {
    label: "Courier",
    items: [
      { path: "/couriers", label: "Parcels", icon: Package },
      { path: "/couriers/dashboard", label: "Courier Stats", icon: BarChart3 },
    ],
  },
  {
    label: "Assets",
    items: [
      { path: "/assets", label: "All Assets", icon: Box },
    ],
  },
  {
    label: "Complaints",
    items: [
      { path: "/complaints", label: "All Complaints", icon: AlertTriangle },
      { path: "/complaints/dashboard", label: "Complaint Stats", icon: BarChart3 },
    ],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <Building2 className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold">OfficeFlow</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-2 text-xs text-sidebar-foreground/50 truncate">{user?.email}</div>
          {roles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {roles.map((role) => (
                <span key={role} className="rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-xs capitalize text-sidebar-primary">{role}</span>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="mr-2 h-4 w-4" />Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-lg font-semibold">OfficeFlow</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
