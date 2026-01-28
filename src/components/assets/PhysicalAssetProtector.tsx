
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Home, Car, Key, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Task {
    id: string;
    label: string;
    description: string;
    verified?: boolean;
}

interface PhysicalAssetProtectorProps {
    assetCategory: string;
    assetType: string;
}

export function PhysicalAssetProtector({ assetCategory, assetType }: PhysicalAssetProtectorProps) {
    const isProperty = assetCategory === "property" || assetType.toLowerCase().includes("home") || assetType.toLowerCase().includes("real estate");
    const isVehicle = assetType.toLowerCase().includes("car") || assetType.toLowerCase().includes("vehicle") || assetType.toLowerCase().includes("boat");

    const [tasks, setTasks] = useState<Task[]>(() => {
        const baseTasks: Task[] = [];

        if (isProperty) {
            baseTasks.push(
                { id: "lock_doors", label: "Secure all entry points", description: "Change original locks and secure all windows/gates." },
                { id: "mail_redirect", label: "Redirect mail", description: "Stop mail buildup which signals an empty house." },
                { id: "insurance_check", label: "Verify Vacancy Insurance", description: "Regular homeowners insurance often lapses if the home is empty for 30+ days." },
                { id: "valuable_removal", label: "Remove small valuables", description: "Gather jewelry, cash, and small electronics for off-site storage." }
            );
        }

        if (isVehicle) {
            baseTasks.push(
                { id: "secure_keys", label: "Locate and secure all keys", description: "Do not leave spare keys in the vehicle." },
                { id: "park_securely", label: "Park in a secure location", description: "Ideally a locked garage or monitored area." },
                { id: "insurance_vehicle", label: "Maintain auto insurance", description: "Ensure the policy remains active until the vehicle is sold or transferred." }
            );
        }

        return baseTasks;
    });

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, verified: !t.verified } : t));
    };

    if (!isProperty && !isVehicle) return null;

    const completedCount = tasks.filter(t => t.verified).length;
    const isFullySecured = completedCount === tasks.length;

    return (
        <Card className={cn(
            "border-2 transition-all duration-500 rounded-[32px] overflow-hidden",
            isFullySecured ? "border-emerald-200 bg-emerald-50/20 shadow-emerald-100" : "border-amber-100 bg-white shadow-sm"
        )}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-3 rounded-2xl ring-4 transition-all duration-500",
                            isFullySecured ? "bg-emerald-100 ring-emerald-50 text-emerald-600" : "bg-amber-100 ring-amber-50 text-amber-600"
                        )}>
                            {isProperty ? <Home className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">Physical Asset Protection</CardTitle>
                            <p className="text-xs text-slate-500 font-medium">Critical "Executor Duty" for tangible property</p>
                        </div>
                    </div>
                    <Badge className={cn(
                        "px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none",
                        isFullySecured ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    )}>
                        {isFullySecured ? "Fully Secured" : `${completedCount}/${tasks.length} Secured`}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                        "The law holds the Executor personally liable for any loss or theft of physical assets prior to distribution. Secure these items immediately."
                    </p>
                </div>

                <div className="grid gap-3">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group",
                                task.verified ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/30"
                            )}
                            onClick={() => toggleTask(task.id)}
                        >
                            <Checkbox
                                checked={task.verified}
                                onCheckedChange={() => toggleTask(task.id)}
                                className="mt-1 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="space-y-1">
                                <p className={cn(
                                    "text-sm font-bold tracking-tight",
                                    task.verified ? "text-emerald-900" : "text-slate-900"
                                )}>
                                    {task.label}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-600">
                                    {task.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {isFullySecured && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 p-3 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200"
                    >
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Legal Duty Met: Possession Secured</p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
