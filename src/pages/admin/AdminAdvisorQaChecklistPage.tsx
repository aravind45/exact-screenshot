import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Users,
  Calendar,
  MessageSquare,
  UserPlus,
  Search,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
};

type ChecklistSection = {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
};

const STORAGE_KEY = "admin-advisor-qa-checklist-v1";

const normalizeStatus = (status?: string): string => {
  if (status === "PENDING") return "PENDING_REVIEW";
  if (status === "VERIFIED") return "APPROVED";
  return status || "DRAFT";
};

const SECTIONS: ChecklistSection[] = [
  {
    id: "advisor_registration",
    title: "1. Advisor Registration",
    description: "Create advisor account, complete profile, set rates, and submit for review.",
    items: [
      {
        id: "signup_advisor",
        title: "Create advisor account",
        detail: "Use signup and select Advisor account type.",
        path: "/auth?mode=signup",
        icon: UserPlus,
      },
      {
        id: "complete_onboarding",
        title: "Complete advisor onboarding",
        detail: "Fill bio, expertise, license details, and hourly rate.",
        path: "/advisor/onboarding",
        icon: ShieldCheck,
      },
      {
        id: "publish_rate_plan",
        title: "Verify bookable rate plan",
        detail: "Confirm at least one service package exists in advisor profile.",
        path: "/advisor/profile",
        icon: DollarSign,
      },
    ],
  },
  {
    id: "admin_approval",
    title: "2. Admin Approval",
    description: "Review advisor in queue and approve.",
    items: [
      {
        id: "review_queue",
        title: "Open advisor queue",
        detail: "Find advisor under pending review.",
        path: "/admin/advisors",
        icon: Users,
      },
      {
        id: "approve_advisor",
        title: "Approve advisor",
        detail: "Approve profile and confirm status turns Approved.",
        path: "/admin/advisors",
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: "executor_booking",
    title: "3. Executor Search and Booking",
    description: "Executor should find advisor, book consultation, and confirm booking appears.",
    items: [
      {
        id: "search_marketplace",
        title: "Search advisor marketplace",
        detail: "Verify advisor appears in directory filters and search.",
        path: "/marketplace",
        icon: Search,
      },
      {
        id: "book_consultation",
        title: "Book consultation",
        detail: "Select slot, complete intake, and payment intent flow.",
        path: "/my-bookings",
        icon: Calendar,
      },
    ],
  },
  {
    id: "calendar_chat",
    title: "4. Calendar and Chat Validation",
    description: "Validate consultation visibility and two-way chat for advisor and executor.",
    items: [
      {
        id: "executor_calendar",
        title: "Executor calendar view",
        detail: "Booked consultation shows on consultation calendar page.",
        path: "/consultations/calendar",
        icon: Calendar,
      },
      {
        id: "executor_chat",
        title: "Executor chat",
        detail: "Executor can send/receive messages in My Bookings.",
        path: "/my-bookings",
        icon: MessageSquare,
      },
      {
        id: "advisor_chat",
        title: "Advisor chat",
        detail: "Advisor can see booking and reply in advisor bookings.",
        path: "/advisor/bookings",
        icon: MessageSquare,
      },
    ],
  },
];

export default function AdminAdvisorQaChecklistPage() {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setCheckedMap(parsed as Record<string, boolean>);
      }
    } catch {
      // Ignore malformed local state.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedMap));
  }, [checkedMap]);

  const { data: queuePayload, isLoading: queueLoading } = useQuery({
    queryKey: ["admin-advisor-qa-queue"],
    queryFn: () => api.marketplace.admin.getQueue({ limit: 200 }),
  });

  const queueStats = useMemo(() => {
    const advisors = Array.isArray((queuePayload as any)?.advisors)
      ? (queuePayload as any).advisors
      : Array.isArray(queuePayload)
        ? queuePayload
        : [];

    const normalized = advisors.map((advisor: any) => normalizeStatus(advisor?.status || advisor?.verificationStatus));

    return {
      pending: normalized.filter((status: string) => status === "PENDING_REVIEW").length,
      approved: normalized.filter((status: string) => status === "APPROVED").length,
      paused: normalized.filter((status: string) => status === "PAUSED").length,
      total: normalized.length,
    };
  }, [queuePayload]);

  const allItems = SECTIONS.flatMap((section) => section.items);
  const completedCount = allItems.filter((item) => checkedMap[item.id]).length;
  const progress = allItems.length === 0 ? 0 : Math.round((completedCount / allItems.length) * 100);

  const toggleItem = (itemId: string, value: boolean) => {
    setCheckedMap((prev) => ({ ...prev, [itemId]: value }));
  };

  const resetChecklist = () => {
    setCheckedMap({});
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <main className="max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Advisor Feature QA Checklist</h1>
              <p className="text-slate-500 mt-1">Run advisor registration, approval, booking, calendar, and chat checks in one place.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/admin/advisors">
                  Advisor Queue
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" onClick={resetChecklist}>Reset Checklist</Button>
            </div>
          </div>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Execution Progress</CardTitle>
              <CardDescription>{completedCount} of {allItems.length} checks completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="h-2" />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">Progress {progress}%</Badge>
                <Badge variant="outline">Pending Review {queueLoading ? "..." : queueStats.pending}</Badge>
                <Badge variant="outline">Approved {queueLoading ? "..." : queueStats.approved}</Badge>
                <Badge variant="outline">Paused {queueLoading ? "..." : queueStats.paused}</Badge>
                <Badge variant="outline">Total Advisors {queueLoading ? "..." : queueStats.total}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {SECTIONS.map((section) => (
              <Card key={section.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item) => {
                    const checked = Boolean(checkedMap[item.id]);
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-3 py-3 bg-white",
                          checked ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleItem(item.id, value === true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", checked ? "text-emerald-600" : "text-slate-400")} />
                            <p className={cn("text-sm font-semibold", checked ? "text-emerald-800" : "text-slate-800")}>{item.title}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                          <a href={item.path}>
                            Open
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

