import { useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Link } from "wouter";
import { AIChatbot } from "./AIChatbot";
import { FloatingButtons } from "./FloatingButtons";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Menu, X, Phone, Mail, ChevronDown, Calculator, Building2, Scale, Receipt } from "lucide-react";
import { useState, useEffect } from "react";

const taxLegalLinks = [
  { href: "/tax-legal", icon: <Calculator size={14} className="text-blue-500" />, label: "Tax & Legal Services", desc: "All services overview" },
  { href: "/gst-services", icon: <Calculator size={14} className="text-blue-500" />, label: "GST Services", desc: "Registration & returns" },
  { href: "/itr-filing", icon: <Receipt size={14} className="text-green-500" />, label: "ITR Filing", desc: "Income tax filing" },
  { href: "/msme-registration", icon: <Building2 size={14} className="text-purple-500" />, label: "MSME Registration", desc: "Udyam certificate" },
  { href: "/business-registration", icon: <Building2 size={14} className="text-purple-500" />, label: "Business Registration", desc: "Pvt Ltd, LLP, Proprietorship" },
  { href: "/legal-documentation", icon: <Scale size={14} className="text-orange-500" />, label: "Legal Documentation", desc: "Agreements & affidavits" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTaxMenu, setShowTaxMenu] = useState(false);
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
    { href: "/success-stories", label: "Results" },
    { href: "/contact", label: "Contact" },
    { href: "/track", label: "Track Case" },
  ];

  const isTaxLegalActive = ["/tax-legal", "/gst-services", "/itr-filing", "/msme-registration", "/business-registration", "/legal-documentation"].includes(location);

  return (
    <div className="min-h-screen flex flex-col bg-background relative selection:bg-primary/30">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-border/50" : "bg-transparent"
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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
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

            {/* Tax & Legal Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowTaxMenu(true)}
              onMouseLeave={() => setShowTaxMenu(false)}
            >
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${isTaxLegalActive ? "text-primary" : "text-foreground/80"}`}
              >
                Tax & Legal <ChevronDown size={14} className={`transition-transform ${showTaxMenu ? "rotate-180" : ""}`} />
              </button>
              {showTaxMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border/50 p-2 z-50">
                  {taxLegalLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setShowTaxMenu(false)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">{link.icon}</div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Auth */}
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
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-lg p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col gap-1">
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

              {/* Tax & Legal section in mobile */}
              <div className="mt-2 pt-2 border-t border-border/40">
                <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax & Legal Services</p>
                {taxLegalLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                      location === link.href ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {link.icon} {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="h-px bg-border" />
            {user ? (
              <div className="flex flex-col gap-2">
                <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"}>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>Log out</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">Customer Login</Button>
                </Link>
                <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-start bg-gradient-to-r from-primary to-accent border-0">Admin Login</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img src="/cir-logo.jpg" alt="CIR Consultation Service" className="h-12 w-auto object-contain rounded-lg bg-white/10 p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <span className="text-lg font-bold text-white leading-tight">CIR Consultation<br />Service</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your Partner in Financial Health. Premium credit report rectification, GST, income tax, business registration and legal documentation services across India.
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-400">
                <a href="tel:01169310902" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone size={13} /> 01169310902</a>
                <a href="mailto:support@circonsultationservice.in" className="flex items-center gap-2 hover:text-primary transition-colors"><Mail size={13} /> support@circonsultationservice.in</a>
              </div>
            </div>

            {/* Credit Services */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Credit Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/services" className="hover:text-primary transition-colors">CIBIL Rectification</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Score Improvement</Link></li>
                <li><Link href="/services" className="hover:text-primary transition-colors">Dispute Assistance</Link></li>
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
                <li><Link href="/track" className="hover:text-primary transition-colors">Track Case</Link></li>
              </ul>
            </div>

            {/* Tax & Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Tax & Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/gst-services" className="hover:text-primary transition-colors">GST Services</Link></li>
                <li><Link href="/itr-filing" className="hover:text-primary transition-colors">ITR Filing</Link></li>
                <li><Link href="/msme-registration" className="hover:text-primary transition-colors">MSME Registration</Link></li>
                <li><Link href="/business-registration" className="hover:text-primary transition-colors">Business Registration</Link></li>
                <li><Link href="/legal-documentation" className="hover:text-primary transition-colors">Legal Documentation</Link></li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/success-stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/referral" className="hover:text-primary transition-colors">Referral Program</Link></li>
              </ul>
              <h4 className="font-semibold mt-5 mb-3 text-white">Policies</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><Link href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} CIR Consultation Service. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
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
