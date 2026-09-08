"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { deleteProduct } from "@/app/actions/admin/product-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteProduct(productId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Product deleted");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {productName}?</DialogTitle>
          <DialogDescription>This will permanently remove the product, its images, and inventory. This cannot be undone.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>{isPending ? "Deleting..." : "Delete"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
