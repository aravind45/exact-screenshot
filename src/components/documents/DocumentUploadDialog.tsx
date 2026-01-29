import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";

interface DocumentUploadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (name: string, file: File) => void;
    initialName?: string;
    title?: string;
    description?: string;
}

export function DocumentUploadDialog({
    isOpen,
    onClose,
    onUpload,
    initialName = "",
    title = "Upload Document",
    description = "Give this document a clear name so you can find it later."
}: DocumentUploadDialogProps) {
    const [name, setName] = useState(initialName);
    const [file, setFile] = useState<File | null>(null);

    // Update name when initialName changes (e.g. from state change in parent)
    React.useEffect(() => {
        setName(initialName);
    }, [initialName, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            if (!name) {
                // Auto-fill name from filename without extension
                const fileName = e.target.files[0].name.split('.').slice(0, -1).join('.');
                setName(fileName);
            }
        }
    };

    const handleUpload = () => {
        if (name && file) {
            onUpload(name, file);
            setName("");
            setFile(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="doc-name">Document Name</Label>
                        <Input
                            id="doc-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Death Certificate, Will Copy"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="doc-file">Select File</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="doc-file"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-slate-600 truncate max-w-[300px] font-medium">
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!name || !file}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Upload Document
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
