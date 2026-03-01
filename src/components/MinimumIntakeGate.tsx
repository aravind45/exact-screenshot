import { useNavigate } from "react-router-dom";
import { ClipboardList, ArrowRight, HelpCircle, Scale, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MinimumIntakeGateProps {
  estateId?: string;
}

export function MinimumIntakeGate({ estateId }: MinimumIntakeGateProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6">
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ClipboardList className="w-52 h-52 text-indigo-900" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Finish setup to generate your plan
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                One more step before we can build your personalized roadmap
              </p>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            To generate an accurate settlement roadmap we need to know how this estate will be administered.
            Showing a generic plan before this step would surface <strong className="text-slate-800">incorrect tasks and misleading deadlines</strong> — we want to protect you from that.
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Required before we can continue</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-3 h-3 text-indigo-600" />
                </div>
                <span>State where the decedent resided — so we apply the right probate laws</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-3 h-3 text-indigo-600" />
                </div>
                <span>Administration type (probate, trust, or both) — so we show the right tasks</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm px-8 h-11 rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 gap-2"
              onClick={() => navigate("/onboarding")}
            >
              Complete Setup
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-slate-500 hover:text-indigo-600 font-bold text-sm gap-1.5"
              onClick={() => navigate("/onboarding")}
            >
              <HelpCircle className="w-4 h-4" />
              Not sure which type? We&apos;ll help you decide
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 font-medium">
        This takes about 2 minutes. Your registration is already saved.
      </p>
    </div>
  );
}
