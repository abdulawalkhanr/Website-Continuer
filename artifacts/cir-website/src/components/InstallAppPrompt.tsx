import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isStandaloneApp } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "cir-install-prompt-dismissed";

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneApp() || sessionStorage.getItem(DISMISSED_KEY) === "true") {
      return;
    }

    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
      setInstallEvent(null);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible || !installEvent) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-4 z-[100] mx-auto max-w-xl rounded-2xl border border-primary/20 bg-background/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-6 sm:flex sm:items-center sm:gap-4"
      role="dialog"
      aria-label="Install CIR Consultation Service"
      data-testid="install-app-prompt"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-3 flex min-w-0 items-center gap-3 pr-7 sm:mb-0 sm:flex-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
          <img src="/app-icon-192.png" alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="font-semibold text-foreground">Install CIR App</p>
          </div>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            Add CIR Consultation Service to your home screen for quick access.
          </p>
        </div>
      </div>

      <Button onClick={install} className="w-full shrink-0 sm:w-auto" data-testid="button-install-app">
        <Download className="mr-2 h-4 w-4" />
        Install
      </Button>
    </aside>
  );
}