
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye, Gavel, Scale, ScrollText } from "lucide-react";
import { motion } from "framer-motion";

const FORMS = [
    {
        id: "DE-111",
        title: "Petition for Probate",
        description: "The primary document used to start the probate process in California.",
        icon: ScrollText,
        color: "bg-blue-500",
    },
    {
        id: "DE-150",
        title: "Letters",
        description: "Official evidence of the personal representative's authority to act on behalf of the estate.",
        icon: Gavel,
        color: "bg-purple-500",
    },
    {
        id: "DE-160",
        title: "Inventory and Appraisal",
        description: "A complete list of all assets in the estate with their date-of-death values.",
        icon: Scale,
        color: "bg-emerald-500",
    },
];

const Forms = () => {
    return (
        <div className="flex min-h-screen bg-slate-950 text-white">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <header className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black tracking-tighter mb-2"
                    >
                        OFFICIAL <span className="text-primary italic">FORMS</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 max-w-2xl"
                    >
                        Generate court-ready Judicial Council forms using your estate data. These forms are generated using our high-fidelity Overlay Engine for pixel-perfect results.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FORMS.map((form, index) => (
                        <motion.div
                            key={form.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <Card className="bg-slate-900 border-slate-800 hover:border-primary/50 transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${form.color} opacity-5 blur-3xl -mr-8 -mt-8`} />
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl ${form.color} bg-opacity-20 flex items-center justify-center mb-4 border border-white/10`}>
                                        <form.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">{form.id}</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                        {form.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-sm leading-relaxed">
                                        {form.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[2px] w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full ${form.color}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ delay: 0.5 + (0.1 * index), duration: 1 }}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-3">
                                    <Button variant="outline" className="flex-1 bg-transparent border-slate-700 hover:bg-white/5 text-slate-300">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                                        <Download className="w-4 h-4 mr-2" />
                                        Generate
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <section className="mt-20">
                    <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FileText className="w-32 h-32" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 relative z-10">Pro Tip: Coordinate Calibration</h2>
                        <p className="text-slate-400 max-w-xl mb-6 relative z-10">
                            If you notice alignment issues on a specific printer, you can run our calibration tool to adjust the document scaling and offsets.
                        </p>
                        <Button variant="secondary" className="relative z-10">
                            Run Calibration
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Forms;
