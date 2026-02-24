import React, { useState } from 'react';
import { calculateAuthorityRecommendation } from '@/lib/authorityEngine';
import { generateRoadmap } from '@/config/roadmapGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Scale, FileText, DollarSign, Users } from 'lucide-react';

interface MARoadmapTestProps {
  onTestComplete?: (result: any) => void;
}

export default function DebugMARoadmap({ onTestComplete }: MARoadmapTestProps) {
  const [testState, setTestState] = useState({
    hasWill: true,
    hasContest: false,
    estimatedValue: 100000,
    isSpouse: false,
    hasOutOfStateProperty: false,
    isTrustRevocable: false,
    hasTODDeed: false,
    hasUnknownHeirs: false
  });

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 Testing MA Roadmap Generation...');
      console.log('Input State:', testState);

      // Test 1: Authority Recommendation
      console.log('📋 Testing Authority Recommendation...');
      const authority = calculateAuthorityRecommendation([], 'MA', {
        hasWill: testState.hasWill,
        isSpouse: testState.isSpouse,
        isOutOfState: testState.hasOutOfStateProperty,
        estimatedValue: testState.estimatedValue,
        isTrustRevocable: testState.isTrustRevocable,
        hasTODDeed: testState.hasTODDeed,
        hasContest: testState.hasContest
      });

      console.log('Authority Result:', authority);

      // Test 2: Roadmap Generation
      console.log('🗺️ Testing Roadmap Generation...');
      const roadmap = generateRoadmap(
        authority.type,
        'MA',
        [],
        authority.activeEngines || ['PROBATE'],
        testState.hasWill
      );

      console.log('Roadmap Result:', roadmap);

      const testResult = {
        authority,
        roadmap,
        input: testState,
        timestamp: new Date().toISOString()
      };

      setResult(testResult);
      onTestComplete?.(testResult);

    } catch (err: any) {
      console.error('❌ MA Roadmap Test Failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTestState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            Massachusetts Roadmap Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Has Will?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={testState.hasWill ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('hasWill', true)}
                >
                  Yes
                </Button>
                <Button
                  variant={!testState.hasWill ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('hasWill', false)}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Is Spouse?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={testState.isSpouse ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('isSpouse', true)}
                >
                  Yes
                </Button>
                <Button
                  variant={!testState.isSpouse ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('isSpouse', false)}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Is Contested?
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={testState.hasContest ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('hasContest', true)}
                >
                  Yes
                </Button>
                <Button
                  variant={!testState.hasContest ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('hasContest', false)}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Estimated Value
              </Label>
              <Input
                type="number"
                value={testState.estimatedValue}
                onChange={(e) => handleInputChange('estimatedValue', parseInt(e.target.value))}
                placeholder="e.g., 100000"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTest}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg"
            >
              {isLoading ? 'Testing...' : 'Test MA Roadmap Generation'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setError(null);
              }}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <span className="font-bold">Error:</span>
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">Authority Result</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Type:</span>
                  <Badge variant="outline" className="ml-2">{result.authority.type}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Master Mode:</span>
                  <Badge variant="outline" className="ml-2">{result.authority.masterMode}</Badge>
                </div>
                <div>
                  <span className="font-semibold">Reason:</span>
                  <span className="ml-2 text-gray-600">{result.authority.reason}</span>
                </div>
                <div>
                  <span className="font-semibold">Active Engines:</span>
                  <div className="ml-2 flex gap-1">
                    {result.authority.activeEngines?.map((engine: string) => (
                      <Badge key={engine} variant="outline">{engine}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">Roadmap Result</Badge>
                <span className="text-xs text-gray-500">({result.roadmap.length} phases)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.roadmap.length === 0 ? (
                <div className="text-red-600">❌ No roadmap phases generated!</div>
              ) : (
                <div className="space-y-4">
                  {result.roadmap.map((phase: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{phase.phase}</Badge>
                          <span className="font-semibold">{phase.title}</span>
                        </div>
                        <Badge variant="secondary">{phase.tasks?.length || 0} tasks</Badge>
                      </div>
                      {phase.subtitle && (
                        <p className="text-sm text-gray-600 mb-2">{phase.subtitle}</p>
                      )}
                      {phase.tasks && phase.tasks.length > 0 && (
                        <div className="space-y-1">
                          {phase.tasks.slice(0, 3).map((task: any, taskIndex: number) => (
                            <div key={taskIndex} className="text-sm text-gray-700 flex items-center gap-2">
                              <ArrowRight className="w-3 h-3 text-blue-500" />
                              {task.title}
                            </div>
                          ))}
                          {phase.tasks.length > 3 && (
                            <div className="text-xs text-gray-500">... and {phase.tasks.length - 3} more tasks</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">Debug Info</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Test Input:</span>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">{JSON.stringify(result.input, null, 2)}</pre>
                </div>
                <div>
                  <span className="font-semibold">Timestamp:</span>
                  <span className="ml-2 text-gray-600">{new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}