import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProcessTimeline } from './components/ProcessTimeline';
import { ConfidenceSection } from './components/ConfidenceSection';
import { TrustSection } from './components/TrustSection';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      <ProcessTimeline />
      <ConfidenceSection />
      <TrustSection />
    </div>
  );
}