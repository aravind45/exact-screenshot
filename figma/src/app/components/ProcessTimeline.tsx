import { Check } from 'lucide-react';

interface ProcessStep {
  title: string;
  subtitle: string;
  timeline: string;
  color: string;
}

const steps: ProcessStep[] = [
  {
    title: 'Immediate',
    subtitle: 'Actions',
    timeline: 'Week 1-2',
    color: 'bg-red-500',
  },
  {
    title: 'Court',
    subtitle: 'Filing',
    timeline: 'Week 2-8',
    color: 'bg-orange-500',
  },
  {
    title: 'Asset',
    subtitle: 'Discovery',
    timeline: 'Month 2-4',
    color: 'bg-yellow-500',
  },
  {
    title: 'Creditor',
    subtitle: 'Claims',
    timeline: 'Month 4-6',
    color: 'bg-blue-500',
  },
  {
    title: 'Asset',
    subtitle: 'Liquidation',
    timeline: 'Month 6-12',
    color: 'bg-purple-500',
  },
  {
    title: 'Final',
    subtitle: 'Distribution',
    timeline: 'Month 12-18',
    color: 'bg-green-500',
  },
];

export function ProcessTimeline() {
  return (
    <section className="py-12 bg-gradient-to-b from-gray-100 to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="overflow-x-auto">
            <div className="flex items-center justify-start md:justify-center gap-0 pb-4 min-w-max px-4">
              {steps.map((step, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <div
                    className={`${step.color} text-white px-10 py-6 min-w-[160px] text-center relative`}
                    style={{
                      clipPath: index === steps.length - 1
                        ? 'polygon(15% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 50%)'
                        : index === 0
                        ? 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)'
                        : 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
                      marginLeft: index === 0 ? '0' : '-15px',
                    }}
                  >
                    <div className="font-bold text-base leading-tight">{step.title}</div>
                    <div className="font-bold text-base leading-tight">{step.subtitle}</div>
                    <div className="text-xs mt-2 opacity-95 font-medium">{step.timeline}</div>
                  </div>
                </div>
              ))}
              <div className="flex-shrink-0 ml-2">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-9 h-9 text-white stroke-[3]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}