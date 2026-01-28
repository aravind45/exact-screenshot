import { NonProbateHub } from "@/components/NonProbateHub";
import { Sidebar } from "@/components/Sidebar";

export default function NonProbatePage() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-slate-50 p-6 pl-4">
                <div className="max-w-6xl">
                    <NonProbateHub />
                </div>
            </div>
        </div>
    );
}
