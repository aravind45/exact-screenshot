import React, { useEffect, useState } from 'react';
import { calculateAuthorityRecommendation } from '@/lib/authorityEngine';
import { generateRoadmap } from '@/config/roadmapGenerator';
import { getStateRule } from '@/lib/stateRules';

export default function SimpleMARoadmapTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runTest();
  }, []);

  const runTest = async () => {
    try {
      console.log('🔍 Starting Simple MA Roadmap Test...');
      
      // Test 1: Check if MA state rules exist
      console.log('📋 Testing MA State Rules...');
      const maRules = getStateRule('MA');
      console.log('MA Rules:', maRules);
      
      if (!maRules) {
        throw new Error('MA state rules not found!');
      }

      // Test 2: Test authority recommendation
      console.log('🎯 Testing Authority Recommendation...');
      const authority = calculateAuthorityRecommendation([], 'MA', {
        hasWill: true,
        isSpouse: false,
        isOutOfState: false,
        estimatedValue: 100000,
        isTrustRevocable: false,
        hasTODDeed: false,
        hasContest: false
      });
      
      console.log('Authority Result:', authority);

      // Test 3: Test roadmap generation
      console.log('🗺️ Testing Roadmap Generation...');
      const roadmap = generateRoadmap(
        authority.type,
        'MA',
        [],
        authority.activeEngines || ['PROBATE'],
        true
      );
      
      console.log('Roadmap Result:', roadmap);

      // Test 4: Check for MA-specific content
      const hasMASpecificContent = roadmap.some((phase: any) => 
        phase.tasks?.some((task: any) => 
          task.title?.includes('MA') || 
          task.title?.includes('Massachusetts') ||
          task.description?.includes('MA') ||
          task.description?.includes('Massachusetts')
        )
      );

      const testResult = {
        maRules,
        authority,
        roadmap,
        hasMASpecificContent,
        phaseCount: roadmap.length,
        taskCount: roadmap.reduce((acc: number, phase: any) => acc + (phase.tasks?.length || 0), 0),
        timestamp: new Date().toISOString()
      };

      setTestResults(testResult);
      console.log('✅ Test completed successfully:', testResult);

    } catch (err: any) {
      console.error('❌ Test failed:', err);
      setError(err.message || 'Unknown error');
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-bold text-red-700">Test Failed</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!testResults) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700">Running MA roadmap test...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-bold text-green-700">✅ MA Roadmap Test Results</h3>
        <p className="text-green-600">Test completed successfully</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">MA State Rules</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(testResults.maRules, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">Authority Result</h4>
          <div className="space-y-1">
            <div><strong>Type:</strong> <span className="bg-blue-100 px-2 py-1 rounded">{testResults.authority.type}</span></div>
            <div><strong>Master Mode:</strong> <span className="bg-blue-100 px-2 py-1 rounded">{testResults.authority.masterMode}</span></div>
            <div><strong>Reason:</strong> {testResults.authority.reason}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">Roadmap Stats</h4>
          <div className="space-y-1">
            <div><strong>Phases:</strong> {testResults.phaseCount}</div>
            <div><strong>Tasks:</strong> {testResults.taskCount}</div>
            <div><strong>MA Content:</strong> {testResults.hasMASpecificContent ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">Roadmap Phases</h4>
          <div className="space-y-2">
            {testResults.roadmap.map((phase: any, index: number) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{phase.phase}</span>: {phase.title} ({phase.tasks?.length || 0} tasks)
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold mb-2">Sample Tasks</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {testResults.roadmap.flatMap((phase: any) => phase.tasks || []).slice(0, 5).map((task: any, index: number) => (
              <div key={index} className="text-xs bg-gray-50 p-1 rounded">
                {task.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">Full Roadmap Data</h4>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(testResults.roadmap, null, 2)}</pre>
      </div>
    </div>
  );
}