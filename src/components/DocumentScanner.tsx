
import { useState } from "react";
import { Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DocumentScannerProps {
    onScanComplete: (data: any) => void;
    className?: string;
}

export function DocumentScanner({ onScanComplete, className }: DocumentScannerProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setIsScanning(true);
        setError(null);

        try {
            const data = await api.processDocument(file);
            toast({
                title: "Scan Complete",
                description: "Document analyzed successfully.",
            });
            onScanComplete(data);
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || "Failed to scan document.";
            setError(errorMessage);
            toast({
                title: "Scan Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className={className}>
            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-card">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Document Scanner</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Upload a financial statement (PDF) or image. Our AI will extract the details automatically.
                </p>

                <div className="w-full max-w-xs space-y-4">
                    <Input type="file" onChange={handleFileChange} accept=".pdf,image/*,.txt" disabled={isScanning} />

                    <Button
                        onClick={handleScan}
                        disabled={!file || isScanning}
                        className="w-full"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Analyze Document
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm text-left max-w-sm w-full"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
