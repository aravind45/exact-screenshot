import { DocumentVault } from "@/components/DocumentVault";
import { Sidebar } from "@/components/Sidebar";
import { ScreenIntro } from "@/components/ScreenIntro";

export default function DocumentsPage() {
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-[220px] min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-5">
                <div className="max-w-5xl mx-auto space-y-5">
                    <ScreenIntro
                        what="Every paper this estate depends on — death certificates, court Letters, tax filings. When a bank or the court asks for proof, it comes from here. Uploading key documents also completes the matching roadmap steps automatically."
                    />
                    <DocumentVault />
                </div>
            </div>
        </div>
    );
}
