import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateLead } from "@workspace/api-client-react";

type Step = "greeting" | "name" | "mobile" | "email" | "city" | "service" | "done";

interface Message {
  from: "bot" | "user";
  text: string;
}

const SERVICES = [
  "CIBIL Rectification",
  "Credit Report Correction",
  "Score Improvement",
  "Written Off Account",
  "Settled Account",
  "Dispute Assistance",
  "Financial Consultation",
  "Other",
];

const STEP_QUESTIONS: Record<Step, string> = {
  greeting: "Hello! I am your CIR Credit Assistant. I can help you resolve credit issues. May I know your name?",
  name: "Great! What is your mobile number?",
  mobile: "Thank you. What is your email address? (Optional — press Enter to skip)",
  email: "Which city are you from?",
  city: "What service do you need help with?",
  service: "Thank you! Our team will contact you within 24 hours.",
  done: "",
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userData, setUserData] = useState({ name: "", mobile: "", email: "", city: "", service: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createLead = useCreateLead();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ from: "bot", text: STEP_QUESTIONS.greeting }]);
      setStep("name");
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text: string, from: "bot" | "user") => {
    setMessages(prev => [...prev, { from, text }]);
  };

  const handleSend = (value?: string) => {
    const text = (value || input).trim();
    if (!text) return;
    setInput("");
    addMessage(text, "user");

    setTimeout(() => {
      if (step === "name") {
        setUserData(prev => ({ ...prev, name: text }));
        addMessage(STEP_QUESTIONS.name, "bot");
        setStep("mobile");
      } else if (step === "mobile") {
        setUserData(prev => ({ ...prev, mobile: text }));
        addMessage(STEP_QUESTIONS.mobile, "bot");
        setStep("email");
      } else if (step === "email") {
        setUserData(prev => ({ ...prev, email: text === "" ? "" : text }));
        addMessage(STEP_QUESTIONS.email, "bot");
        setStep("city");
      } else if (step === "city") {
        setUserData(prev => ({ ...prev, city: text }));
        addMessage(STEP_QUESTIONS.city, "bot");
        setStep("service");
      } else if (step === "service") {
        const updatedData = { ...userData, service: text };
        setUserData(updatedData);
        addMessage("Submitting your inquiry...", "bot");
        createLead.mutate({
          data: {
            name: updatedData.name,
            mobile: updatedData.mobile,
            email: updatedData.email || undefined,
            city: updatedData.city,
            serviceRequired: updatedData.service,
            source: "CHATBOT",
          },
        }, {
          onSuccess: () => {
            addMessage(`Thank you, ${updatedData.name}! Your inquiry has been received. Our credit expert will call you at ${updatedData.mobile} within 24 hours. You can also reach us at 01169310902 or WhatsApp +91 9864920810.`, "bot");
            setStep("done");
          },
          onError: () => {
            addMessage("Your inquiry has been noted. We will contact you shortly at " + updatedData.mobile, "bot");
            setStep("done");
          },
        });
      }
    }, 400);
  };

  return (
    <>
      {/* Chat bubble */}
      <button
        data-testid="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-40 right-5 z-50 w-14 h-14 rounded-full btn-gradient shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        {isOpen ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-[232px] right-5 z-50 w-[340px] rounded-2xl overflow-hidden shadow-xl border border-border bg-white flex flex-col" style={{ height: 420 }}>
          {/* Header */}
          <div className="btn-gradient px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">CIR Credit Assistant</p>
              <p className="text-white/80 text-xs">Usually replies instantly</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.from === "bot"
                    ? "bg-white border border-border text-foreground shadow-sm"
                    : "btn-gradient text-white"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {step === "service" && (
              <div className="flex flex-wrap gap-1 mt-2">
                {SERVICES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {step !== "done" && (
            <div className="p-3 border-t border-border bg-white flex gap-2">
              <Input
                data-testid="chatbot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="text-sm"
              />
              <Button size="icon" className="btn-gradient border-0 shrink-0" onClick={() => handleSend()} data-testid="chatbot-send">
                <Send size={16} className="text-white" />
              </Button>
            </div>
          )}
          {step === "done" && (
            <div className="p-3 border-t border-border bg-white">
              <Button className="w-full btn-gradient border-0 text-white text-sm" onClick={() => { setIsOpen(false); setMessages([]); setStep("name"); setUserData({ name: "", mobile: "", email: "", city: "", service: "" }); }}>
                Start New Chat <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
