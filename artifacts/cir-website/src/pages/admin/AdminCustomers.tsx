import { useState } from "react";
import {
  useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  getListCustomersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Phone, Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Customer = { id: number; name: string; email: string; mobile: string; city?: string | null; createdAt: string };

function getApiError(error: unknown, fallback: string): string {
  const apiError = error as {
    data?: { error?: string };
    response?: { data?: { error?: string } };
  };
  return apiError.data?.error || apiError.response?.data?.error || fallback;
}

function CustomerForm({ initial, onSave, onCancel, isSaving }: {
  initial: Partial<Customer & { password: string }>;
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({ name: initial.name || "", email: initial.email || "", mobile: initial.mobile || "", city: initial.city || "", password: initial.password || "" });
  const isEdit = !!initial.id;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Rahul Sharma" />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="rahul@example.com" />
        </div>
        <div className="space-y-2">
          <Label>Mobile *</Label>
          <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="9876543210" />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New Delhi" />
        </div>
        <div className="space-y-2">
          <Label>{isEdit ? "New Password (leave blank to keep)" : "Password *"}</Label>
          <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={isEdit ? "Leave blank to keep current" : "Min 6 chars"} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button className="flex-1 btn-gradient border-0 text-white" onClick={() => onSave(form)} disabled={isSaving || !form.name || !form.email || !form.mobile || (!isEdit && form.password.length < 6)}>
          {isSaving ? "Saving..." : isEdit ? "Update Customer" : "Create Customer"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useListCustomers(search ? { search } : {}, { query: { queryKey: getListCustomersQueryKey(search ? { search } : {}) } });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const refreshList = () => {
    queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey({}) });
    queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey(search ? { search } : {}) });
  };

  const handleCreate = (form: Record<string, string>) => {
    createCustomer.mutate({ data: { name: form.name, email: form.email, mobile: form.mobile, city: form.city || undefined, password: form.password } }, {
      onSuccess: () => { refreshList(); setShowCreate(false); toast({ title: "Customer created" }); },
      onError: (error: unknown) => toast({
        title: getApiError(error, "Failed to create customer"),
        variant: "destructive",
      }),
    });
  };

  const handleEdit = (form: Record<string, string>) => {
    if (!editCustomer) return;
    const data: Record<string, string> = { name: form.name, email: form.email, mobile: form.mobile };
    if (form.city) data.city = form.city;
    if (form.password) data.password = form.password;
    updateCustomer.mutate({ id: editCustomer.id, data }, {
      onSuccess: () => {
        refreshList();
        setEditCustomer(null);
        toast({ title: form.password ? "Customer and password updated" : "Customer updated" });
      },
      onError: (error: unknown) => toast({
        title: getApiError(error, "Failed to update customer"),
        variant: "destructive",
      }),
    });
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteCustomer.mutate({ id: deleteId }, {
      onSuccess: () => { refreshList(); setDeleteId(null); toast({ title: "Customer deleted" }); },
      onError: () => toast({ title: "Failed to delete customer", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, manage and track all customer accounts</p>
        </div>
        <Button className="btn-gradient border-0 text-white gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or mobile..." className="pl-9" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-muted-foreground text-sm">{customer.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    {customer.mobile || "—"}
                    {customer.mobile && <a href={`tel:${customer.mobile}`} className="text-primary ml-1"><Phone size={13} /></a>}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{(customer as Customer).city || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditCustomer(customer as Customer)} title="Edit">
                      <Pencil size={13} className="text-primary" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDeleteId(customer.id)} title="Delete">
                      <Trash2 size={13} className="text-destructive" />
                    </Button>
                    {customer.mobile && (
                      <a href={`tel:${customer.mobile}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Call">
                          <Phone size={13} className="text-green-600" />
                        </Button>
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCheck size={20} className="text-primary" /> Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm initial={{}} onSave={handleCreate} onCancel={() => setShowCreate(false)} isSaving={createCustomer.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editCustomer} onOpenChange={o => !o && setEditCustomer(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={20} className="text-primary" /> Edit Customer</DialogTitle>
          </DialogHeader>
          {editCustomer && <CustomerForm initial={editCustomer} onSave={handleEdit} onCancel={() => setEditCustomer(null)} isSaving={updateCustomer.isPending} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer account along with all their cases, documents, payments, and tickets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              {deleteCustomer.isPending ? "Deleting..." : "Delete Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
