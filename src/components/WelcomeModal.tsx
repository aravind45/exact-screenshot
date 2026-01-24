
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Gavel,
    ShieldCheck,
    Users,
    Zap,
    ArrowRight,
    Scale,
    AlertCircle,
    Globe
} from "lucide-react";
import { motion } from "framer-motion";

const TRACKS = [
    {
        id: "PROBATE",
        title: "Probate",
        description: "Official court supervision for assets in the decedent's name only.",
        icon: Gavel,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        id: "SMALL_ESTATE",
        title: "Small Estate",
        description: "Simplified process for estates below state value thresholds.",
        icon: Zap,
        color: "text-amber-600",
        bg: "bg-amber-50"
    },
    {
        id: "TRUST_BASED",
        title: "Trust-Based",
        description: "Assets held in a trust, bypassing probate with direct Trustee control.",
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    },
    {
        id: "INTESTATE",
        title: "Intestate",
        description: "No valid will exists. Settlement follows state succession laws.",
        icon: Scale,
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        id: "NON_PROBATE",
        title: "Non-Probate",
        description: "Assets with beneficiaries (Life Insurance, 401k) that override wills.",
        icon: Users,
        color: "text-sky-600",
        bg: "bg-sky-50"
    },
    {
        id: "ANCILLARY",
        title: "Ancillary",
        description: "Property in multiple states requiring secondary court involvement.",
        icon: Globe,
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    {
        id: "INSOLVENT",
        title: "Insolvent",
        description: "Debts exceed assets. Requires strict creditor priority management.",
        icon: AlertCircle,
        color: "text-rose-600",
        bg: "bg-rose-50"
    },
    {
        id: "SPECIAL",
        title: "Special Case",
        description: "Contested estates, minor heirs, or complex tax requirements.",
        icon: ShieldCheck,
        color: "text-gray-600",
        bg: "bg-gray-50"
    }
];

export function WelcomeModal() {
    const queryClient = useQueryClient();
    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const updateMutation = useMutation({
        mutationFn: (type: string) => api.updateMyEstate({ estateType: type }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
        }
    });

    const [selected, setSelected] = useState<string | null>(null);

    if (isLoading || !estate || estate.estateType) return null;

    return (
        <Dialog open={true}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center pb-4">
                    <DialogTitle className="text-2xl font-bold">Welcome to ExpectedEstate</DialogTitle>
                    <DialogDescription>
                        To prepare your personalized workflow, please select the primary track for this case.
                        Most estates are hybrid, but this selection defines your main legal path.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                    {TRACKS.map((track) => (
                        <button
                            key={track.id}
                            onClick={() => setSelected(track.id)}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${selected === track.id
                                ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                : "border-border hover:border-border-hover bg-card hover:bg-muted/50"
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${track.bg} ${track.color}`}>
                                <track.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm">{track.title}</h3>
                                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                    {track.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-end pt-4 gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => updateMutation.mutate("PROBATE")}
                    >
                        I'm not sure yet
                    </Button>
                    <Button
                        disabled={!selected || updateMutation.isPending}
                        onClick={() => selected && updateMutation.mutate(selected)}
                        className="gap-2"
                    >
                        {updateMutation.isPending ? "Setting track..." : "Initialize Estate"}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
