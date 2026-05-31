import { useLocation, Link } from "wouter";
import { useLogout, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, FileText, CreditCard, MessageSquare, Bell, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/case", label: "My Case", icon: FileText },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/tickets", label: "Support Tickets", icon: MessageSquare },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-bold gradient-text">CIR</span>
          <span className="text-sm text-muted-foreground">Customer Portal</span>
        </div>

        <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user?.name || "Customer"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "btn-gradient text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                  {isActive && <ChevronRight size={14} className="ml-auto text-white/70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-4 border-t border-border">
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors mb-2">
              Back to Website
            </div>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r border-border shadow-sm z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-border shadow-lg z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-border flex items-center px-4 sticky top-0 z-30 lg:hidden shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <span className="ml-3 font-semibold gradient-text">Customer Portal</span>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
