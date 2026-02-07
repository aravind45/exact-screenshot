
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AcceptInvite() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    const acceptMutation = useMutation({
        mutationFn: (token: string) => api.acceptInvitation(token),
        onSuccess: () => {
            setStatus("success");
            toast.success("Invitation accepted! Welcome to the estate team.");
        },
        onError: (err: any) => {
            setStatus("error");
            setErrorMsg(err.message || "Failed to accept invitation");
            toast.error(err.message || "Failed to accept invitation");
        }
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            // Store target in session storage to redirect after login
            sessionStorage.setItem("after_login_redirect", `/invite/${token}`);
            navigate("/auth");
            return;
        }

        if (token && status === "loading") {
            acceptMutation.mutate(token);
        }
    }, [token, user, authLoading]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none card-elevated">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Accept Invitation</CardTitle>
                    <CardDescription> Joining an estate collaboration team on ExpectedEstate</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center justify-center py-6">
                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <p className="text-slate-500 font-medium">Processing your invitation...</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-2">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Successfully Joined!</h3>
                            <p className="text-slate-500">
                                You now have access to the estate. You can view tasks, documents, and assets shared with you.
                            </p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2">
                                <XCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Invitation Error</h3>
                            <p className="text-red-600 font-medium">{errorMsg}</p>
                            <p className="text-slate-500 text-sm">
                                This link may be expired or already used. Please contact the inviter for a new link.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter>
                    {status === "success" ? (
                        <Button
                            className="w-full bg-slate-900 hover:bg-slate-800 h-12 rounded-xl font-bold text-lg gap-2"
                            onClick={() => navigate("/dashboard")}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    ) : status === "error" ? (
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl font-bold"
                            onClick={() => navigate("/")}
                        >
                            Back Home
                        </Button>
                    ) : null}
                </CardFooter>
            </Card>
        </div>
    );
}
