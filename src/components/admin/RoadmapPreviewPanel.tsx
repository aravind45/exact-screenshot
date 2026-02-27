/**
 * Roadmap Preview Panel Component
 * 
 * Interactive preview of a roadmap for a specific estate profile.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Play, FileText, MapPin, DollarSign, Users, Home, Briefcase, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RoadmapPreviewPanelProps {
  defaultStateCode?: string;
}

interface RoadmapTask {
  id: string;
  title: string;
  authorityScope?: string;
  description?: string;
}

interface RoadmapPhase {
  phase: string;
  title: string;
  tasks: RoadmapTask[];
}

interface RoadmapData {
  phases: RoadmapPhase[];
  filteredCount: number;
  totalCount: number;
}

const STATE_OPTIONS = [
  { code: 'CA', name: 'California' },
  { code: 'NY', name: 'New York' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'OH', name: 'Ohio' },
  { code: 'IL', name: 'Illinois' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'WA', name: 'Washington' },
  { code: 'AZ', name: 'Arizona' },
];

export function RoadmapPreviewPanel({ defaultStateCode = 'CA' }: RoadmapPreviewPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);

  // Form state
  const [stateCode, setStateCode] = useState(defaultStateCode);
  const [authorityType, setAuthorityType] = useState<'PROBATE' | 'TRUST' | 'BOTH'>('PROBATE');
  const [hasRealProperty, setHasRealProperty] = useState(true);
  const [estateValue, setEstateValue] = useState(500000);
  const [hasWill, setHasWill] = useState(true);
  const [county, setCounty] = useState('');
  const [isSmallEstate, setIsSmallEstate] = useState(false);
  const [hasMinorBeneficiaries, setHasMinorBeneficiaries] = useState(false);
  const [isInternational, setIsInternational] = useState(false);
  const [hasTODDeed, setHasTODDeed] = useState(false);
  const [isSurvivingSpouse, setIsSurvivingSpouse] = useState(false);

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const response = await api.admin.previewRoadmap({
        stateCode,
        authorityType,
        hasRealProperty,
        estateValue,
        hasWill,
        county: county || undefined,
        characteristics: {
          isSmallEstate,
          hasMinorBeneficiaries,
          isInternational,
          hasTODDeed,
          isSurvivingSpouse,
        },
      });

      setRoadmap(response.roadmap);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Preview Failed",
        description: error.message || "Failed to generate roadmap preview",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthorityScopeBadge = (scope?: string) => {
    switch (scope) {
      case 'PROBATE':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Probate</Badge>;
      case 'TRUST':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Trust</Badge>;
      case 'BOTH':
        return <Badge variant="outline" className="text-green-600 border-green-200">Both</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Estate Profile Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {STATE_OPTIONS.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Authority Type */}
            <div className="space-y-2">
              <Label htmlFor="authorityType">Authority Type</Label>
              <Select value={authorityType} onValueChange={(v) => setAuthorityType(v as typeof authorityType)}>
                <SelectTrigger id="authorityType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROBATE">Probate</SelectItem>
                  <SelectItem value="TRUST">Trust</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* County */}
            <div className="space-y-2">
              <Label htmlFor="county">
                <MapPin className="w-4 h-4 inline mr-1" />
                County (optional)
              </Label>
              <Input
                id="county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="e.g., Los Angeles"
              />
            </div>

            {/* Estate Value */}
            <div className="space-y-2">
              <Label htmlFor="estateValue">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Estate Value
              </Label>
              <Input
                id="estateValue"
                type="number"
                value={estateValue}
                onChange={(e) => setEstateValue(Number(e.target.value))}
                min={0}
                step={1000}
              />
            </div>

            {/* Has Will */}
            <div className="flex items-center justify-between pt-6">
              <Label htmlFor="hasWill" className="cursor-pointer">
                <FileText className="w-4 h-4 inline mr-1" />
                Has Will
              </Label>
              <Switch
                id="hasWill"
                checked={hasWill}
                onCheckedChange={setHasWill}
              />
            </div>

            {/* Has Real Property */}
            <div className="flex items-center justify-between pt-6">
              <Label htmlFor="hasRealProperty" className="cursor-pointer">
                <Home className="w-4 h-4 inline mr-1" />
                Has Real Property
              </Label>
              <Switch
                id="hasRealProperty"
                checked={hasRealProperty}
                onCheckedChange={setHasRealProperty}
              />
            </div>

            {/* Small Estate */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isSmallEstate" className="cursor-pointer">
                Small Estate
              </Label>
              <Switch
                id="isSmallEstate"
                checked={isSmallEstate}
                onCheckedChange={setIsSmallEstate}
              />
            </div>

            {/* Minor Beneficiaries */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasMinorBeneficiaries" className="cursor-pointer">
                <Users className="w-4 h-4 inline mr-1" />
                Minor Beneficiaries
              </Label>
              <Switch
                id="hasMinorBeneficiaries"
                checked={hasMinorBeneficiaries}
                onCheckedChange={setHasMinorBeneficiaries}
              />
            </div>

            {/* International */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isInternational" className="cursor-pointer">
                <Globe className="w-4 h-4 inline mr-1" />
                International
              </Label>
              <Switch
                id="isInternational"
                checked={isInternational}
                onCheckedChange={setIsInternational}
              />
            </div>

            {/* TOD Deed */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasTODDeed" className="cursor-pointer">
                Has TOD Deed
              </Label>
              <Switch
                id="hasTODDeed"
                checked={hasTODDeed}
                onCheckedChange={setHasTODDeed}
              />
            </div>

            {/* Surviving Spouse */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isSurvivingSpouse" className="cursor-pointer">
                Surviving Spouse
              </Label>
              <Switch
                id="isSurvivingSpouse"
                checked={isSurvivingSpouse}
                onCheckedChange={setIsSurvivingSpouse}
              />
            </div>
          </div>

          <Button 
            onClick={handlePreview} 
            disabled={isLoading}
            className="mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Preview
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {roadmap && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Roadmap Preview: {stateCode} {authorityType}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{roadmap.filteredCount} of {roadmap.totalCount} tasks</span>
                <Badge variant="outline">
                  {Math.round((roadmap.filteredCount / roadmap.totalCount) * 100)}% included
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={[roadmap.phases[0]?.phase]} className="w-full">
              {roadmap.phases.map((phase) => (
                <AccordionItem key={phase.phase} value={phase.phase}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{phase.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {phase.tasks.length} tasks
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-xs text-muted-foreground">{task.id}</code>
                              {getAuthorityScopeBadge(task.authorityScope)}
                            </div>
                            <p className="font-medium mt-1">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
