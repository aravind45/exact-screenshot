import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-foreground text-background">
      <div className="section-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold text-background">ExpectedEstate</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="text-background/70 hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/70 hover:text-background transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/70 hover:text-background transition-colors">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-background/50">
            © 2026 ExpectedEstate. All rights reserved.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-background/10 text-center">
          <p className="text-sm text-background/50">
            Built with compassion for those navigating difficult times.
          </p>
        </div>
      </div>
    </footer>
  );
}
