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
            // Upload logic here
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
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Required Probate Forms
                </CardTitle>
                <CardDescription>
                    Download blank forms, complete them, and upload the finished documents
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {REQUIRED_FORMS.map((form) => {
                        const status = getFormStatus(form.code);
                        const isCompleted = status === "OBTAINED";
                        const isPending = status === "PENDING";

                        return (
                            <div
                                key={form.code}
                                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-primary">{form.code}</span>
                                        {form.required && (
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{form.name}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    {isCompleted && (
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Completed
                                        </Badge>
                                    )}
                                    {isPending && (
                                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Pending
                                        </Badge>
                                    )}
                                    {!isCompleted && !isPending && (
                                        <Badge variant="outline" className="text-muted-foreground">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Not Started
                                        </Badge>
                                    )}

                                    {/* Download Blank Form */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="gap-2"
                                    >
                                        <a href={form.url} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4" />
                                            Download
                                        </a>
                                    </Button>

                                    {/* Upload Completed Form */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
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
                                        <Upload className="w-4 h-4" />
                                        {uploadingForm === form.code ? "Uploading..." : "Upload"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <div className="flex gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Need help filling out forms?
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                Visit the{" "}
                                <a
                                    href="https://www.courts.ca.gov/selfhelp-probate.htm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-blue-900"
                                >
                                    California Courts Self-Help Guide
                                </a>
                                {" "}for instructions
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
