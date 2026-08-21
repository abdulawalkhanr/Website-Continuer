import { useListStaffPortalDocuments, getListStaffPortalDocumentsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  UPLOADED: "bg-blue-50 text-blue-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default function StaffDocuments() {
  const { data: documents, isLoading } = useListStaffPortalDocuments(
    { query: { queryKey: getListStaffPortalDocumentsQueryKey() } }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Client Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Documents associated with your assigned cases</p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Case Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !documents?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>
            ) : documents.map(d => (
              <TableRow key={d.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span className="font-medium text-sm">{d.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{d.type.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <Link href={`/staff/cases/${d.caseId}`} className="text-xs font-medium text-primary hover:underline">
                    View Case
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${DOC_STATUS_COLORS[d.status]}`}>
                    {d.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {d.fileUrl ? (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ExternalLink size={14} />
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}