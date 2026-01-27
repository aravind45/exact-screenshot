import { useState, useEffect } from "react";
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
    { value: "LETTERS_TESTAMENTARY", label: "Letters Testamentary", icon: FileCheck },
    { value: "SMALL_ESTATE_AFFIDAVIT", label: "Small Estate Affidavit", icon: FileCheck },
    { value: "EIN_LETTER", label: "EIN Letter (IRS)", icon: FileText },
    { value: "TRUST_CERTIFICATION", label: "Trust Certification", icon: FileText },
    { value: "WILL", label: "Will", icon: FileText }
];

const STATUS_CONFIG = {
    NOT_STARTED: { label: "Not Started", color: "bg-gray-500", icon: AlertCircle },
    PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
    OBTAINED: { label: "Obtained", color: "bg-green-500", icon: CheckCircle2 },
    EXPIRED: { label: "Expired", color: "bg-red-500", icon: X }
};

export function DocumentVault() {
    const [documents, setDocuments] = useState<EstateDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

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

    const handleFileUpload = async (id: string, file: File) => {
        setUploadingId(id);
        try {
            await api.uploadEstateDocumentFile(id, file);
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
                            className="mb-6 p-4 border rounded-lg bg-gray-50"
                        >
                            <h3 className="font-semibold mb-4">Add New Document</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Document Type</Label>
                                    <select
                                        className="w-full mt-1 p-2 border rounded"
                                        value={formData.documentType}
                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                    >
                                        <option value="">Select type...</option>
                                        {DOCUMENT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Document Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Certified Death Certificate"
                                    />
                                </div>
                                <div>
                                    <Label>Total Copies</Label>
                                    <Input
                                        type="number"
                                        value={formData.totalCopies}
                                        onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <Label>Issuing Authority</Label>
                                    <Input
                                        value={formData.issuingAuthority}
                                        onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                                        placeholder="e.g., Los Angeles County"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleCreate} size="sm">
                                    <Check className="w-4 h-4 mr-2" />
                                    Create
                                </Button>
                                <Button onClick={() => { setShowAddForm(false); resetForm(); }} variant="outline" size="sm">
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Obtained on {new Date(doc.obtainedDate).toLocaleDateString()}
                                                    </p>
                                                )}

                                                {doc.notes && (
                                                    <p className="text-sm text-gray-500 mt-2 italic">{doc.notes}</p>
                                                )}

                                                {doc.clues && Array.isArray(doc.clues) && doc.clues.length > 0 && (
                                                    <div className="mt-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                                            <Search className="w-3 h-3" />
                                                            AI Discovered Leads
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {(doc.clues as any[]).map((clue: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                                                                    <span className="font-medium">{clue.institution} ({clue.potentialAsset || clue.type})</span>
                                                                    <Badge variant="outline" className="h-4 text-[9px] bg-indigo-100 text-indigo-700 px-1 border-none">
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
                                                    onClick={() => window.open(api.getEstateDocumentDownloadUrl(doc.documentType), "_blank")}
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
                                                            if (file) handleFileUpload(doc.id, file);
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
        </Card>
    );
}
