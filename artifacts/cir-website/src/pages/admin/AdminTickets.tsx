import { useState } from "react";
import { useListTickets, useUpdateTicket, getListTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Ticket = { id: number; customerId: number; customerName?: string | null; subject: string; description: string; status: string; response?: string | null; createdAt: string | Date };

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminTickets() {
  const { data: tickets, isLoading } = useListTickets({}, { query: { queryKey: getListTicketsQueryKey({}) } });
  const updateTicket = useUpdateTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const openEdit = (t: Ticket) => {
    setEditTicket(t);
    setResponse(t.response || "");
    setEditStatus(t.status);
  };

  const handleSave = () => {
    if (!editTicket) return;
    updateTicket.mutate({ id: editTicket.id, data: { response, status: editStatus as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey({}) });
        setEditTicket(null);
        toast({ title: "Ticket updated" });
      },
    });
  };

  const openCount = tickets?.filter(t => t.status === "OPEN").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Respond to customer support requests</p>
        </div>
        {openCount > 0 && <Badge className="bg-red-100 text-red-700 border-red-200">{openCount} Open</Badge>}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Responded</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !tickets?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tickets found</TableCell></TableRow>
            ) : tickets.map(t => (
              <TableRow key={t.id} className="hover:bg-muted/30">
                <TableCell className="font-medium text-sm">{(t as unknown as Record<string, unknown>).customerName as string || `Customer #${t.customerId}`}</TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{t.subject}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_COLORS[t.status]}`}>{t.status.replace(/_/g, " ")}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Badge variant={t.response ? "default" : "outline"} className="text-xs">{t.response ? "Yes" : "No"}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(t as Ticket)} data-testid={`reply-ticket-${t.id}`}>
                    <Reply size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editTicket} onOpenChange={(o) => !o && setEditTicket(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Respond to Ticket</DialogTitle></DialogHeader>
          {editTicket && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="font-semibold text-sm mb-1">{editTicket.subject}</div>
                <p className="text-sm text-muted-foreground">{editTicket.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response</Label>
                <Textarea value={response} onChange={e => setResponse(e.target.value)} rows={4} placeholder="Type your response to the customer..." />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 btn-gradient border-0 text-white" onClick={handleSave} disabled={updateTicket.isPending}>
                  {updateTicket.isPending ? "Saving..." : "Send Response"}
                </Button>
                <Button variant="outline" onClick={() => setEditTicket(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
