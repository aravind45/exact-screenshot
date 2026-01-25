import { ProbateHub } from "@/components/ProbateHub";
import { Sidebar } from "@/components/Sidebar";

export default function ProbatePage() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 pl-4">
                <div className="max-w-5xl">
                    <ProbateHub />
                </div>
            </div>
        </div>
    );
}
