import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Upload,
    Download,
    Plus,
    Trash2,
    Edit,
    Check,
    X,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileCheck,
    Search
} from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface EstateDocument {
    id: string;
    documentType: string;
    name: string;
    fileUrl?: string;
    totalCopies: number;
    copiesUsed: number;
    copiesRemaining: number;
    status: string;
    obtainedDate?: string;
    expirationDate?: string;
    issuingAuthority?: string;
    referenceNumber?: string;
    notes?: string;
    clues?: any;
}

const DOCUMENT_TYPES = [
    { value: "DEATH_CERTIFICATE", label: "Death Certificate", icon: FileText },
    { value: "LETTERS_TESTAMENTARY", label: "Letters Testamentary (DE-150)", icon: FileCheck },
    { value: "SMALL_ESTATE_AFFIDAVIT", label: "Small Estate Affidavit (DE-310)", icon: FileCheck },
    { value: "EIN_LETTER", label: "EIN Letter (IRS)", icon: FileText },
    { value: "TRUST_CERTIFICATION", label: "Trust Certification", icon: FileText },
    { value: "WILL", label: "Original Will", icon: FileText },
    { value: "DE-111", label: "Petition for Probate (DE-111)", icon: FileText },
    { value: "DE-160", label: "Inventory & Appraisal (DE-160)", icon: FileText }
];

const FOUNDATION_DOCUMENTS = [
    { type: "DEATH_CERTIFICATE", label: "Death Certificate", roadmapId: "notify_ssa", note: "Required for SSA & Social Security." },
    { type: "WILL", label: "Original Will", roadmapId: "locate_will", note: "Must be located to prove legal intent." },
    { type: "LETTERS_TESTAMENTARY", label: "Letters Testamentary (DE-150)", roadmapId: "receive_letters", note: "The legal authority to move assets." },
    { type: "SMALL_ESTATE_AFFIDAVIT", label: "Small Estate Affidavit (DE-310)", roadmapId: "file_affidavit", note: "Shortcut to settle smaller estates." },
    { type: "TRUST_CERTIFICATION", label: "Trust Certification", roadmapId: "issue_cert_trust", note: "Proof of Trustee authority." },
];

const STATUS_CONFIG = {
    NOT_STARTED: { label: "Not Started", color: "bg-gray-500", icon: Clock },
    PENDING: { label: "Pending", color: "bg-amber-500", icon: Clock },
    OBTAINED: { label: "Obtained", color: "bg-emerald-500", icon: CheckCircle2 },
    EXPIRED: { label: "Expired", color: "bg-rose-500", icon: X }
};

