import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";

export function Header() {
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
            <a href="/#about" className="text-background/70 hover:text-background transition-colors">
              About Us
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-semibold" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" className="font-bold px-6" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
