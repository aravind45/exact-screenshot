import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Bell,
    FileText,
    Mail,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Users,
    Search,
    Plus,
    Trash2,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

export default function SpecialNotice() {
    const queryClient = useQueryClient();
    const [downloadingForm, setDownloadingForm] = useState<string | null>(null);
    const [newRequestor, setNewRequestor] = useState("");

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const completeTaskMutation = useMutation({
        mutationFn: ({ taskId }: { taskId: string }) =>
            api.completeTask(estate?.id || "", taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast.success("Progress updated successfully");
        },
        onError: (err: any) => {
            toast.error(`Error updating progress: ${err.message}`);
        }
    });
    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
    const handleDownload = async (form: string, blankUrl?: string) => {
        setDownloadingForm(form);
        try {
            const result = await downloadAutofillWithFallback({
                formType: form,
                blankPdfUrl: blankUrl,
                filename: form + "_PreFilled.pdf",
            });
            if (result.mode === "blank") {
                toast.success("Auto-fill isn't available for " + form + " yet. Opened the blank form.");
            } else {
                toast.success(form + " downloaded successfully");
            }
        } catch (err: any) {
            toast.error("Couldn't generate " + form + ": " + err.message);
        } finally {
            setDownloadingForm(null);
        }
    };

    const handleMarkAsComplete = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    // Use a local state for the registry for demo purposes if not in DB
    const [registry, setRegistry] = useState([
        { id: 1, name: "Internal Revenue Service", date: "2023-11-15", type: "Creditor" },
        { id: 2, name: "CA Franchise Tax Board", date: "2023-12-01", type: "Tax Authority" }
    ]);

    const addRegistryEntry = () => {
        if (!newRequestor) return;
        setRegistry([...registry, {
            id: Date.now(),
            name: newRequestor,
            date: new Date().toISOString().split('T')[0],
            type: "Other Interested Party"
        }]);
        setNewRequestor("");
        toast.success("Requestor added to registry");
    };

    const removeRegistryEntry = (id: number) => {
        setRegistry(registry.filter(r => r.id !== id));
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-600 rounded shadow-md shadow-blue-200">
                                <Bell className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Special Notice Registry (DE-154)</h1>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[9px] font-black h-4 px-2">
                                Compliance
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Parties interested in the estate may request special notice of all court filings.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Registry Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="border-none shadow-xl shadow-blue-100/50 bg-white rounded-[2rem] overflow-hidden border-t-4 border-t-blue-600">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-black text-slate-900">Requestor Registry</CardTitle>
                                            <CardDescription className="text-xs font-medium">List of parties who must be served with all filings.</CardDescription>
                                        </div>
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 font-bold">
                                            {registry.length} Total
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter name of person or entity..."
                                            className="h-10 text-sm rounded-xl border-slate-200 focus:ring-blue-500"
                                            value={newRequestor}
                                            onChange={(e) => setNewRequestor(e.target.value)}
                                        />
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-bold text-xs flex gap-2 shrink-0"
                                            onClick={addRegistryEntry}
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </Button>
                                    </div>

                                    <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100">
                                        {registry.length > 0 ? registry.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                        <Mail className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-400 font-medium">Received: {item.date}</span>
                                                            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">{item.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-slate-300 hover:text-rose-500 rounded-lg"
                                                    onClick={() => removeRegistryEntry(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="p-12 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Search className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400">No requests filed yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    {!completedTaskIds.includes("track_special_notice_requests") && (
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 font-bold text-xs"
                                            onClick={() => handleMarkAsComplete("track_special_notice_requests")}
                                        >
                                            Mark Task as Finished
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-slate-900">How to Serve Notice</CardTitle>
                                    <CardDescription className="text-xs font-medium">Service requirements for special notice recipients.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-2">
                                                <Mail className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase text-slate-900">What to Send</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                A copy of the filed document and a Notice of Hearing (DE-120).
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h4 className="text-xs font-black uppercase text-slate-900">Proof of Service</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">
                                                You must file form POS-030 (Proof of Service by Mail) with the court for each service.
                                            </p>
                                        </div>
                                    </div>

                                    {!completedTaskIds.includes("serve_special_notice_parties") && (
                                        <div className="p-4 bg-blue-600 rounded-2xl flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black text-white leading-tight">Ongoing Compliance</p>
                                                <p className="text-[10px] text-blue-100/80 font-medium">Keep this registry updated throughout probate.</p>
                                            </div>
                                            <Button
                                                className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg"
                                                onClick={() => handleMarkAsComplete("serve_special_notice_parties")}
                                            >
                                                Mark as Ongoing
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-blue-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <AlertCircle className="w-5 h-5 text-blue-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-300">Compliance Warning</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                        Failure to serve a party who has requested special notice can result in:
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-rose-400 mt-1 shrink-0" />
                                            Invalidation of court orders
                                        </li>
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-rose-400 mt-1 shrink-0" />
                                            Removal of personal representative
                                        </li>
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-rose-400 mt-1 shrink-0" />
                                            Personal liability for damages
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Download className="w-3.5 h-3.5" /> Sample Request
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        Generating this form allows you to see what the document looks like when filed by an interested party.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full h-9 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex gap-2"
                                        onClick={() => handleDownload("DE-154", "https://www.courts.ca.gov/documents/de154.pdf")}
                                        disabled={downloadingForm === "DE-154"}
                                    >
                                        <FileText className="w-4 h-4" /> {downloadingForm === "DE-154" ? "Generating..." : "Generate DE-154"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



