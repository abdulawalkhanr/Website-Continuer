import React, { createContext, useContext, useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useGetOnboarding, getGetOnboardingQueryKey } from "@workspace/api-client-react";

export type Language = "ENGLISH" | "HINDI" | "ASSAMESE";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const dictionaries: Record<Language, Record<string, string>> = {
  ENGLISH: {
    "nav.overview": "Overview",
    "nav.myCase": "My Case",
    "nav.creditReport": "Credit Report",
    "nav.documents": "Documents",
    "nav.payments": "Payments",
    "nav.support": "Support Tickets",
    "nav.notifications": "Notifications",
    "nav.logout": "Log out",
    "nav.backToWebsite": "Back to Website",
    "dashboard.welcome": "Welcome back, {name}",
    "dashboard.summary": "Here's a summary of your credit case and recent activity.",
    "dashboard.noActiveCase": "No active case",
    "dashboard.caseWillAppear": "Your case will appear here once registered by our team.",
    "dashboard.contactSupport": "Contact Support",
    "dashboard.caseNumber": "Case Number",
    "dashboard.serviceType": "Service Type",
    "dashboard.assignedTo": "Assigned To",
    "dashboard.expectedCompletion": "Expected Completion",
    "dashboard.progress": "Progress",
    "dashboard.viewTimeline": "View Full Timeline",
    "dashboard.creditHealth": "Credit Health & Intelligence",
    "dashboard.reportProcessed": "Report Processed on {date}",
    "dashboard.score": "Score",
    "dashboard.confidence": "Analysis Confidence",
    "dashboard.viewFullReport": "View Full Report",
    "report.uploadNew": "Upload New Report",
    "report.uploadDesc": "Upload your latest CIR to get AI-powered insights and consultation.",
    "report.fileTypes": "PDF, JPG, PNG up to 15MB",
    "report.uploadBtn": "Select File",
    "report.uploading": "Uploading...",
    "report.processing": "Processing report...",
    "report.needsReview": "Needs Manual Review",
    "report.processed": "Processed successfully",
    "report.failed": "Failed to process",
    "report.tabs.detail": "Report Detail",
    "report.tabs.compare": "Compare Versions",
    "report.tabs.quote": "Service Quote",
    "report.accounts": "Accounts",
    "report.cardsLoans": "Cards & Loans",
    "report.factors": "Impact Factors",
    "report.flags": "Red Flags",
    "report.aiSummary": "AI Summary",
    "report.noReport": "No credit report uploaded yet.",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.error": "An error occurred",
    "onboarding.step1": "Select Language",
    "onboarding.step2": "Identity & Consent",
    "onboarding.step3": "Next Steps",
    "onboarding.panName": "Name as per PAN",
    "onboarding.panNumber": "PAN Number",
    "onboarding.consent": "I consent to CIR Consultation Service accessing and analyzing my credit information to provide consultation.",
    "onboarding.uploadReport": "Upload Credit Report",
    "onboarding.requestCallback": "Request Expert Callback",
  },
  HINDI: {
    "nav.overview": "अवलोकन",
    "nav.myCase": "मेरा केस",
    "nav.creditReport": "क्रेडिट रिपोर्ट",
    "nav.documents": "दस्तावेज़",
    "nav.payments": "भुगतान",
    "nav.support": "सहायता टिकट",
    "nav.notifications": "सूचनाएं",
    "nav.logout": "लॉग आउट",
    "nav.backToWebsite": "वेबसाइट पर वापस जाएं",
    "dashboard.welcome": "वापसी पर स्वागत है, {name}",
    "dashboard.summary": "यहां आपके क्रेडिट केस और हाल की गतिविधियों का सारांश है।",
    "dashboard.noActiveCase": "कोई सक्रिय केस नहीं",
    "dashboard.caseWillAppear": "हमारी टीम द्वारा पंजीकृत होने के बाद आपका केस यहां दिखाई देगा।",
    "dashboard.contactSupport": "सहायता से संपर्क करें",
    "dashboard.caseNumber": "केस नंबर",
    "dashboard.serviceType": "सेवा का प्रकार",
    "dashboard.assignedTo": "सौंपा गया",
    "dashboard.expectedCompletion": "अपेक्षित पूर्णता",
    "dashboard.progress": "प्रगति",
    "dashboard.viewTimeline": "पूरी टाइमलाइन देखें",
    "dashboard.creditHealth": "क्रेडिट स्वास्थ्य और बुद्धिमत्ता",
    "dashboard.reportProcessed": "रिपोर्ट {date} को प्रोसेस की गई",
    "dashboard.score": "स्कोर",
    "dashboard.confidence": "विश्लेषण का विश्वास",
    "dashboard.viewFullReport": "पूरी रिपोर्ट देखें",
    "report.uploadNew": "नई रिपोर्ट अपलोड करें",
    "report.uploadDesc": "AI-संचालित अंतर्दृष्टि और परामर्श प्राप्त करने के लिए अपना नवीनतम CIR अपलोड करें।",
    "report.fileTypes": "PDF, JPG, PNG 15MB तक",
    "report.uploadBtn": "फ़ाइल चुनें",
    "report.uploading": "अपलोड हो रहा है...",
    "report.processing": "रिपोर्ट प्रोसेस हो रही है...",
    "report.needsReview": "मैनुअल समीक्षा की आवश्यकता है",
    "report.processed": "सफलतापूर्वक प्रोसेस किया गया",
    "report.failed": "प्रोसेस करने में विफल",
    "report.tabs.detail": "रिपोर्ट विवरण",
    "report.tabs.compare": "संस्करणों की तुलना करें",
    "report.tabs.quote": "सेवा उद्धरण",
    "report.accounts": "खाते",
    "report.cardsLoans": "कार्ड और ऋण",
    "report.factors": "प्रभाव कारक",
    "report.flags": "रेड फ्लैग्स",
    "report.aiSummary": "AI सारांश",
    "report.noReport": "अभी तक कोई क्रेडिट रिपोर्ट अपलोड नहीं की गई है।",
    "common.loading": "लोड हो रहा है...",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.submit": "जमा करें",
    "common.error": "एक त्रुटि हुई",
    "onboarding.step1": "भाषा चुनें",
    "onboarding.step2": "पहचान और सहमति",
    "onboarding.step3": "अगले कदम",
    "onboarding.panName": "पैन के अनुसार नाम",
    "onboarding.panNumber": "पैन नंबर",
    "onboarding.consent": "मैं CIR परामर्श सेवा को परामर्श प्रदान करने के लिए मेरी क्रेडिट जानकारी तक पहुंचने और उसका विश्लेषण करने की सहमति देता हूं।",
    "onboarding.uploadReport": "क्रेडिट रिपोर्ट अपलोड करें",
    "onboarding.requestCallback": "विशेषज्ञ कॉलबैक का अनुरोध करें",
  },
  ASSAMESE: {
    "nav.overview": "অৱলোকন",
    "nav.myCase": "মোৰ গোচৰ",
    "nav.creditReport": "ক্ৰেডিট ৰিপোৰ্ট",
    "nav.documents": "নথিপত্ৰ",
    "nav.payments": "পৰিশোধ",
    "nav.support": "সাহায্য টিকট",
    "nav.notifications": "জাননী",
    "nav.logout": "লগ আউট",
    "nav.backToWebsite": "ৱেবচাইটলৈ ঘূৰি যাওক",
    "dashboard.welcome": "আকৌ স্বাগতম, {name}",
    "dashboard.summary": "ইয়াত আপোনাৰ ক্ৰেডিট গোচৰ আৰু শেহতীয়া কাৰ্য্যকলাপৰ এক সাৰাংশ দিয়া হৈছে।",
    "dashboard.noActiveCase": "কোনো সক্ৰিয় গোচৰ নাই",
    "dashboard.caseWillAppear": "আমাৰ দলৰ দ্বাৰা পঞ্জীয়ন হোৱাৰ পিছত আপোনাৰ গোচৰ ইয়াত দেখা যাব।",
    "dashboard.contactSupport": "সাহায্যৰ সৈতে যোগাযোগ কৰক",
    "dashboard.caseNumber": "গোচৰ নম্বৰ",
    "dashboard.serviceType": "সেৱাৰ প্ৰকাৰ",
    "dashboard.assignedTo": "অৰ্পণ কৰা হৈছে",
    "dashboard.expectedCompletion": "প্ৰত্যাশিত সম্পূৰ্ণতা",
    "dashboard.progress": "প্ৰগতি",
    "dashboard.viewTimeline": "সম্পূৰ্ণ সময়ৰেখা চাওক",
    "dashboard.creditHealth": "ক্ৰেডিট স্বাস্থ্য আৰু বুদ্ধিমত্তা",
    "dashboard.reportProcessed": "ৰিপোৰ্ট {date} তাৰিখে প্ৰচেছ কৰা হৈছে",
    "dashboard.score": "স্ক'ৰ",
    "dashboard.confidence": "বিশ্লেষণৰ বিশ্বাস",
    "dashboard.viewFullReport": "সম্পূৰ্ণ ৰিপোৰ্ট চাওক",
    "report.uploadNew": "নতুন ৰিপোৰ্ট আপলোড কৰক",
    "report.uploadDesc": "AI-চালিত অন্তৰ্দৃষ্টি আৰু পৰামৰ্শ লাভ কৰিবলৈ আপোনাৰ শেহতীয়া CIR আপলোড কৰক।",
    "report.fileTypes": "PDF, JPG, PNG ১৫MB লৈকে",
    "report.uploadBtn": "ফাইল বাছক",
    "report.uploading": "আপলোড হৈ আছে...",
    "report.processing": "ৰিপোৰ্ট প্ৰচেছ হৈ আছে...",
    "report.needsReview": "মেনুৱেল সমীক্ষাৰ প্ৰয়োজন",
    "report.processed": "সফলতাৰে প্ৰচেছ কৰা হৈছে",
    "report.failed": "প্ৰচেছ কৰাত বিফল",
    "report.tabs.detail": "ৰিপোৰ্টৰ বিৱৰণ",
    "report.tabs.compare": "সংস্কৰণসমূহৰ তুলনা কৰক",
    "report.tabs.quote": "সেৱা মূল্য",
    "report.accounts": "একাউণ্টসমূহ",
    "report.cardsLoans": "কাৰ্ড আৰু ঋণ",
    "report.factors": "প্ৰভাৱ কাৰকসমূহ",
    "report.flags": "ৰেড ফ্লেগসমূহ",
    "report.aiSummary": "AI সাৰাংশ",
    "report.noReport": "এতিয়ালৈকে কোনো ক্ৰেডিট ৰিপোৰ্ট আপলোড কৰা হোৱা নাই।",
    "common.loading": "লোড হৈ আছে...",
    "common.save": "ছেভ কৰক",
    "common.cancel": "বাতিল কৰক",
    "common.submit": "দাখিল কৰক",
    "common.error": "এটা ত্ৰুটি দেখা দিছে",
    "onboarding.step1": "ভাষা বাছক",
    "onboarding.step2": "পৰিচয় আৰু সন্মতি",
    "onboarding.step3": "পৰৱৰ্তী পদক্ষেপ",
    "onboarding.panName": "পেনৰ অনুসৰি নাম",
    "onboarding.panNumber": "পেন নম্বৰ",
    "onboarding.consent": "মই CIR পৰামৰ্শ সেৱাক পৰামৰ্শ প্ৰদান কৰিবলৈ মোৰ ক্ৰেডিট তথ্য অভিগম আৰু বিশ্লেষণ কৰিবলৈ সন্মতি দিছোঁ।",
    "onboarding.uploadReport": "ক্ৰেডিট ৰিপোৰ্ট আপলোড কৰক",
    "onboarding.requestCallback": "বিশেষজ্ঞৰ কলবেক অনুৰোধ কৰক",
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ENGLISH");
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: Infinity } });
  
  const { data: onboarding } = useGetOnboarding(
    { query: { enabled: !!user && user.role === "CUSTOMER", queryKey: getGetOnboardingQueryKey() } }
  );

  useEffect(() => {
    if (onboarding?.preferredLanguage) {
      setLanguageState(onboarding.preferredLanguage as Language);
    } else {
      const stored = localStorage.getItem("preferredLanguage");
      if (stored && ["ENGLISH", "HINDI", "ASSAMESE"].includes(stored)) {
        setLanguageState(stored as Language);
      }
    }
  }, [onboarding]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferredLanguage", lang);
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    let str = dictionaries[language][key] || dictionaries["ENGLISH"][key] || key;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error("useTranslation must be used within TranslationProvider");
  return context;
}
