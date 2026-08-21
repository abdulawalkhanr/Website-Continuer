import { Link } from "wouter";
import { useGetStaffPortalDashboard, getGetStaffPortalDashboardQueryKey } from "@workspace/api-client-react";
import { Briefcase, CheckSquare, Clock, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StaffDashboard() {
  const { data, isLoading } = useGetStaffPortalDashboard({ query: { queryKey: getGetStaffPortalDashboardQueryKey() } });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Loading dashboard...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here is your workload overview for today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Briefcase size={20} /></div>
              <h3 className="text-3xl font-bold text-foreground">{data.activeCases}</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><CheckSquare size={20} /></div>
              <h3 className="text-3xl font-bold text-foreground">{data.pendingTasks}</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Clock size={20} /></div>
              <h3 className="text-3xl font-bold text-foreground">{data.newAssignments}</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">New Assignments</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Users size={20} /></div>
              <h3 className="text-3xl font-bold text-foreground">{data.totalClients}</h3>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
              <Link href="/staff/cases" className="text-xs font-medium text-primary flex items-center hover:underline">View all <ArrowRight size={12} className="ml-1" /></Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-border">
                {data.upcomingDeadlines.map((a) => (
                  <div key={a.id} className="p-4 hover:bg-muted/30 transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-foreground">{a.caseNumber}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.customerName || "Customer"}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={a.priority === "URGENT" || a.priority === "HIGH" ? "text-destructive border-destructive" : ""}>
                        {a.priority}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No upcoming deadlines.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Link href="/staff/activity" className="text-xs font-medium text-primary flex items-center hover:underline">View all <ArrowRight size={12} className="ml-1" /></Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="divide-y divide-border">
                {data.recentActivity.slice(0,5).map((act) => (
                  <div key={act.id} className="p-4 hover:bg-muted/30 transition-colors text-sm">
                    <div className="font-medium text-foreground">{act.action.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{act.actorName}</span>
                      <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
