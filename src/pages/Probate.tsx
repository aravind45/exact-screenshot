import { ProbateHub } from "@/components/ProbateHub";
import { SmallEstateHub } from "@/components/SmallEstateHub";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ProbatePage() {
    const { data: estate, isLoading } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    const isSmallEstate = estate?.estateType === "SMALL_ESTATE";

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 pl-4">
                <div className="max-w-5xl">
                    {isSmallEstate ? <SmallEstateHub /> : <ProbateHub />}
                </div>
            </div>
        </div>
    );
}
