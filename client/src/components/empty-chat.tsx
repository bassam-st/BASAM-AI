import { Bot, MessageSquare, Sparkles, Zap, Download, X, Share, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function EmptyChat() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setIsInstalled(true);
      }
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {showInstallBanner && !isInstalled && !dismissed && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 w-full max-w-md">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={dismissBanner} 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-dismiss-install"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-lg">ثبّت التطبيق</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            ثبّت BASSAM AI على جهازك للوصول السريع
          </p>
          
          {installPrompt ? (
            <Button 
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              data-testid="button-install-pwa"
            >
              <Download className="h-4 w-4 ml-2" />
              تثبيت التطبيق
            </Button>
          ) : (
            <div className="text-sm text-right space-y-2">
              {isIOS ? (
                <div className="flex items-center gap-2 justify-end text-muted-foreground">
                  <span>اضغط</span>
                  <Share className="h-4 w-4 text-primary" />
                  <span>ثم "إضافة للشاشة الرئيسية"</span>
                </div>
              ) : isAndroid ? (
                <div className="flex items-center gap-2 justify-end text-muted-foreground">
                  <span>اضغط</span>
                  <MoreVertical className="h-4 w-4 text-primary" />
                  <span>ثم "تثبيت التطبيق"</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  افتح قائمة المتصفح واختر "تثبيت التطبيق"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary-foreground" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        مرحباً بك في BASSAM AI
      </h1>
      
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        مساعدك الذكي الشخصي. اسألني أي سؤال وسأساعدك بأفضل طريقة ممكنة.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <SuggestionCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="اسأل أي سؤال"
          description="يمكنني الإجابة على أسئلتك في مختلف المجالات"
        />
        <SuggestionCard
          icon={<Zap className="h-5 w-5" />}
          title="حلول سريعة"
          description="أقدم لك حلولاً سريعة ومفيدة لمشاكلك"
        />
      </div>
    </div>
  );
}

function SuggestionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-card-border hover-elevate transition-colors cursor-default">
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="text-right">
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