export function DocumentVault() {
    const [documents, setDocuments] = useState<EstateDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        documentType: "",
        name: "",
        totalCopies: 0,
        copiesUsed: 0,
        status: "NOT_STARTED",
        obtainedDate: "",
        issuingAuthority: "",
        referenceNumber: "",
        notes: ""
    });

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await api.getEstateDocuments();
            // Ensure data is always an array
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error("Failed to load documents:", error);

            // Handle 401 Unauthorized - user not logged in
            if (error?.message?.includes('401') || error?.status === 401) {
                console.warn("User not authenticated. Skipping document vault.");
                setDocuments([]);
            } else {
                // For other errors, still set empty array to prevent crashes
                setDocuments([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await api.createEstateDocument(formData);
            await loadDocuments();
            setShowAddForm(false);
            resetForm();
        } catch (error) {
            console.error("Failed to create document:", error);
        }
    };

    const handleUpdate = async (id: string, updates: Partial<EstateDocument>) => {
        try {
            await api.updateEstateDocument(id, updates);
            await loadDocuments();
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update document:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.deleteEstateDocument(id);
            await loadDocuments();
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    const handleSyncRoadmap = async (roadmapId: string) => {
        try {
            const estate = await api.getMyEstate();
            if (!estate) return;

            const completedTaskIds = estate.roadmapProgress?.completedTaskIds || [];
            if (!completedTaskIds.includes(roadmapId)) {
                const newIds = [...completedTaskIds, roadmapId];
                await api.updateRoadmap({
                    completedTaskIds: newIds,
                    completedPhases: estate.roadmapProgress?.completedPhases || [],
                    taskId: roadmapId,
                    action: 'COMPLETED'
                });
                toast({
                    title: "Roadmap Sync",
                    description: `Automatically marked roadmap task as "Complete".`,
                });
            }
        } catch (err) {
            console.error("Failed to sync roadmap:", err);
        }
    };

    const handleFileUpload = async (id: string, file: File, docType: string) => {
        setUploadingId(id);
        try {
            await api.uploadEstateDocumentFile(id, file);

            // Check for roadmap sync
            const foundation = FOUNDATION_DOCUMENTS.find(f => f.type === docType);
            if (foundation) {
                await handleSyncRoadmap(foundation.roadmapId);
            }

            await loadDocuments();
        } catch (error) {
            console.error("Failed to upload file:", error);
        } finally {
            setUploadingId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            documentType: "",
            name: "",
            totalCopies: 0,
            copiesUsed: 0,
            status: "NOT_STARTED",
            obtainedDate: "",
            issuingAuthority: "",
            referenceNumber: "",
            notes: ""
        });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Document Vault
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">Loading documents...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Document Vault
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Centralized storage for estate-level documents used across all assets
                        </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Document
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-6 border rounded-[24px] bg-slate-50/50 shadow-inner"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-indigo-600" />
                                    New Document Entry
                                </h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-600 tracking-widest pl-1">Document Type</Label>
                                    <select
                                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                        value={formData.documentType}
                                        onChange={(e) => {
                                            const type = DOCUMENT_TYPES.find(t => t.value === e.target.value);
                                            setFormData({ ...formData, documentType: e.target.value, name: type?.label || "" });
                                        }}
                                    >
                                        <option value="">Select type...</option>
                                        {DOCUMENT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-600 tracking-widest pl-1">Display Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Health Directive"
                                        className="h-11 px-4 rounded-xl border-slate-200 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label className="text-[11px] font-black uppercase text-slate-600 tracking-widest pl-1">Upload File (Optional)</Label>
                                    <div
                                        className="relative group/upload h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-300 hover:bg-white transition-all cursor-pointer overflow-hidden bg-white/50"
                                        onClick={() => document.getElementById('new-doc-file')?.click()}
                                    >
                                        {formData.name && (file?.name) ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">{file.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                    className="text-[10px] text-red-500 hover:underline font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2 group-hover/upload:scale-110 transition-transform">
                                                    <Upload className="w-5 h-5 text-slate-400 group-hover/upload:text-indigo-500" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 group-hover/upload:text-slate-700">Click to select or drag and drop</p>
                                                <p className="text-[10px] text-slate-500 mt-1 font-bold italic">Max size 10MB</p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            id="new-doc-file"
                                            className="hidden"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                <Button
                                    onClick={async () => {
                                        try {
                                            const response = await api.createEstateDocument(formData);
                                            if (file && response?.id) {
                                                await api.uploadEstateDocumentFile(response.id, file);
                                                const foundation = FOUNDATION_DOCUMENTS.find(f => f.type === formData.documentType);
                                                if (foundation) await handleSyncRoadmap(foundation.roadmapId);
                                            }
                                            await loadDocuments();
                                            setShowAddForm(false);
                                            resetForm();
                                            setFile(null);
                                            toast({ title: "Success", description: "Document saved to vault." });
                                        } catch (error) {
                                            console.error("Failed to create document:", error);
                                        }
                                    }}
                                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Document
                                </Button>
                                <Button
                                    onClick={() => { setShowAddForm(false); resetForm(); setFile(null); }}
                                    variant="outline"
                                    className="h-11 px-8 rounded-xl border-slate-200 text-slate-600 font-bold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Foundation Checklist */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <FileCheck className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900">Foundation Documents</h3>
                        <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase font-black tracking-widest px-2 h-6">
                            Required for Compliance
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {FOUNDATION_DOCUMENTS.map((foundation) => {
                            const existing = documents.find(d => d.documentType === foundation.type);
                            const isObtained = !!existing?.fileUrl || existing?.status === "OBTAINED";

                            return (
                                <div key={foundation.type} className={cn(
                                    "p-4 rounded-2xl border transition-all duration-300",
                                    isObtained ? "bg-emerald-50/30 border-emerald-200 shadow-sm" : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                                )}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isObtained ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {isObtained ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                        </div>
                                        {isObtained && (
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-black uppercase tracking-tight h-5 px-2">
                                                Obtained
                                            </Badge>
                                        )}
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-900 mb-1">{foundation.label}</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight mb-4 min-h-[2.5em] font-medium">{foundation.note}</p>

                                    {isObtained ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-8 text-[10px] font-bold bg-white border-slate-200 text-slate-600 hover:text-indigo-600"
                                            onClick={() => api.viewEstateDocument(foundation.type)}
                                        >
                                            <Download className="w-3.5 h-3.5 mr-2" />
                                            View Document
                                        </Button>
                                    ) : (
                                        <div className="relative">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="w-full h-8 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700"
                                                disabled={uploadingId === (existing?.id || 'new')}
                                            >
                                                {uploadingId === (existing?.id || 'new') ? "Uploading..." : (
                                                    <>
                                                        <Upload className="w-3.5 h-3.5 mr-2" />
                                                        Upload {foundation.type.split('_')[0]}
                                                    </>
                                                )}
                                            </Button>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    if (existing) {
                                                        await handleFileUpload(existing.id, file, existing.documentType);
                                                    } else {
                                                        // Create a basic entry first
                                                        try {
                                                            const newDoc = await api.createEstateDocument({
                                                                documentType: foundation.type,
                                                                name: foundation.label,
                                                                status: "OBTAINED",
                                                                totalCopies: 1
                                                            });
                                                            if (newDoc?.id) {
                                                                await handleFileUpload(newDoc.id, file, foundation.type);
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to auto-create doc:", err);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-8" />

                <div className="flex items-center justify-between px-1 mb-4">
                    <h3 className="font-bold text-slate-900">General Vault</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                        {documents.length} Items Total
                    </p>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 mb-2">No documents in vault yet</p>
                        <p className="text-sm text-gray-400 mb-4">
                            Add estate-level documents like Death Certificates and Letters Testamentary
                        </p>
                        <Button onClick={() => setShowAddForm(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Document
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map((doc) => {
                            const docType = DOCUMENT_TYPES.find((t) => t.value === doc.documentType);
                            const statusConfig = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG];
                            const Icon = docType?.icon || FileText;
                            const StatusIcon = statusConfig?.icon || AlertCircle;

                            return (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-2 bg-blue-50 rounded">
                                                <Icon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold">{doc.name}</h4>
                                                    <Badge className={`${statusConfig?.color} text-white`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {statusConfig?.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{docType?.label}</p>

                                                {/* Quantity Tracking */}
                                                {doc.totalCopies > 0 && (
                                                    <div className="flex items-center gap-4 text-sm mb-2">
                                                        <span className="text-gray-600">
                                                            <strong>{doc.copiesRemaining}</strong> copies remaining
                                                        </span>
                                                        <span className="text-gray-400">
                                                            ({doc.totalCopies} total, {doc.copiesUsed} used)
                                                        </span>
                                                    </div>
                                                )}

                                                {doc.issuingAuthority && (
                                                    <p className="text-sm text-gray-500">
                                                        Issued by: {doc.issuingAuthority}
                                                    </p>
                                                )}

                                                {doc.obtainedDate && (
                                                    <p className="text-[11px] text-slate-600 font-bold mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Obtained on {new Date(doc.obtainedDate).toLocaleDateString()}
                                                    </p>
                                                )}

                                                {doc.notes && (
                                                    <p className="text-sm text-gray-500 mt-2 italic">{doc.notes}</p>
                                                )}

                                                {doc.clues && Array.isArray(doc.clues) && doc.clues.length > 0 && (
                                                    <div className="mt-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                                        <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                            <Search className="w-3 h-3" />
                                                            AI Discovered Leads
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {(doc.clues as any[]).map((clue: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                                                                    <span className="font-medium">{clue.institution} ({clue.potentialAsset || clue.type})</span>
                                                                    <Badge variant="outline" className="h-4 text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 border-none">
                                                                        {Math.round((clue.confidence || 0) * 100)}% Match
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {doc.fileUrl ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => api.viewEstateDocument(doc.documentType)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                            ) : (
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={`upload-${doc.id}`}
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(doc.id, file, doc.documentType);
                                                        }}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                                                        disabled={uploadingId === doc.id}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        {uploadingId === doc.id ? "Uploading..." : "Upload"}
                                                    </Button>
                                                </div>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingId(editingId === doc.id ? null : doc.id)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(doc.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Inline Edit Form */}
                                    <AnimatePresence>
                                        {editingId === doc.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 pt-4 border-t"
                                            >
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Total Copies</Label>
                                                        <Input
                                                            type="number"
                                                            defaultValue={doc.totalCopies}
                                                            onBlur={(e) => {
                                                                const totalCopies = parseInt(e.target.value) || 0;
                                                                handleUpdate(doc.id, {
                                                                    totalCopies,
                                                                    copiesRemaining: totalCopies - doc.copiesUsed
                                                                });
                                                            }}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Copies Used</Label>
                                                        <Input
                                                            type="number"
                                                            defaultValue={doc.copiesUsed}
                                                            onBlur={(e) => {
                                                                const copiesUsed = parseInt(e.target.value) || 0;
                                                                handleUpdate(doc.id, {
                                                                    copiesUsed,
                                                                    copiesRemaining: doc.totalCopies - copiesUsed
                                                                });
                                                            }}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Status</Label>
                                                        <select
                                                            className="w-full h-8 text-sm p-1 border rounded"
                                                            defaultValue={doc.status}
                                                            onChange={(e) => handleUpdate(doc.id, { status: e.target.value })}
                                                        >
                                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                                <option key={key} value={key}>
                                                                    {config.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
