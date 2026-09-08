import { useState } from "react";
import { 
  useListAdminCallbackRequests, getListAdminCallbackRequestsQueryKey,
  useUpdateAdminCallbackRequest 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, CheckCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminCallbacks() {
  const { data: callbacks, isLoading } = useListAdminCallbackRequests({}, { query: { queryKey: getListAdminCallbackRequestsQueryKey() } });
  const updateMut = useUpdateAdminCallbackRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdateStatus = async (id: number, status: "REQUESTED" | "CONTACTED" | "CLOSED") => {
    try {
      await updateMut.mutateAsync({ id, data: { status } });
      queryClient.invalidateQueries({ queryKey: getListAdminCallbackRequestsQueryKey() });
      toast({ title: "Status updated" });
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Callback Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage customer expert callback requests from onboarding</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested On</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Message / Pref Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : !callbacks?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">No callback requests found</TableCell></TableRow>
            ) : callbacks.map(cb => (
              <TableRow key={cb.id}>
                <TableCell className="text-sm">
                  {new Date(cb.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium">User #{cb.userId}</TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{cb.preferredTime || "Any time"}</div>
                  <div className="text-muted-foreground text-xs max-w-[200px] truncate" title={cb.message || ""}>
                    {cb.message || "No message"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cb.status === "REQUESTED" ? "bg-yellow-100 text-yellow-700" : cb.status === "CONTACTED" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                    {cb.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Select value={cb.status} onValueChange={(v: any) => handleUpdateStatus(cb.id, v)}>
                    <SelectTrigger className="w-32 ml-auto h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUESTED">REQUESTED</SelectItem>
                      <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                      <SelectItem value="CLOSED">CLOSED</SelectItem>
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