import { DocumentVault } from "@/components/DocumentVault";
import { Sidebar } from "@/components/Sidebar";

export default function DocumentsPage() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-8">
                <div className="max-w-5xl mx-auto">
                    <DocumentVault />
                </div>
            </div>
        </div>
    );
}
