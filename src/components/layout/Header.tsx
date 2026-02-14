import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-foreground">ExpectedEstate</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link to="/" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Home
            </Link>
            <a href="/#services" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Services
            </a>
            <a href="/#pricing" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="/#knowledge-base" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Knowledge Base
            </a>
            <a href="/#about" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              About Us
            </a>
            <a href="/#contact" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Contact Us
            </a>
            <Link to="/advisor/onboarding" className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors">
              Become an Advisor
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <Link
                  to="/auth?mode=login"
                  className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Button size="sm" className="font-bold px-6 rounded-full" asChild>
                  <Link to="/auth?mode=signup">Start guided intake</Link>
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-semibold text-foreground/70 hover:text-red-500 transition-colors"
                >
                  Sign Out
                </button>
                <Button size="sm" className="font-bold px-6 rounded-full" asChild>
                  <Link to={user?.role === 'ADVISOR' ? "/advisor/dashboard" : "/dashboard"}>
                    Dashboard
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
