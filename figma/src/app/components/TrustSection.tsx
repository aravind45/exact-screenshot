import { Star, Users, Clock, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function TrustSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Trusted by Families Nationwide
              </h2>
              <p className="text-xl text-gray-700 mb-8">
                Join thousands of executors who have successfully settled estates
                with confidence, precision, and peace of mind.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <Users className="w-8 h-8 text-cyan-600 mb-2" />
                  <div className="text-3xl font-bold text-gray-900">15,000+</div>
                  <div className="text-sm text-gray-600">Estates Settled</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <Star className="w-8 h-8 text-cyan-600 mb-2" />
                  <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <Clock className="w-8 h-8 text-cyan-600 mb-2" />
                  <div className="text-3xl font-bold text-gray-900">40%</div>
                  <div className="text-sm text-gray-600">Time Saved</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <CheckCircle className="w-8 h-8 text-cyan-600 mb-2" />
                  <div className="text-3xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-600">Compliance Rate</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-2">
                "This platform transformed what seemed impossible into a manageable,
                step-by-step process. I felt supported every day."
              </p>
              <p className="font-semibold text-gray-900">— Michael R., Estate Executor</p>
            </div>

            <div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1554224155-cfa08c2a758f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGZhbWlseSUyMHJlbGllZiUyMHBhcGVyd29ya3xlbnwxfHx8fDE3NzAzMDk2OTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Happy family completing estate settlement"
                className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
