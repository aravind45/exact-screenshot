import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Map } from "lucide-react";
import { STATE_RULES, StateRule } from "@/lib/stateRules";

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function StateRulebook() {
    const [searchTerm, setSearchTerm] = useState("");

    const stateEntries = Object.entries(STATE_RULES);

    const filteredStates = stateEntries.filter(([code, rule]) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            code.toLowerCase().includes(searchLower) ||
            rule.probateTerm.toLowerCase().includes(searchLower) ||
            rule.smallEstateTerm.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <Card className="card-elevated border-none">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Map className="w-5 h-5 text-indigo-600" />
                                50-State Legal Rulebook
                            </CardTitle>
                            <CardDescription className="mt-1">
                                A centralized reference for all state-specific thresholds, Uniform Probate Code (UPC) status, and exact legal terminology used by the application's routing engine.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6 max-w-sm">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search state code or terms (e.g., 'NY', 'Muniment')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-muted/30"
                        />
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">State</TableHead>
                                    <TableHead>Probate Type</TableHead>
                                    <TableHead>Small Estate Threshold</TableHead>
                                    <TableHead className="hidden md:table-cell">Small Estate Term</TableHead>
                                    <TableHead className="text-center">UPC Status</TableHead>
                                    <TableHead className="hidden lg:table-cell text-right">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStates.map(([code, rule]) => (
                                    <TableRow key={code} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold text-indigo-600">
                                            {code}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{rule.probateTerm}</div>
                                            {rule.probateCitation && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    {rule.probateCitation.join(", ")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-sm cursor-help" title={`If personal property is under ${formatCurrency(rule.threshold)}, it qualifies for the small estate track.`}>
                                                {formatCurrency(rule.threshold)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="font-medium text-sm">{rule.smallEstateTerm}</div>
                                            {rule.smallEstateCitation && (
                                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                                    {rule.smallEstateCitation.join(", ")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {rule.isUPC ? (
                                                <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-right text-xs text-muted-foreground max-w-[200px] truncate" title={rule.notes}>
                                            {rule.notes || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {filteredStates.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                            No states found matching your search.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
