import { useState } from "react";
import { useListCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Phone, User } from "lucide-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListCustomers(search ? { search } : {}, { query: { queryKey: getListCustomersQueryKey(search ? { search } : {}) } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View and manage registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid="customers-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or mobile..." className="pl-9" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !customers?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
            ) : customers.map(customer => (
              <TableRow key={customer.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {customer.mobile || "—"}
                    {customer.mobile && <a href={`tel:${customer.mobile}`} className="text-primary ml-1"><Phone size={13} /></a>}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">Customer</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <a href={`tel:${customer.mobile}`}><button className="p-1 rounded hover:bg-muted transition-colors"><Phone size={14} className="text-primary" /></button></a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
