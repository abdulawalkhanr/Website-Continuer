import { useState } from "react";
import { 
  useListStaffPortalTasks, useUpdateStaffPortalTask, getListStaffPortalTasksQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
};

export default function StaffTasks() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: tasksData, isLoading } = useListStaffPortalTasks(
    { query: { queryKey: getListStaffPortalTasksQueryKey() } }
  );

  const tasks = statusFilter !== "ALL" ? tasksData?.filter(t => t.status === statusFilter) : tasksData;
  
  const updateTask = useUpdateStaffPortalTask();

  const handleUpdateStatus = (taskId: number, newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStaffPortalTasksQueryKey() });
        toast({ title: "Task status updated" });
      },
      onError: () => toast({ title: "Failed to update task", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your assigned tasks</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Related Case</TableHead>
              <TableHead>Priority & Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !tasks?.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tasks found</TableCell></TableRow>
            ) : tasks.map(t => (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="font-medium text-sm">{t.title}</div>
                  {t.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-sm">{t.description}</div>}
                </TableCell>
                <TableCell>
                  {t.relatedCaseId ? (
                    <Link href={`/staff/cases/${t.relatedCaseId}`} className="text-sm font-medium text-primary hover:underline">
                      View Case
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={t.priority === "URGENT" || t.priority === "HIGH" ? "text-destructive border-destructive" : ""}>
                    {t.priority}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Due Date"}
                  </div>
                </TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={(v) => handleUpdateStatus(t.id, v)}>
                    <SelectTrigger className={`w-[140px] h-8 text-xs ${STATUS_COLORS[t.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}