import { Link } from "react-router-dom";
import { Landmark, Scale } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-12 bg-foreground text-background">
      <div className="section-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="font-bold text-background">ExpectedEstate</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <a href="/" className="text-background/70 hover:text-background transition-colors">
              Home
            </a>
            <a href="/#services" className="text-background/70 hover:text-background transition-colors">
              Services
            </a>
            <a href="/#pricing" className="text-background/70 hover:text-background transition-colors">
              Pricing
            </a>
            <a href="/#about" className="text-background/70 hover:text-background transition-colors">
              About Us
            </a>
            <a href="/#contact" className="text-background/70 hover:text-background transition-colors">
              Contact Us
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-background/50">
            © 2026 ExpectedEstate. All rights reserved.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-background/10">
          <div className="flex items-center gap-3 text-[10px] text-background/50 max-w-3xl">
            <Scale className="w-4 h-4 shrink-0" />
            <p>
              <strong>ExpectedEstate is not a law firm.</strong> We provide recordkeeping tools to help executors document fiduciary actions for attorney review. Use does not create an attorney-client relationship.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
