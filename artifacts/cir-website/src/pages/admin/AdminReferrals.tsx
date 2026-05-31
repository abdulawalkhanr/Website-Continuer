import { useListReferrals, useUpdateReferral, getListReferralsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-green-100 text-green-700 border-green-200",
};

export default function AdminReferrals() {
  const { data: referrals, isLoading } = useListReferrals({ query: { queryKey: getListReferralsQueryKey() } });
  const updateReferral = useUpdateReferral();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdate = (id: number, status: "PENDING" | "APPROVED" | "PAID") => {
    updateReferral.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReferralsQueryKey() });
        toast({ title: `Referral ${status.toLowerCase()}` });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage referrals and process rewards</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Referral</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !referrals?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No referrals yet</TableCell></TableRow>
            ) : referrals.map(r => (
              <TableRow key={r.id} className="hover:bg-muted/30">
                <TableCell>
                  <div><div className="font-medium text-sm">{r.referrerName}</div><div className="text-xs text-muted-foreground">{r.referrerMobile}</div></div>
                </TableCell>
                <TableCell>
                  <div><div className="font-medium text-sm">{r.refereeName}</div><div className="text-xs text-muted-foreground">{r.refereeMobile}</div></div>
                </TableCell>
                <TableCell className="font-semibold">₹{(typeof r.rewardAmount === "number" ? r.rewardAmount : parseFloat(String(r.rewardAmount))).toLocaleString()}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_COLORS[r.status]}`}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {r.status === "PENDING" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleUpdate(r.id, "APPROVED")}>
                        <CheckCircle size={12} className="mr-1" /> Approve
                      </Button>
                    )}
                    {r.status === "APPROVED" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleUpdate(r.id, "PAID")}>
                        <DollarSign size={12} className="mr-1" /> Mark Paid
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
