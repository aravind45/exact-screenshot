import { Shield, Heart, FileCheck } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function ConfidenceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              You're Not Alone in This Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thousands of executors have successfully navigated estate settlement
              with confidence, knowing every step was documented and protected.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1629360067822-89c74b25bb66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBhZHZpc29yJTIwaGVscGluZyUyMGZhbWlseSUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzAzMDk2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Professional guidance and support"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-6">
                Expert Guidance at Every Step
              </h3>
              <p className="text-lg text-gray-700 mb-8">
                Our platform combines legal expertise with intuitive technology,
                ensuring you never miss a critical deadline or requirement. Feel
                confident knowing you have a trusted partner throughout the entire
                settlement process.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-100 p-3 rounded-lg">
                    <Shield className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Complete Protection</h4>
                    <p className="text-gray-600">
                      Every action documented for legal compliance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Peace of Mind</h4>
                    <p className="text-gray-600">
                      Reduce stress with clear, step-by-step guidance
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-100 p-3 rounded-lg">
                    <FileCheck className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Proven Process</h4>
                    <p className="text-gray-600">
                      Trusted by thousands of executors nationwide
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-3xl font-bold mb-6">
                Your Family's Future, Secured
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Protect your loved ones and honor your responsibilities with
                confidence. Our comprehensive platform ensures beneficiaries receive
                their inheritance fairly and on time, while you stay protected from
                personal liability.
              </p>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                <p className="text-lg italic text-gray-800">
                  "ExpectedEstate gave me the confidence to handle my father's estate
                  without constant worry. Every step was clear, and I knew I was doing
                  everything right."
                </p>
                <p className="mt-4 font-semibold text-gray-900">— Sarah M., Executor</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758686254593-7c4cd55b2621?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHNlbmlvciUyMHdvbWFuJTIwc21pbGluZ3xlbnwxfHx8fDE3NzAzMDk2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Peace of mind and confidence"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
