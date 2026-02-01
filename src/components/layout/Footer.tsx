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

        <div className="mt-8 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 text-[10px] text-background/50 max-w-2xl text-left">
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <p>
                <strong>ExpectedEstate is not a law firm and does not provide legal advice.</strong> Use of this platform does not create an attorney-client relationship. Our tools are designed for recordkeeping and procedural documentation to assist in your fiduciary duties.
                The Fiduciary Activity Report is intended for review by qualified legal counsel.
              </p>
            </div>
            <p className="text-sm text-background/50 italic shrink-0">
              Built with care for executors.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
