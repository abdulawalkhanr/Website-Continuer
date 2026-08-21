import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Bell, Info, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StaffNotifications() {
  const { data: notifications, isLoading } = useListNotifications({}, { query: { queryKey: getListNotificationsQueryKey() } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Updates on your assigned cases and tasks</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
        ) : !notifications?.length ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell size={20} className="text-muted-foreground" />
            </div>
            <div className="font-medium">No Notifications</div>
            <div className="text-sm text-muted-foreground mt-1">You're all caught up!</div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(n => (
              <div key={n.id} className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                <div className="shrink-0 pt-1">
                  {n.type === 'CASE_UPDATE' ? <Info className="text-blue-500" size={20} /> :
                   n.type === 'DOCUMENT' ? <CheckCircle2 className="text-green-500" size={20} /> :
                   <Bell className="text-primary" size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'}`}>{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground flex items-center shrink-0">
                      <Clock size={10} className="mr-1" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}