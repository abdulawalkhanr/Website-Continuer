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
import { Menu, X, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => { window.location.href = "/"; } });
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
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/cir-logo.jpg"
              alt="CIR Consultation Service"
              className="h-10 w-auto object-contain rounded-md"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="hidden sm:inline-block text-sm font-semibold text-foreground/80 tracking-tight leading-tight max-w-[120px]">
              CIR Consultation Service
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
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleLogout}>
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
                    location === link.href ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
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
                  <Button variant="outline" className="w-full justify-start">Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full justify-start">Customer Login</Button>
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

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-200 pt-14 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="space-y-4 lg:col-span-1">
              <div className="flex items-center gap-3">
                <img
                  src="/cir-logo.jpg"
                  alt="CIR Consultation Service"
                  className="h-12 w-auto object-contain rounded-lg bg-white/10 p-1"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="text-lg font-bold text-white leading-tight">CIR Consultation<br/>Service</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your Partner in Financial Health. Premium credit report rectification and CIBIL dispute assistance across India.
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <a href="tel:01169310902" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Phone size={13} /> 01169310902
                </a>
                <a href="mailto:support@circonsultationservice.in" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail size={13} /> support@circonsultationservice.in
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/services" className="hover:text-primary transition-colors">CIBIL Rectification</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Credit Score Improvement</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Dispute Assistance</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
                <li><Link href="/referral" className="hover:text-primary transition-colors">Referral Program</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/process" className="hover:text-primary transition-colors">Our Process</Link></li>
                <li><Link href="/success-stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Legal & Policies</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
              </ul>
              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-white">Quick Access</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/login" className="hover:text-primary transition-colors">Customer Login</Link></li>
                  <li><Link href="/track" className="hover:text-primary transition-colors">Track Case</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} CIR Consultation Service. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
              <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>

      <AIChatbot />
      <FloatingButtons />
    </div>
  );
}
