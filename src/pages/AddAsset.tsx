
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { InstitutionSelect, Institution } from "@/components/InstitutionSelect";
import { Sidebar } from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getAssetAuthorityType, getStateRule } from "@/lib/authorityEngine";
import { AuthorityBadge } from "@/components/AuthorityBadge";
import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    institution: z.string().min(2, "Institution name is required"),
    assetType: z.string().min(1, "Asset type is required"),
    category: z.string().min(1, "Category is required"),
    value: z.coerce.number().min(0, "Value must be positive"),
    ownershipType: z.string().default("INDIVIDUAL"),
    status: z.string().default("discovered"),
    priority: z.string().default("medium"),
});

export default function AddAsset() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedInst, setSelectedInst] = useState<Institution | null>(null);

    const { data: estate } = useQuery({
        queryKey: ['estate'],
        queryFn: api.getMyEstate,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            institution: "",
            assetType: "checking",
            category: "financial",
            value: 0,
            ownershipType: "INDIVIDUAL",
            status: "discovered",
            priority: "medium",
        },
    });

    const ownershipType = form.watch("ownershipType");
    const assetValue = form.watch("value");

    const authorityPreview = useMemo(() => {
        if (!estate) return "UNSET";
        const rule = getStateRule((estate as any).deceasedState || "CA");
        return getAssetAuthorityType({
            ownershipType,
            value: assetValue
        }, rule.threshold);
    }, [estate, ownershipType, assetValue]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            // Merge institution details if selected
            const payload = {
                ...values,
                institutionPhone: selectedInst?.phone,
                institutionEmail: selectedInst?.email,
                institutionFax: selectedInst?.fax,
                institutionAddress: selectedInst?.address,
                institutionUrl: selectedInst?.website
            };

            await api.createAsset(payload);
            toast({
                title: "Asset Created",
                description: selectedInst
                    ? `Added ${values.institution} with contact info.`
                    : "The asset has been successfully added to your estate.",
            });
            navigate("/dashboard");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create asset. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-background">
                <header className="sticky top-0 z-40 glass border-b border-border/50">
                    <div className="section-container">
                        <div className="flex items-center h-16">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => navigate("/dashboard")}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <h1 className="ml-4 font-bold text-lg">Add New Asset</h1>
                        </div>
                    </div>
                </header>

                <main className="section-container py-8 max-2xl mx-auto">
                    <div className="card-elevated p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <FormField
                                    control={form.control}
                                    name="institution"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Institution Name</FormLabel>
                                            <FormControl>
                                                <InstitutionSelect
                                                    value={field.value}
                                                    onChange={(val) => {
                                                        field.onChange(val);
                                                        setSelectedInst(null); // Clear strict selection if typing manually
                                                    }}
                                                    onSelect={(inst) => {
                                                        field.onChange(inst.name);
                                                        setSelectedInst(inst);
                                                        toast({
                                                            title: "Institution Found!",
                                                            description: "Contact details will be auto-filled."
                                                        });
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="assetType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Asset Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="checking">Checking Account</SelectItem>
                                                        <SelectItem value="savings">Savings Account</SelectItem>
                                                        <SelectItem value="401k">401(k)</SelectItem>
                                                        <SelectItem value="ira">IRA</SelectItem>
                                                        <SelectItem value="life_insurance">Life Insurance</SelectItem>
                                                        <SelectItem value="stock">Stock/Brokerage</SelectItem>
                                                        <SelectItem value="property">Real Estate</SelectItem>
                                                        <SelectItem value="vehicle">Vehicle</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="ownershipType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-2">
                                                    <FormLabel className="mb-0">Ownership Type (Titling)</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">Projected Category:</span>
                                                        <AuthorityBadge type={authorityPreview} />
                                                    </div>
                                                </div>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="How is it owned?" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="INDIVIDUAL">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">Individual (Probate)</span>
                                                                <span className="text-[10px] text-muted-foreground">Owned solely by the deceased. Requires court or affidavit.</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="BENEFICIARY">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">Named Beneficiaries (TOD/POD)</span>
                                                                <span className="text-[10px] text-muted-foreground">Transfer on death or payable on death designation. Bypass probate.</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="JOINT">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">Jointly Owned (Survivor)</span>
                                                                <span className="text-[10px] text-muted-foreground">Held with right of survivorship. Automatic transfer.</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="TRUST">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">Held in Trust</span>
                                                                <span className="text-[10px] text-muted-foreground">Asset title is in the name of a Trust. Trustee has authority.</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="financial">Financial</SelectItem>
                                                        <SelectItem value="retirement">Retirement</SelectItem>
                                                        <SelectItem value="insurance">Insurance</SelectItem>
                                                        <SelectItem value="property">Property</SelectItem>
                                                        <SelectItem value="digital">Digital Asset</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estimated Value ($)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="discovered">Discovered</SelectItem>
                                                        <SelectItem value="contacted">Contacted</SelectItem>
                                                        <SelectItem value="documents_submitted">Docs Submitted</SelectItem>
                                                        <SelectItem value="in_review">In Review</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="distributed">Distributed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Priority</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="urgent">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                                        {isSubmitting ? "Saving..." : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Asset
                                            </>
                                        )}
                                    </Button>
                                </div>

                            </form>
                        </Form>
                    </div>
                </main>
            </div>
        </div>
    );
}
