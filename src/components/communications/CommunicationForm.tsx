import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Phone, Mail, FileText, Printer, Users,
    Calendar as CalendarIcon,
    Plus,
    X,
    Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CommunicationType, CommunicationDirection } from "@/lib/api";

const formSchema = z.object({
    type: z.string().min(1, "Required"),
    direction: z.string().min(1, "Required"),
    occurredAt: z.date(),
    subject: z.string().optional(),
    contactName: z.string().optional(),
    contactChannel: z.string().optional(),
    notes: z.string().min(5, "Notes must be at least 5 characters"),
    followUpDueAt: z.date().optional(),
    statusChange: z.string().optional(),
});

interface CommunicationFormProps {
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    onCancel: () => void;
    isLoading?: boolean;
    initialData?: any;
}

export function CommunicationForm({ onSubmit, onCancel, isLoading, initialData }: CommunicationFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "CALL",
            direction: "OUTBOUND",
            occurredAt: new Date(),
            notes: "",
            ...initialData
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Method & Direction */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white rounded-xl h-11 border-slate-200">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CALL"><div className="flex items-center gap-2"><Phone className="w-4 h-4" /> Phone Call</div></SelectItem>
                                            <SelectItem value="EMAIL"><div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</div></SelectItem>
                                            <SelectItem value="POSTAL_MAIL"><div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Letter</div></SelectItem>
                                            <SelectItem value="FAX"><div className="flex items-center gap-2"><Printer className="w-4 h-4" /> Fax</div></SelectItem>
                                            <SelectItem value="IN_PERSON"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> In-Person</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="direction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Direction</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white rounded-xl h-11 border-slate-200">
                                                <SelectValue placeholder="Select direction" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="OUTBOUND">Outbound (You reached out)</SelectItem>
                                            <SelectItem value="INBOUND">Inbound (They reached out)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Date & Contact Info */}
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="occurredAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Date of Communication</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full h-11 rounded-xl text-left font-normal border-slate-200 bg-white",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date > new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Representative Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Jane Smith" {...field} className="bg-white rounded-xl h-11 border-slate-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Subject / Purpose</FormLabel>
                            <FormControl>
                                <Input placeholder="Brief summary of the contact" {...field} className="bg-white rounded-xl h-11 border-slate-200" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase text-slate-500">Detailed Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Include key details, what was discussed, and outcome..."
                                    className="resize-none h-32 bg-white rounded-2xl border-slate-200 leading-relaxed"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <FormField
                        control={form.control}
                        name="followUpDueAt"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Optional: Follow-up Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-11 rounded-xl text-left font-normal border-slate-200 bg-white",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? format(field.value, "PPP") : <span>Set reminder</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription className="text-[10px]">We'll alert you if you haven't heard back by this date.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="statusChange"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-bold uppercase text-slate-500">Outcome / Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white rounded-xl h-11 border-slate-200">
                                            <SelectValue placeholder="Update status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="initial_contact">Initial Contact Made</SelectItem>
                                        <SelectItem value="documents_requested">Documents Requested</SelectItem>
                                        <SelectItem value="documents_submitted">Documents Submitted</SelectItem>
                                        <SelectItem value="claim_submitted">Claim Form Submitted</SelectItem>
                                        <SelectItem value="under_review">Under Institutional Review</SelectItem>
                                        <SelectItem value="approved">Approved / Payment Sent</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-xl px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                        {isLoading ? "Saving..." : "Log Communication"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
