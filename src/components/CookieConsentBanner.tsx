import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, Shield, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useCookieConsent, ConsentPreferences } from '@/hooks/useCookieConsent';
import { cn } from '@/lib/utils';

export function CookieConsentBanner() {
  const { 
    showBanner, 
    setShowBanner, 
    acceptAll, 
    acceptNecessary,
    updatePreferences,
    preferences,
  } = useCookieConsent();
  
  const [showDetails, setShowDetails] = useState(false);
  const [customPrefs, setCustomPrefs] = useState<ConsentPreferences>({
    necessary: true,
    analytics: true,
    functional: true,
  });

  if (!showBanner) return null;

  const handleSaveCustom = () => {
    updatePreferences(customPrefs);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="container mx-auto max-w-4xl">
        <div className="glass-card border border-border/50 rounded-xl p-4 sm:p-6 shadow-2xl bg-background/95 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20 text-primary flex-shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Cookie Preferences</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience. Some are essential for the app to work, 
                while others help us improve performance and understand how you use MuriukiDB.
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-4"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide details' : 'Manage preferences'}
          </button>

          {/* Cookie Details */}
          {showDetails && (
            <div className="space-y-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Necessary - Always On */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">Necessary</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                      Always on
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Essential for authentication, session management, and core functionality.
                  </p>
                </div>
                <Switch checked={true} disabled className="opacity-50" />
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Functional</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Theme preferences, visit tracking, and personalization features.
                  </p>
                </div>
                <Switch 
                  checked={customPrefs.functional}
                  onCheckedChange={(checked) => setCustomPrefs(p => ({ ...p, functional: checked }))}
                />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Analytics & Monitoring</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Error tracking (Sentry), performance monitoring, and usage analytics to improve the app.
                  </p>
                </div>
                <Switch 
                  checked={customPrefs.analytics}
                  onCheckedChange={(checked) => setCustomPrefs(p => ({ ...p, analytics: checked }))}
                />
              </div>

              <Button 
                onClick={handleSaveCustom}
                variant="outline" 
                size="sm"
                className="w-full mt-2"
              >
                Save Preferences
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={acceptNecessary}
              variant="outline"
              className="flex-1 font-medium"
            >
              Necessary Only
            </Button>
            <Button
              onClick={acceptAll}
              className="flex-1 font-medium bg-primary hover:bg-primary/90"
            >
              Accept All
            </Button>
          </div>

          {/* Privacy Link */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            By using this site, you agree to our use of cookies.{' '}
            <a 
              href="https://github.com/Samuel-Muriuki/rdbms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
