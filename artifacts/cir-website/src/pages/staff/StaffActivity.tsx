import { useGetStaffPortalDashboard, getGetStaffPortalDashboardQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock } from "lucide-react";
import { Link } from "wouter";

export default function StaffActivity() {
  const { data, isLoading } = useGetStaffPortalDashboard({ query: { queryKey: getGetStaffPortalDashboardQueryKey() } });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Activity size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground text-sm">Recent actions across all your assigned cases</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
        ) : !data?.recentActivity?.length ? (
          <div className="text-center py-12 text-muted-foreground">No recent activity found.</div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {data.recentActivity.map((act) => (
              <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Activity size={14} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-white shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-sm text-foreground">{act.action.replace(/_/g, " ")}</div>
                    <time className="text-[10px] font-medium text-muted-foreground flex items-center">
                      <Clock size={10} className="mr-1" /> {new Date(act.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">By {act.actorName}</div>
                  
                  {act.summary && (
                    <div className="text-sm bg-muted/40 p-2.5 rounded-lg border border-border/50 text-foreground/80 mb-2">
                      {act.summary}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 items-center mt-2 pt-2 border-t border-border/50">
                    {act.previousStatus && act.newStatus && act.previousStatus !== act.newStatus && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        Status: 
                        <span className="line-through opacity-70">{act.previousStatus.replace(/_/g, " ")}</span>
                        <span>→</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{act.newStatus.replace(/_/g, " ")}</Badge>
                      </div>
                    )}
                    <Link href={`/staff/cases/${act.caseId}`} className="text-xs font-medium text-primary hover:underline ml-auto">
                      View Case
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}