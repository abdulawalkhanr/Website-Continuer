import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CreditCard, 
  Share2, 
  MessageSquare,
  FileText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const logout = useLogout();
  const { data: user } = useGetMe();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/admin/login";
      },
    });
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/leads", label: "Leads", icon: Users },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/staff", label: "Staff", icon: Briefcase },
    { href: "/admin/cases", label: "Cases", icon: Briefcase },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/referrals", label: "Referrals", icon: Share2 },
    { href: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            CIR Admin
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-8 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.role}</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6">
        <Button 
          variant="outline" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" 
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r border-border shadow-sm z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-border shadow-lg z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>
        <SidebarContent />
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen relative z-10">
        <header className="h-16 bg-white border-b border-border flex items-center px-4 sm:px-6 lg:hidden sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <span className="ml-4 font-semibold text-lg">CIR Admin</span>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}