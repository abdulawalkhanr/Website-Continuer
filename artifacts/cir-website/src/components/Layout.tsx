import { useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Link } from "wouter";
import { AIChatbot } from "./AIChatbot";
import { FloatingButtons } from "./FloatingButtons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      },
    });
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/process", label: "Process" },
    { href: "/pricing", label: "Pricing" },
    { href: "/success-stories", label: "Success Stories" },
    { href: "/contact", label: "Contact" },
    { href: "/track", label: "Track Case" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary/30">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              CIR
            </span>
            <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground tracking-tight">
              Consultation Service
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={handleLogout}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Customer Login
                </Link>
                <Link href="/admin/login">
                  <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-sm border-0">
                    Admin Login
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-foreground/80 hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-lg p-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === link.href
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground/80"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="h-px bg-border my-2" />
            {user ? (
              <div className="flex flex-col gap-2">
                <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"}>
                  <Button variant="outline" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full justify-start">
                    Customer Login
                  </Button>
                </Link>
                <Link href="/admin/login">
                  <Button className="w-full justify-start bg-gradient-to-r from-primary to-accent border-0">
                    Admin Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full relative z-0">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              CIR
            </span>
            <p className="text-sm text-slate-400">
              Your Partner in Financial Health. Premium credit report rectification and CIBIL dispute assistance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/services" className="hover:text-primary transition-colors">CIBIL Rectification</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Credit Score Improvement</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Dispute Assistance</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/referral" className="hover:text-primary transition-colors">Referral Program</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Phone: 01169310902</li>
              <li>WhatsApp: +91 9864920810</li>
              <li>Email: support@circonsultationservice.site</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} CIR Consultation Service. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
      <AIChatbot />
      <FloatingButtons />
    </div>
  );
}