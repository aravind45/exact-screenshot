import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GuideExplorer } from "../GuideExplorer";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-black text-lg text-slate-900 tracking-tight">ExpectedEstate</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Home
            </Link>
            <a href="/#features" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Features
            </a>
            <Link to="/pricing" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Pricing
            </Link>
            <GuideExplorer />
            <Link to="/advisor/onboarding" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors flex items-center gap-2">
              Become an Advisor
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <Link to="/auth?mode=login" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Button size="sm" className="font-bold px-6 rounded-full" asChild>
                  <Link to="/auth?mode=signup">Start guided intake</Link>
                </Button>
              </>
            ) : (
              <>
                <button onClick={handleSignOut} className="text-sm font-semibold text-foreground/70 hover:text-red-500 transition-colors">
                  Sign Out
                </button>
                <Button size="sm" className="font-bold px-6 rounded-full" asChild>
                  <Link to={user?.role === 'ADVISOR' ? "/advisor/dashboard" : "/dashboard"}>Dashboard</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: CTA button + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!user ? (
              <Button size="sm" className="font-bold px-4 rounded-full text-xs h-8" asChild>
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            ) : (
              <Button size="sm" className="font-bold px-4 rounded-full text-xs h-8" asChild>
                <Link to={user?.role === 'ADVISOR' ? "/advisor/dashboard" : "/dashboard"}>Dashboard</Link>
              </Button>
            )}
            <button
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg px-4 py-4 space-y-1">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">Home</Link>
          <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">Features</a>
          <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">Pricing</Link>
          <Link to="/advisor/onboarding" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">Become an Advisor</Link>
          {!user ? (
            <Link to="/auth?mode=login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">Sign In</Link>
          ) : (
            <button onClick={handleSignOut} className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Sign Out</button>
          )}
        </div>
      )}
    </header>
  );
}
