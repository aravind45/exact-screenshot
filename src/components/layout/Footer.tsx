import { Link } from "react-router-dom";
import { Landmark, Scale, ShieldCheck, Lock, Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-16 bg-foreground text-background">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-background">ExpectedEstate</span>
            </Link>
            <p className="text-background/60 text-sm max-w-sm mb-6 font-medium leading-relaxed">
              The compassionate platform for estate settlement. We simplify the complexities of probate and trust administration through clarity and automation.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/5 border border-background/10 text-[10px] font-black uppercase tracking-widest text-background/50">
                <Lock className="w-3 h-3 text-success" /> SSL Encrypted
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/5 border border-background/10 text-[10px] font-black uppercase tracking-widest text-background/50">
                <ShieldCheck className="w-3 h-3 text-success" /> SOC2 Compliant Data Center
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-background/40">Product</h4>
            <nav className="flex flex-col gap-4 text-sm font-bold">
              <Link to="/#services" className="text-background/70 hover:text-primary transition-colors">Services</Link>
              <Link to="/#pricing" className="text-background/70 hover:text-primary transition-colors">Pricing</Link>
              <Link to="/auth?mode=signup" className="text-background/70 hover:text-primary transition-colors font-black">Get Started</Link>
            </nav>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-background/40">Support</h4>
            <nav className="flex flex-col gap-4 text-sm font-bold">
              <Link to="/#about" className="text-background/70 hover:text-primary transition-colors">About Us</Link>
              <a href="mailto:expected.estate@gmail.com" className="text-background/70 hover:text-primary transition-colors">Contact Us</a>
              <div className="flex items-center gap-2 text-primary text-xs mt-4">
                <Eye className="w-3.5 h-3.5" />
                <span>Private & Defensible</span>
              </div>
            </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-background/50">
            © 2026 ExpectedEstate. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-bold text-background/40">
            <Link to="#" className="hover:text-background transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-background transition-colors">Terms of Service</Link>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-background/5 border border-background/10">
          <div className="flex items-center gap-4 text-[10px] text-background/50 leading-relaxed font-medium">
            <Scale className="w-5 h-5 shrink-0 text-primary/40" />
            <p>
              <strong className="text-background/70">Legal Disclaimer: ExpectedEstate is not a law firm.</strong> We provide administration and recordkeeping tools to help executors document fiduciary actions for professional review. Our services do not create an attorney-client relationship. Data is handled with banking-grade security and client-side encryption protocols.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
