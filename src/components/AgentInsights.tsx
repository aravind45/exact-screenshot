import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Sparkles, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AgentInsights() {
    const { data: insights, isLoading } = useQuery({
        queryKey: ["agent-insights"],
        queryFn: api.getAgentInsights,
        refetchInterval: 30000, // Poll every 30s for proactive feel
    });

    if (isLoading || !insights || insights.length === 0) return null;

    return (
        <section className="space-y-4 mb-8">
            <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Proactive AI Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {insights.map((insight: any, i: number) => (
                        <motion.div
                            key={insight.assetId + i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className={cn(
                                "border-l-4 shadow-sm hover:shadow-md transition-all group overflow-hidden relative",
                                insight.priority === "high" ? "border-l-destructive bg-destructive/5" : "border-l-primary bg-primary/5"
                            )}>
                                <CardHeader className="pb-2 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            {insight.priority === "high" ? <AlertCircle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-primary" />}
                                            {insight.title}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs leading-relaxed font-medium text-foreground/80">
                                        {insight.message}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-between h-8 text-xs font-bold group-hover:bg-background/80"
                                    >
                                        Take Action
                                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}
