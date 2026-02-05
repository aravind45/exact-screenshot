import { Building2 } from 'lucide-react';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-600 p-2 rounded">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl">ExpectedEstate</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-700 hover:text-gray-900">Solutions</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Audit Trail</a>
          <a href="#" className="text-gray-700 hover:text-gray-900">Fiduciary Guidance</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost">Sign In</Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">Get Started</Button>
        </div>
      </div>
    </header>
  );
}
