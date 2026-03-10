import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Clock, FileText, Users, CheckCircle2, Scale, Landmark, MapPin, AlertCircle, Star, ChevronDown, MessageSquare, BookOpen, CreditCard, Bell, DollarSign, Zap, TrendingUp, BarChart3, Calendar, FileCheck, UserCheck, Globe, Database, Smartphone, Tablet, Laptop, ArrowUpRight, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";

const COMPETITORS = [
  {
    name: "Atticus",
    logo: "https://atticus.io/wp-content/uploads/2023/03/atticus-logo.svg",
    category: "Legal Practice Management",
    pricing: {
      basic: "$0",
      premium: "$99/month",
      enterprise: "Custom"
    },
    features: {
      probate: "Basic templates",
      tracking: "Manual",
      automation: "Limited",
      advisor: "No",
      compliance: "Basic",
      assets: "No",
      liabilities: "No",
      accounting: "No",
      distribution: "No",
      interface: "Basic",
      mobile: "Limited",
      support: "Basic",
      learning: "No"
    },
    pros: [
      "Good for general law practice",
      "Document templates available",
      "Basic time tracking"
    ],
    cons: [
      "Not probate-specific",
      "Manual workflow",
      "No deadline automation",
      "Limited asset tracking"
    ],
    bestFor: "General law firms",
    rating: 4.2
  },
  {
    name: "Clio",
    logo: "https://clio.com/wp-content/uploads/2023/03/clio-logo.svg",
    category: "Legal Practice Management",
    pricing: {
      basic: "$49/month",
      premium: "$119/month",
      enterprise: "Custom"
    },
    features: {
      probate: "Basic case management",
      tracking: "Manual",
      automation: "Limited",
      advisor: "No",
      compliance: "Basic",
      assets: "No",
      liabilities: "No",
      accounting: "No",
      distribution: "No",
      interface: "Good",
      mobile: "Good",
      support: "Good",
      learning: "Basic"
    },
    pros: [
      "Industry standard for law firms",
      "Good client management",
      "Integration ecosystem"
    ],
    cons: [
      "Expensive for probate",
      "Not executor-focused",
      "Complex for individuals",
      "No probate-specific features"
    ],
    bestFor: "Law firms with probate practice",
    rating: 4.5
  },
  {
    name: "MyCase",
    logo: "https://mycase.com/wp-content/uploads/2023/03/mycase-logo.svg",
    category: "Legal Practice Management",
    pricing: {
      basic: "$39/month",
      premium: "$69/month",
      enterprise: "Custom"
    },
    features: {
      probate: "Case management",
      tracking: "Manual",
      automation: "Limited",
      advisor: "No",
      compliance: "Basic",
      assets: "No",
      liabilities: "No",
      accounting: "No",
      distribution: "No",
      interface: "Basic",
      mobile: "Basic",
      support: "Basic",
      learning: "No"
    },
    pros: [
      "Affordable pricing",
      "Client portal",
      "Document management"
    ],
    cons: [
      "Not probate-specific",
      "Manual workflows",
      "Limited automation",
      "No deadline tracking"
    ],
    bestFor: "Small law firms",
    rating: 4.0
  },
  {
    name: "PracticePanther",
    logo: "https://practicepanther.com/wp-content/uploads/2023/03/practicepanther-logo.svg",
    category: "Legal Practice Management",
    pricing: {
      basic: "$49/month",
      premium: "$79/month",
      enterprise: "Custom"
    },
    features: {
      probate: "Case management",
      tracking: "Manual",
      automation: "Limited",
      advisor: "No",
      compliance: "Basic",
      assets: "No",
      liabilities: "No",
      accounting: "No",
      distribution: "No",
      interface: "Good",
      mobile: "Good",
      support: "Good",
      learning: "Basic"
    },
    pros: [
      "Good automation features",
      "Time tracking",
      "Client communication"
    ],
    cons: [
      "Not probate-focused",
      "Expensive for individuals",
      "Complex setup",
      "No probate templates"
    ],
    bestFor: "Mid-size law firms",
    rating: 4.3
  },
  {
    name: "LawPay",
    logo: "https://lawpay.com/wp-content/uploads/2023/03/lawpay-logo.svg",
    category: "Legal Payment Processing",
    pricing: {
      basic: "2.9% + $0.30 per transaction",
      premium: "Custom rates",
      enterprise: "Custom"
    },
    features: {
      probate: "Payment processing only",
      tracking: "No",
      automation: "No",
      advisor: "No",
      compliance: "Payment compliance",
      assets: "No",
      liabilities: "No",
      accounting: "No",
      distribution: "No",
      interface: "Basic",
      mobile: "Basic",
      support: "Basic",
      learning: "No"
    },
    pros: [
      "Trusted payment processor",
      "Legal-specific compliance",
      "Easy integration"
    ],
    cons: [
      "No probate features",
      "Transaction fees",
      "Limited functionality",
      "Not a complete solution"
    ],
    bestFor: "Payment processing only",
    rating: 3.8
  },
  {
    name: "ExpectedEstate",
    logo: "/logo.svg",
    category: "Probate & Estate Settlement",
    pricing: {
      basic: "$0",
      premium: "$29/month",
      enterprise: "Custom"
    },
    features: {
      probate: "AI-powered action plan",
      tracking: "Automated deadline tracking",
      automation: "Full workflow automation",
      advisor: "Verified marketplace",
      compliance: "State-specific compliance",
      assets: "Full asset discovery",
      liabilities: "Comprehensive tracking",
      accounting: "Court-ready reports",
      distribution: "Beneficiary management",
      interface: "Intuitive design",
      mobile: "Full functionality",
      support: "Dedicated team",
      learning: "Extensive resources"
    },
    pros: [
      "Probate-specific design",
      "AI-powered automation",
      "Executor-focused",
      "Verified advisor network",
      "Real-time deadline tracking",
      "Asset discovery tools",
      "Creditor management",
      "Heir collaboration"
    ],
    cons: [
      "Newer platform",
      "Limited to probate/estate",
      "Growing feature set"
    ],
    bestFor: "Executors and estate administrators",
    rating: 4.8
  }
];

