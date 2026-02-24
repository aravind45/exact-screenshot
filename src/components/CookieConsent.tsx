import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const COOKIEConsent_KEY = 'cookie_consent';

interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIEConsent_KEY);
    if (!stored) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsent = (newConsent: CookieConsentState) => {
    localStorage.setItem(COOKIEConsent_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    setShowBanner(false);
    setShowSettings(false);
    
    // Trigger Google Analytics consent update if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: newConsent.analytics ? 'granted' : 'denied',
        ad_storage: newConsent.marketing ? 'granted' : 'denied',
      });
    }
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-4xl mx-auto shadow-lg border-slate-200">
        <CardContent className="p-6">
          {showSettings ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Necessary Cookies</p>
                    <p className="text-sm text-slate-500">Required for the website to function</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={consent.necessary} 
                    disabled 
                    className="w-5 h-5"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics Cookies</p>
                    <p className="text-sm text-slate-500">Help us understand how visitors use our site</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Cookies</p>
                    <p className="text-sm text-slate-500">Used to deliver relevant advertisements</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={consent.marketing}
                    onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Back
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => saveConsent(consent)}>
                  Save Preferences
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-start gap-3">
                <Cookie className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold">We value your privacy</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSettings(true)}
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Customize
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={rejectAll}
                  className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white"
                >
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  onClick={acceptAll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                >
                  Accept All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CookieConsent;
