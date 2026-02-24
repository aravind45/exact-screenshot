import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, MapPin, AlertTriangle } from 'lucide-react';
import DebugMARoadmap from '@/components/DebugMARoadmap';
import SimpleMARoadmapTest from '@/components/SimpleMARoadmapTest';

export default function DebugMARoadmapPage() {
  const { user } = useAuth();

  // Only allow access for authenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow access for admin or test users
  if (user.role !== 'ADMIN' && !user.email?.includes('@expectedestate.com')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              This debug tool is only available for administrators and team members.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MA Roadmap Debug Tool</h1>
              <p className="text-gray-600">Test Massachusetts probate roadmap generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Authenticated</span>
          </div>
        </div>

        <DebugMARoadmap 
          onTestComplete={(result) => {
            console.log('✅ MA Roadmap Test Completed:', result);
            // You can add additional handling here if needed
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Configure Test Parameters</h3>
                <p className="text-sm text-gray-600">
                  Set the estate parameters to test different Massachusetts scenarios.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">2. Run Test</h3>
                <p className="text-sm text-gray-600">
                  Click "Test MA Roadmap Generation" to run the debug test.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">3. Review Results</h3>
                <p className="text-sm text-gray-600">
                  Check the console and results panel for detailed output.
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Debug Information</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Check browser console for detailed logs</li>
                <li>• Results show authority type and roadmap phases</li>
                <li>• Use different test parameters to verify MA-specific logic</li>
                <li>• Look for MA-specific terminology in roadmap tasks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}