import { Phone, MessageCircle } from "lucide-react";

export function FloatingButtons() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href="https://wa.me/919864920810"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="float-whatsapp"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ background: "#25D366" }}
        aria-label="WhatsApp"
      >
        <MessageCircle size={22} className="text-white" />
      </a>
      <a
        href="tel:01169310902"
        data-testid="float-call"
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 btn-gradient"
        aria-label="Call Now"
      >
        <Phone size={20} className="text-white" />
      </a>
    </div>
  );
}
