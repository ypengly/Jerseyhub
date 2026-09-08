"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateStoreSettings } from "@/app/actions/admin/settings-actions";

type Settings = { storeName: string; telegramUsername: string; supportEmail: string; shippingFlat: number; freeShippingOver: number };

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    const res = await updateStoreSettings(form);
    setLoading(false);
    if (res.error) toast.error(res.error);
    else toast.success("Settings saved");
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">General</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Store Name</Label>
          <Input value={form.storeName} onChange={(e) => update("storeName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telegram Username</Label>
          <Input value={form.telegramUsername} onChange={(e) => update("telegramUsername", e.target.value)} placeholder="jerseyhub_store" />
          <p className="text-xs text-muted-foreground">Used to build the store's t.me/&lt;username&gt; contact link — no bot token or credentials required.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Support Email</Label>
          <Input type="email" value={form.supportEmail} onChange={(e) => update("supportEmail", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Flat Shipping Rate ($)</Label>
            <Input type="number" step="0.01" value={form.shippingFlat} onChange={(e) => update("shippingFlat", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Free Shipping Over ($)</Label>
            <Input type="number" step="0.01" value={form.freeShippingOver} onChange={(e) => update("freeShippingOver", parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <Button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Save Settings"}</Button>
      </CardContent>
    </Card>
  );
}
