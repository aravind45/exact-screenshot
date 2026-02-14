import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Send, CheckCircle, Loader2 } from "lucide-react";

export function ContactForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: ""
    });
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS">("IDLE");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.message) return;

        setStatus("LOADING");
        try {
            await api.marketing.submitContact({
                ...formData,
                source: "landing_page"
            });
            setStatus("SUCCESS");
            toast.success("Message sent successfully!");
            setFormData({ name: "", email: "", message: "" });
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message. Please try again.");
            setStatus("IDLE");
        }
    };

    if (status === "SUCCESS") {
        return (
            <div className="bg-white p-8 rounded-2xl border border-border/50 shadow-lg text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-6">
                    Thanks for reaching out. We usually respond within 24 hours.
                </p>
                <Button
                    variant="outline"
                    onClick={() => setStatus("IDLE")}
                >
                    Send Another Message
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-border/50">
            <div className="mb-8">
                <h3 className="text-2xl font-black text-foreground mb-2">Contact Support</h3>
                <p className="text-muted-foreground font-medium">
                    Questions? We're here to help.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-bold text-foreground/80 ml-1">Name</label>
                    <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-bold text-foreground/80 ml-1">Email <span className="text-destructive">*</span></label>
                    <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-bold text-foreground/80 ml-1">Message <span className="text-destructive">*</span></label>
                    <Textarea
                        id="message"
                        required
                        placeholder="How can we help you?"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none py-3"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={status === "LOADING"}
                    className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 mt-2"
                >
                    {status === "LOADING" ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
                        </>
                    ) : (
                        <>
                            Send Message <Send className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
