import { Bell, MessageCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "WhatsApp", message: "Your dispute has been submitted to CIBIL bureau. Case ID: CIR-2026-1234. Expected response: 30-45 days.", time: "2 hours ago", read: false },
  { id: 2, type: "Email", message: "Documents verified successfully. Your case has moved to 'Dispute Submitted' stage.", time: "1 day ago", read: false },
  { id: 3, type: "SMS", message: "CIR Case Update: Documentation verified. Dispute being prepared for filing. Team will contact you shortly.", time: "2 days ago", read: true },
  { id: 4, type: "Email", message: "Welcome to CIR Consultation Service. Your case CIR-2026-1234 has been registered. Assigned executive will contact you in 24 hours.", time: "3 days ago", read: true },
  { id: 5, type: "WhatsApp", message: "Your documents have been received. Our team is reviewing them. We'll update you within 24 hours.", time: "5 days ago", read: true },
];

const typeIcon = { WhatsApp: <MessageCircle size={16} className="text-green-600" />, Email: <Mail size={16} className="text-primary" />, SMS: <Bell size={16} className="text-accent" /> };
const typeBadge = { WhatsApp: "bg-green-100 text-green-700 border-green-200", Email: "bg-primary/10 text-primary border-primary/20", SMS: "bg-accent/20 text-accent-foreground border-accent/30" };

export default function DashboardNotifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Badge className="bg-primary/10 text-primary border-primary/20">{MOCK_NOTIFICATIONS.filter(n => !n.read).length} Unread</Badge>
      </div>
      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map(notif => (
          <div key={notif.id} className={`glass-card rounded-xl p-4 flex gap-4 ${!notif.read ? "border-primary/20" : ""}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${typeBadge[notif.type as keyof typeof typeBadge].split(" ").slice(0, 1).join("")}`}>
              {typeIcon[notif.type as keyof typeof typeIcon]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${typeBadge[notif.type as keyof typeof typeBadge]} text-xs`}>{notif.type}</Badge>
                {!notif.read && <Badge className="bg-primary text-white border-0 text-xs">New</Badge>}
              </div>
              <p className="text-sm text-foreground">{notif.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