const FEATURE_CATEGORIES = [
  {
    category: "Core Probate Features",
    features: [
      { key: "probate", label: "Probate Action Plan", description: "Step-by-step guidance through probate process" },
      { key: "tracking", label: "Deadline Tracking", description: "Automated tracking of statutory deadlines" },
      { key: "automation", label: "Workflow Automation", description: "Automated task management and reminders" },
      { key: "advisor", label: "Advisor Integration", description: "Access to verified probate professionals" },
      { key: "compliance", label: "Compliance Management", description: "State-specific legal compliance" }
    ]
  },
  {
    category: "Asset & Financial Management",
    features: [
      { key: "assets", label: "Asset Discovery", description: "Comprehensive asset tracking and management" },
      { key: "liabilities", label: "Liability Tracking", description: "Debt and creditor management" },
      { key: "accounting", label: "Estate Accounting", description: "Court-ready financial reporting" },
      { key: "distribution", label: "Distribution Planning", description: "Beneficiary distribution management" }
    ]
  },
  {
    category: "User Experience",
    features: [
      { key: "interface", label: "User Interface", description: "Intuitive and easy to navigate" },
      { key: "mobile", label: "Mobile Access", description: "Full functionality on mobile devices" },
      { key: "support", label: "Customer Support", description: "Responsive and knowledgeable support" },
      { key: "learning", label: "Educational Resources", description: "Guides and tutorials for executors" }
    ]
  }
];

