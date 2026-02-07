
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Mail, Shield, UserCircle, CreditCard, Clock, Loader2, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface UserManagementProps {
    estateId: string;
}

export function UserManagement({ estateId }: UserManagementProps) {
    const queryClient = useQueryClient();
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("VIEWER");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLimitExceeded, setIsLimitExceeded] = useState(false);

    const { data: collaborators, isLoading } = useQuery({
        queryKey: ["collaborators", estateId],
        queryFn: () => api.getCollaborators(estateId)
    });

    const inviteMutation = useMutation({
        mutationFn: (data: { email: string; role: string }) =>
            api.inviteCollaborator({ estateId, ...data }),
        onSuccess: (response: any) => {
            if (response.limitExceeded) {
                setIsLimitExceeded(true);
                return;
            }
            queryClient.invalidateQueries({ queryKey: ["collaborators", estateId] });
            setIsInviteDialogOpen(false);
            setEmail("");
            setRole("VIEWER");
            toast.success("Invitation sent successfully!");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to send invitation");
        }
    });

    const seatPaymentMutation = useMutation({
        mutationFn: () => api.createExtraSeatSession({ estateId, email, role }),
        onSuccess: (session: any) => {
            setClientSecret(session.clientSecret);
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to initiate payment");
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        inviteMutation.mutate({ email, role });
    };

    if (isLoading) return <div className="p-4 text-center">Loading collaborators...</div>;

    const grants = collaborators?.grants || [];
    const pendingInvites = collaborators?.invitations || [];

    return (
        <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        Estate Collaborators
                    </CardTitle>
                    <CardDescription>
                        Attorneys, Co-Executors, and Heirs with access to this case.
                    </CardDescription>
                </div>

                <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
                    setIsInviteDialogOpen(open);
                    if (!open) {
                        setClientSecret(null);
                        setIsLimitExceeded(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className={clientSecret ? "sm:max-w-[700px]" : "sm:max-w-[425px]"}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-indigo-600" />
                                {clientSecret ? "Complete Payment" : "Invite Collaborator"}
                            </DialogTitle>
                            <DialogDescription>
                                {clientSecret
                                    ? "You've reached the free limit. Finish payment to add another seat."
                                    : "Add a new member to the estate team. They will receive an email invitation."}
                            </DialogDescription>
                        </DialogHeader>

                        {clientSecret ? (
                            <div className="mt-4 border rounded-xl overflow-hidden bg-white">
                                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                    <EmbeddedCheckout className="min-h-[400px]" />
                                </EmbeddedCheckoutProvider>
                            </div>
                        ) : isLimitExceeded ? (
                            <div className="space-y-6 pt-4">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1 text-sm">Free Seat Limit Reached</p>
                                        <p className="text-xs leading-relaxed opacity-90">
                                            Your estate currently has 5 or more collaborators. Additional seats are available for a one-time charge of **$9.99** each.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={() => seatPaymentMutation.mutate()}
                                        disabled={seatPaymentMutation.isPending}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold gap-2"
                                    >
                                        {seatPaymentMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Pay $9.99 for Extra Seat
                                                <CreditCard className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsLimitExceeded(false)}
                                        className="text-slate-500 font-medium"
                                    >
                                        Back to Details
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="collaborator@example.com"
                                                className="pl-10 h-10 rounded-lg"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="role">Collaborator Role</Label>
                                        <Select value={role} onValueChange={setRole}>
                                            <SelectTrigger className="h-10 rounded-lg">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="VIEWER">Viewer (Read Only)</SelectItem>
                                                <SelectItem value="CO_EXECUTOR">Co-Executor (Full Access)</SelectItem>
                                                <SelectItem value="ATTORNEY">Attorney (Legal Oversight)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg font-bold"
                                    disabled={inviteMutation.isPending}
                                >
                                    {inviteMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        "Send Invitation"
                                    )}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Active Collaborators */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> Active Members
                    </h3>
                    <div className="grid gap-3">
                        {grants.length === 0 && (
                            <div className="text-sm text-slate-400 italic">No other collaborators yet.</div>
                        )}
                        {grants.map((grant: any) => (
                            <div key={grant.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                        {(grant.user?.fullName || "A").charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">{grant.user?.fullName || grant.user?.email}</div>
                                        <div className="text-xs text-slate-500">{grant.role}</div>
                                    </div>
                                </div>
                                <div className="text-xs px-2 py-1 rounded bg-white border text-slate-500">
                                    Active
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Invitations */}
                {pendingInvites.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Pending Invitations
                        </h3>
                        <div className="grid gap-3">
                            {pendingInvites.map((invite: any) => (
                                <div key={invite.id} className="flex items-center justify-between p-3 border border-dashed rounded-lg bg-amber-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-700">{invite.email}</div>
                                            <div className="text-xs text-slate-500">Sent to {invite.role}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-amber-600 font-medium">
                                        Waiting for Join
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
