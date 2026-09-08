"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createDiscount, updateDiscount, toggleDiscountActive, deleteDiscount } from "@/app/actions/admin/discount-actions";
import { formatDate } from "@/lib/utils";

type Discount = {
  id: string;
  productId: string;
  productName: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrentlyActive: boolean;
};

type ProductOption = { id: string; name: string };

const emptyForm = {
  productId: "",
  type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
  value: 20,
  label: "SALE",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  isActive: true,
};

export function DiscountManager({ discounts, products }: { discounts: Discount[]; products: ProductOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(d: Discount) {
    setEditingId(d.id);
    setForm({
      productId: d.productId,
      type: d.type,
      value: d.value,
      label: d.label,
      startDate: d.startDate.slice(0, 10),
      endDate: d.endDate.slice(0, 10),
      isActive: d.isActive,
    });
    setOpen(true);
  }

  function submit() {
    if (!form.productId) {
      toast.error("Select a product");
      return;
    }
    startTransition(async () => {
      const payload = { ...form, startDate: new Date(form.startDate), endDate: new Date(form.endDate) };
      const res = editingId ? await updateDiscount(editingId, payload) : await createDiscount(payload);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editingId ? "Discount updated" : "Discount created");
      setOpen(false);
      router.refresh();
    });
  }

  function toggleActive(d: Discount) {
    startTransition(async () => {
      await toggleDiscountActive(d.id, !d.isActive);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteDiscount(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Discount</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Label</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{d.productName}</td>
                <td className="p-3">{d.type === "PERCENTAGE" ? `${d.value}%` : `$${d.value}`}</td>
                <td className="p-3">{d.label}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(d.startDate)}</td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(d.endDate)}</td>
                <td className="p-3">
                  {d.isCurrentlyActive ? <Badge variant="success">Active</Badge> : d.isActive ? <Badge variant="outline">Scheduled/Expired</Badge> : <Badge variant="muted">Inactive</Badge>}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(d)} disabled={isPending}>{d.isActive ? "Deactivate" : "Activate"}</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {discounts.length === 0 && <p className="p-6 text-center text-muted-foreground">No discounts yet.</p>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Discount" : "New Discount"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={(v) => setForm((f) => ({ ...f, productId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as "PERCENTAGE" | "FIXED" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="SALE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={submit} disabled={isPending}>{editingId ? "Save Changes" : "Create Discount"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
