import { Shield, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-8">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Built for Fiduciary Protection</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            The settlement trail that protects you from{' '}
            <span className="text-red-600">personal liability</span>
          </h1>
          
          <p className="text-xl text-gray-700 mb-10 leading-relaxed">
            ExpectedEstate helps executors document every action, eliminate
            diligence gaps, and build a bulletproof record of{' '}
            <em className="italic">reasonable care</em>—so
            you never have to worry about missing a step or being sued later.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-lg px-8 py-6">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" className="text-lg px-8 py-6">
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
