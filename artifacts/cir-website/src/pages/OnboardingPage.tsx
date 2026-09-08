import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useGetOnboarding, getGetOnboardingQueryKey, useUpdateOnboarding, useCreateCallbackRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, Language } from "@/contexts/TranslationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, FileText, Phone, ArrowRight, ShieldCheck, Upload } from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: onboarding, isLoading: obLoading } = useGetOnboarding({ query: { queryKey: getGetOnboardingQueryKey(), enabled: !!user } });
  const updateOnboarding = useUpdateOnboarding();
  const createCallback = useCreateCallbackRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, setLanguage, language } = useTranslation();

  const [step, setStep] = useState(1);
  const [lang, setLang] = useState<Language>("ENGLISH");
  const [panName, setPanName] = useState("");
  const [pan, setPan] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (onboarding && onboarding.completedAt) {
      setLocation("/dashboard");
    } else if (onboarding) {
      if (onboarding.preferredLanguage) {
        setLang(onboarding.preferredLanguage as Language);
      }
      if (onboarding.panName) setPanName(onboarding.panName);
      if (onboarding.consentedAt) setConsent(true);
    }
  }, [onboarding, setLocation]);

  if (userLoading || obLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted/30">Loading...</div>;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleLanguageSelect = async () => {
    setLanguage(lang);
    setStep(2);
  };

  const handleIdentitySubmit = async () => {
    if (!pan || !panName || !consent) {
      toast({ title: "Please complete all fields and accept the consent", variant: "destructive" });
      return;
    }
    // basic pan validation
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) {
      toast({ title: "Invalid PAN format", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateOnboarding.mutateAsync({
        data: {
          preferredLanguage: lang,
          pan: pan.toUpperCase(),
          panName: panName.toUpperCase(),
          consent: true,
        }
      });
      setStep(3);
    } catch (e) {
      toast({ title: "Failed to update details", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadChoice = async () => {
    setIsSubmitting(true);
    try {
      await updateOnboarding.mutateAsync({
        data: {
          preferredLanguage: lang,
          consent: true,
          complete: true
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetOnboardingQueryKey() });
      setLocation("/dashboard/credit-report");
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallbackChoice = async () => {
    setIsSubmitting(true);
    try {
      await createCallback.mutateAsync({
        data: { message: "Requested from onboarding" }
      });
      await updateOnboarding.mutateAsync({
        data: {
          preferredLanguage: lang,
          consent: true,
          complete: true
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetOnboardingQueryKey() });
      setLocation("/dashboard");
      toast({ title: "Callback requested successfully" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">CIR Consultation</h1>
          <p className="text-muted-foreground">Setup your account to get started</p>
        </div>

        <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Globe className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                  <h2 className="text-xl font-semibold">{t("onboarding.step1")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose your preferred communication language</p>
                </div>

                <div className="space-y-3">
                  {[
                    { val: "ENGLISH", label: "English" },
                    { val: "HINDI", label: "हिंदी (Hindi)" },
                    { val: "ASSAMESE", label: "অসমীয়া (Assamese)" }
                  ].map(l => (
                    <div 
                      key={l.val}
                      onClick={() => setLang(l.val as Language)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${lang === l.val ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/50 hover:bg-muted"}`}
                    >
                      <span className="font-medium">{l.label}</span>
                      {lang === l.val && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full btn-gradient text-white" 
                  size="lg"
                  onClick={handleLanguageSelect}
                  disabled={isSubmitting}
                  data-testid="button-onboarding-lang"
                >
                  {isSubmitting ? t("common.loading") : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                  <h2 className="text-xl font-semibold">{t("onboarding.step2")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Verify your identity to fetch or process reports</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("onboarding.panName")} *</Label>
                    <Input 
                      value={panName} 
                      onChange={e => setPanName(e.target.value)} 
                      placeholder="e.g. RAHUL SHARMA"
                      className="uppercase"
                      data-testid="input-pan-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.panNumber")} *</Label>
                    <Input 
                      value={pan} 
                      onChange={e => setPan(e.target.value)} 
                      placeholder="ABCDE1234F"
                      className="uppercase"
                      maxLength={10}
                      data-testid="input-pan-number"
                    />
                  </div>
                  
                  <div className="flex items-start space-x-3 mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Checkbox id="consent" checked={consent} onCheckedChange={(c) => setConsent(!!c)} data-testid="checkbox-consent" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="consent"
                        className="text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Consent
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {t("onboarding.consent")}
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full btn-gradient text-white" 
                  size="lg"
                  onClick={handleIdentitySubmit}
                  disabled={isSubmitting || !pan || !panName || !consent}
                  data-testid="button-onboarding-identity"
                >
                  {isSubmitting ? t("common.loading") : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
                  <h2 className="text-xl font-semibold">{t("onboarding.step3")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">How would you like to proceed?</p>
                </div>

                <div className="grid gap-4">
                  <div 
                    className="p-5 border-2 border-transparent bg-primary/5 hover:border-primary/30 rounded-xl cursor-pointer transition-all flex items-start gap-4"
                    onClick={handleUploadChoice}
                    data-testid="choice-upload"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t("onboarding.uploadReport")}</h3>
                      <p className="text-xs text-muted-foreground">I have my credit report ready. Upload it for informational analysis followed by expert review.</p>
                    </div>
                  </div>

                  <div 
                    className="p-5 border-2 border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20 rounded-xl cursor-pointer transition-all flex items-start gap-4"
                    onClick={handleCallbackChoice}
                    data-testid="choice-callback"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t("onboarding.requestCallback")}</h3>
                      <p className="text-xs text-muted-foreground">I don't have my report. Please call me to assist with fetching it.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}