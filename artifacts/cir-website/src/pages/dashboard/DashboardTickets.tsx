import { useState } from "react";
import { useGetMe, useListCases, useListTickets, useCreateTicket, getGetMeQueryKey, getListCasesQueryKey, getListTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function statusBadge(status: string) {
  if (status === "RESOLVED") return <Badge className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>;
  if (status === "IN_PROGRESS") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In Progress</Badge>;
  if (status === "CLOSED") return <Badge variant="secondary">Closed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Open</Badge>;
}

export default function DashboardTickets() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: cases } = useListCases(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListCasesQueryKey(user ? { customerId: user.id } : {}) } });
  const { data: tickets, isLoading } = useListTickets(user ? { customerId: user.id } : {}, { query: { enabled: !!user, queryKey: getListTicketsQueryKey(user ? { customerId: user.id } : {}) } });
  const createTicket = useCreateTicket();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!user || !subject || !description) return;
    const activeCase = cases?.[0];
    createTicket.mutate({ data: { customerId: user.id, caseId: activeCase?.id, subject, description } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey({ customerId: user.id }) });
        setSubject(""); setDescription(""); setShowForm(false);
        toast({ title: "Ticket created", description: "Our team will respond within 24 hours." });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <Button className="btn-gradient border-0 text-white" onClick={() => setShowForm(!showForm)} data-testid="new-ticket-btn">
          <Plus size={18} className="mr-2" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Create Support Ticket</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input data-testid="ticket-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea data-testid="ticket-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your issue in detail..." rows={4} />
            </div>
            <div className="flex gap-3">
              <Button className="btn-gradient border-0 text-white" onClick={handleCreate} disabled={!subject || !description || createTicket.isPending} data-testid="ticket-submit">
                {createTicket.isPending ? "Creating..." : "Submit Ticket"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 animate-pulse text-center text-muted-foreground">Loading tickets...</div>
      ) : tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold">{ticket.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                </div>
                {statusBadge(ticket.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
              {ticket.response && (
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="text-xs font-semibold text-primary mb-1">Team Response</div>
                  <p className="text-sm">{ticket.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          <MessageSquare size={40} className="mx-auto mb-3 text-primary/30" />
          <p className="font-medium">No tickets yet</p>
          <p className="text-sm mt-1">Create a ticket if you have any questions or concerns about your case.</p>
        </div>
      )}
    </div>
  );
}
