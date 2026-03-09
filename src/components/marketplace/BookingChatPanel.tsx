import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BookingMessage = {
  id: string;
  senderId: string;
  senderRole: "EXECUTOR" | "ADVISOR";
  senderName: string;
  message: string;
  createdAt: string;
};

const normalizeMessages = (payload: unknown): BookingMessage[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((entry: any) => ({
      id: String(entry?.id || ""),
      senderId: String(entry?.senderId || ""),
      senderRole: entry?.senderRole === "ADVISOR" ? "ADVISOR" : "EXECUTOR",
      senderName: String(entry?.senderName || (entry?.senderRole === "ADVISOR" ? "Advisor" : "Executor")),
      message: String(entry?.message || ""),
      createdAt: String(entry?.createdAt || ""),
    }))
    .filter((entry) => Boolean(entry.id && entry.senderId && entry.message))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

interface BookingChatPanelProps {
  bookingId: string;
  canSend?: boolean;
  className?: string;
}

export function BookingChatPanel({ bookingId, canSend = true, className }: BookingChatPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-chat", bookingId],
    queryFn: () => api.marketplace.getBookingMessages(bookingId),
    enabled: Boolean(bookingId),
    staleTime: 10_000,
  });

  const messages = React.useMemo(() => normalizeMessages(data), [data]);

  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => api.marketplace.sendBookingMessage(bookingId, message),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["booking-chat", bookingId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send message");
    },
  });

  const handleSend = () => {
    const message = draft.trim();
    if (!message || !canSend) return;
    sendMutation.mutate(message);
  };

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white", className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <h4 className="text-sm font-semibold text-slate-800">Consultation Chat</h4>
      </div>

      <div ref={scrollRef} className="max-h-56 overflow-y-auto px-3 py-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No messages yet. Use chat to coordinate your consultation.</p>
        ) : (
          messages.map((entry) => {
            const mine = entry.senderId === user?.id;
            const timestamp = entry.createdAt ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) : "";

            return (
              <div key={entry.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2",
                    mine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"
                  )}
                >
                  <div className={cn("text-[10px] font-semibold mb-1", mine ? "text-indigo-100" : "text-slate-500")}>
                    {mine ? "You" : entry.senderName}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{entry.message}</p>
                  {timestamp && (
                    <div className={cn("text-[10px] mt-1", mine ? "text-indigo-100" : "text-slate-500")}>
                      {timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-100 p-3 space-y-2">
        <Textarea
          placeholder={canSend ? "Type your message..." : "Messaging disabled for cancelled bookings"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          disabled={!canSend || sendMutation.isPending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          className="text-sm"
        />
        <div className="flex justify-end">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSend} disabled={!canSend || sendMutation.isPending || !draft.trim()}>
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
