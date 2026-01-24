import { DocumentVault } from "@/components/DocumentVault";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                <Card className="card-elevated border-none">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/10 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Document Vault</CardTitle>
                                <CardDescription>
                                    Centralized storage for estate-level documents used across all assets
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DocumentVault />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