export default function CompetitorComparison() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);
  const [sortBy, setSortBy] = useState('rating');

  const sortedCompetitors = [...COMPETITORS].sort((a, b) => {
    // Always put ExpectedEstate first
    if (a.name === 'ExpectedEstate') return -1;
    if (b.name === 'ExpectedEstate') return 1;
    
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') {
      const aPrice = parseFloat(a.pricing.basic.replace('$', '').replace('/month', ''));
      const bPrice = parseFloat(b.pricing.basic.replace('$', '').replace('/month', ''));
      return aPrice - bPrice;
    }
    return 0;
  });

  const getFeatureScore = (competitor: any, featureKey: string) => {
    const score = competitor.features[featureKey];
    if (score === 'Full' || score === 'AI-powered action plan' || score === 'Automated deadline tracking' || score === 'Full workflow automation' || score === 'Verified marketplace' || score === 'State-specific compliance') return 5;
    if (score === 'Good' || score === 'Basic case management' || score === 'Good automation features' || score === 'Industry standard for law firms') return 4;
    if (score === 'Basic' || score === 'Basic templates' || score === 'Basic case management' || score === 'Basic time tracking' || score === 'Basic client management' || score === 'Basic document management' || score === 'Basic compliance') return 3;
    if (score === 'Limited' || score === 'Manual' || score === 'Limited automation' || score === 'Manual workflows' || score === 'Limited functionality') return 2;
    if (score === 'No' || score === 'Payment processing only' || score === 'No probate features' || score === 'No deadline automation' || score === 'No probate-specific features' || score === 'No probate templates' || score === 'No probate action plan' || score === 'No deadline tracking' || score === 'No automation' || score === 'No advisor integration' || score === 'No compliance management') return 1;
    return 0;
  };

  const getFeatureColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    if (score >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <>
      <SEO
        title="Probate Software Comparison: ExpectedEstate vs Atticus, Clio & More"
        description="Editorial comparison of probate software positioning and feature sets. Verify current pricing, reviews, and availability directly with each vendor."
        canonical="https://www.expectedestate.com/competitor-comparison"
        ogTitle="Probate Software Comparison: Feature Positioning Snapshot"
        ogDescription="Editorial comparison of probate software feature positioning. Verify current pricing, reviews, and availability directly with each vendor."
        noindex
      />

      <div className="min-h-screen bg-white font-sans">
        <Header />

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 text-white">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-indigo-500/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-28 text-center">
            <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6 px-4 py-1.5 text-xs font-black uppercase tracking-widest">
              Software Comparison
            </Badge>

            <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
              Probate Software
              <br />
              <span className="text-indigo-400">Comparison Guide</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed mb-10">
              Compare ExpectedEstate with industry leaders like Atticus, Clio, MyCase, and PracticePanther. 
              Find the right probate solution for executors, estate administrators, and law firms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate("/register?mode=signup")}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg px-10 h-14 rounded-2xl shadow-2xl shadow-indigo-900/50 w-full sm:w-auto"
              >
                Try ExpectedEstate Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => document.getElementById('comparison-table')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-300 hover:text-white font-bold text-base h-14 w-full sm:w-auto"
              >
                View Comparison Table
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl font-black text-indigo-600 mb-2">$0</div>
                <div className="text-sm text-slate-600 font-semibold">Starting Price</div>
                <div className="text-xs text-slate-500 mt-1">ExpectedEstate Free Plan</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl font-black text-green-600 mb-2">4.8</div>
                <div className="text-sm text-slate-600 font-semibold">Editorial Score</div>
                <div className="text-xs text-slate-500 mt-1">Internal product assessment</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl font-black text-blue-600 mb-2">95%</div>
                <div className="text-sm text-slate-600 font-semibold">Workflow Coverage</div>
                <div className="text-xs text-slate-500 mt-1">Coverage of core executor workflows</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="text-3xl font-black text-purple-600 mb-2">12x</div>
                <div className="text-sm text-slate-600 font-semibold">Faster Setup</div>
                <div className="text-xs text-slate-500 mt-1">Compared with manual executor tracking</div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="comparison-table" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 text-xs font-black uppercase tracking-widest">
                Detailed Comparison
              </Badge>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Feature-by-Feature Comparison
              </h2>
              <p className="text-slate-600 font-medium mt-2">
                See how ExpectedEstate stacks up against the competition across all major categories.
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Button
                variant={sortBy === 'rating' ? 'default' : 'outline'}
                onClick={() => setSortBy('rating')}
                className="font-black"
              >
                Sort by Rating
              </Button>
              <Button
                variant={sortBy === 'price' ? 'default' : 'outline'}
                onClick={() => setSortBy('price')}
                className="font-black"
              >
                Sort by Price
              </Button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {FEATURE_CATEGORIES.map((category, index) => (
                <Button
                  key={index}
                  variant={activeCategory === index ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(index)}
                  className="font-black"
                >
                  {category.category}
                </Button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 px-4 py-3 text-left font-black text-slate-900">Product</th>
                    {sortedCompetitors.map((competitor) => (
                      <th key={competitor.name} className="border border-slate-200 px-4 py-3 text-center font-black text-slate-900">
                        <div className="flex flex-col items-center gap-2">
                          <img src={competitor.logo} alt={competitor.name} className="h-8 w-auto" />
                          <span className="text-sm font-semibold">{competitor.name}</span>
                          <Badge variant="secondary" className="text-xs">{competitor.category}</Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_CATEGORIES[activeCategory].features.map((feature) => (
                    <tr key={feature.key} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-3 font-semibold text-slate-700">
                        {feature.label}
                        <div className="text-xs text-slate-500 mt-1">{feature.description}</div>
                      </td>
                      {sortedCompetitors.map((competitor) => {
                        const score = getFeatureScore(competitor, feature.key);
                        return (
                          <td key={competitor.name} className="border border-slate-200 px-4 py-3 text-center">
                            {score > 0 ? (
                              <Badge className={`${getFeatureColor(score)} border-0 font-black`}>
                                {score === 5 ? 'Full' : score === 4 ? 'Good' : score === 3 ? 'Basic' : score === 2 ? 'Limited' : 'No'}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">N/A</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Individual Reviews */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Individual Product Reviews
              </h2>
              <p className="text-slate-600 font-medium mt-2">
                Detailed analysis of each probate software solution.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {sortedCompetitors.map((competitor) => (
                <div key={competitor.name} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <img src={competitor.logo} alt={competitor.name} className="h-12 w-auto" />
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{competitor.name}</h3>
                        <p className="text-sm text-slate-600">{competitor.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">{competitor.rating}</div>
                      <div className="text-xs text-slate-500">Rating</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-black text-slate-900 mb-2">Starting Price</h4>
                      <p className="text-lg text-slate-700 font-semibold">{competitor.pricing.basic}</p>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 mb-2">Best For</h4>
                      <p className="text-slate-700">{competitor.bestFor}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-black text-green-700 mb-2">Pros</h4>
                      <ul className="space-y-1">
                        {competitor.pros.map((pro, index) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-black text-red-700 mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {competitor.cons.map((con, index) => (
                          <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => navigate("/register?mode=signup")}
                      variant="outline"
                      className="font-black border-slate-300"
                    >
                      Try ExpectedEstate
                    </Button>
                    <Button
                      variant="ghost"
                      className="font-black text-slate-600"
                      onClick={() => window.open(`https://www.${competitor.name.toLowerCase()}.com`, '_blank')}
                    >
                      Visit Website
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why ExpectedEstate */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 mb-4 text-xs font-black uppercase tracking-widest">
                Why Choose ExpectedEstate
              </Badge>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                The Executor's Choice
              </h2>
              <p className="text-slate-600 font-medium mt-2">
                Here's why executors and estate administrators choose ExpectedEstate over the competition.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">AI-Powered Efficiency</h3>
                    <p className="text-slate-600">Smart automation that learns and adapts to your specific estate.</p>
                  </div>
                </div>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Automated deadline tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Smart document suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Predictive task management
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Executor-Focused Design</h3>
                    <p className="text-slate-600">Built specifically for executors, not law firms.</p>
                  </div>
                </div>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    No legal jargon
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Step-by-step guidance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Family-friendly interface
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Comprehensive Asset Tracking</h3>
                    <p className="text-slate-600">Track every asset, debt, and distribution in one place.</p>
                  </div>
                </div>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Real-time asset valuation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Debt and creditor management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Distribution tracking
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">State-Specific Compliance</h3>
                    <p className="text-slate-600">Automatically adapts to your state's probate laws.</p>
                  </div>
                </div>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Local deadline tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    State-specific forms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Local professional network
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-indigo-600 py-24 px-6 text-white overflow-hidden text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              Ready to simplify probate?
            </h2>
            <p className="text-indigo-200 font-medium text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              Join thousands of executors who chose clarity over chaos. 
              Get started with ExpectedEstate today — free for life.
            </p>
            <Button
              onClick={() => navigate("/register?mode=signup")}
              size="lg"
              className="bg-white hover:bg-indigo-50 text-indigo-700 font-black text-lg px-12 h-14 rounded-2xl shadow-2xl w-full sm:w-auto"
            >
              Start Your Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-indigo-300 text-sm font-semibold mt-8">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-400 py-12 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="font-black text-white">ExpectedEstate</span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm font-semibold">
              <a href="/guides/california-probate-deadlines" className="hover:text-white transition-colors">
                CA Probate Guide
              </a>
              <a href="/marketplace" className="hover:text-white transition-colors">
                Find an Advisor
              </a>
              <a href="/login" className="hover:text-white transition-colors">
                Sign In
              </a>
              <a href="/register?mode=signup" className="hover:text-white transition-colors">
                Register
              </a>
            </div>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ExpectedEstate. Not legal advice.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}


