import { Bell, MessageCircle, Mail, FileText, CreditCard, Ticket, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useListNotifications, useUpdateNotification, useMarkAllNotificationsRead,
  getListNotificationsQueryKey, useGetMe, getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICON: Record<string, React.ReactNode> = {
  CASE_UPDATE: <Ticket size={16} className="text-primary" />,
  DOCUMENT: <FileText size={16} className="text-purple-600" />,
  PAYMENT: <CreditCard size={16} className="text-green-600" />,
  TICKET: <MessageCircle size={16} className="text-orange-500" />,
  GENERAL: <Bell size={16} className="text-accent-foreground" />,
};

const TYPE_BADGE: Record<string, string> = {
  CASE_UPDATE: "bg-primary/10 text-primary border-primary/20",
  DOCUMENT: "bg-purple-50 text-purple-700 border-purple-200",
  PAYMENT: "bg-green-50 text-green-700 border-green-200",
  TICKET: "bg-orange-50 text-orange-700 border-orange-200",
  GENERAL: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABEL: Record<string, string> = {
  CASE_UPDATE: "Case Update", DOCUMENT: "Document", PAYMENT: "Payment", TICKET: "Support", GENERAL: "General",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DashboardNotifications() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: notifications, isLoading } = useListNotifications(
    user ? { userId: user.id } : {},
    { query: { enabled: !!user, queryKey: getListNotificationsQueryKey(user ? { userId: user.id } : {}) } }
  );
  const markRead = useUpdateNotification();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id, data: { isRead: true } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey(user ? { userId: user.id } : {}) }),
    });
  };

  const handleMarkAllRead = () => {
    if (!user) return;
    markAllRead.mutate({ data: { userId: user.id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ userId: user.id }) });
        toast({ title: "All notifications marked as read" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-muted-foreground text-sm">Stay updated on your case progress</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge className="bg-primary text-white border-0">{unreadCount} Unread</Badge>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              <CheckCheck size={14} /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading notifications...</div>
      ) : !notifications?.length ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bell size={40} className="text-primary/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">You'll receive updates here when your case status changes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`glass-card rounded-xl p-4 flex gap-4 cursor-pointer transition-all ${!notif.isRead ? "border-primary/30 bg-primary/5" : "opacity-80"}`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_BADGE[notif.type]?.split(" ").slice(0, 1).join("")} bg-opacity-20`}>
                {TYPE_ICON[notif.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={`${TYPE_BADGE[notif.type]} text-xs`}>{TYPE_LABEL[notif.type]}</Badge>
                  {!notif.isRead && <Badge className="bg-primary text-white border-0 text-xs">New</Badge>}
                </div>
                <p className="text-sm font-medium text-foreground">{notif.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
