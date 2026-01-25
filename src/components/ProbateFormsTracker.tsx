import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    FileText,
    Download,
    Upload,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const REQUIRED_FORMS = [
    {
        code: "DE-111",
        name: "Petition for Probate",
        url: "https://www.courts.ca.gov/documents/de111.pdf",
        required: true
    },
    {
        code: "DE-121",
        name: "Notice of Hearing",
        url: "https://www.courts.ca.gov/documents/de121.pdf",
        required: true
    },
    {
        code: "DE-150",
        name: "Letters Testamentary",
        url: "https://www.courts.ca.gov/documents/de150.pdf",
        required: true
    },
    {
        code: "DE-160",
        name: "Inventory and Appraisal",
        url: "https://www.courts.ca.gov/documents/de160.pdf",
        required: false
    },
    {
        code: "DE-165",
        name: "Notice of Proposed Action",
        url: "https://www.courts.ca.gov/documents/de165.pdf",
        required: false
    }
];

export function ProbateFormsTracker() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploadingForm, setUploadingForm] = useState<string | null>(null);

    const { data: documents } = useQuery({
        queryKey: ["estate", "documents"],
        queryFn: api.getEstateDocuments
    });

    const getFormStatus = (formCode: string) => {
        const doc = documents?.find((d: any) => d.documentType === formCode);
        return doc?.status || "NOT_STARTED";
    };

    const handleUpload = async (formCode: string, file: File) => {
        setUploadingForm(formCode);
        try {
            await api.uploadEstateDocument(formCode, `${formCode} - Completed`, file);
            toast({ title: "Form Uploaded", description: `${formCode} has been uploaded successfully.` });
            queryClient.invalidateQueries({ queryKey: ["estate", "documents"] });
        } catch (error) {
            toast({ variant: "destructive", title: "Upload Failed" });
        } finally {
            setUploadingForm(null);
        }
    };

    return (
        <Card className="card-elevated border-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4" />
                    Required Probate Forms
                </CardTitle>
                <CardDescription className="text-xs">
                    Download blank forms, complete them, and upload the finished documents
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-4 py-3 text-left">Form</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-center">Required</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {REQUIRED_FORMS.map((form) => {
                                const status = getFormStatus(form.code);
                                const isCompleted = status === "OBTAINED";
                                const isPending = status === "PENDING";

                                return (
                                    <tr key={form.code} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs font-bold text-primary">{form.code}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {form.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {form.required ? (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">Required</Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Optional</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center">
                                                {isCompleted && (
                                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-2 py-0">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Completed
                                                    </Badge>
                                                )}
                                                {isPending && (
                                                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] px-2 py-0">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                                {!isCompleted && !isPending && (
                                                    <Badge variant="outline" className="text-muted-foreground text-[10px] px-2 py-0">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        Not Started
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    className="h-7 text-xs px-2"
                                                >
                                                    <a href={form.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Blank
                                                    </a>
                                                </Button>

                                                {isCompleted && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                        className="h-7 text-xs px-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                                                    >
                                                        <a
                                                            href={api.getEstateDocumentDownloadUrl(form.code)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            View
                                                        </a>
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    disabled={uploadingForm === form.code}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = '.pdf';
                                                        input.onchange = (e: any) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleUpload(form.code, file);
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    <Upload className="w-3 h-3 mr-1" />
                                                    {uploadingForm === form.code ? "..." : "Upload"}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex gap-2 items-start">
                        <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                Need help filling out forms?
                            </p>
                            <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                                Visit the{" "}
                                <a
                                    href="https://www.courts.ca.gov/selfhelp-probate.htm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-blue-900"
                                >
                                    California Courts Self-Help Guide
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
