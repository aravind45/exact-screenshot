import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Gavel, CheckCircle2, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProbateProgressMiniProps {
    className?: string;
}

export function ProbateProgressMini({ className }: ProbateProgressMiniProps) {
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    if (!estate) return null;

    const isGranted = estate.authorityStatus === "GRANTED" || estate.probateStatus === "EXECUTOR_APPOINTED";
    const isInProgress = estate.probateStatus === "FILED";
    const notStarted = estate.probateStatus === "NOT_STARTED";

    const getStatusInfo = () => {
        if (isGranted) {
            return {
                icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                text: "Authority Granted",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                textColor: "text-green-700"
            };
        }
        if (isInProgress) {
            return {
                icon: <Clock className="w-4 h-4 text-blue-600" />,
                text: "Probate In Progress",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                textColor: "text-blue-700"
            };
        }
        return {
            icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
            text: "Probate Not Started",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            textColor: "text-amber-700"
        };
    };

    const status = getStatusInfo();

    return (
        <Link
            to="/probate"
            className={cn("p-3 rounded-lg border flex items-center gap-3 hover:opacity-80 transition-all group", status.bgColor, status.borderColor, className)}
        >
            <div className="p-1.5 bg-white rounded-md shadow-sm">
                <Gavel className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {status.icon}
                        <span className={cn("text-xs font-bold", status.textColor)}>
                            {status.text}
                        </span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-tight">
                    Estate-Level Process • Click to View
                </p>
            </div>
        </Link>
    );
}
