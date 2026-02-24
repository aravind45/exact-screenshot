import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PilotAccessForm } from '@/components/PilotAccessForm';

const LandingTexasLawyer = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <header className="bg-slate-900 text-white py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
                        Texas Probate Workflow OS
                        <span className="block text-amber-500 mt-2">Built for Estate Attorneys</span>
                    </h1>
                    <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                        Standardize Independent, Dependent, and Small Estate Administration with structured
                        case tracking, deadline control, and client status reporting.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-6 text-lg" asChild>
                            <a href="#request-access">Request Pilot Access</a>
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                            Firm Demo
                        </Button>
                    </div>
                    <p className="mt-8 text-amber-400 font-medium animate-pulse">
                        Limited Texas firm pilot. Invite only.
                    </p>
                </div>
            </header>

            {/* Features Grid */}
            <section className="py-24 px-6 max-w-6xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-center text-slate-900 mb-16">
                    A Unified System for Texas Probate Firms
                </h2>
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-sky-100 text-sky-900 rounded-lg flex items-center justify-center mb-6">
                            <Scale className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Statutory Deadline Control</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Roadmaps mapped to Texas Estates Code. Automate notices, inventory deadlines, and creditor periods.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-lg flex items-center justify-center mb-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Client Status Reporting</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Generate one-click progress reports for heirs and clients. Show value through transparency.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-900 rounded-lg flex items-center justify-center mb-6">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Firm Efficiency</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Standardize workflows across your team. Scale your probate practice without adding headcount.
                        </p>
                    </div>
                </div>
            </section>

            {/* Request Pilot Access Section */}
            <section id="request-access" className="bg-slate-50 py-24 px-6">
                <div className="max-w-xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
                    <h2 className="text-3xl font-serif font-bold mb-4 text-slate-900">
                        Request Pilot Access
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Join a limited group of Texas firms selected for our validation sprint.
                    </p>
                    <PilotAccessForm />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-12 border-t border-slate-200 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:row justify-between items-center text-slate-400 text-sm">
                    <p>© 2026 Expected Estate - Texas Lawyer Edition. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link to="/terms" className="hover:text-slate-600">Terms</Link>
                        <Link to="/privacy" className="hover:text-slate-600">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingTexasLawyer;
