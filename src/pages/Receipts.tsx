import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Receipts() {
    const navigate = useNavigate();

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Receipts & Releases</h1>
                            <p className="text-slate-500 mt-1 text-sm uppercase font-bold tracking-wider">Proof of Distribution</p>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Feature Shell</Badge>
                    </div>

                    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8 text-indigo-600" />
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-900">Receipt Vault Coming Soon</CardTitle>
                            <CardDescription className="max-w-md mt-2 text-slate-500">
                                A dedicated space for 'Receipt of Beneficiary and Release' forms.
                                Upload signed documents here to finalize the estate closing.
                            </CardDescription>
                            <Button
                                onClick={() => navigate("/documents")}
                                className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Go to Document Vault
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
