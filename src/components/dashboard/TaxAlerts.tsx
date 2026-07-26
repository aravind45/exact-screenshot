
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Info, Calculator, Landmark } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TaxAlertsProps {
    estate: any;
    totalValue: number;
    className?: string;
}

import {
    FEDERAL_ESTATE_TAX,
    STATE_ESTATE_TAX_THRESHOLDS,
    INHERITANCE_TAX_STATES,
} from "@/lib/jurisdictionData";

// 2026 federal exemption: $15,000,000/person (P.L. 119-21, effective 2026-01-01)
const FEDERAL_ESTATE_TAX_THRESHOLD = FEDERAL_ESTATE_TAX.exemption2026;

export function TaxAlerts({ estate, totalValue, className }: TaxAlertsProps) {
    if (!estate) return null;

    const state = estate.deceasedState || '';
    const alerts = [];

    // Federal Alert
    if (totalValue > FEDERAL_ESTATE_TAX_THRESHOLD) {
        alerts.push({
            type: 'critical',
            title: 'Federal Estate Tax Alert (Form 706)',
            description: `The total estate value ($${totalValue.toLocaleString()}) exceeds the federal exemption limit of $${FEDERAL_ESTATE_TAX_THRESHOLD.toLocaleString()}. A Federal Estate Tax Return (Form 706) is likely required within 9 months of death.`,
            icon: ShieldAlert
        });
    } else if (totalValue > FEDERAL_ESTATE_TAX_THRESHOLD * 0.8) {
        alerts.push({
            type: 'warning',
            title: 'Approaching Federal Estate Tax Limit',
            description: 'The estate value is nearing the federal exemption threshold. Precise valuation of all assets is critical to determine if Form 706 filing is necessary.',
            icon: Info
        });
    }

    // State Estate Tax Alert
    const stateThreshold = STATE_ESTATE_TAX_THRESHOLDS[state];
    if (stateThreshold && totalValue > stateThreshold) {
        alerts.push({
            type: 'important',
            title: `${state} State Estate Tax Alert`,
            description: `${state} has a lower estate tax threshold ($${stateThreshold.toLocaleString()}) than the federal government. A state estate tax return may be required.`,
            icon: Landmark
        });
    }

    // Inheritance Tax Alert
    if (INHERITANCE_TAX_STATES.includes(state)) {
        alerts.push({
            type: 'info',
            title: `${state} Inheritance Tax Notice`,
            description: `${state} imposes an Inheritance Tax on distributions to certain beneficiaries. Note: Pennsylvania offers a 5% discount if tax is pre-paid within 3 months of death.`,
            icon: Calculator
        });
    }

    if (alerts.length === 0) return null;

    return (
        <div className={cn("space-y-4", className)}>
            {alerts.map((alert, idx) => (
                <Alert
                    key={idx}
                    variant={alert.type === 'critical' ? 'destructive' : 'default'}
                    className={cn(
                        "border-l-4",
                        alert.type === 'critical' && "border-l-destructive",
                        alert.type === 'warning' && "border-l-amber-500 bg-amber-50/50",
                        alert.type === 'important' && "border-l-primary bg-primary/5",
                        alert.type === 'info' && "border-l-blue-400 bg-blue-50/30"
                    )}
                >
                    <alert.icon className="h-4 w-4" />
                    <AlertTitle className="font-black flex items-center gap-2">
                        {alert.title}
                        {alert.type === 'critical' && <span className="text-[10px] bg-destructive text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Urgent</span>}
                    </AlertTitle>
                    <AlertDescription className="text-slate-600 font-medium">
                        {alert.description}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}
